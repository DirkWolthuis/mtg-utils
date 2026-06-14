import type { GameState } from '../../model/game-state';
import type { StackItemId } from '../../model/types';
import { makeStackItemId } from '../../model/types';

/**
 * Deterministic per-game stack item id. Safe (no collisions) because the stack's
 * `length + 1` is monotonic between casts: every cast increments the stack, and
 * resolutions decrement only after another cast can run.
 */
export const nextStackItemId = (state: GameState, cardId: string): StackItemId =>
  makeStackItemId(`s-t${state.turn}-${state.stack.length + 1}-${cardId}`);

export const requireStep = (state: GameState, allowed: GameState['step'][]): string | null => {
  if (allowed.includes(state.step)) {
    return null;
  }
  return `action not legal during step ${state.step}; expected one of ${allowed.join(', ')}`;
};

export const requireActive = (
  state: GameState,
  playerId: GameState['activePlayer'],
): string | null => {
  if (playerId === state.activePlayer) {
    return null;
  }
  return `not active player's turn`;
};

/** Sorcery speed: caster is active player, has priority, in a main phase, with empty stack. */
export const sorcerySpeed = (state: GameState, playerId: GameState['activePlayer']): boolean =>
  state.activePlayer === playerId &&
  state.priorityPlayer === playerId &&
  (state.step === 'main1' || state.step === 'main2') &&
  state.stack.length === 0;

/** Instant speed: caster has priority. That's it. */
export const instantSpeed = (state: GameState, playerId: GameState['activePlayer']): boolean =>
  state.priorityPlayer === playerId;
