import type { GameEvent, GameId, PlayerId, PlayerView } from '@mtg-utils/engine-core';

export enum ServerMessageType {
  StateSync = 'state_sync',
  EventBatch = 'event_batch',
  RejectedAction = 'rejected_action',
  GameOver = 'game_over',
  ServerError = 'server_error',
  JoinAck = 'join_ack',
}

export type StateSync = {
  type: ServerMessageType.StateSync;
  gameId: GameId;
  view: PlayerView;
};

export type EventBatch = {
  type: ServerMessageType.EventBatch;
  gameId: GameId;
  events: GameEvent[];
  view: PlayerView;
};

export type RejectedAction = {
  type: ServerMessageType.RejectedAction;
  gameId: GameId;
  reason: string;
};

export type GameOver = {
  type: ServerMessageType.GameOver;
  gameId: GameId;
  winner: PlayerId | null;
};

export type ServerError = {
  type: ServerMessageType.ServerError;
  message: string;
};

export type JoinAck = {
  type: ServerMessageType.JoinAck;
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
