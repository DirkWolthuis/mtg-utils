import { ok } from '@mtg-utils/engine-util';
import type { GameEvent } from '../../../engine/events';
import { GameEventType } from '../../../engine/events';
import type { EffectHandler } from '../effect-registry';
import type { DrawCards } from '../effect-types';

export const drawCards: EffectHandler<DrawCards> = (effect, ctx) => {
  const events: GameEvent[] = [];
  const library = ctx.state.players[ctx.casterId].library;
  for (let i = 0; i < effect.count; i++) {
    const cardId = library[i];
    if (cardId === undefined) {
      events.push({ type: GameEventType.DrawAttemptedEmpty, playerId: ctx.casterId });
      break;
    }
    events.push({ type: GameEventType.CardDrawn, playerId: ctx.casterId, cardId });
  }
  return ok(events);
};
