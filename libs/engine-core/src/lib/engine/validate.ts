import { getCardDefinition } from '../cards/catalog';
import type { Action } from '../actions/action';
import type { GameState } from '../model/game-state';
import { otherPlayer } from '../model/game-state';
import { STEP_ORDER } from '../model/types';
import type { GameEvent } from './events';
import { manaSpentMatchesCost, poolHasAtLeast, totalSpent } from './mana';
import type { Result } from './result';
import { err, ok } from './result';
import { runEffect } from '../cards/effects/effect-registry';

const requireStep = (state: GameState, allowed: GameState['step'][]): string | null => {
  return allowed.includes(state.step)
    ? null
    : `action not legal during step ${state.step}; expected one of ${allowed.join(', ')}`;
};

const requireActive = (state: GameState, playerId: GameState['activePlayer']): string | null => {
  return playerId === state.activePlayer ? null : `not active player's turn`;
};

export const validate = (
  state: GameState,
  action: Action,
): Result<GameEvent[], string> => {
  if (state.status === 'ended') return err('game has ended');

  switch (action.kind) {
    case 'tap_land_for_mana': {
      const card = state.cards[action.cardId];
      if (!card) return err('unknown card');
      if (card.zone !== 'battlefield') return err('card not on battlefield');
      if (card.controllerId !== action.playerId) return err('not your permanent');
      if (card.tapped) return err('card already tapped');
      const def = getCardDefinition(card.definitionId);
      if (!def.types.includes('land')) return err('not a land');
      if (!def.produces?.includes(action.color)) return err(`land cannot produce ${action.color}`);
      return ok([
        { kind: 'permanent_tapped', cardId: card.id },
        {
          kind: 'mana_produced',
          playerId: action.playerId,
          color: action.color,
          amount: 1,
          sourceCardId: card.id,
        },
      ]);
    }

    case 'play_land': {
      const step = requireStep(state, ['main1', 'main2']);
      if (step) return err(step);
      const active = requireActive(state, action.playerId);
      if (active) return err(active);
      const player = state.players[action.playerId];
      if (player.landsPlayedThisTurn >= 1) return err('already played a land this turn');
      const card = state.cards[action.cardId];
      if (!card || card.zone !== 'hand' || card.ownerId !== action.playerId)
        return err('card not in your hand');
      const def = getCardDefinition(card.definitionId);
      if (!def.types.includes('land')) return err('not a land');
      return ok<GameEvent[]>([
        { kind: 'land_played', playerId: action.playerId, cardId: card.id },
        {
          kind: 'card_entered_zone',
          cardId: card.id,
          from: 'hand',
          to: 'battlefield',
          causedBy: action.playerId,
        },
      ]);
    }

    case 'cast_creature': {
      const step = requireStep(state, ['main1', 'main2']);
      if (step) return err(step);
      const active = requireActive(state, action.playerId);
      if (active) return err(active);
      const card = state.cards[action.cardId];
      if (!card || card.zone !== 'hand' || card.ownerId !== action.playerId)
        return err('card not in your hand');
      const def = getCardDefinition(card.definitionId);
      if (!def.types.includes('creature')) return err('not a creature');
      if (!def.manaCost) return err('no mana cost on creature');
      const costCheck = manaSpentMatchesCost(def.manaCost, action.manaSpent);
      if (!costCheck.ok) return err(costCheck.reason);
      const poolCheck = poolHasAtLeast(
        state.players[action.playerId].manaPool,
        action.manaSpent,
      );
      if (!poolCheck.ok) return err(poolCheck.reason);
      if (totalSpent(action.manaSpent) === 0) return err('must spend mana for a non-free spell');
      return ok<GameEvent[]>([
        { kind: 'mana_spent', playerId: action.playerId, spent: action.manaSpent },
        {
          kind: 'card_entered_zone',
          cardId: card.id,
          from: 'hand',
          to: 'battlefield',
          causedBy: action.playerId,
        },
      ]);
    }

    case 'cast_sorcery': {
      const step = requireStep(state, ['main1', 'main2']);
      if (step) return err(step);
      const active = requireActive(state, action.playerId);
      if (active) return err(active);
      const card = state.cards[action.cardId];
      if (!card || card.zone !== 'hand' || card.ownerId !== action.playerId)
        return err('card not in your hand');
      const def = getCardDefinition(card.definitionId);
      if (!def.types.includes('sorcery')) return err('not a sorcery');
      if (!def.manaCost) return err('no mana cost on sorcery');
      const costCheck = manaSpentMatchesCost(def.manaCost, action.manaSpent);
      if (!costCheck.ok) return err(costCheck.reason);
      const poolCheck = poolHasAtLeast(
        state.players[action.playerId].manaPool,
        action.manaSpent,
      );
      if (!poolCheck.ok) return err(poolCheck.reason);

      const effects = def.effects ?? [];
      const targetCount = effects.filter((e) => e.kind === 'deal_damage_to_any').length;
      const targets = action.targets ?? [];
      if (targets.length < targetCount) return err(`spell needs ${targetCount} target(s)`);

      const seed: GameEvent[] = [
        { kind: 'mana_spent', playerId: action.playerId, spent: action.manaSpent },
        {
          kind: 'card_entered_zone',
          cardId: card.id,
          from: 'hand',
          to: 'graveyard',
          causedBy: action.playerId,
        },
      ];
      let targetIdx = 0;
      for (const e of effects) {
        const ctx = {
          state,
          casterId: action.playerId,
          sourceCardId: card.id,
          target: e.kind === 'deal_damage_to_any' ? targets[targetIdx++] : undefined,
        };
        const produced = runEffect(e, ctx);
        if (!produced.ok) return err(produced.error);
        seed.push(...produced.value);
      }
      return ok(seed);
    }

    case 'declare_attackers': {
      if (state.step !== 'declare_attackers') return err('not declare attackers step');
      const active = requireActive(state, action.playerId);
      if (active) return err(active);
      const defender = otherPlayer(state, action.playerId);
      const events: GameEvent[] = [];
      const seen = new Set<string>();
      for (const id of action.attackerIds) {
        if (seen.has(id)) return err('duplicate attacker');
        seen.add(id);
        const c = state.cards[id];
        if (!c || c.zone !== 'battlefield' || c.controllerId !== action.playerId)
          return err('cannot attack with that card');
        const def = getCardDefinition(c.definitionId);
        if (!def.types.includes('creature')) return err('only creatures can attack');
        if (c.tapped) return err('tapped creatures cannot attack');
        if (c.summoningSick && !def.keywords.includes('haste'))
          return err('summoning sick creature cannot attack');
        if (!def.keywords.includes('vigilance')) {
          events.push({ kind: 'permanent_tapped', cardId: id });
        }
        events.push({ kind: 'attacker_declared', attackerId: id, defenderId: defender });
      }
      events.push({
        kind: 'step_advanced',
        from: 'declare_attackers',
        to: 'declare_blockers',
        turn: state.turn,
      });
      return ok(events);
    }

    case 'declare_blockers': {
      if (state.step !== 'declare_blockers') return err('not declare blockers step');
      const defender = otherPlayer(state, state.activePlayer);
      if (action.playerId !== defender) return err('only defending player declares blockers');
      const events: GameEvent[] = [];
      const attackerIds = new Set(state.combat.attackers.map((a) => a.attackerId));
      const usedBlockers = new Set<string>();
      for (const a of action.assignments) {
        if (!attackerIds.has(a.attackerId)) return err('not an attacker');
        if (usedBlockers.has(a.blockerId)) return err('blocker already used');
        usedBlockers.add(a.blockerId);
        const b = state.cards[a.blockerId];
        if (!b || b.zone !== 'battlefield' || b.controllerId !== defender)
          return err('cannot block with that card');
        const bd = getCardDefinition(b.definitionId);
        if (!bd.types.includes('creature')) return err('only creatures can block');
        if (b.tapped) return err('tapped creatures cannot block');
        const attacker = state.cards[a.attackerId];
        const ad = getCardDefinition(attacker.definitionId);
        if (ad.keywords.includes('flying') && !bd.keywords.includes('flying'))
          return err('cannot block flying without flying');
        events.push({
          kind: 'blocker_declared',
          blockerId: a.blockerId,
          attackerId: a.attackerId,
        });
      }
      events.push({
        kind: 'step_advanced',
        from: 'declare_blockers',
        to: 'combat_damage',
        turn: state.turn,
      });
      return ok(events);
    }

    case 'pass_step': {
      if (action.playerId !== state.activePlayer) return err('only active player passes in v0');
      const idx = STEP_ORDER.indexOf(state.step);
      const nextStep = STEP_ORDER[(idx + 1) % STEP_ORDER.length];
      return ok<GameEvent[]>([
        { kind: 'step_advanced', from: state.step, to: nextStep, turn: state.turn },
      ]);
    }

    case 'concede': {
      return ok<GameEvent[]>([
        { kind: 'player_lost', playerId: action.playerId, reason: 'concede' },
      ]);
    }
  }
};
