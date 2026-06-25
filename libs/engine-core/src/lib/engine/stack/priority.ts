import { GameEventType, PriorityResetReason } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import { STEP_ORDER } from '../../model/types';
import type { EventBus } from '../event-bus';
import type { GameEvent } from '../events';
import { resolveStackItem } from './resolve';

const PASSES_TO_RESOLVE = 2;

/**
 * Drives the priority-pass loop:
 *
 * - When both players pass priority in a row (`consecutivePasses === 2`), either
 *   resolve the top of the stack (if non-empty) or advance the step.
 * - When a stack item resolves, priority resets to the active player.
 * - When the step advances, priority resets to the active player.
 *
 * Spells reset `consecutivePasses` via applyEvent; the caster keeps priority and
 * may chain more or pass.
 */
export const registerPriorityLoop = (bus: EventBus): void => {
  bus.on(GameEventType.PriorityPassed, (state) => {
    if (state.consecutivePasses < PASSES_TO_RESOLVE) {
      return [];
    }
    // Both players have passed in a row.
    if (state.stack.length > 0) {
      const top = state.stack[state.stack.length - 1];
      return resolveStackItem(state, top);
    }
    return advanceStep(state);
  });

  bus.on(GameEventType.StackItemResolved, (state) => [
    {
      type: GameEventType.PriorityReset,
      to: state.activePlayer,
      reason: PriorityResetReason.StackChanged,
    },
  ]);

  bus.on(GameEventType.StepAdvanced, (state) => [
    {
      type: GameEventType.PriorityReset,
      to: state.activePlayer,
      reason: PriorityResetReason.StepStarted,
    },
  ]);

  // After attackers/blockers are declared, the active player receives priority
  // first, opening the window for combat tricks before the step advances.
  bus.on(GameEventType.CombatDeclared, (state) => [
    {
      type: GameEventType.PriorityReset,
      to: state.activePlayer,
      reason: PriorityResetReason.CombatDeclared,
    },
  ]);
};

const advanceStep = (state: GameState): GameEvent[] => {
  const idx = STEP_ORDER.indexOf(state.step);
  const to = STEP_ORDER[(idx + 1) % STEP_ORDER.length];
  return [{ type: GameEventType.StepAdvanced, from: state.step, to, turn: state.turn }];
};
