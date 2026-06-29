import { err, ok } from '@mtg-utils/engine-util';
import type { GameEvent } from '../../../engine/events';
import { GameEventType, LifeChangeReason, TargetKind, Zone } from '../../../model/enums';
import type { EffectContext, EffectHandler } from '../effect-registry';
import type { DealDamageToAny } from '../effect-types';

export const dealDamageToAny: EffectHandler<DealDamageToAny> = (effect, ctx: EffectContext) => {
  if (!ctx.target) {
    return err('deal_damage_to_any requires a target');
  }
  const target = ctx.target;
  if (target.kind === TargetKind.Player && !ctx.state.players[target.playerId]) {
    return err('unknown player target');
  }
  if (target.kind === TargetKind.Permanent) {
    const c = ctx.state.cards[target.cardId];
    if (!c || c.zone !== Zone.Battlefield) {
      return err('target not on battlefield');
    }
  }
  const events: GameEvent[] = [
    {
      type: GameEventType.DamageDealt,
      sourceCardId: ctx.sourceCardId,
      target,
      amount: effect.amount,
      combat: false,
    },
  ];
  if (target.kind === TargetKind.Player) {
    events.push({
      type: GameEventType.LifeChanged,
      playerId: target.playerId,
      delta: -effect.amount,
      reason: LifeChangeReason.Damage,
    });
  }
  return ok(events);
};
