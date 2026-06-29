import { getCardDefinition } from '../cards/catalog';
import { CardType, GameEventType, GameStatus, PlayerLostReason, Zone } from '../model/enums';
import type { GameState } from '../model/game-state';
import type { GameEvent } from './events';

export const checkStateBasedActions = (state: GameState): GameEvent[] => {
  if (state.status === GameStatus.Ended) {
    return [];
  }
  const events: GameEvent[] = [];
  const losers = new Set<string>();

  // Creatures with lethal damage die
  for (const id of state.battlefield) {
    const c = state.cards[id];
    if (c.zone !== Zone.Battlefield) {
      continue;
    }
    const def = getCardDefinition(c.definitionId);
    if (!def.types.includes(CardType.Creature)) {
      continue;
    }
    const toughness = (def.toughness ?? 0) + c.toughnessMod;
    if (c.damage > 0 && c.damage >= toughness) {
      events.push({ type: GameEventType.CreatureDied, cardId: id });
      events.push({
        type: GameEventType.CardEnteredZone,
        cardId: id,
        from: Zone.Battlefield,
        to: Zone.Graveyard,
      });
    }
  }

  // Players at 0 or less life lose
  for (const pid of state.playerOrder) {
    if (state.losers.includes(pid)) {
      continue;
    }
    const p = state.players[pid];
    if (p.life <= 0 && !losers.has(pid)) {
      losers.add(pid);
      events.push({ type: GameEventType.PlayerLost, playerId: pid, reason: PlayerLostReason.Life });
    }
  }

  // If at least one player has lost (per state.losers OR a newly-emitted event),
  // and only one player remains, emit game_ended.
  const allLosers = new Set([...state.losers, ...Array.from(losers)]);
  const survivors = state.playerOrder.filter((p) => !allLosers.has(p));
  if (allLosers.size > 0 && survivors.length <= 1) {
    events.push({ type: GameEventType.GameEnded, winner: survivors[0] ?? null });
  }

  return events;
};
