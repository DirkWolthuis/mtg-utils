import type { CardInstanceId, ManaColor, PlayerId } from '../model/types';
import type { EffectTarget } from '../cards/effects/effect-types';

/**
 * The set of player actions the engine accepts. Values are the string the
 * wire format carries; the enum exists so consumers (validators, REPL,
 * tests) can switch on a single source of truth rather than scattered
 * string literals.
 */
export enum ActionKind {
  TapLandForMana = 'tap_land_for_mana',
  PlayLand = 'play_land',
  CastCreature = 'cast_creature',
  CastSorcery = 'cast_sorcery',
  CastInstant = 'cast_instant',
  DeclareAttackers = 'declare_attackers',
  DeclareBlockers = 'declare_blockers',
  PassPriority = 'pass_priority',
  Concede = 'concede',
}

export interface TapLandForMana {
  kind: ActionKind.TapLandForMana;
  playerId: PlayerId;
  cardId: CardInstanceId;
  color: ManaColor;
}

export interface PlayLand {
  kind: ActionKind.PlayLand;
  playerId: PlayerId;
  cardId: CardInstanceId;
}

export interface CastCreature {
  kind: ActionKind.CastCreature;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
}

export interface CastSorcery {
  kind: ActionKind.CastSorcery;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface CastInstant {
  kind: ActionKind.CastInstant;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface DeclareAttackers {
  kind: ActionKind.DeclareAttackers;
  playerId: PlayerId;
  attackerIds: CardInstanceId[];
}

export interface DeclareBlockers {
  kind: ActionKind.DeclareBlockers;
  playerId: PlayerId;
  assignments: { blockerId: CardInstanceId; attackerId: CardInstanceId }[];
}

export interface PassPriority {
  kind: ActionKind.PassPriority;
  playerId: PlayerId;
}

export interface Concede {
  kind: ActionKind.Concede;
  playerId: PlayerId;
}

export type Action =
  | TapLandForMana
  | PlayLand
  | CastCreature
  | CastSorcery
  | CastInstant
  | DeclareAttackers
  | DeclareBlockers
  | PassPriority
  | Concede;
