import type {
  GameEvent,
  GameId,
  PlayerId,
  PlayerView,
} from '@mtg-utils/engine-core';

export interface StateSync {
  kind: 'state_sync';
  gameId: GameId;
  view: PlayerView;
}

export interface EventBatch {
  kind: 'event_batch';
  gameId: GameId;
  events: GameEvent[];
  view: PlayerView;
}

export interface RejectedAction {
  kind: 'rejected_action';
  gameId: GameId;
  reason: string;
}

export interface GameOver {
  kind: 'game_over';
  gameId: GameId;
  winner: PlayerId | null;
}

export interface ServerError {
  kind: 'server_error';
  message: string;
}

export interface JoinAck {
  kind: 'join_ack';
  gameId: GameId;
  playerId: PlayerId;
  /** Both players present and game has started */
  ready: boolean;
}

export type ServerMessage =
  | StateSync
  | EventBatch
  | RejectedAction
  | GameOver
  | ServerError
  | JoinAck;

export type ServerMessageKind = ServerMessage['kind'];
