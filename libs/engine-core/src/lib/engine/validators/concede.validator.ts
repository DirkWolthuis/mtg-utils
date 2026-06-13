import { ok, type Result } from '@mtg-utils/engine-util';

import type { Concede } from '../../actions/action';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';

export const validateConcede = (
  _state: GameState,
  action: Concede,
): Result<GameEvent[], string> =>
  ok<GameEvent[]>([
    { kind: 'player_lost', playerId: action.playerId, reason: 'concede' },
  ]);
