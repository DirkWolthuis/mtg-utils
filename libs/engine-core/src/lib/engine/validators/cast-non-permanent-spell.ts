import { err, ok, type Result } from '@mtg-utils/engine-util';

import type { CastInstant, CastSorcery } from '../../actions/action';
import { getCardDefinition } from '../../cards/catalog';
import { EffectType, GameEventType, StackItemSource, Zone, type CardType } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import type { StackItem } from '../../model/stack';
import type { GameEvent } from '../events';
import { manaSpentMatchesCost, poolHasAtLeast } from '../mana';
import { instantSpeed, nextStackItemId, sorcerySpeed } from './_shared';

/**
 * Shared cast logic for instants and sorceries. The only differences between
 * the two are which timing check applies and what the card type must be — the
 * rest (cost, targets, stack item construction, events) is identical.
 */
export const castNonPermanentSpell = (
  state: GameState,
  action: CastSorcery | CastInstant,
  requiredType: CardType.Sorcery | CardType.Instant,
  atInstantSpeed: boolean,
): Result<GameEvent[], string> => {
  if (atInstantSpeed) {
    if (!instantSpeed(state, action.playerId)) {
      return err('you do not have priority');
    }
  } else {
    if (!sorcerySpeed(state, action.playerId)) {
      return err('cannot cast at sorcery speed right now');
    }
  }

  const card = state.cards[action.cardId];
  if (!card || card.zone !== Zone.Hand || card.ownerId !== action.playerId) {
    return err('card not in your hand');
  }

  const def = getCardDefinition(card.definitionId);
  if (!def.types.includes(requiredType)) {
    return err(`not a ${requiredType}`);
  }
  if (!def.manaCost) {
    return err(`no mana cost on ${requiredType}`);
  }

  const costCheck = manaSpentMatchesCost(def.manaCost, action.manaSpent);
  if (!costCheck.ok) {
    return err(costCheck.reason);
  }
  const poolCheck = poolHasAtLeast(state.players[action.playerId].manaPool, action.manaSpent);
  if (!poolCheck.ok) {
    return err(poolCheck.reason);
  }

  const effects = def.effects ?? [];
  const targetedEffectTypes = new Set([EffectType.DealDamageToAny, EffectType.DestroyPermanent]);
  const targetCount = effects.filter((e) => targetedEffectTypes.has(e.type)).length;
  const targets = action.targets ?? [];
  if (targets.length < targetCount) {
    return err(`spell needs ${targetCount} target(s)`);
  }

  const item: StackItem = {
    id: nextStackItemId(state, card.id),
    controllerId: action.playerId,
    cardId: card.id,
    source: StackItemSource.Spell,
    effects,
    targets: targets.slice(0, targetCount),
    manaSpent: action.manaSpent,
  };

  return ok<GameEvent[]>([
    { type: GameEventType.ManaSpent, playerId: action.playerId, spent: action.manaSpent },
    {
      type: GameEventType.CardEnteredZone,
      cardId: card.id,
      from: Zone.Hand,
      to: Zone.Stack,
      causedBy: action.playerId,
    },
    { type: GameEventType.SpellPutOnStack, item },
  ]);
};
