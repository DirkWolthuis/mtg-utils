import type { EffectTarget } from '../cards/effects/effect-types';
import type { CardInstanceId, ManaColor, PlayerId } from '../model/types';

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

export type TapLandForMana = {
  type: ActionType.TapLandForMana;
  playerId: PlayerId;
  cardId: CardInstanceId;
  color: ManaColor;
};

export type PlayLand = {
  type: ActionType.PlayLand;
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type CastCreature = {
  type: ActionType.CastCreature;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
};

export type CastSorcery = {
  type: ActionType.CastSorcery;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
};

export type CastInstant = {
  type: ActionType.CastInstant;
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
};

export type DeclareAttackers = {
  type: ActionType.DeclareAttackers;
  playerId: PlayerId;
  attackerIds: CardInstanceId[];
};

export type DeclareBlockers = {
  type: ActionType.DeclareBlockers;
  playerId: PlayerId;
  assignments: { blockerId: CardInstanceId; attackerId: CardInstanceId }[];
};

export type PassPriority = {
  type: ActionType.PassPriority;
  playerId: PlayerId;
};

export type Concede = {
  type: ActionType.Concede;
  playerId: PlayerId;
};

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
