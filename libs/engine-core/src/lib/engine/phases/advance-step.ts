import { GameEventType, PlayerLostReason, Step } from '../../model/enums';
import type { GameState } from '../../model/game-state';
import { otherPlayer } from '../../model/game-state';
import type { CardInstanceId, PlayerId } from '../../model/types';
import type { EventBus } from '../event-bus';
import type { GameEvent } from '../events';
import { computeCombatDamageEvents } from './combat';

const intrinsicForStep = (state: GameState, step: Step): GameEvent[] => {
  switch (step) {
    case Step.Untap:
      return intrinsicUntap(state);
    case Step.Draw:
      return intrinsicDraw(state);
    case Step.CombatDamage:
      return computeCombatDamageEvents(state);
    case Step.Cleanup:
      return intrinsicCleanup(state);
    default:
      return [];
  }
};

const intrinsicUntap = (state: GameState): GameEvent[] => {
  const active = state.activePlayer;
  const events: GameEvent[] = [];
  events.push({ type: GameEventType.LandsPlayedReset, playerId: active });
  for (const id of state.battlefield) {
    const c = state.cards[id];
    if (c.controllerId !== active) {
      continue;
    }
    if (c.tapped) {
      events.push({ type: GameEventType.PermanentUntapped, cardId: id });
    }
    if (c.summoningSick) {
      events.push({ type: GameEventType.SummoningSicknessCleared, cardId: id });
    }
  }
  return events;
};

const intrinsicDraw = (state: GameState): GameEvent[] => {
  const active = state.activePlayer;
  // Turn-1 first player skip-draw
  if (state.turn === 1 && state.playerOrder[0] === active) {
    return [];
  }
  const lib = state.players[active].library;
  if (lib.length === 0) {
    return [
      { type: GameEventType.DrawAttemptedEmpty, playerId: active },
      { type: GameEventType.PlayerLost, playerId: active, reason: PlayerLostReason.DeckOut },
    ];
  }
  return [{ type: GameEventType.CardDrawn, playerId: active, cardId: lib[0] as CardInstanceId }];
};

const intrinsicCleanup = (state: GameState): GameEvent[] => {
  const events: GameEvent[] = [];
  for (const pid of state.playerOrder) {
    events.push({ type: GameEventType.ManaPoolEmptied, playerId: pid });
  }
  events.push({ type: GameEventType.DamageClearedAtCleanup });
  return events;
};

const turnStartedFor = (state: GameState, justEntered: Step, fromStep: Step): GameEvent[] => {
  // turn rolls when cleanup → untap
  if (fromStep === Step.Cleanup && justEntered === Step.Untap) {
    const newActive: PlayerId = otherPlayer(state, state.activePlayer);
    return [{ type: GameEventType.TurnStarted, turn: state.turn + 1, activePlayer: newActive }];
  }
  return [];
};

const skippableEmptyDeclareSteps = (state: GameState, step: Step): GameEvent[] => {
  if (step === Step.DeclareBlockers && state.combat.attackers.length === 0) {
    return [
      {
        type: GameEventType.StepAdvanced,
        from: Step.DeclareBlockers,
        to: Step.CombatDamage,
        turn: state.turn,
      },
    ];
  }
  return [];
};

export const registerStepAdvanceSubscriber = (bus: EventBus): void => {
  bus.on(GameEventType.StepAdvanced, (state, event) => {
    if (event.type !== GameEventType.StepAdvanced) {
      return [];
    }
    // First: any turn_started event for the *new* state
    const startedEvents = turnStartedFor(state, event.to, event.from);
    // Then: the intrinsic events for the new step
    const intrinsics = intrinsicForStep(state, event.to);
    // Then: any auto-skip (e.g. declare_blockers with no attackers)
    const skips = skippableEmptyDeclareSteps(state, event.to);
    // Knit: turn_started first, then intrinsics, then skips at the end
    // (skips need to fire after intrinsics so combat_damage_marked etc. don't get bypassed)
    return [...startedEvents, ...intrinsics, ...skips];
  });
};
