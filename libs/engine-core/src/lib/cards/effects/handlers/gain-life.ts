import type { GainLife } from '../effect-types';
import type { EffectHandler } from '../effect-registry';
import { ok } from '@mtg-utils/engine-util';

export const gainLife: EffectHandler<GainLife> = (effect, ctx) =>
  ok([
    {
      kind: 'life_changed',
      playerId: ctx.casterId,
      delta: effect.amount,
      reason: 'effect',
    },
  ]);
