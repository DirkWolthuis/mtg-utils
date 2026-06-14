import { getCardDefinition } from '../../cards/catalog';
import type { GameState } from '../../model/game-state';
import type { CardInstanceId } from '../../model/types';
import type { GameEvent } from '../events';

type PowerToughness = {
  power: number;
  toughness: number;
};

const ptOf = (state: GameState, cardId: CardInstanceId): PowerToughness => {
  const c = state.cards[cardId];
  const def = getCardDefinition(c.definitionId);
  return {
    power: (def.power ?? 0) + c.powerMod,
    toughness: (def.toughness ?? 0) + c.toughnessMod,
  };
};

const hasKeyword = (state: GameState, cardId: CardInstanceId, kw: string): boolean => {
  const c = state.cards[cardId];
  const def = getCardDefinition(c.definitionId);
  return def.keywords.includes(kw as never);
};

/**
 * Compute the events for combat damage on a single combat sub-step.
 * `firstStrike` toggles whether we only emit damage from creatures that deal damage
 * in the first-strike sub-step (those with first_strike). The non-first-strike pass
 * emits damage from creatures still alive that did not deal first-strike damage,
 * plus creatures with first_strike that survived (in v0, simplification: first
 * strike creatures only deal damage in the first-strike sub-step).
 */
const damageForPass = (state: GameState, pass: 'first_strike' | 'regular'): GameEvent[] => {
  const events: GameEvent[] = [];
  const livingOnBattlefield = (id: CardInstanceId): boolean =>
    state.cards[id]?.zone === 'battlefield';

  for (const attack of state.combat.attackers) {
    const attackerId = attack.attackerId;
    if (!livingOnBattlefield(attackerId)) continue;
    const aFirstStrike = hasKeyword(state, attackerId, 'first_strike');
    if (pass === 'first_strike' && !aFirstStrike) continue;
    if (pass === 'regular' && aFirstStrike) continue;

    const attackerPT = ptOf(state, attackerId);
    if (attackerPT.power <= 0) continue;

    const blockers = state.combat.blockers.filter((b) => b.attackerId === attackerId);

    if (blockers.length === 0) {
      // Unblocked: damage to defending player
      events.push({
        type: 'damage_dealt',
        sourceCardId: attackerId,
        target: { kind: 'player', playerId: attack.defenderId },
        amount: attackerPT.power,
        combat: true,
      });
      events.push({
        type: 'life_changed',
        playerId: attack.defenderId,
        delta: -attackerPT.power,
        reason: 'damage',
      });
      if (hasKeyword(state, attackerId, 'lifelink')) {
        events.push({
          type: 'life_changed',
          playerId: state.cards[attackerId].controllerId,
          delta: attackerPT.power,
          reason: 'lifelink',
        });
      }
    } else {
      // Blocked: assign damage in order to blockers (v0: simple lethal-then-overflow)
      let remaining = attackerPT.power;
      const aTrample = hasKeyword(state, attackerId, 'trample');
      const aDeathtouch = hasKeyword(state, attackerId, 'deathtouch');

      for (const b of blockers) {
        if (!livingOnBattlefield(b.blockerId)) continue;
        const bPT = ptOf(state, b.blockerId);
        const bCurrentDamage = state.cards[b.blockerId].damage;
        const lethalNeeded = aDeathtouch ? 1 : Math.max(1, bPT.toughness - bCurrentDamage);
        const assigned = Math.min(remaining, lethalNeeded);
        if (assigned > 0) {
          events.push({
            type: 'damage_dealt',
            sourceCardId: attackerId,
            target: { kind: 'permanent', cardId: b.blockerId },
            amount: assigned,
            combat: true,
          });
          if (hasKeyword(state, attackerId, 'lifelink')) {
            events.push({
              type: 'life_changed',
              playerId: state.cards[attackerId].controllerId,
              delta: assigned,
              reason: 'lifelink',
            });
          }
          remaining -= assigned;
        }
      }

      if (aTrample && remaining > 0) {
        events.push({
          type: 'damage_dealt',
          sourceCardId: attackerId,
          target: { kind: 'player', playerId: attack.defenderId },
          amount: remaining,
          combat: true,
        });
        events.push({
          type: 'life_changed',
          playerId: attack.defenderId,
          delta: -remaining,
          reason: 'damage',
        });
        if (hasKeyword(state, attackerId, 'lifelink')) {
          events.push({
            type: 'life_changed',
            playerId: state.cards[attackerId].controllerId,
            delta: remaining,
            reason: 'lifelink',
          });
        }
      }

      // Blockers also deal damage to the attacker
      for (const b of blockers) {
        if (!livingOnBattlefield(b.blockerId)) continue;
        const bFirstStrike = hasKeyword(state, b.blockerId, 'first_strike');
        if (pass === 'first_strike' && !bFirstStrike) continue;
        if (pass === 'regular' && bFirstStrike) continue;
        const bPT = ptOf(state, b.blockerId);
        if (bPT.power <= 0) continue;
        events.push({
          type: 'damage_dealt',
          sourceCardId: b.blockerId,
          target: { kind: 'permanent', cardId: attackerId },
          amount: bPT.power,
          combat: true,
        });
        if (hasKeyword(state, b.blockerId, 'lifelink')) {
          events.push({
            type: 'life_changed',
            playerId: state.cards[b.blockerId].controllerId,
            delta: bPT.power,
            reason: 'lifelink',
          });
        }
      }
    }
  }

  return events;
};

export const computeCombatDamageEvents = (state: GameState): GameEvent[] => {
  if (state.combat.attackers.length === 0) return [];
  // v0 simplification: emit first-strike pass and regular pass back-to-back; SBAs
  // between events will clean up creatures that died in the first-strike pass before
  // their regular damage entries are processed (damage_dealt against a card that's no
  // longer on the battlefield becomes a no-op via applyEvent's lookup).
  const fs = damageForPass(state, 'first_strike');
  const reg = damageForPass(state, 'regular');
  return [...fs, { type: 'combat_damage_marked' }, ...reg];
};
