import type { StackItem } from '../model/stack';
import type { CardInstanceId, ManaColor, PlayerId, StackItemId, Step, Zone } from '../model/types';

export type CardEnteredZone = {
  kind: 'card_entered_zone';
  cardId: CardInstanceId;
  from: Zone;
  to: Zone;
  causedBy?: PlayerId;
};

export type PermanentTapped = {
  kind: 'permanent_tapped';
  cardId: CardInstanceId;
};

export type PermanentUntapped = {
  kind: 'permanent_untapped';
  cardId: CardInstanceId;
};

export type ManaProduced = {
  kind: 'mana_produced';
  playerId: PlayerId;
  color: ManaColor;
  amount: number;
  sourceCardId?: CardInstanceId;
};

export type ManaSpent = {
  kind: 'mana_spent';
  playerId: PlayerId;
  spent: Partial<Record<ManaColor, number>>;
};

export type ManaPoolEmptied = {
  kind: 'mana_pool_emptied';
  playerId: PlayerId;
};

export type DamageDealt = {
  kind: 'damage_dealt';
  sourceCardId: CardInstanceId;
  target: { kind: 'player'; playerId: PlayerId } | { kind: 'permanent'; cardId: CardInstanceId };
  amount: number;
  combat: boolean;
};

export type LifeChanged = {
  kind: 'life_changed';
  playerId: PlayerId;
  delta: number;
  reason: 'damage' | 'lifelink' | 'effect';
};

export type CardDrawn = {
  kind: 'card_drawn';
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type DrawAttemptedEmpty = {
  kind: 'draw_attempted_empty';
  playerId: PlayerId;
};

export type LandPlayed = {
  kind: 'land_played';
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type SpellPutOnStack = {
  kind: 'spell_put_on_stack';
  item: StackItem;
};

export type StackItemResolved = {
  kind: 'stack_item_resolved';
  stackItemId: StackItemId;
};

export type PriorityPassed = {
  kind: 'priority_passed';
  from: PlayerId;
  to: PlayerId;
};

export type PriorityReset = {
  kind: 'priority_reset';
  to: PlayerId;
  /** Why priority was reset (state change on stack, step transition). */
  reason: 'stack_changed' | 'step_started';
};

export type CreatureDied = {
  kind: 'creature_died';
  cardId: CardInstanceId;
};

export type AttackerDeclared = {
  kind: 'attacker_declared';
  attackerId: CardInstanceId;
  defenderId: PlayerId;
};

export type BlockerDeclared = {
  kind: 'blocker_declared';
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
};

export type CombatDamageMarked = {
  kind: 'combat_damage_marked';
};

export type DamageClearedAtCleanup = {
  kind: 'damage_cleared_at_cleanup';
};

export type SummoningSicknessCleared = {
  kind: 'summoning_sickness_cleared';
  cardId: CardInstanceId;
};

export type StepAdvanced = {
  kind: 'step_advanced';
  from: Step;
  to: Step;
  turn: number;
};

export type TurnStarted = {
  kind: 'turn_started';
  turn: number;
  activePlayer: PlayerId;
};

export type LandsPlayedReset = {
  kind: 'lands_played_reset';
  playerId: PlayerId;
};

export type PlayerLost = {
  kind: 'player_lost';
  playerId: PlayerId;
  reason: 'life' | 'deck_out' | 'concede';
};

export type GameEnded = {
  kind: 'game_ended';
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
  | CombatDamageMarked
  | DamageClearedAtCleanup
  | SummoningSicknessCleared
  | StepAdvanced
  | TurnStarted
  | LandsPlayedReset
  | PlayerLost
  | GameEnded;

export type GameEventKind = GameEvent['kind'];
