import type { Effect, EffectTarget } from '../cards/effects/effect-types';
import type { CardInstanceId, ManaColor, PlayerId, StackItemId } from './types';

/**
 * Resolution origin of a stack item: `Spell` for cast cards (move card to
 * graveyard on resolution), `Ability` for triggered/activated (no zone move).
 * v0 sets `Spell` only.
 */
export enum StackItemSource {
  Spell = 'spell',
  Ability = 'ability',
}

/**
 * A spell or ability on the stack. The `cardId` points at the card instance
 * that produced it (a spell currently in the `stack` zone, or — once
 * triggered/activated abilities exist — the permanent whose ability triggered).
 *
 * Effects are stored as descriptors so they re-resolve against current state
 * (e.g. target-legality checks happen at resolution, not at cast time).
 */
export type StackItem = {
  id: StackItemId;
  controllerId: PlayerId;
  /** The card instance whose cast/trigger put this on the stack. */
  cardId: CardInstanceId;
  source: StackItemSource;
  effects: Effect[];
  /** Ordered, one per damage-style effect; otherwise empty. */
  targets: EffectTarget[];
  /** Recorded for the event log; spent at cast time, not on resolution. */
  manaSpent: Partial<Record<ManaColor, number>>;
};
