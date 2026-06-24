import type { GameState } from '../model/game-state';
import { otherPlayer } from '../model/game-state';
import type { CardInstance, CardInstanceId, Player, PlayerId, Step } from '../model/types';
import { STEP_ORDER, emptyCombat, emptyManaPool } from '../model/types';
import type { GameEvent } from './events';

const updateCard = (
  state: GameState,
  cardId: CardInstanceId,
  patch: Partial<CardInstance>,
): GameState => ({
  ...state,
  cards: { ...state.cards, [cardId]: { ...state.cards[cardId], ...patch } },
});

const updatePlayer = (state: GameState, playerId: PlayerId, patch: Partial<Player>): GameState => ({
  ...state,
  players: { ...state.players, [playerId]: { ...state.players[playerId], ...patch } },
});

const removeFromZone = (player: Player, cardId: CardInstanceId): Partial<Player> => ({
  library: player.library.filter((c) => c !== cardId),
  hand: player.hand.filter((c) => c !== cardId),
  graveyard: player.graveyard.filter((c) => c !== cardId),
  exile: player.exile.filter((c) => c !== cardId),
});

const addToZone = (
  player: Player,
  cardId: CardInstanceId,
  zone: 'library' | 'hand' | 'graveyard' | 'exile',
): Partial<Player> => {
  switch (zone) {
    case 'library':
      return { library: [...player.library, cardId] };
    case 'hand':
      return { hand: [...player.hand, cardId] };
    case 'graveyard':
      return { graveyard: [...player.graveyard, cardId] };
    case 'exile':
      return { exile: [...player.exile, cardId] };
  }
};

const nextStep = (current: Step): { step: Step; wraps: boolean } => {
  const idx = STEP_ORDER.indexOf(current);
  const next = STEP_ORDER[(idx + 1) % STEP_ORDER.length];
  return { step: next, wraps: idx === STEP_ORDER.length - 1 };
};

export const applyEvent = (state: GameState, event: GameEvent): GameState => {
  switch (event.type) {
    case 'card_entered_zone': {
      const card = state.cards[event.cardId];
      const owner = state.players[card.ownerId];

      let next = state;
      const ownerPatch: Partial<Player> = { ...removeFromZone(owner, event.cardId) };

      let battlefield = state.battlefield.filter((c) => c !== event.cardId);

      if (event.to === 'battlefield') {
        battlefield = [...battlefield, event.cardId];
      } else if (event.to !== 'stack') {
        // 'stack' is tracked via state.stack; nothing to add to per-player zones.
        Object.assign(ownerPatch, addToZone(owner, event.cardId, event.to));
      }

      const cardPatch: Partial<CardInstance> = { zone: event.to };
      if (event.to === 'battlefield') {
        cardPatch.tapped = false;
        cardPatch.damage = 0;
        cardPatch.summoningSick = true;
      } else if (event.from === 'battlefield') {
        cardPatch.tapped = false;
        cardPatch.damage = 0;
        cardPatch.summoningSick = false;
        cardPatch.controllerId = card.ownerId;
      }

      next = updatePlayer(next, card.ownerId, ownerPatch);
      next = { ...next, battlefield };
      next = updateCard(next, event.cardId, cardPatch);
      return next;
    }

    case 'permanent_tapped':
      return updateCard(state, event.cardId, { tapped: true });

    case 'permanent_untapped':
      return updateCard(state, event.cardId, { tapped: false });

    case 'mana_produced': {
      const p = state.players[event.playerId];
      const pool = { ...p.manaPool, [event.color]: p.manaPool[event.color] + event.amount };
      return updatePlayer(state, event.playerId, { manaPool: pool });
    }

    case 'mana_spent': {
      const p = state.players[event.playerId];
      const pool = { ...p.manaPool };
      for (const [color, amount] of Object.entries(event.spent)) {
        const c = color as keyof typeof pool;
        pool[c] = Math.max(0, pool[c] - (amount ?? 0));
      }
      return updatePlayer(state, event.playerId, { manaPool: pool });
    }

    case 'mana_pool_emptied':
      return updatePlayer(state, event.playerId, { manaPool: emptyManaPool() });

    case 'damage_dealt': {
      if (event.target.kind === 'player') {
        return state;
      }
      const card = state.cards[event.target.cardId];
      return updateCard(state, card.id, { damage: card.damage + event.amount });
    }

    case 'life_changed': {
      const p = state.players[event.playerId];
      return updatePlayer(state, event.playerId, { life: p.life + event.delta });
    }

    case 'card_drawn': {
      const p = state.players[event.playerId];
      const moved = updatePlayer(state, event.playerId, {
        library: p.library.slice(1),
        hand: [...p.hand, event.cardId],
      });
      return updateCard(moved, event.cardId, { zone: 'hand' });
    }

    case 'draw_attempted_empty':
      return state;

    case 'land_played': {
      const p = state.players[event.playerId];
      return updatePlayer(state, event.playerId, {
        landsPlayedThisTurn: p.landsPlayedThisTurn + 1,
      });
    }

    case 'spell_put_on_stack':
      return { ...state, stack: [...state.stack, event.item], consecutivePasses: 0 };

    case 'stack_item_resolved': {
      const idx = state.stack.findIndex((s) => s.id === event.stackItemId);
      if (idx < 0) {
        return state;
      }
      const stack = state.stack.slice();
      stack.splice(idx, 1);
      return { ...state, stack, consecutivePasses: 0 };
    }

    case 'priority_passed':
      return { ...state, priorityPlayer: event.to, consecutivePasses: state.consecutivePasses + 1 };

    case 'priority_reset':
      return { ...state, priorityPlayer: event.to, consecutivePasses: 0 };

    case 'creature_died':
      return state;

    case 'attacker_declared':
      return {
        ...state,
        combat: {
          ...state.combat,
          attackers: [
            ...state.combat.attackers,
            { attackerId: event.attackerId, defenderId: event.defenderId },
          ],
        },
      };

    case 'blocker_declared':
      return {
        ...state,
        combat: {
          ...state.combat,
          blockers: [
            ...state.combat.blockers,
            { blockerId: event.blockerId, attackerId: event.attackerId },
          ],
        },
      };

    case 'combat_declared': {
      const flag = event.declaration === 'attackers' ? 'attackersDeclared' : 'blockersDeclared';
      return { ...state, combat: { ...state.combat, [flag]: true } };
    }

    case 'combat_damage_marked':
      return state;

    case 'damage_cleared_at_cleanup': {
      const cards = { ...state.cards };
      for (const id of state.battlefield) {
        if (cards[id].damage > 0) {
          cards[id] = { ...cards[id], damage: 0 };
        }
      }
      return { ...state, cards };
    }

    case 'summoning_sickness_cleared':
      return updateCard(state, event.cardId, { summoningSick: false });

    case 'step_advanced': {
      const next = nextStep(state.step);
      let s: GameState = { ...state, step: event.to };
      if (next.wraps) {
        s = { ...s, turn: s.turn + 1, activePlayer: otherPlayer(s, s.activePlayer) };
      }
      if (event.to === 'begin_combat' || event.to === 'main1' || event.to === 'untap') {
        s = { ...s, combat: emptyCombat() };
      }
      return s;
    }

    case 'turn_started':
      return state;

    case 'lands_played_reset':
      return updatePlayer(state, event.playerId, { landsPlayedThisTurn: 0 });

    case 'player_lost':
      if (state.losers.includes(event.playerId)) {
        return state;
      }
      return { ...state, losers: [...state.losers, event.playerId] };

    case 'game_ended':
      return { ...state, status: 'ended', winner: event.winner };
  }
};
