import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_DECK,
  computeSpent,
  getMana,
  type Action,
  type CardDefinitionId,
  type PlayerView,
} from '@mtg-utils/engine-core';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';
import { ClientMessageType, ServerMessageType } from '@mtg-utils/engine-protocol';

export { DEFAULT_DECK, computeSpent, getMana };

export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Waiting = 'waiting',
  Active = 'active',
}

@Injectable({ providedIn: 'root' })
export class EngineWsService {
  readonly view = signal<PlayerView | null>(null);
  readonly connectionStatus = signal<ConnectionStatus>(ConnectionStatus.Disconnected);
  readonly lastRejection = signal<string | null>(null);
  readonly log = signal<string[]>([]);
  readonly serverVersion = signal<string | null>(null);

  playerId = '';
  gameId = '';

  private ws: WebSocket | null = null;

  connect(
    playerId: string,
    name: string,
    gameId: string,
    url: string,
    deck: CardDefinitionId[],
  ): void {
    this.ws?.close();
    this.playerId = playerId;
    this.gameId = gameId;
    this.connectionStatus.set(ConnectionStatus.Connecting);
    this.log.set([]);
    this.view.set(null);
    this.lastRejection.set(null);
    this.serverVersion.set(null);

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.connectionStatus.set(ConnectionStatus.Waiting);
      this.sendRaw({
        type: ClientMessageType.JoinGame,
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
      this.connectionStatus.set(ConnectionStatus.Disconnected);
      this.addLog('← connection closed');
    };

    ws.onerror = () => {
      this.connectionStatus.set(ConnectionStatus.Disconnected);
      this.addLog('← connection error');
    };
  }

  submit(action: Action): void {
    this.sendRaw({ type: ClientMessageType.SubmitAction, gameId: this.gameId as never, action });
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
    switch (msg.type) {
      case ServerMessageType.JoinAck:
        this.serverVersion.set(msg.serverVersion);
        this.addLog(`← join_ack ready=${msg.ready} version=${msg.serverVersion}`);
        if (msg.ready) {
          this.connectionStatus.set(ConnectionStatus.Active);
        }
        return;
      case ServerMessageType.StateSync:
        this.view.set(msg.view);
        if (this.connectionStatus() !== ConnectionStatus.Active) {
          this.connectionStatus.set(ConnectionStatus.Active);
        }
        this.addLog(`← state_sync turn=${msg.view.turn} step=${msg.view.step}`);
        return;
      case ServerMessageType.EventBatch:
        this.view.set(msg.view);
        this.lastRejection.set(null);
        this.addLog(
          `← event_batch (${msg.events.length}) turn=${msg.view.turn} step=${msg.view.step}`,
        );
        for (const e of msg.events) {
          let suffix = '';
          if ('cardId' in e) {
            suffix = ` ${(e as { cardId: string }).cardId}`;
          } else if ('playerId' in e) {
            suffix = ` ${(e as { playerId: string }).playerId}`;
          }
          this.addLog(`  · ${e.type}${suffix}`);
        }
        return;
      case ServerMessageType.RejectedAction:
        this.lastRejection.set(msg.reason);
        this.addLog(`← REJECTED: ${msg.reason}`);
        return;
      case ServerMessageType.GameOver:
        this.addLog(`← GAME OVER winner=${msg.winner ?? 'draw'}`);
        return;
      case ServerMessageType.ServerError:
        this.addLog(`← server_error: ${msg.message}`);
        return;
    }
  }

  private addLog(line: string): void {
    this.log.update((lines) => [...lines.slice(-99), line]);
  }
}
