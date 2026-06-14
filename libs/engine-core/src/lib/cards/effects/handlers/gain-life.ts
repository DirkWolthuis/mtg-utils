import { ok } from '@mtg-utils/engine-util';
import type { EffectHandler } from '../effect-registry';
import type { GainLife } from '../effect-types';

export const gainLife: EffectHandler<GainLife> = (effect, ctx) =>
  ok([
    {
      type: 'life_changed',
      playerId: ctx.casterId,
      delta: effect.amount,
      reason: 'effect',
    },
  ]);
