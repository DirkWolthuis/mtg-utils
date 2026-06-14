import {
  type Action,
  type CardDefinitionId,
  type Engine,
  type GameEvent,
  type GameId,
  type GameState,
  type PlayerId,
  type PlayerView,
  createDefaultEngine,
  projectFor,
  setupGame,
} from '@mtg-utils/engine-core';
import type { ServerMessage } from '@mtg-utils/engine-protocol';
import type { WebSocket } from 'ws';

export type JoinedPlayer = {
  playerId: PlayerId;
  name: string;
  deck: CardDefinitionId[];
  socket: WebSocket;
};

export class GameRoom {
  readonly id: GameId;
  private readonly engine: Engine;
  private state: GameState | null = null;
  private readonly players = new Map<PlayerId, JoinedPlayer>();
  private readonly log: GameEvent[] = [];

  constructor(id: GameId) {
    this.id = id;
    this.engine = createDefaultEngine();
  }

  get isFull(): boolean {
    return this.players.size >= 2;
  }

  get hasStarted(): boolean {
    return this.state !== null;
  }

  hasPlayer(playerId: PlayerId): boolean {
    return this.players.has(playerId);
  }

  attachSocket(playerId: PlayerId, socket: WebSocket): void {
    const existing = this.players.get(playerId);
    if (existing) existing.socket = socket;
  }

  join(player: JoinedPlayer): { ok: true; ready: boolean } | { ok: false; reason: string } {
    const existing = this.players.get(player.playerId);
    if (existing) {
      // Re-attach socket for an existing player (reconnect)
      existing.socket = player.socket;
      return { ok: true, ready: this.hasStarted };
    }
    if (this.isFull) return { ok: false, reason: 'game is full' };
    this.players.set(player.playerId, player);
    if (this.players.size === 2 && !this.hasStarted) this.start();
    return { ok: true, ready: this.hasStarted };
  }

  private start(): void {
    const arr = Array.from(this.players.values());
    const [a, b] = arr;
    this.state = setupGame({
      id: this.id,
      seed: Date.now() >>> 0,
      players: [
        { id: a.playerId, name: a.name, decklist: a.deck },
        { id: b.playerId, name: b.name, decklist: b.deck },
      ],
    });
    for (const p of arr) this.sendStateSync(p.playerId);
  }

  submitAction(action: Action): { ok: true } | { ok: false; reason: string } {
    if (!this.state) return { ok: false, reason: 'game has not started' };
    const result = this.engine.apply(this.state, action);
    if (!result.ok) return { ok: false, reason: result.error };
    this.state = result.value.state;
    this.log.push(...result.value.events);
    for (const p of this.players.values()) {
      this.sendEventBatch(p.playerId, result.value.events);
    }
    if (this.state.status === 'ended') {
      this.broadcast({ kind: 'game_over', gameId: this.id, winner: this.state.winner });
    }
    return { ok: true };
  }

  private viewFor(playerId: PlayerId): PlayerView | null {
    if (!this.state) return null;
    return projectFor(this.state, playerId);
  }

  private send(playerId: PlayerId, msg: ServerMessage): void {
    const p = this.players.get(playerId);
    if (!p) return;
    if (p.socket.readyState !== p.socket.OPEN) return;
    p.socket.send(JSON.stringify(msg));
  }

  private broadcast(msg: ServerMessage): void {
    for (const p of this.players.values()) this.send(p.playerId, msg);
  }

  sendStateSync(playerId: PlayerId): void {
    const view = this.viewFor(playerId);
    if (!view) return;
    this.send(playerId, { kind: 'state_sync', gameId: this.id, view });
  }

  private sendEventBatch(playerId: PlayerId, events: GameEvent[]): void {
    const view = this.viewFor(playerId);
    if (!view) return;
    this.send(playerId, { kind: 'event_batch', gameId: this.id, events, view });
  }

  sendError(playerId: PlayerId, reason: string): void {
    this.send(playerId, { kind: 'rejected_action', gameId: this.id, reason });
  }
}
