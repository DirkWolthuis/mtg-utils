import type { CardDefinitionId, GameEvent, PlayerId, PlayerView } from '@mtg-utils/engine-core';
import { ActionType } from '@mtg-utils/engine-core';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';
import { ClientMessageType, ServerMessageType } from '@mtg-utils/engine-protocol';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket, type WebSocketServer } from 'ws';
import { startWebSocketServer } from './ws-server';

const PORT = 18080;
const GAME_ID = 'smoke-1';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const send = (ws: WebSocket, msg: ClientMessage): void => {
  ws.send(JSON.stringify(msg));
};

type ClientHandle = {
  ws: WebSocket;
  inbox: ServerMessage[];
  events: GameEvent[];
  views: PlayerView[];
};

const connect = async (
  playerId: string,
  name: string,
  deck: CardDefinitionId[],
): Promise<ClientHandle> => {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const inbox: ServerMessage[] = [];
  const events: GameEvent[] = [];
  const views: PlayerView[] = [];

  await new Promise<void>((resolve) => ws.on('open', () => resolve()));

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString()) as ServerMessage;
    inbox.push(msg);
    if (msg.type === ServerMessageType.EventBatch) {
      events.push(...msg.events);
      views.push(msg.view);
    } else if (msg.type === ServerMessageType.StateSync) {
      views.push(msg.view);
    }
  });

  send(ws, {
    type: ClientMessageType.JoinGame,
    gameId: GAME_ID as never,
    playerId: playerId as PlayerId,
    name,
    deck,
  });

  return { ws, inbox, events, views };
};

const waitForType = async (
  client: ClientHandle,
  msgType: ServerMessage['type'],
  timeoutMs = 3000,
): Promise<ServerMessage> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = client.inbox.find((m) => m.type === msgType);
    if (found) {
      return found;
    }
    await wait(20);
  }
  throw new Error(`timeout waiting for ${msgType}`);
};

describe('engine-server smoke', () => {
  let server: WebSocketServer;

  beforeAll(async () => {
    server = startWebSocketServer({ port: PORT });
    await wait(50);
  });

  afterAll(async () => {
    server.close();
    await wait(50);
  });

  it('runs a 2-client game where the active player concedes', async () => {
    const aliceDeck: CardDefinitionId[] = [
      'forest',
      'forest',
      'forest',
      'forest',
      'forest',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'lightning-strike',
      'lightning-strike',
      'healing-salve',
    ] as CardDefinitionId[];
    const bobDeck: CardDefinitionId[] = [
      'mountain',
      'mountain',
      'mountain',
      'mountain',
      'mountain',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'grizzly-bears',
      'lightning-strike',
      'lightning-strike',
      'healing-salve',
    ] as CardDefinitionId[];

    const a = await connect('p1', 'Alice', aliceDeck);
    const b = await connect('p2', 'Bob', bobDeck);

    await waitForType(a, ServerMessageType.StateSync);
    await waitForType(b, ServerMessageType.StateSync);

    const view = a.views[a.views.length - 1];
    expect(view).toBeDefined();
    if (!view) {
      return;
    }

    const activeClient = view.activePlayer === ('p1' as PlayerId) ? a : b;
    const activeView = activeClient.views[activeClient.views.length - 1];
    expect(activeView).toBeDefined();
    if (!activeView) {
      return;
    }
    const expectedWinner = activeView.opponent.id;

    send(activeClient.ws, {
      type: ClientMessageType.SubmitAction,
      gameId: GAME_ID as never,
      action: { type: ActionType.Concede, playerId: activeView.forPlayer },
    });

    const over = await waitForType(a, ServerMessageType.GameOver);
    expect(over.type).toBe(ServerMessageType.GameOver);
    if (over.type === ServerMessageType.GameOver) {
      expect(over.winner).toBe(expectedWinner);
    }

    a.ws.close();
    b.ws.close();
  });
});
