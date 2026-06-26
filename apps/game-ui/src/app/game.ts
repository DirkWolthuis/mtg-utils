import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CardInstance,
  CardInstanceId,
  ManaColor,
  ManaCost,
  PlayerId,
  PlayerView,
} from '@mtg-utils/engine-core';
import {
  ActionType,
  CardType,
  EffectType,
  GameStatus,
  Step,
  TargetKind,
  getCardDefinition,
} from '@mtg-utils/engine-core';
import {
  ConnectionStatus,
  DEFAULT_DECK,
  EngineWsService,
  computeSpent,
  getMana,
} from './engine-ws.service';
import { RuntimeConfigService } from './runtime-config.service';

type CardRow = {
  id: CardInstanceId;
  name: string;
  costLabel: string;
  types: CardType[];
  power?: number;
  toughness?: number;
  produces: ManaColor[];
  instance: CardInstance;
};

const formatCost = (cost: ManaCost | null): string => {
  if (!cost) {
    return '';
  }
  const parts: string[] = [];
  if (cost.generic) {
    parts.push(String(cost.generic));
  }
  for (const c of ['W', 'U', 'B', 'R', 'G', 'C'] as ManaColor[]) {
    const n = cost[c] ?? 0;
    for (let i = 0; i < n; i++) {
      parts.push(c);
    }
  }
  return `{${parts.join('')}}`;
};

const toCardRow = (id: CardInstanceId, v: PlayerView): CardRow => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const inst = v.cards[id]!;
  const def = getCardDefinition(inst.definitionId);
  return {
    id,
    name: def.name,
    costLabel: formatCost(def.manaCost),
    types: def.types,
    power: def.power,
    toughness: def.toughness,
    produces: def.produces ?? [],
    instance: inst,
  };
};

