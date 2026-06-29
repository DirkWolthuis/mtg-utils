import { ok } from '@mtg-utils/engine-util';
import { GameEventType, LifeChangeReason } from '../../../model/enums';
import type { EffectHandler } from '../effect-registry';
import type { GainLife } from '../effect-types';

export const gainLife: EffectHandler<GainLife> = (effect, ctx) =>
  ok([
    {
      type: GameEventType.LifeChanged,
      playerId: ctx.casterId,
      delta: effect.amount,
      reason: LifeChangeReason.Effect,
    },
  ]);
