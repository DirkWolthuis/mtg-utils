import type { GameId, PlayerId } from '@mtg-utils/engine-core';
import type { WebSocket } from 'ws';

export type Session = {
  socket: WebSocket;
  gameId: GameId | null;
  playerId: PlayerId | null;
};

export const createSession = (socket: WebSocket): Session => ({
  socket,
  gameId: null,
  playerId: null,
});
