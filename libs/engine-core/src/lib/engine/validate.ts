import { err, type Result } from '@mtg-utils/engine-util';

import type { Action } from '../actions/action';
import { ActionKind } from '../actions/action';
import type { GameState } from '../model/game-state';
import type { GameEvent } from './events';
import {
  validateCastCreature,
  validateCastInstant,
  validateCastSorcery,
  validateConcede,
  validateDeclareAttackers,
  validateDeclareBlockers,
  validatePassPriority,
  validatePlayLand,
  validateTapLandForMana,
} from './validators';

/**
 * Turn a player action into the events it produces, or a reason why it
 * cannot. Pure: no state mutation, no I/O. Each action kind dispatches to
 * a dedicated validator under ./validators/.
 */
export const validate = (
  state: GameState,
  action: Action,
): Result<GameEvent[], string> => {
  if (state.status === 'ended') {
    return err('game has ended');
  }

  switch (action.kind) {
    case ActionKind.TapLandForMana:
      return validateTapLandForMana(state, action);
    case ActionKind.PlayLand:
      return validatePlayLand(state, action);
    case ActionKind.CastCreature:
      return validateCastCreature(state, action);
    case ActionKind.CastSorcery:
      return validateCastSorcery(state, action);
    case ActionKind.CastInstant:
      return validateCastInstant(state, action);
    case ActionKind.DeclareAttackers:
      return validateDeclareAttackers(state, action);
    case ActionKind.DeclareBlockers:
      return validateDeclareBlockers(state, action);
    case ActionKind.PassPriority:
      return validatePassPriority(state, action);
    case ActionKind.Concede:
      return validateConcede(state, action);
  }
};
