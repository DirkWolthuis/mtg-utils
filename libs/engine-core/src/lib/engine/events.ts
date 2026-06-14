import type { StackItem } from '../model/stack';
import type { CardInstanceId, ManaColor, PlayerId, StackItemId, Step, Zone } from '../model/types';

export type CardEnteredZone = {
  type: 'card_entered_zone';
  cardId: CardInstanceId;
  from: Zone;
  to: Zone;
  causedBy?: PlayerId;
};

export type PermanentTapped = {
  type: 'permanent_tapped';
  cardId: CardInstanceId;
};

export type PermanentUntapped = {
  type: 'permanent_untapped';
  cardId: CardInstanceId;
};

export type ManaProduced = {
  type: 'mana_produced';
  playerId: PlayerId;
  color: ManaColor;
  amount: number;
  sourceCardId?: CardInstanceId;
};

export type ManaSpent = {
  type: 'mana_spent';
  playerId: PlayerId;
  spent: Partial<Record<ManaColor, number>>;
};

export type ManaPoolEmptied = {
  type: 'mana_pool_emptied';
  playerId: PlayerId;
};

export type DamageDealt = {
  type: 'damage_dealt';
  sourceCardId: CardInstanceId;
  target: { kind: 'player'; playerId: PlayerId } | { kind: 'permanent'; cardId: CardInstanceId };
  amount: number;
  combat: boolean;
};

export type LifeChanged = {
  type: 'life_changed';
  playerId: PlayerId;
  delta: number;
  reason: 'damage' | 'lifelink' | 'effect';
};

export type CardDrawn = {
  type: 'card_drawn';
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type DrawAttemptedEmpty = {
  type: 'draw_attempted_empty';
  playerId: PlayerId;
};

export type LandPlayed = {
  type: 'land_played';
  playerId: PlayerId;
  cardId: CardInstanceId;
};

export type SpellPutOnStack = {
  type: 'spell_put_on_stack';
  item: StackItem;
};

export type StackItemResolved = {
  type: 'stack_item_resolved';
  stackItemId: StackItemId;
};

export type PriorityPassed = {
  type: 'priority_passed';
  from: PlayerId;
  to: PlayerId;
};

export type PriorityReset = {
  type: 'priority_reset';
  to: PlayerId;
  /** Why priority was reset (state change on stack, step transition). */
  reason: 'stack_changed' | 'step_started';
};

export type CreatureDied = {
  type: 'creature_died';
  cardId: CardInstanceId;
};

export type AttackerDeclared = {
  type: 'attacker_declared';
  attackerId: CardInstanceId;
  defenderId: PlayerId;
};

export type BlockerDeclared = {
  type: 'blocker_declared';
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
};

export type CombatDamageMarked = {
  type: 'combat_damage_marked';
};

export type DamageClearedAtCleanup = {
  type: 'damage_cleared_at_cleanup';
};

export type SummoningSicknessCleared = {
  type: 'summoning_sickness_cleared';
  cardId: CardInstanceId;
};

export type StepAdvanced = {
  type: 'step_advanced';
  from: Step;
  to: Step;
  turn: number;
};

export type TurnStarted = {
  type: 'turn_started';
  turn: number;
  activePlayer: PlayerId;
};

export type LandsPlayedReset = {
  type: 'lands_played_reset';
  playerId: PlayerId;
};

export type PlayerLost = {
  type: 'player_lost';
  playerId: PlayerId;
  reason: 'life' | 'deck_out' | 'concede';
};

export type GameEnded = {
  type: 'game_ended';
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

export type GameEventType = GameEvent['type'];
