import type { CardInstanceId, ManaColor, PlayerId } from '../model/types';
import type { EffectTarget } from '../cards/effects/effect-types';

export interface TapLandForMana {
  kind: 'tap_land_for_mana';
  playerId: PlayerId;
  cardId: CardInstanceId;
  color: ManaColor;
}

export interface PlayLand {
  kind: 'play_land';
  playerId: PlayerId;
  cardId: CardInstanceId;
}

export interface CastCreature {
  kind: 'cast_creature';
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
}

export interface CastSorcery {
  kind: 'cast_sorcery';
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface CastInstant {
  kind: 'cast_instant';
  playerId: PlayerId;
  cardId: CardInstanceId;
  manaSpent: Partial<Record<ManaColor, number>>;
  targets?: EffectTarget[];
}

export interface DeclareAttackers {
  kind: 'declare_attackers';
  playerId: PlayerId;
  attackerIds: CardInstanceId[];
}

export interface DeclareBlockers {
  kind: 'declare_blockers';
  playerId: PlayerId;
  assignments: { blockerId: CardInstanceId; attackerId: CardInstanceId }[];
}

export interface PassPriority {
  kind: 'pass_priority';
  playerId: PlayerId;
}

export interface Concede {
  kind: 'concede';
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

export type ActionKind = Action['kind'];
