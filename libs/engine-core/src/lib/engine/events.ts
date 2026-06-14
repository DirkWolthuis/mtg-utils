import type { StackItem } from '../model/stack';
import type {
  CardInstanceId,
  ManaColor,
  PlayerId,
  StackItemId,
  Step,
  Zone,
} from '../model/types';

export interface CardEnteredZone {
  kind: 'card_entered_zone';
  cardId: CardInstanceId;
  from: Zone;
  to: Zone;
  causedBy?: PlayerId;
}

export interface PermanentTapped {
  kind: 'permanent_tapped';
  cardId: CardInstanceId;
}

export interface PermanentUntapped {
  kind: 'permanent_untapped';
  cardId: CardInstanceId;
}

export interface ManaProduced {
  kind: 'mana_produced';
  playerId: PlayerId;
  color: ManaColor;
  amount: number;
  sourceCardId?: CardInstanceId;
}

export interface ManaSpent {
  kind: 'mana_spent';
  playerId: PlayerId;
  spent: Partial<Record<ManaColor, number>>;
}

export interface ManaPoolEmptied {
  kind: 'mana_pool_emptied';
  playerId: PlayerId;
}

export interface DamageDealt {
  kind: 'damage_dealt';
  sourceCardId: CardInstanceId;
  target:
    | { kind: 'player'; playerId: PlayerId }
    | { kind: 'permanent'; cardId: CardInstanceId };
  amount: number;
  combat: boolean;
}

export interface LifeChanged {
  kind: 'life_changed';
  playerId: PlayerId;
  delta: number;
  reason: 'damage' | 'lifelink' | 'effect';
}

export interface CardDrawn {
  kind: 'card_drawn';
  playerId: PlayerId;
  cardId: CardInstanceId;
}

export interface DrawAttemptedEmpty {
  kind: 'draw_attempted_empty';
  playerId: PlayerId;
}

export interface LandPlayed {
  kind: 'land_played';
  playerId: PlayerId;
  cardId: CardInstanceId;
}

export interface SpellPutOnStack {
  kind: 'spell_put_on_stack';
  item: StackItem;
}

export interface StackItemResolved {
  kind: 'stack_item_resolved';
  stackItemId: StackItemId;
}

export interface PriorityPassed {
  kind: 'priority_passed';
  from: PlayerId;
  to: PlayerId;
}

export interface PriorityReset {
  kind: 'priority_reset';
  to: PlayerId;
  /** Why priority was reset (state change on stack, step transition). */
  reason: 'stack_changed' | 'step_started';
}

export interface CreatureDied {
  kind: 'creature_died';
  cardId: CardInstanceId;
}

export interface AttackerDeclared {
  kind: 'attacker_declared';
  attackerId: CardInstanceId;
  defenderId: PlayerId;
}

export interface BlockerDeclared {
  kind: 'blocker_declared';
  blockerId: CardInstanceId;
  attackerId: CardInstanceId;
}

export interface CombatDamageMarked {
  kind: 'combat_damage_marked';
}

export interface DamageClearedAtCleanup {
  kind: 'damage_cleared_at_cleanup';
}

export interface SummoningSicknessCleared {
  kind: 'summoning_sickness_cleared';
  cardId: CardInstanceId;
}

export interface StepAdvanced {
  kind: 'step_advanced';
  from: Step;
  to: Step;
  turn: number;
}

export interface TurnStarted {
  kind: 'turn_started';
  turn: number;
  activePlayer: PlayerId;
}

export interface LandsPlayedReset {
  kind: 'lands_played_reset';
  playerId: PlayerId;
}

export interface PlayerLost {
  kind: 'player_lost';
  playerId: PlayerId;
  reason: 'life' | 'deck_out' | 'concede';
}

export interface GameEnded {
  kind: 'game_ended';
  winner: PlayerId | null;
}

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
