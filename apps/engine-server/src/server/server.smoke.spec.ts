import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket, type WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';
import type {
  CardDefinitionId,
  GameEvent,
  PlayerId,
  PlayerView,
} from '@mtg-utils/engine-core';
import { ActionKind } from '@mtg-utils/engine-core';
import { startWebSocketServer } from './ws-server';

const PORT = 18080;
const GAME_ID = 'smoke-1';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const send = (ws: WebSocket, msg: ClientMessage): void => {
  ws.send(JSON.stringify(msg));
};

interface ClientHandle {
  ws: WebSocket;
  inbox: ServerMessage[];
  events: GameEvent[];
  views: PlayerView[];
}

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
    if (msg.kind === 'event_batch') {
      events.push(...msg.events);
      views.push(msg.view);
    } else if (msg.kind === 'state_sync') {
      views.push(msg.view);
    }
  });

  send(ws, {
    kind: 'join_game',
    gameId: GAME_ID as never,
    playerId: playerId as PlayerId,
    name,
    deck,
  });

  return { ws, inbox, events, views };
};

const waitForKind = async (
  client: ClientHandle,
  kind: ServerMessage['kind'],
  timeoutMs = 3000,
): Promise<ServerMessage> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = client.inbox.find((m) => m.kind === kind);
    if (found) return found;
    await wait(20);
  }
  throw new Error(`timeout waiting for ${kind}`);
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
      'forest', 'forest', 'forest', 'forest', 'forest',
      'grizzly-bears', 'grizzly-bears', 'grizzly-bears', 'grizzly-bears', 'grizzly-bears',
      'lightning-strike', 'lightning-strike', 'healing-salve',
    ] as CardDefinitionId[];
    const bobDeck: CardDefinitionId[] = [
      'mountain', 'mountain', 'mountain', 'mountain', 'mountain',
      'grizzly-bears', 'grizzly-bears', 'grizzly-bears', 'grizzly-bears', 'grizzly-bears',
      'lightning-strike', 'lightning-strike', 'healing-salve',
    ] as CardDefinitionId[];

    const a = await connect('p1', 'Alice', aliceDeck);
    const b = await connect('p2', 'Bob', bobDeck);

    await waitForKind(a, 'state_sync');
    await waitForKind(b, 'state_sync');

    const view = a.views[a.views.length - 1];
    expect(view).toBeDefined();
    if (!view) return;

    const activeClient = view.activePlayer === ('p1' as PlayerId) ? a : b;
    const activeView = activeClient.views[activeClient.views.length - 1];
    expect(activeView).toBeDefined();
    if (!activeView) return;
    const expectedWinner = activeView.opponent.id;

    send(activeClient.ws, {
      kind: 'submit_action',
      gameId: GAME_ID as never,
      action: { kind: ActionKind.Concede, playerId: activeView.forPlayer },
    });

    const over = await waitForKind(a, 'game_over');
    expect(over.kind).toBe('game_over');
    if (over.kind === 'game_over') {
      expect(over.winner).toBe(expectedWinner);
    }

    a.ws.close();
    b.ws.close();
  });
});
