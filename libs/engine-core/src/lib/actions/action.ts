import type { CardInstanceId, ManaColor, PlayerId } from '../model/types';
import type { EffectTarget } from '../cards/effects/effect-types';

/**
 * The set of player actions the engine accepts. Values are the string the
 * wire format carries; the enum exists so consumers (validators, REPL,
 * tests) can switch on a single source of truth rather than scattered
 * string literals.
 */
export enum ActionType {
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
  type: ActionType.TapLandForMana;
  playerId: PlayerId;
  cardId: CardInstanceId;
  color: ManaColor;
}

export interface PlayLand {
  type: ActionType.PlayLand;
  playerId: PlayerId;
  cardId: CardInstanceId;
}

export interface CastCreature {
  type: ActionType.CastCreature;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
}

export interface CastSorcery {
  type: ActionType.CastSorcery;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface CastInstant {
  type: ActionType.CastInstant;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface DeclareAttackers {
  type: ActionType.DeclareAttackers;
  playerId: PlayerId;
  attackerIds: CardInstanceId[];
}

export interface DeclareBlockers {
  type: ActionType.DeclareBlockers;
  playerId: PlayerId;
  assignments: { blockerId: CardInstanceId; attackerId: CardInstanceId }[];
}

export interface PassPriority {
  type: ActionType.PassPriority;
  playerId: PlayerId;
}

export interface Concede {
  type: ActionType.Concede;
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
