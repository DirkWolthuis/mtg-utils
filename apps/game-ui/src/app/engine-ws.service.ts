import { Injectable, signal } from '@angular/core';
import type {
  Action,
  CardDefinitionId,
  ManaColor,
  ManaCost,
  ManaPool,
  PlayerView,
} from '@mtg-utils/engine-core';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

export const computeSpent = (
  cost: ManaCost | null,
  pool: ManaPool,
): Partial<Record<ManaColor, number>> => {
  if (!cost) return {};
  const spent: Partial<Record<ManaColor, number>> = {};
  for (const c of COLORS) {
    const req = cost[c] ?? 0;
    if (req > 0) spent[c] = req;
  }
  let generic = cost.generic ?? 0;
  for (const c of COLORS) {
    if (generic <= 0) break;
    const avail = getMana(pool, c) - (spent[c] ?? 0);
    const use = Math.min(avail, generic);
    if (use > 0) {
      spent[c] = (spent[c] ?? 0) + use;
      generic -= use;
    }
  }
  return spent;
};

export const getMana = (pool: ManaPool, color: ManaColor): number => {
  switch (color) {
    case 'W':
      return pool.W;
    case 'U':
      return pool.U;
    case 'B':
      return pool.B;
    case 'R':
      return pool.R;
    case 'G':
      return pool.G;
    case 'C':
      return pool.C;
  }
};

export const DEFAULT_DECK: CardDefinitionId[] = [
  'forest',
  'forest',
  'forest',
  'forest',
  'forest',
  'forest',
  'mountain',
  'mountain',
  'mountain',
  'mountain',
  'mountain',
  'mountain',
  'grizzly-bears',
  'grizzly-bears',
  'grizzly-bears',
  'grizzly-bears',
  'hill-giant',
  'hill-giant',
  'lightning-strike',
  'lightning-strike',
  'healing-salve',
] as CardDefinitionId[];

export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'active';

@Injectable({ providedIn: 'root' })
export class EngineWsService {
  readonly view = signal<PlayerView | null>(null);
  readonly connectionStatus = signal<ConnectionStatus>('disconnected');
  readonly lastRejection = signal<string | null>(null);
  readonly log = signal<string[]>([]);

  playerId = '';
  gameId = '';

  private ws: WebSocket | null = null;

  connect(
    playerId: string,
    name: string,
    gameId: string,
    port: number,
    deck: CardDefinitionId[],
  ): void {
    this.ws?.close();
    this.playerId = playerId;
    this.gameId = gameId;
    this.connectionStatus.set('connecting');
    this.log.set([]);
    this.view.set(null);
    this.lastRejection.set(null);

    const ws = new WebSocket(`ws://localhost:${port}`);
    this.ws = ws;

    ws.onopen = () => {
      this.connectionStatus.set('waiting');
      this.sendRaw({
        kind: 'join_game',
        gameId: gameId as never,
        playerId: playerId as never,
        name,
        deck,
      });
      this.addLog('→ join_game sent');
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      this.handleMessage(msg);
    };

    ws.onclose = () => {
      this.connectionStatus.set('disconnected');
      this.addLog('← connection closed');
    };

    ws.onerror = () => {
      this.connectionStatus.set('disconnected');
      this.addLog('← connection error');
    };
  }

  submit(action: Action): void {
    this.sendRaw({ kind: 'submit_action', gameId: this.gameId as never, action });
    this.lastRejection.set(null);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  private sendRaw(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.kind) {
      case 'join_ack':
        this.addLog(`← join_ack ready=${msg.ready}`);
        if (msg.ready) this.connectionStatus.set('active');
        return;
      case 'state_sync':
        this.view.set(msg.view);
        if (this.connectionStatus() !== 'active') this.connectionStatus.set('active');
        this.addLog(`← state_sync turn=${msg.view.turn} step=${msg.view.step}`);
        return;
      case 'event_batch':
        this.view.set(msg.view);
        this.lastRejection.set(null);
        this.addLog(
          `← event_batch (${msg.events.length}) turn=${msg.view.turn} step=${msg.view.step}`,
        );
        for (const e of msg.events) {
          let suffix = '';
          if ('cardId' in e) suffix = ` ${(e as { cardId: string }).cardId}`;
          else if ('playerId' in e) suffix = ` ${(e as { playerId: string }).playerId}`;
          this.addLog(`  · ${e.type}${suffix}`);
        }
        return;
      case 'rejected_action':
        this.lastRejection.set(msg.reason);
        this.addLog(`← REJECTED: ${msg.reason}`);
        return;
      case 'game_over':
        this.addLog(`← GAME OVER winner=${msg.winner ?? 'draw'}`);
        return;
      case 'server_error':
        this.addLog(`← server_error: ${msg.message}`);
        return;
    }
  }

  private addLog(line: string): void {
    this.log.update((lines) => [...lines.slice(-99), line]);
  }
}
