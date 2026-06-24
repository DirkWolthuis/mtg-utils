import type { StackItem } from '../model/stack';
import type { CardInstanceId, ManaColor, PlayerId, StackItemId } from '../model/types';
import { type Step, type TargetKind, type Zone } from '../model/types';

export enum GameEventType {
  CardEnteredZone = 'card_entered_zone',
  PermanentTapped = 'permanent_tapped',
  PermanentUntapped = 'permanent_untapped',
  ManaProduced = 'mana_produced',
  ManaSpent = 'mana_spent',
  ManaPoolEmptied = 'mana_pool_emptied',
  DamageDealt = 'damage_dealt',
  LifeChanged = 'life_changed',
  CardDrawn = 'card_drawn',
  DrawAttemptedEmpty = 'draw_attempted_empty',
  LandPlayed = 'land_played',
  SpellPutOnStack = 'spell_put_on_stack',
  StackItemResolved = 'stack_item_resolved',
  PriorityPassed = 'priority_passed',
  PriorityReset = 'priority_reset',
  CreatureDied = 'creature_died',
  AttackerDeclared = 'attacker_declared',
  BlockerDeclared = 'blocker_declared',
  CombatDeclared = 'combat_declared',
  CombatDamageMarked = 'combat_damage_marked',
  DamageClearedAtCleanup = 'damage_cleared_at_cleanup',
  SummoningSicknessCleared = 'summoning_sickness_cleared',
  StepAdvanced = 'step_advanced',
  TurnStarted = 'turn_started',
  LandsPlayedReset = 'lands_played_reset',
  PlayerLost = 'player_lost',
  GameEnded = 'game_ended',
}

/** Why a `life_changed` event was emitted. */
export enum LifeChangeReason {
  Damage = 'damage',
  Lifelink = 'lifelink',
  Effect = 'effect',
}

/** Why a `priority_reset` was emitted. */
export enum PriorityResetReason {
  StackChanged = 'stack_changed',
  StepStarted = 'step_started',
  CombatDeclared = 'combat_declared',
}

/** Which combat turn-based declaration a `combat_declared` event marks. */
export enum CombatDeclaration {
  Attackers = 'attackers',
  Blockers = 'blockers',
}

/** Why a `player_lost` event was emitted. */
export enum PlayerLostReason {
  Life = 'life',
  DeckOut = 'deck_out',
  Concede = 'concede',
}

export type CardEnteredZone = {
  type: GameEventType.CardEnteredZone;
  cardId: CardInstanceId;
  from: Zone;
  to: Zone;
  causedBy?: PlayerId;
};

export type PermanentTapped = {
  type: GameEventType.PermanentTapped;
  cardId: CardInstanceId;
};

export type PermanentUntapped = {
  type: GameEventType.PermanentUntapped;
  cardId: CardInstanceId;
};

export type ManaProduced = {
  type: GameEventType.ManaProduced;
  playerId: PlayerId;
  color: ManaColor;
  amount: number;
  sourceCardId?: CardInstanceId;
};

export type ManaSpent = {
  type: GameEventType.ManaSpent;
  playerId: PlayerId;
  spent: Partial<Record<ManaColor, number>>;
};

export type ManaPoolEmptied = {
  type: GameEventType.ManaPoolEmptied;
  playerId: PlayerId;
};

export type DamageDealt = {
  type: GameEventType.DamageDealt;
  sourceCardId: CardInstanceId;
  target:
    | { kind: TargetKind.Player; playerId: PlayerId }
    | { kind: TargetKind.Permanent; cardId: CardInstanceId };
  amount: number;
  combat: boolean;
};

export type LifeChanged = {
  type: GameEventType.LifeChanged;
  playerId: PlayerId;
  delta: number;
  reason: LifeChangeReason;
};

export type CardDrawn = {
  type: GameEventType.CardDrawn;
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type DrawAttemptedEmpty = {
  type: GameEventType.DrawAttemptedEmpty;
  playerId: PlayerId;
};

export type LandPlayed = {
  type: GameEventType.LandPlayed;
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type SpellPutOnStack = {
  type: GameEventType.SpellPutOnStack;
  item: StackItem;
};

export type StackItemResolved = {
  type: GameEventType.StackItemResolved;
  stackItemId: StackItemId;
};

export type PriorityPassed = {
  type: GameEventType.PriorityPassed;
  from: PlayerId;
  to: PlayerId;
};

export type PriorityReset = {
  type: GameEventType.PriorityReset;
  to: PlayerId;
  /** Why priority was reset (state change on stack, step transition, combat declaration). */
  reason: PriorityResetReason;
};

export type CreatureDied = {
  type: GameEventType.CreatureDied;
  cardId: CardInstanceId;
};

export type AttackerDeclared = {
  type: GameEventType.AttackerDeclared;
  attackerId: CardInstanceId;
  defenderId: PlayerId;
};

export type BlockerDeclared = {
  type: GameEventType.BlockerDeclared;
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
};

/**
 * Marks that the turn-based declaration for a combat step is complete. Flips
 * the matching `combat.attackersDeclared` / `combat.blockersDeclared` flag so
 * the declaration can't be repeated, then a priority window opens (the loop
 * resets priority to the active player) before the step advances. This is what
 * makes combat tricks possible — instants can respond to attackers and blockers.
 */
export type CombatDeclared = {
  type: GameEventType.CombatDeclared;
  declaration: CombatDeclaration;
};

export type CombatDamageMarked = {
  type: GameEventType.CombatDamageMarked;
};

export type DamageClearedAtCleanup = {
  type: GameEventType.DamageClearedAtCleanup;
};

export type SummoningSicknessCleared = {
  type: GameEventType.SummoningSicknessCleared;
  cardId: CardInstanceId;
};

export type StepAdvanced = {
  type: GameEventType.StepAdvanced;
  from: Step;
  to: Step;
  turn: number;
};

export type TurnStarted = {
  type: GameEventType.TurnStarted;
  turn: number;
  activePlayer: PlayerId;
};

export type LandsPlayedReset = {
  type: GameEventType.LandsPlayedReset;
  playerId: PlayerId;
};

export type PlayerLost = {
  type: GameEventType.PlayerLost;
  playerId: PlayerId;
  reason: PlayerLostReason;
};

export type GameEnded = {
  type: GameEventType.GameEnded;
  winner: PlayerId | null;
};

export type GameEvent =
  | CardEnteredZone
  | PermanentTapped
  | PermanentUntapped
  | ManaProduced
  | ManaSpent
  | ManaPoolEmptied
  | DamageDealt
  | LifeChanged
  | CardDrawn
  | DrawAttemptedEmpty
  | LandPlayed
  | SpellPutOnStack
  | StackItemResolved
  | PriorityPassed
  | PriorityReset
  | CreatureDied
  | AttackerDeclared
  | BlockerDeclared
  | CombatDeclared
  | CombatDamageMarked
  | DamageClearedAtCleanup
  | SummoningSicknessCleared
  | StepAdvanced
  | TurnStarted
  | LandsPlayedReset
  | PlayerLost
  | GameEnded;
