import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { PassPriority } from '../../actions/action';
import { otherPlayer, type GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { GameEventType } from '../events';

export const validatePassPriority = (
  state: GameState,
  action: PassPriority,
): Result<GameEvent[], string> => {
  if (state.priorityPlayer !== action.playerId) {
    return err(`player ${action.playerId} does not have priority`);
  }
  const to = otherPlayer(state, action.playerId);
  return ok<GameEvent[]>([{ type: GameEventType.PriorityPassed, from: action.playerId, to }]);
};
