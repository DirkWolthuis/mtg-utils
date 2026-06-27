import { Injectable, computed, signal } from '@angular/core';
import type { CubeCard, Relationship } from '../models/cube.model';

type PersistedState = {
  cubeId: string;
  cubeName: string;
  cards: CubeCard[];
  relationships: Relationship[];
};

const STORAGE_KEY = 'cube-network-v1';

@Injectable({ providedIn: 'root' })
export class NetworkStateService {
  readonly cubeId = signal<string | null>(null);
  readonly cubeName = signal<string | null>(null);
  readonly cards = signal<CubeCard[]>([]);
  readonly relationships = signal<Relationship[]>([]);

  readonly hasData = computed(() => this.cards().length > 0);

  constructor() {
    this.loadFromStorage();
  }

  loadCube(cubeId: string, cards: CubeCard[]): void {
    this.cubeId.set(cubeId);
    this.cubeName.set(cubeId);
    this.cards.set(cards);
    this.relationships.set([]);
    this.persist();
  }

  addRelationship(sourceId: string, targetId: string, label: string): void {
    const rel: Relationship = {
      id: `${sourceId}--${targetId}--${Date.now()}`,
      sourceId,
      targetId,
      label,
    };
    this.relationships.update((rels) => [...rels, rel]);
    this.persist();
  }

  deleteRelationship(id: string): void {
    this.relationships.update((rels) => rels.filter((r) => r.id !== id));
    this.persist();
  }

  getCardName(id: string): string {
    return this.cards().find((c) => c.id === id)?.name ?? id;
  }

  private persist(): void {
    const state: PersistedState = {
      cubeId: this.cubeId() ?? '',
      cubeName: this.cubeName() ?? '',
      cards: this.cards(),
      relationships: this.relationships(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {return;}
    try {
      const state = JSON.parse(raw) as PersistedState;
      this.cubeId.set(state.cubeId || null);
      this.cubeName.set(state.cubeName || null);
      this.cards.set(state.cards ?? []);
      this.relationships.set(state.relationships ?? []);
    } catch {
      // ignore corrupt data
    }
  }
}
