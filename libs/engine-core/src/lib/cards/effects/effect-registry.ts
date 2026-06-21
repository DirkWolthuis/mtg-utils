import type { Result } from '@mtg-utils/engine-util';
import { err, ok } from '@mtg-utils/engine-util';
import type { GameEvent } from '../../engine/events';
import type { GameState } from '../../model/game-state';
import type { CardInstanceId, PlayerId } from '../../model/types';
import type { Effect, EffectTarget, EffectType } from './effect-types';
import { dealDamageToAny } from './handlers/deal-damage';
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
  ['deal_damage_to_any', dealDamageToAny as AnyHandler],
  ['draw_cards', drawCards as AnyHandler],
  ['gain_life', gainLife as AnyHandler],
]);

export const runEffect = (effect: Effect, ctx: EffectContext): Result<GameEvent[], string> => {
  const handler = registry.get(effect.type);
  if (!handler) {
    return err(`no handler registered for effect ${effect.type}`);
  }
  return handler(effect, ctx);
};

export { err, ok };
