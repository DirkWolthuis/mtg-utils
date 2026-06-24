import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { DeclareAttackers } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { otherPlayer, type GameState } from '../../model/game-state';
import { CardType, Keyword, Step, Zone } from '../../model/types';
import type { GameEvent } from '../events';
import { CombatDeclaration, GameEventType } from '../events';
import { requireActive } from './_shared';

export const validateDeclareAttackers = (
  state: GameState,
  action: DeclareAttackers,
): Result<GameEvent[], string> => {
  if (state.step !== Step.DeclareAttackers) {
    return err('not declare attackers step');
  }
  if (state.combat.attackersDeclared) {
    return err('attackers already declared');
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
    if (!c || c.zone !== Zone.Battlefield || c.controllerId !== action.playerId) {
      return err('cannot attack with that card');
    }
    const def = getCardDefinition(c.definitionId);
    if (!def.types.includes(CardType.Creature)) {
      return err('only creatures can attack');
    }
    if (c.tapped) {
      return err('tapped creatures cannot attack');
    }
    if (c.summoningSick && !def.keywords.includes(Keyword.Haste)) {
      return err('summoning sick creature cannot attack');
    }

    if (!def.keywords.includes(Keyword.Vigilance)) {
      events.push({ type: GameEventType.PermanentTapped, cardId: id });
    }
    events.push({
      type: GameEventType.AttackerDeclared,
      attackerId: id,
      defenderId: defender,
    });
  }

  // Don't advance the step here: emitting `combat_declared` opens a priority
  // window (active player first) so instants can respond to the attackers
  // before blocks. The step advances once both players pass priority.
  events.push({ type: GameEventType.CombatDeclared, declaration: CombatDeclaration.Attackers });
  return ok(events);
};
