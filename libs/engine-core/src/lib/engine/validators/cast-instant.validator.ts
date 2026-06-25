import type { Result } from '@mtg-utils/engine-util';

import type { CastInstant } from '../../actions/action';
import { CardType } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { castNonPermanentSpell } from './cast-non-permanent-spell';

export const validateCastInstant = (
  state: GameState,
  action: CastInstant,
): Result<GameEvent[], string> =>
  castNonPermanentSpell(state, action, CardType.Instant, /* atInstantSpeed */ true);
