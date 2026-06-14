import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { TapLandForMana } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';

export const validateTapLandForMana = (
  state: GameState,
  action: TapLandForMana,
): Result<GameEvent[], string> => {
  const card = state.cards[action.cardId];
  if (!card) {
    return err('unknown card');
  }
  if (card.zone !== 'battlefield') {
    return err('card not on battlefield');
  }
  if (card.controllerId !== action.playerId) {
    return err('not your permanent');
  }
  if (card.tapped) {
    return err('card already tapped');
  }
  const def = getCardDefinition(card.definitionId);
  if (!def.types.includes('land')) {
    return err('not a land');
  }
  if (!def.produces?.includes(action.color)) {
    return err(`land cannot produce ${action.color}`);
  }
  return ok<GameEvent[]>([
    { type: 'permanent_tapped', cardId: card.id },
    {
      type: 'mana_produced',
      playerId: action.playerId,
      color: action.color,
      amount: 1,
      sourceCardId: card.id,
    },
  ]);
};
