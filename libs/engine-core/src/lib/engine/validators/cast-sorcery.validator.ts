import type { Result } from '@mtg-utils/engine-util';

import type { CastSorcery } from '../../actions/action';
import { CardType } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { castNonPermanentSpell } from './cast-non-permanent-spell';

export const validateCastSorcery = (
  state: GameState,
  action: CastSorcery,
): Result<GameEvent[], string> =>
  castNonPermanentSpell(state, action, CardType.Sorcery, /* atInstantSpeed */ false);
