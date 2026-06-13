import { WebSocket } from 'ws';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';
import type {
  CardDefinitionId,
  GameEvent,
  PlayerId,
  PlayerView,
} from '@mtg-utils/engine-core';
import { startWebSocketServer } from '../apps/engine-server/src/server/ws-server';

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

const main = async () => {
  const server = startWebSocketServer({ port: PORT });
  await wait(50);

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
  if (!view) throw new Error('alice has no view');
  console.log(
    `Game started — active=${view.activePlayer}, turn=${view.turn}, step=${view.step}`,
  );

  // Active player concedes; expect GameOver with the OTHER as winner.
  const activeClient = view.activePlayer === ('p1' as PlayerId) ? a : b;
  const activeView = activeClient.views[activeClient.views.length - 1];
  if (!activeView) throw new Error('no active view');
  const expectedWinner = activeView.opponent.id;

  send(activeClient.ws, {
    kind: 'submit_action',
    gameId: GAME_ID as never,
    action: { kind: 'concede', playerId: activeView.forPlayer },
  });

  const over = await waitForKind(a, 'game_over');
  if (over.kind !== 'game_over') throw new Error('not game_over');
  if (over.winner !== expectedWinner) {
    throw new Error(`expected winner ${expectedWinner}, got ${over.winner}`);
  }
  console.log(`SMOKE OK: GameOver, winner=${over.winner}`);

  a.ws.close();
  b.ws.close();
  server.close();
  await wait(50);
};

main().catch((e) => {
  console.error('SMOKE FAILED:', e);
  process.exit(1);
});
