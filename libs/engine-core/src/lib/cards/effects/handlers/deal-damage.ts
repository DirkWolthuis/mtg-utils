import type { DealDamageToAny } from '../effect-types';
import type { EffectContext, EffectHandler } from '../effect-registry';
import type { GameEvent } from '../../../engine/events';
import { err, ok } from '../../../engine/result';

export const dealDamageToAny: EffectHandler<DealDamageToAny> = (
  effect,
  ctx: EffectContext,
) => {
  if (!ctx.target) return err('deal_damage_to_any requires a target');
  const target = ctx.target;
  if (target.kind === 'player' && !ctx.state.players[target.playerId]) {
    return err('unknown player target');
  }
  if (target.kind === 'permanent') {
    const c = ctx.state.cards[target.cardId];
    if (!c || c.zone !== 'battlefield') return err('target not on battlefield');
  }
  const events: GameEvent[] = [
    {
      kind: 'damage_dealt',
      sourceCardId: ctx.sourceCardId,
      target,
      amount: effect.amount,
      combat: false,
    },
  ];
  if (target.kind === 'player') {
    events.push({
      kind: 'life_changed',
      playerId: target.playerId,
      delta: -effect.amount,
      reason: 'damage',
    });
  }
  return ok(events);
};
