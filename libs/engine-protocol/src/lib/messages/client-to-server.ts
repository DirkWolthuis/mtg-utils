import type { Action, CardDefinitionId, GameId, PlayerId } from '@mtg-utils/engine-core';

export enum ClientMessageKind {
  JoinGame = 'join_game',
  SubmitAction = 'submit_action',
  LeaveGame = 'leave_game',
}

export type JoinGame = {
  kind: ClientMessageKind.JoinGame;
  gameId: GameId;
  playerId: PlayerId;
  name: string;
  deck: CardDefinitionId[];
};

export type SubmitAction = {
  kind: ClientMessageKind.SubmitAction;
  gameId: GameId;
  action: Action;
};

export type LeaveGame = {
  kind: ClientMessageKind.LeaveGame;
  gameId: GameId;
  playerId: PlayerId;
};

export type ClientMessage = JoinGame | SubmitAction | LeaveGame;
