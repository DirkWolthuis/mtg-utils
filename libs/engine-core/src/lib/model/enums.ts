/**
 * Central home for the engine's enumerations. Every discriminant / categorical
 * value in the model is a named enum here; enum values equal the wire strings,
 * so serialization is unchanged. Keep `ManaColor` as a string union (it is used
 * as `Record` keys and `{ W: 0, ... }` literals, where an enum adds only churn).
 */

// --- Card model -------------------------------------------------------------

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

// --- Turn structure ---------------------------------------------------------

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

export enum GameStatus {
  Waiting = 'waiting',
  Active = 'active',
  Ended = 'ended',
}

// --- Stack ------------------------------------------------------------------

/**
 * Resolution origin of a stack item: `Spell` for cast cards (move card to
 * graveyard on resolution), `Ability` for triggered/activated (no zone move).
 * v0 sets `Spell` only.
 */
export enum StackItemSource {
  Spell = 'spell',
  Ability = 'ability',
}

// --- Effects ----------------------------------------------------------------

export enum EffectType {
  DealDamageToAny = 'deal_damage_to_any',
  DrawCards = 'draw_cards',
  GainLife = 'gain_life',
}

// --- Events -----------------------------------------------------------------

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

/** Which combat-damage sub-step is being computed. */
export enum DamagePass {
  FirstStrike = 'first_strike',
  Regular = 'regular',
}
