import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { DeclareBlockers } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { otherPlayer, type GameState } from '../../model/game-state';
import type { GameEvent } from '../events';

export const validateDeclareBlockers = (
  state: GameState,
  action: DeclareBlockers,
): Result<GameEvent[], string> => {
  if (state.step !== 'declare_blockers') {
    return err('not declare blockers step');
  }

  const defender = otherPlayer(state, state.activePlayer);
  if (action.playerId !== defender) {
    return err('only defending player declares blockers');
  }

  const events: GameEvent[] = [];
  const attackerIds = new Set(state.combat.attackers.map((a) => a.attackerId));
  const usedBlockers = new Set<string>();

  for (const a of action.assignments) {
    if (!attackerIds.has(a.attackerId)) {
      return err('not an attacker');
    }
    if (usedBlockers.has(a.blockerId)) {
      return err('blocker already used');
    }
    usedBlockers.add(a.blockerId);

    const b = state.cards[a.blockerId];
    if (!b || b.zone !== 'battlefield' || b.controllerId !== defender) {
      return err('cannot block with that card');
    }
    const bd = getCardDefinition(b.definitionId);
    if (!bd.types.includes('creature')) {
      return err('only creatures can block');
    }
    if (b.tapped) {
      return err('tapped creatures cannot block');
    }

    const attacker = state.cards[a.attackerId];
    const ad = getCardDefinition(attacker.definitionId);
    if (ad.keywords.includes('flying') && !bd.keywords.includes('flying')) {
      return err('cannot block flying without flying');
    }

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
};
