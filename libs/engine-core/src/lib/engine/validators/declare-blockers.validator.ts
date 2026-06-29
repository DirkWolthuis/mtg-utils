import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { DeclareBlockers } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { CardType, CombatDeclaration, GameEventType, Keyword, Step, Zone } from '../../model/enums';
import { otherPlayer, type GameState } from '../../model/game-state';
import type { GameEvent } from '../events';

export const validateDeclareBlockers = (
  state: GameState,
  action: DeclareBlockers,
): Result<GameEvent[], string> => {
  if (state.step !== Step.DeclareBlockers) {
    return err('not declare blockers step');
  }
  if (state.combat.blockersDeclared) {
    return err('blockers already declared');
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
    if (!b || b.zone !== Zone.Battlefield || b.controllerId !== defender) {
      return err('cannot block with that card');
    }
    const bd = getCardDefinition(b.definitionId);
    if (!bd.types.includes(CardType.Creature)) {
      return err('only creatures can block');
    }
    if (b.tapped) {
      return err('tapped creatures cannot block');
    }

    const attacker = state.cards[a.attackerId];
    const ad = getCardDefinition(attacker.definitionId);
    if (ad.keywords.includes(Keyword.Flying) && !bd.keywords.includes(Keyword.Flying)) {
      return err('cannot block flying without flying');
    }

    events.push({
      type: GameEventType.BlockerDeclared,
      blockerId: a.blockerId,
      attackerId: a.attackerId,
    });
  }

  // Don't advance the step here: emitting `combat_declared` opens a priority
  // window (active player first) so instants can respond to the blocks before
  // combat damage. The step advances once both players pass priority.
  events.push({ type: GameEventType.CombatDeclared, declaration: CombatDeclaration.Blockers });
  return ok(events);
};
