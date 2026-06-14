import type { StackItem } from './stack';
import type {
  CardInstance,
  CardInstanceId,
  CombatState,
  GameId,
  GameStatus,
  Player,
  PlayerId,
  Step,
} from './types';

export interface GameState {
  id: GameId;
  status: GameStatus;
  playerOrder: [PlayerId, PlayerId];
  players: Record<PlayerId, Player>;
  cards: Record<CardInstanceId, CardInstance>;
  battlefield: CardInstanceId[];
  /** Bottom of stack at index 0; top of stack at index length-1. Resolves top-first. */
  stack: StackItem[];
  activePlayer: PlayerId;
  /** Whoever currently has priority; null between steps when priority is being handed back. */
  priorityPlayer: PlayerId | null;
  /**
   * Consecutive `pass_priority` actions with no intervening stack change.
   * Resets to 0 whenever a spell/ability is put on the stack or one resolves.
   * Reaches 2 (= number of players) → either top of stack resolves, or step advances.
   */
  consecutivePasses: number;
  turn: number;
  step: Step;
  combat: CombatState;
  seed: number;
  rngState: number;
  losers: PlayerId[];
  winner: PlayerId | null;
}

export const otherPlayer = (state: GameState, playerId: PlayerId): PlayerId =>
  state.playerOrder[0] === playerId ? state.playerOrder[1] : state.playerOrder[0];
