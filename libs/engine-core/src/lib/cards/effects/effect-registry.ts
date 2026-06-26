import type { Result } from '@mtg-utils/engine-util';
import { err, ok } from '@mtg-utils/engine-util';
import type { GameEvent } from '../../engine/events';
import { EffectType } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import type { CardInstanceId, PlayerId } from '../../model/types';
import type { Effect, EffectTarget } from './effect-types';
import { dealDamageToAny } from './handlers/deal-damage';
import { destroyPermanent } from './handlers/destroy-permanent';
import { drawCards } from './handlers/draw-cards';
import { gainLife } from './handlers/gain-life';

export type EffectContext = {
  state: GameState;
  casterId: PlayerId;
  sourceCardId: CardInstanceId;
  target?: EffectTarget;
};

export type EffectHandler<E extends Effect> = (
  effect: E,
  ctx: EffectContext,
) => Result<GameEvent[], string>;

type AnyHandler = EffectHandler<Effect>;

const registry = new Map<EffectType, AnyHandler>([
  [EffectType.DealDamageToAny, dealDamageToAny as AnyHandler],
  [EffectType.DrawCards, drawCards as AnyHandler],
  [EffectType.GainLife, gainLife as AnyHandler],
  [EffectType.DestroyPermanent, destroyPermanent as AnyHandler],
]);

export const runEffect = (effect: Effect, ctx: EffectContext): Result<GameEvent[], string> => {
  const handler = registry.get(effect.type);
  if (!handler) {
    return err(`no handler registered for effect ${effect.type}`);
  }
  return handler(effect, ctx);
};

export { err, ok };
