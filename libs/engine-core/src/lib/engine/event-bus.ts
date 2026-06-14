import type { GameState } from '../model/game-state';
import type { GameEvent, GameEventType } from './events';

export type Subscriber = (state: GameState, event: GameEvent) => GameEvent[];

export type EventBus = {
  on: (eventType: GameEventType | '*', handler: Subscriber) => void;
  notify: (state: GameState, event: GameEvent) => GameEvent[];
};

export const createEventBus = (): EventBus => {
  const byType = new Map<GameEventType | '*', Subscriber[]>();

  const on: EventBus['on'] = (eventType, handler) => {
    const existing = byType.get(eventType);
    if (existing) existing.push(handler);
    else byType.set(eventType, [handler]);
  };

  const notify: EventBus['notify'] = (state, event) => {
    const out: GameEvent[] = [];
    for (const handler of byType.get(event.type) ?? []) out.push(...handler(state, event));
    for (const handler of byType.get('*') ?? []) out.push(...handler(state, event));
    return out;
  };

  return { on, notify };
};
