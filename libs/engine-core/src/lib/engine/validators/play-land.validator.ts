import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { PlayLand } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { requireActive, requireStep } from './_shared';

export const validatePlayLand = (
  state: GameState,
  action: PlayLand,
): Result<GameEvent[], string> => {
  const step = requireStep(state, ['main1', 'main2']);
  if (step) {
    return err(step);
  }
  const active = requireActive(state, action.playerId);
  if (active) {
    return err(active);
  }

  const player = state.players[action.playerId];
  if (player.landsPlayedThisTurn >= 1) {
    return err('already played a land this turn');
  }
  const card = state.cards[action.cardId];
  if (!card || card.zone !== 'hand' || card.ownerId !== action.playerId) {
    return err('card not in your hand');
  }
  const def = getCardDefinition(card.definitionId);
  if (!def.types.includes('land')) {
    return err('not a land');
  }

  return ok<GameEvent[]>([
    { type: 'land_played', playerId: action.playerId, cardId: card.id },
    {
      type: 'card_entered_zone',
      cardId: card.id,
      from: 'hand',
      to: 'battlefield',
      causedBy: action.playerId,
    },
  ]);
};
