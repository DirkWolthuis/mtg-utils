import type { Result } from '@mtg-utils/engine-util';

import type { CastInstant } from '../../actions/action';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { castNonPermanentSpell } from './cast-non-permanent-spell';

export const validateCastInstant = (
  state: GameState,
  action: CastInstant,
): Result<GameEvent[], string> =>
  castNonPermanentSpell(state, action, 'instant', /* atInstantSpeed */ true);
