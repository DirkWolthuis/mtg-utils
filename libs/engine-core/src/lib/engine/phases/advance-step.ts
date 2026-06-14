import type { GameState } from '../../model/game-state';
import { otherPlayer } from '../../model/game-state';
import type { CardInstanceId, PlayerId, Step } from '../../model/types';
import type { EventBus } from '../event-bus';
import type { GameEvent } from '../events';
import { computeCombatDamageEvents } from './combat';

const intrinsicForStep = (state: GameState, step: Step): GameEvent[] => {
  switch (step) {
    case 'untap':
      return intrinsicUntap(state);
    case 'draw':
      return intrinsicDraw(state);
    case 'combat_damage':
      return computeCombatDamageEvents(state);
    case 'cleanup':
      return intrinsicCleanup(state);
    default:
      return [];
  }
};

const intrinsicUntap = (state: GameState): GameEvent[] => {
  const active = state.activePlayer;
  const events: GameEvent[] = [];
  events.push({ kind: 'lands_played_reset', playerId: active });
  for (const id of state.battlefield) {
    const c = state.cards[id];
    if (c.controllerId !== active) continue;
    if (c.tapped) events.push({ kind: 'permanent_untapped', cardId: id });
    if (c.summoningSick) events.push({ kind: 'summoning_sickness_cleared', cardId: id });
  }
  return events;
};

const intrinsicDraw = (state: GameState): GameEvent[] => {
  const active = state.activePlayer;
  // Turn-1 first player skip-draw
  if (state.turn === 1 && state.playerOrder[0] === active) return [];
  const lib = state.players[active].library;
  if (lib.length === 0) {
    return [
      { kind: 'draw_attempted_empty', playerId: active },
      { kind: 'player_lost', playerId: active, reason: 'deck_out' },
    ];
  }
  return [{ kind: 'card_drawn', playerId: active, cardId: lib[0] as CardInstanceId }];
};

const intrinsicCleanup = (state: GameState): GameEvent[] => {
  const events: GameEvent[] = [];
  for (const pid of state.playerOrder) {
    events.push({ kind: 'mana_pool_emptied', playerId: pid });
  }
  events.push({ kind: 'damage_cleared_at_cleanup' });
  return events;
};

const turnStartedFor = (state: GameState, justEntered: Step, fromStep: Step): GameEvent[] => {
  // turn rolls when cleanup → untap
  if (fromStep === 'cleanup' && justEntered === 'untap') {
    const newActive: PlayerId = otherPlayer(state, state.activePlayer);
    return [{ kind: 'turn_started', turn: state.turn + 1, activePlayer: newActive }];
  }
  return [];
};

const skippableEmptyDeclareSteps = (state: GameState, step: Step): GameEvent[] => {
  if (step === 'declare_blockers' && state.combat.attackers.length === 0) {
    return [
      {
        kind: 'step_advanced',
        from: 'declare_blockers',
        to: 'combat_damage',
        turn: state.turn,
      },
    ];
  }
  return [];
};

export const registerStepAdvanceSubscriber = (bus: EventBus): void => {
  bus.on('step_advanced', (state, event) => {
    if (event.kind !== 'step_advanced') return [];
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
