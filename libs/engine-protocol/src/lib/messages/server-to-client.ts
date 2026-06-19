import type { GameEvent, GameId, PlayerId, PlayerView } from '@mtg-utils/engine-core';

export enum ServerMessageKind {
  StateSync = 'state_sync',
  EventBatch = 'event_batch',
  RejectedAction = 'rejected_action',
  GameOver = 'game_over',
  ServerError = 'server_error',
  JoinAck = 'join_ack',
}

export type StateSync = {
  kind: ServerMessageKind.StateSync;
  gameId: GameId;
  view: PlayerView;
};

export type EventBatch = {
  kind: ServerMessageKind.EventBatch;
  gameId: GameId;
  events: GameEvent[];
  view: PlayerView;
};

export type RejectedAction = {
  kind: ServerMessageKind.RejectedAction;
  gameId: GameId;
  reason: string;
};

export type GameOver = {
  kind: ServerMessageKind.GameOver;
  gameId: GameId;
  winner: PlayerId | null;
};

export type ServerError = {
  kind: ServerMessageKind.ServerError;
  message: string;
};

export type JoinAck = {
  kind: ServerMessageKind.JoinAck;
  gameId: GameId;
  playerId: PlayerId;
  /** Both players present and game has started */
  ready: boolean;
};

export type ServerMessage =
  | StateSync
  | EventBatch
  | RejectedAction
  | GameOver
  | ServerError
  | JoinAck;
