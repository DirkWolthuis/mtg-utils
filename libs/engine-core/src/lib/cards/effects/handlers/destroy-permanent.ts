import { err, ok } from '@mtg-utils/engine-util';
import type { GameEvent } from '../../../engine/events';
import { CardType, GameEventType, TargetKind, Zone } from '../../../model/enums';
import { getCardDefinition } from '../../catalog';
import type { EffectContext, EffectHandler } from '../effect-registry';
import type { DestroyPermanent } from '../effect-types';

export const destroyPermanent: EffectHandler<DestroyPermanent> = (_effect, ctx: EffectContext) => {
  if (!ctx.target || ctx.target.kind !== TargetKind.Permanent) {
    return err('destroy_permanent requires a permanent target');
  }
  const { cardId } = ctx.target;
  const card = ctx.state.cards[cardId];
  if (!card || card.zone !== Zone.Battlefield) {
    return err('target not on battlefield');
  }
  const def = getCardDefinition(card.definitionId);
  const events: GameEvent[] = [];
  if (def.types.includes(CardType.Creature)) {
    events.push({ type: GameEventType.CreatureDied, cardId });
  }
  events.push({
    type: GameEventType.CardEnteredZone,
    cardId,
    from: Zone.Battlefield,
    to: Zone.Graveyard,
  });
  return ok(events);
};
