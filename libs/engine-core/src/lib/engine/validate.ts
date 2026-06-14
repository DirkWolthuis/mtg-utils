import { err, type Result } from '@mtg-utils/engine-util';

import type { Action } from '../actions/action';
import { ActionType } from '../actions/action';
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
 * cannot. Pure: no state mutation, no I/O. Each action type dispatches to
 * a dedicated validator under ./validators/.
 */
export const validate = (
  state: GameState,
  action: Action,
): Result<GameEvent[], string> => {
  if (state.status === 'ended') {
    return err('game has ended');
  }

  switch (action.type) {
    case ActionType.TapLandForMana:
      return validateTapLandForMana(state, action);
    case ActionType.PlayLand:
      return validatePlayLand(state, action);
    case ActionType.CastCreature:
      return validateCastCreature(state, action);
    case ActionType.CastSorcery:
      return validateCastSorcery(state, action);
    case ActionType.CastInstant:
      return validateCastInstant(state, action);
    case ActionType.DeclareAttackers:
      return validateDeclareAttackers(state, action);
    case ActionType.DeclareBlockers:
      return validateDeclareBlockers(state, action);
    case ActionType.PassPriority:
      return validatePassPriority(state, action);
    case ActionType.Concede:
      return validateConcede(state, action);
  }
};
