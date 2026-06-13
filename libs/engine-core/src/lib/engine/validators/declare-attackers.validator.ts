import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { DeclareAttackers } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { otherPlayer, type GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { requireActive } from './_shared';

export const validateDeclareAttackers = (
  state: GameState,
  action: DeclareAttackers,
): Result<GameEvent[], string> => {
  if (state.step !== 'declare_attackers') {
    return err('not declare attackers step');
  }
  const active = requireActive(state, action.playerId);
  if (active) {
    return err(active);
  }

  const defender = otherPlayer(state, action.playerId);
  const events: GameEvent[] = [];
  const seen = new Set<string>();

  for (const id of action.attackerIds) {
    if (seen.has(id)) {
      return err('duplicate attacker');
    }
    seen.add(id);

    const c = state.cards[id];
    if (!c || c.zone !== 'battlefield' || c.controllerId !== action.playerId) {
      return err('cannot attack with that card');
    }
    const def = getCardDefinition(c.definitionId);
    if (!def.types.includes('creature')) {
      return err('only creatures can attack');
    }
    if (c.tapped) {
      return err('tapped creatures cannot attack');
    }
    if (c.summoningSick && !def.keywords.includes('haste')) {
      return err('summoning sick creature cannot attack');
    }

    if (!def.keywords.includes('vigilance')) {
      events.push({ kind: 'permanent_tapped', cardId: id });
    }
    events.push({
      kind: 'attacker_declared',
      attackerId: id,
      defenderId: defender,
    });
  }

  events.push({
    kind: 'step_advanced',
    from: 'declare_attackers',
    to: 'declare_blockers',
    turn: state.turn,
  });
  return ok(events);
};
