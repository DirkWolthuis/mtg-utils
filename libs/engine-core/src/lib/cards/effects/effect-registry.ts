import type { Effect, EffectKind, EffectTarget } from './effect-types';
import type { GameState } from '../../model/game-state';
import type { CardInstanceId, PlayerId } from '../../model/types';
import type { GameEvent } from '../../engine/events';
import type { Result } from '../../engine/result';
import { err, ok } from '../../engine/result';
import { dealDamageToAny } from './handlers/deal-damage';
import { drawCards } from './handlers/draw-cards';
import { gainLife } from './handlers/gain-life';

export interface EffectContext {
  state: GameState;
  casterId: PlayerId;
  sourceCardId: CardInstanceId;
  target?: EffectTarget;
}

export type EffectHandler<E extends Effect> = (
  effect: E,
  ctx: EffectContext,
) => Result<GameEvent[], string>;

type AnyHandler = EffectHandler<Effect>;

const registry = new Map<EffectKind, AnyHandler>([
  ['deal_damage_to_any', dealDamageToAny as AnyHandler],
  ['draw_cards', drawCards as AnyHandler],
  ['gain_life', gainLife as AnyHandler],
]);

export const runEffect = (effect: Effect, ctx: EffectContext): Result<GameEvent[], string> => {
  const handler = registry.get(effect.kind);
  if (!handler) return err(`no handler registered for effect ${effect.kind}`);
  return handler(effect, ctx);
};

export { ok, err };
