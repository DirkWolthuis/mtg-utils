import type { GameId } from '@mtg-utils/engine-core';
import { GameRoom } from './game-room';

export class RoomRegistry {
  private readonly rooms = new Map<GameId, GameRoom>();

  getOrCreate(id: GameId): GameRoom {
    const existing = this.rooms.get(id);
    if (existing) {
      return existing;
    }
    const room = new GameRoom(id);
    this.rooms.set(id, room);
    return room;
  }

  get(id: GameId): GameRoom | undefined {
    return this.rooms.get(id);
  }

  delete(id: GameId): void {
    this.rooms.delete(id);
  }
}
