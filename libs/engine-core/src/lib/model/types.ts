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

export type ManaPool = {
  W: number;
  U: number;
  B: number;
  R: number;
  G: number;
  C: number;
};

export const emptyManaPool = (): ManaPool => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });

export const totalMana = (pool: ManaPool): number =>
  pool.W + pool.U + pool.B + pool.R + pool.G + pool.C;

export type ManaCost = Partial<Record<ManaColor, number>> & { generic?: number };

export const cmcOf = (cost: ManaCost | null): number => {
  if (!cost) {
    return 0;
  }
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

export enum Zone {
  Library = 'library',
  Hand = 'hand',
  Battlefield = 'battlefield',
  Graveyard = 'graveyard',
  Exile = 'exile',
  Stack = 'stack',
}

export enum CardType {
  Land = 'land',
  Creature = 'creature',
  Instant = 'instant',
  Sorcery = 'sorcery',
  Enchantment = 'enchantment',
  Artifact = 'artifact',
  Planeswalker = 'planeswalker',
}

export const isSpellType = (type: CardType): boolean =>
  type === CardType.Creature ||
  type === CardType.Instant ||
  type === CardType.Sorcery ||
  type === CardType.Enchantment ||
  type === CardType.Artifact ||
  type === CardType.Planeswalker;

export enum SuperType {
  Basic = 'basic',
  Legendary = 'legendary',
  Snow = 'snow',
}

export enum Keyword {
  Haste = 'haste',
  Flying = 'flying',
  Trample = 'trample',
  Vigilance = 'vigilance',
  Lifelink = 'lifelink',
  Deathtouch = 'deathtouch',
  FirstStrike = 'first_strike',
}

/** Shared target discriminant for damage events and targeted effects. */
export enum TargetKind {
  Player = 'player',
  Permanent = 'permanent',
}

export type CardInstance = {
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
};

export type Player = {
  id: PlayerId;
  name: string;
  life: number;
  manaPool: ManaPool;
  library: CardInstanceId[];
  hand: CardInstanceId[];
  graveyard: CardInstanceId[];
  exile: CardInstanceId[];
  landsPlayedThisTurn: number;
};

export enum Phase {
  Beginning = 'beginning',
  Main1 = 'main1',
  Combat = 'combat',
  Main2 = 'main2',
  Ending = 'ending',
}

export enum Step {
  Untap = 'untap',
  Upkeep = 'upkeep',
  Draw = 'draw',
  Main1 = 'main1',
  BeginCombat = 'begin_combat',
  DeclareAttackers = 'declare_attackers',
  DeclareBlockers = 'declare_blockers',
  CombatDamage = 'combat_damage',
  EndCombat = 'end_combat',
  Main2 = 'main2',
  End = 'end',
  Cleanup = 'cleanup',
}

export const STEP_ORDER: Step[] = [
  Step.Untap,
  Step.Upkeep,
  Step.Draw,
  Step.Main1,
  Step.BeginCombat,
  Step.DeclareAttackers,
  Step.DeclareBlockers,
  Step.CombatDamage,
  Step.EndCombat,
  Step.Main2,
  Step.End,
  Step.Cleanup,
];

export const phaseOfStep = (step: Step): Phase => {
  switch (step) {
    case Step.Untap:
    case Step.Upkeep:
    case Step.Draw:
      return Phase.Beginning;
    case Step.Main1:
      return Phase.Main1;
    case Step.BeginCombat:
    case Step.DeclareAttackers:
    case Step.DeclareBlockers:
    case Step.CombatDamage:
    case Step.EndCombat:
      return Phase.Combat;
    case Step.Main2:
      return Phase.Main2;
    case Step.End:
    case Step.Cleanup:
      return Phase.Ending;
  }
};

export type AttackerEntry = {
  attackerId: CardInstanceId;
  defenderId: PlayerId;
};

export type BlockerEntry = {
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
};

export type CombatState = {
  attackers: AttackerEntry[];
  blockers: BlockerEntry[];
  attackersDeclared: boolean;
  blockersDeclared: boolean;
};

export const emptyCombat = (): CombatState => ({
  attackers: [],
  blockers: [],
  attackersDeclared: false,
  blockersDeclared: false,
});

export enum GameStatus {
  Waiting = 'waiting',
  Active = 'active',
  Ended = 'ended',
}
