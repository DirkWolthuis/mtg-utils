import type { Action, CardDefinitionId, GameId, PlayerId } from '@mtg-utils/engine-core';

export type JoinGame = {
  kind: 'join_game';
  gameId: GameId;
  playerId: PlayerId;
  name: string;
  deck: CardDefinitionId[];
};

export type SubmitAction = {
  kind: 'submit_action';
  gameId: GameId;
  action: Action;
};

export type LeaveGame = {
  kind: 'leave_game';
  gameId: GameId;
  playerId: PlayerId;
};

export type ClientMessage = JoinGame | SubmitAction | LeaveGame;
export type ClientMessageKind = ClientMessage['kind'];
