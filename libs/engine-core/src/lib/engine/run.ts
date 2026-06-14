import type { Result } from '@mtg-utils/engine-util';
import type { Action } from '../actions/action';
import type { GameState } from '../model/game-state';
import { applyEvent } from './apply-event';
import type { EventBus } from './event-bus';
import { createEventBus } from './event-bus';
import type { GameEvent } from './events';
import { validate } from './validate';

export type ApplyResult = {
  state: GameState;
  events: GameEvent[];
};

export type SubscriberRegistrar = (bus: EventBus) => void;
export type SbaCheck = (state: GameState) => GameEvent[];

export type EngineConfig = {
  registrars?: SubscriberRegistrar[];
  sbaChecks?: SbaCheck[];
};

export type Engine = {
  apply: (state: GameState, action: Action) => Result<ApplyResult, string>;
  drain: (state: GameState, seedEvents: GameEvent[]) => ApplyResult;
};

export const MAX_EVENTS_PER_ACTION = 10_000;

export const createEngine = (config: EngineConfig = {}): Engine => {
  const bus = createEventBus();
  for (const r of config.registrars ?? []) r(bus);
  const sbaChecks = config.sbaChecks ?? [];

  const runSbas = (state: GameState, log: GameEvent[], counter: { n: number }): GameState => {
    let s = state;
    let stable = false;
    while (!stable) {
      stable = true;
      const generated: GameEvent[] = [];
      for (const check of sbaChecks) generated.push(...check(s));
      if (generated.length === 0) break;
      for (const e of generated) {
        if (counter.n++ > MAX_EVENTS_PER_ACTION) {
          throw new Error('event loop exceeded max events per action; possible cycle');
        }
        s = applyEvent(s, e);
        log.push(e);
        const followups = bus.notify(s, e);
        if (followups.length) {
          for (const f of followups) {
            if (counter.n++ > MAX_EVENTS_PER_ACTION) {
              throw new Error('event loop exceeded max events per action; possible cycle');
            }
            s = applyEvent(s, f);
            log.push(f);
          }
        }
        stable = false;
      }
    }
    return s;
  };

  const drain = (state: GameState, seedEvents: GameEvent[]): ApplyResult => {
    const queue: GameEvent[] = [...seedEvents];
    const log: GameEvent[] = [];
    let s = state;
    const counter = { n: 0 };
    while (queue.length > 0) {
      if (counter.n++ > MAX_EVENTS_PER_ACTION) {
        throw new Error('event loop exceeded max events per action; possible cycle');
      }
      const event = queue.shift() as GameEvent;
      s = applyEvent(s, event);
      log.push(event);
      const followups = bus.notify(s, event);
      if (followups.length) queue.push(...followups);
      s = runSbas(s, log, counter);
    }
    return { state: s, events: log };
  };

  const apply: Engine['apply'] = (state, action) => {
    const v = validate(state, action);
    if (!v.ok) return v;
    return { ok: true, value: drain(state, v.value) };
  };

  return { apply, drain };
};
