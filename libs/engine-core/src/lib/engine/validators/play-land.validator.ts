import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { PlayLand } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { CardType, GameEventType, Step, Zone } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';
import { requireActive, requireStep } from './_shared';

export const validatePlayLand = (
  state: GameState,
  action: PlayLand,
): Result<GameEvent[], string> => {
  const step = requireStep(state, [Step.Main1, Step.Main2]);
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
  if (!card || card.zone !== Zone.Hand || card.ownerId !== action.playerId) {
    return err('card not in your hand');
  }
  const def = getCardDefinition(card.definitionId);
  if (!def.types.includes(CardType.Land)) {
    return err('not a land');
  }

  return ok<GameEvent[]>([
    { type: GameEventType.LandPlayed, playerId: action.playerId, cardId: card.id },
    {
      type: GameEventType.CardEnteredZone,
      cardId: card.id,
      from: Zone.Hand,
      to: Zone.Battlefield,
      causedBy: action.playerId,
    },
  ]);
};
