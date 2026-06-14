import type { GameEvent, GameId, PlayerId, PlayerView } from '@mtg-utils/engine-core';

export type StateSync = {
  kind: 'state_sync';
  gameId: GameId;
  view: PlayerView;
};

export type EventBatch = {
  kind: 'event_batch';
  gameId: GameId;
  events: GameEvent[];
  view: PlayerView;
};

export type RejectedAction = {
  kind: 'rejected_action';
  gameId: GameId;
  reason: string;
};

export type GameOver = {
  kind: 'game_over';
  gameId: GameId;
  winner: PlayerId | null;
};

export type ServerError = {
  kind: 'server_error';
  message: string;
};

export type JoinAck = {
  kind: 'join_ack';
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

export type ServerMessageKind = ServerMessage['kind'];
