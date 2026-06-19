import { makeGameId, makePlayerId } from '@mtg-utils/engine-core';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';
import {
  ClientMessageKind,
  ServerMessageKind,
  parseClientMessage,
} from '@mtg-utils/engine-protocol';
import { type WebSocket, WebSocketServer } from 'ws';
import { RoomRegistry } from './room-registry';
import { createSession } from './session';

export type StartOptions = {
  port: number;
};

export const startWebSocketServer = (opts: StartOptions): WebSocketServer => {
  const wss = new WebSocketServer({ port: opts.port });
  const rooms = new RoomRegistry();

  wss.on('connection', (socket: WebSocket) => {
    const session = createSession(socket);

    const sendDirect = (msg: ServerMessage): void => {
      if (socket.readyState !== socket.OPEN) return;
      socket.send(JSON.stringify(msg));
    };

    socket.on('message', (data) => {
      const text = typeof data === 'string' ? data : data.toString();
      const msg = parseClientMessage(text);
      if (!msg) {
        sendDirect({ kind: ServerMessageKind.ServerError, message: 'malformed message' });
        return;
      }
      handle(msg);
    });

    socket.on('close', () => {
      // v0: keep room around for reconnects; nothing to do here
    });

    const handle = (msg: ClientMessage): void => {
      switch (msg.kind) {
        case ClientMessageKind.JoinGame: {
          const gameId = makeGameId(msg.gameId);
          const playerId = makePlayerId(msg.playerId);
          const room = rooms.getOrCreate(gameId);
          const result = room.join({
            playerId,
            name: msg.name,
            deck: msg.deck,
            socket,
          });
          if (!result.ok) {
            sendDirect({ kind: ServerMessageKind.ServerError, message: result.reason });
            return;
          }
          session.gameId = gameId;
          session.playerId = playerId;
          sendDirect({
            kind: ServerMessageKind.JoinAck,
            gameId,
            playerId,
            ready: result.ready,
          });
          if (result.ready) room.sendStateSync(playerId);
          return;
        }
        case ClientMessageKind.SubmitAction: {
          const gameId = makeGameId(msg.gameId);
          const room = rooms.get(gameId);
          if (!room) {
            sendDirect({ kind: ServerMessageKind.ServerError, message: 'unknown game' });
            return;
          }
          const result = room.submitAction(msg.action);
          if (!result.ok && session.playerId) {
            room.sendError(session.playerId, result.reason);
          }
          return;
        }
        case ClientMessageKind.LeaveGame: {
          // v0: no-op; reconnect-friendly
          return;
        }
      }
    };
  });

  return wss;
};
