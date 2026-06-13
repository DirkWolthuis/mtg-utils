export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type CardInstanceId = string & { readonly __brand: 'CardInstanceId' };
export type CardDefinitionId = string & { readonly __brand: 'CardDefinitionId' };
export type GameId = string & { readonly __brand: 'GameId' };
export type StackItemId = string & { readonly __brand: 'StackItemId' };

export const makePlayerId = (s: string): PlayerId => s as PlayerId;
export const makeCardInstanceId = (s: string): CardInstanceId => s as CardInstanceId;
export const makeCardDefinitionId = (s: string): CardDefinitionId => s as CardDefinitionId;
export const makeGameId = (s: string): GameId => s as GameId;
export const makeStackItemId = (s: string): StackItemId => s as StackItemId;

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

export interface ManaPool {
  W: number;
  U: number;
  B: number;
  R: number;
  G: number;
  C: number;
}

export const emptyManaPool = (): ManaPool => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });

export const totalMana = (pool: ManaPool): number =>
  pool.W + pool.U + pool.B + pool.R + pool.G + pool.C;

export type ManaCost = Partial<Record<ManaColor, number>> & { generic?: number };

export const cmcOf = (cost: ManaCost | null): number => {
  if (!cost) return 0;
  return (
    (cost.W ?? 0) +
    (cost.U ?? 0) +
    (cost.B ?? 0) +
    (cost.R ?? 0) +
    (cost.G ?? 0) +
    (cost.C ?? 0) +
    (cost.generic ?? 0)
  );
};

export type Zone = 'library' | 'hand' | 'battlefield' | 'graveyard' | 'exile' | 'stack';

export type CardType =
  | 'land'
  | 'creature'
  | 'instant'
  | 'sorcery'
  | 'enchantment'
  | 'artifact'
  | 'planeswalker';

export const isSpellType = (type: CardType): boolean =>
  type === 'creature' ||
  type === 'instant' ||
  type === 'sorcery' ||
  type === 'enchantment' ||
  type === 'artifact' ||
  type === 'planeswalker';

export type SuperType = 'basic' | 'legendary' | 'snow';

export type Keyword =
  | 'haste'
  | 'flying'
  | 'trample'
  | 'vigilance'
  | 'lifelink'
  | 'deathtouch'
  | 'first_strike';

export interface CardInstance {
  id: CardInstanceId;
  definitionId: CardDefinitionId;
  ownerId: PlayerId;
  controllerId: PlayerId;
  zone: Zone;
  tapped: boolean;
  powerMod: number;
  toughnessMod: number;
  damage: number;
  summoningSick: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  life: number;
  manaPool: ManaPool;
  library: CardInstanceId[];
  hand: CardInstanceId[];
  graveyard: CardInstanceId[];
  exile: CardInstanceId[];
  landsPlayedThisTurn: number;
}

export type Phase = 'beginning' | 'main1' | 'combat' | 'main2' | 'ending';

export type Step =
  | 'untap'
  | 'upkeep'
  | 'draw'
  | 'main1'
  | 'begin_combat'
  | 'declare_attackers'
  | 'declare_blockers'
  | 'combat_damage'
  | 'end_combat'
  | 'main2'
  | 'end'
  | 'cleanup';

export const STEP_ORDER: Step[] = [
  'untap',
  'upkeep',
  'draw',
  'main1',
  'begin_combat',
  'declare_attackers',
  'declare_blockers',
  'combat_damage',
  'end_combat',
  'main2',
  'end',
  'cleanup',
];

export const phaseOfStep = (step: Step): Phase => {
  switch (step) {
    case 'untap':
    case 'upkeep':
    case 'draw':
      return 'beginning';
    case 'main1':
      return 'main1';
    case 'begin_combat':
    case 'declare_attackers':
    case 'declare_blockers':
    case 'combat_damage':
    case 'end_combat':
      return 'combat';
    case 'main2':
      return 'main2';
    case 'end':
    case 'cleanup':
      return 'ending';
  }
};

export interface AttackerEntry {
  attackerId: CardInstanceId;
  defenderId: PlayerId;
}

export interface BlockerEntry {
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
}

export interface CombatState {
  attackers: AttackerEntry[];
  blockers: BlockerEntry[];
  attackersDeclared: boolean;
  blockersDeclared: boolean;
}

export const emptyCombat = (): CombatState => ({
  attackers: [],
  blockers: [],
  attackersDeclared: false,
  blockersDeclared: false,
});

export type GameStatus = 'waiting' | 'active' | 'ended';