@Component({
  selector: 'gui-game',
  templateUrl: './game.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class Game {
  // Exposed to the template so it can compare against enum members rather than string literals.
  protected readonly CardType = CardType;
  protected readonly Step = Step;
  protected readonly ConnectionStatus = ConnectionStatus;

  protected readonly ws = inject(EngineWsService);

  // Join form fields
  protected joinPlayerId = 'p1';
  protected joinName = 'Player 1';
  protected joinGameId = 'g1';
  protected joinUrl = inject(RuntimeConfigService).engineWsUrl();

  protected readonly selectedAttackers = signal<Set<CardInstanceId>>(new Set());
  protected readonly blockerAssignments = signal<Map<CardInstanceId, CardInstanceId>>(new Map());

  private lastAutoPassedView: PlayerView | null = null;
  private readonly skipUntilTurn = signal<number | null>(null);

  protected readonly isSkipping = computed(() => this.skipUntilTurn() !== null);

  constructor() {
    effect(() => {
      const v = this.ws.view();
      const rejection = this.ws.lastRejection();

      if (rejection !== null) {
        this.lastAutoPassedView = null;
      }

      if (!v) {
        return;
      }

      const skip = this.skipUntilTurn();
      if (skip !== null && v.turn !== skip) {
        this.skipUntilTurn.set(null);
      }

      if (this.skipUntilTurn() === null) {
        return;
      }
      if (v === this.lastAutoPassedView) {
        return;
      }
      if (v.status !== GameStatus.Active) {
        return;
      }
      if (v.priorityPlayer !== v.forPlayer) {
        return;
      }
      this.lastAutoPassedView = v;
      this.ws.submit({ type: ActionType.PassPriority, playerId: v.forPlayer });
    });
  }

  // --- Computed view slices ---

  protected readonly myHand = computed<CardRow[]>(() => {
    const v = this.ws.view();
    if (!v) {
      return [];
    }
    return v.self.hand.map((id) => toCardRow(id, v));
  });

  protected readonly myBattlefield = computed<CardRow[]>(() => {
    const v = this.ws.view();
    if (!v) {
      return [];
    }
    return v.battlefield
      .filter((id) => v.cards[id]?.controllerId === v.forPlayer)
      .map((id) => toCardRow(id, v));
  });

  protected readonly opponentBattlefield = computed<CardRow[]>(() => {
    const v = this.ws.view();
    if (!v) {
      return [];
    }
    return v.battlefield
      .filter((id) => v.cards[id]?.controllerId !== v.forPlayer)
      .map((id) => toCardRow(id, v));
  });

  protected readonly attackingIds = computed<Set<CardInstanceId>>(() => {
    const v = this.ws.view();
    if (!v) {
      return new Set();
    }
    return new Set(v.combat.attackers.map((a) => a.attackerId));
  });

  protected readonly attackerRows = computed<CardRow[]>(() => {
    const v = this.ws.view();
    if (!v) {
      return [];
    }
    return v.combat.attackers.map((a) => toCardRow(a.attackerId, v));
  });

  protected readonly manaDisplay = computed<string>(() => {
    const v = this.ws.view();
    if (!v) {
      return '';
    }
    const pool = v.self.manaPool;
    const parts = (['W', 'U', 'B', 'R', 'G', 'C'] as ManaColor[])
      .filter((c) => getMana(pool, c) > 0)
      .map((c) => `${c}:${getMana(pool, c)}`);
    return parts.length ? parts.join(' ') : '(empty)';
  });

  protected readonly hasPriority = computed(
    () => this.ws.view()?.priorityPlayer === this.ws.view()?.forPlayer,
  );

  // --- Actions ---

  protected join(): void {
    this.ws.connect(this.joinPlayerId, this.joinName, this.joinGameId, this.joinUrl, DEFAULT_DECK);
  }

  protected pass(): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    this.ws.submit({ type: ActionType.PassPriority, playerId: v.forPlayer });
  }

  protected concede(): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    this.ws.submit({ type: ActionType.Concede, playerId: v.forPlayer });
  }

  protected skipTurn(): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    if (this.skipUntilTurn() !== null) {
      this.skipUntilTurn.set(null);
    } else {
      this.skipUntilTurn.set(v.turn);
      this.lastAutoPassedView = null;
    }
  }

  protected playCard(id: CardInstanceId): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    const inst = v.cards[id];
    if (!inst) {
      return;
    }
    const def = getCardDefinition(inst.definitionId);
    const playerId: PlayerId = v.forPlayer;

    if (def.types.includes(CardType.Land)) {
      this.ws.submit({ type: ActionType.PlayLand, playerId, cardId: id });
      return;
    }

    const spent = computeSpent(def.manaCost, v.self.manaPool);

    if (def.types.includes(CardType.Creature)) {
      this.ws.submit({ type: ActionType.CastCreature, playerId, cardId: id, manaSpent: spent });
      return;
    }

    if (def.types.includes(CardType.Sorcery) || def.types.includes(CardType.Instant)) {
      const opponentId = v.opponent.id as PlayerId;
      const targets = (def.effects ?? [])
        .filter((e) => e.type === EffectType.DealDamageToAny)
        .map(() => ({ kind: TargetKind.Player as const, playerId: opponentId }));
      const type = def.types.includes(CardType.Instant)
        ? ActionType.CastInstant
        : ActionType.CastSorcery;
      this.ws.submit({ type, playerId, cardId: id, manaSpent: spent, targets });
    }
  }

  protected tapLand(id: CardInstanceId, color: ManaColor): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    this.ws.submit({ type: ActionType.TapLandForMana, playerId: v.forPlayer, cardId: id, color });
  }

  protected toggleAttacker(id: CardInstanceId): void {
    this.selectedAttackers.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected declareAttackers(): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    this.ws.submit({
      type: ActionType.DeclareAttackers,
      playerId: v.forPlayer,
      attackerIds: Array.from(this.selectedAttackers()),
    });
    this.selectedAttackers.set(new Set());
  }

  protected onBlockerChange(blockerId: CardInstanceId, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.blockerAssignments.update((map) => {
      const next = new Map(map);
      if (value) {
        next.set(blockerId, value as CardInstanceId);
      } else {
        next.delete(blockerId);
      }
      return next;
    });
  }

  protected readonly getCardDefinition = getCardDefinition;

  protected declareBlockers(): void {
    const v = this.ws.view();
    if (!v) {
      return;
    }
    const assignments = Array.from(this.blockerAssignments().entries()).map(
      ([blockerId, attackerId]) => ({ blockerId, attackerId }),
    );
    this.ws.submit({
      type: ActionType.DeclareBlockers,
      playerId: v.forPlayer,
      assignments,
    });
    this.blockerAssignments.set(new Map());
  }
}
