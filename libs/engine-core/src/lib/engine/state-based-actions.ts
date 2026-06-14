import { getCardDefinition } from '../cards/catalog';
import type { GameState } from '../model/game-state';
import type { GameEvent } from './events';

export const checkStateBasedActions = (state: GameState): GameEvent[] => {
  if (state.status === 'ended') return [];
  const events: GameEvent[] = [];
  const losers = new Set<string>();

  // Creatures with lethal damage die
  for (const id of state.battlefield) {
    const c = state.cards[id];
    if (c.zone !== 'battlefield') continue;
    const def = getCardDefinition(c.definitionId);
    if (!def.types.includes('creature')) continue;
    const toughness = (def.toughness ?? 0) + c.toughnessMod;
    if (c.damage > 0 && c.damage >= toughness) {
      events.push({ type: 'creature_died', cardId: id });
      events.push({
        type: 'card_entered_zone',
        cardId: id,
        from: 'battlefield',
        to: 'graveyard',
      });
    }
  }

  // Players at 0 or less life lose
  for (const pid of state.playerOrder) {
    if (state.losers.includes(pid)) continue;
    const p = state.players[pid];
    if (p.life <= 0 && !losers.has(pid)) {
      losers.add(pid);
      events.push({ type: 'player_lost', playerId: pid, reason: 'life' });
    }
  }

  // If at least one player has lost (per state.losers OR a newly-emitted event),
  // and only one player remains, emit game_ended.
  const allLosers = new Set([...state.losers, ...Array.from(losers)]);
  const survivors = state.playerOrder.filter((p) => !allLosers.has(p));
  if (allLosers.size > 0 && survivors.length <= 1) {
    events.push({ type: 'game_ended', winner: survivors[0] ?? null });
  }

  return events;
};
