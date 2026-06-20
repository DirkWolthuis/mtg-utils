import type { Action, CardDefinitionId, GameId, PlayerId } from '@mtg-utils/engine-core';

export enum ClientMessageType {
  JoinGame = 'join_game',
  SubmitAction = 'submit_action',
  LeaveGame = 'leave_game',
}

export type JoinGame = {
  type: ClientMessageType.JoinGame;
  gameId: GameId;
  playerId: PlayerId;
  name: string;
  deck: CardDefinitionId[];
};

export type SubmitAction = {
  type: ClientMessageType.SubmitAction;
  gameId: GameId;
  action: Action;
};

export type LeaveGame = {
  type: ClientMessageType.LeaveGame;
  gameId: GameId;
  playerId: PlayerId;
};

export type ClientMessage = JoinGame | SubmitAction | LeaveGame;
