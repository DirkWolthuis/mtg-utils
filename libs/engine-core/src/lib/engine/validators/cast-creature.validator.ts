import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { CastCreature } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import type { GameState } from '../../model/game-state';
import type { StackItem } from '../../model/stack';
import type { GameEvent } from '../events';
import { manaSpentMatchesCost, poolHasAtLeast, totalSpent } from '../mana';
import { nextStackItemId, sorcerySpeed } from './_shared';

export const validateCastCreature = (
  state: GameState,
  action: CastCreature,
): Result<GameEvent[], string> => {
  if (!sorcerySpeed(state, action.playerId)) {
    return err('cannot cast at sorcery speed right now');
  }

  const card = state.cards[action.cardId];
  if (!card || card.zone !== 'hand' || card.ownerId !== action.playerId) {
    return err('card not in your hand');
  }

  const def = getCardDefinition(card.definitionId);
  if (!def.types.includes('creature')) {
    return err('not a creature');
  }
  if (!def.manaCost) {
    return err('no mana cost on creature');
  }

  const costCheck = manaSpentMatchesCost(def.manaCost, action.manaSpent);
  if (!costCheck.ok) {
    return err(costCheck.reason);
  }
  const poolCheck = poolHasAtLeast(state.players[action.playerId].manaPool, action.manaSpent);
  if (!poolCheck.ok) {
    return err(poolCheck.reason);
  }
  if (totalSpent(action.manaSpent) === 0) {
    return err('must spend mana for a non-free spell');
  }

  const item: StackItem = {
    id: nextStackItemId(state, card.id),
    controllerId: action.playerId,
    cardId: card.id,
    source: 'spell',
    effects: [],
    targets: [],
    manaSpent: action.manaSpent,
  };

  return ok<GameEvent[]>([
    { type: 'mana_spent', playerId: action.playerId, spent: action.manaSpent },
    {
      type: 'card_entered_zone',
      cardId: card.id,
      from: 'hand',
      to: 'stack',
      causedBy: action.playerId,
    },
    { type: 'spell_put_on_stack', item },
  ]);
};
