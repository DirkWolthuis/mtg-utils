import type { GameState } from '../model/game-state';
import type { GameEvent, GameEventKind } from './events';

export type Subscriber = (state: GameState, event: GameEvent) => GameEvent[];

export interface EventBus {
  on: (kind: GameEventKind | '*', handler: Subscriber) => void;
  notify: (state: GameState, event: GameEvent) => GameEvent[];
}

export const createEventBus = (): EventBus => {
  const byKind = new Map<GameEventKind | '*', Subscriber[]>();

  const on: EventBus['on'] = (kind, handler) => {
    const existing = byKind.get(kind);
    if (existing) existing.push(handler);
    else byKind.set(kind, [handler]);
  };

  const notify: EventBus['notify'] = (state, event) => {
    const out: GameEvent[] = [];
    for (const handler of byKind.get(event.kind) ?? []) out.push(...handler(state, event));
    for (const handler of byKind.get('*') ?? []) out.push(...handler(state, event));
    return out;
  };

  return { on, notify };
};
