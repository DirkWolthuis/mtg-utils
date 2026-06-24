import { getCardDefinition } from '../../cards/catalog';
import { runEffect } from '../../cards/effects/effect-registry';
import { EffectType } from '../../cards/effects/effect-types';
import type { GameState } from '../../model/game-state';
import type { StackItem } from '../../model/stack';
import { CardType, Zone } from '../../model/types';
import type { GameEvent } from '../events';
import { GameEventType } from '../events';

/**
 * Compute the events that resolving a stack item produces. Targets are
 * re-checked against current state: permanents must still be on the
 * battlefield; players must not already have lost. If a damage target is
 * illegal the damage portion of that effect is silently skipped (a v0
 * approximation of "fizzle"); other effects still run.
 *
 * The card itself moves to its post-resolution zone:
 *   - permanents (creature, artifact, enchantment, planeswalker) → battlefield
 *   - instant / sorcery → graveyard
 */
export const resolveStackItem = (state: GameState, item: StackItem): GameEvent[] => {
  const card = state.cards[item.cardId];
  if (!card) {
    return [{ type: GameEventType.StackItemResolved, stackItemId: item.id }];
  }
  const def = getCardDefinition(card.definitionId);

  const events: GameEvent[] = [];

  const isPermanent =
    def.types.includes(CardType.Creature) ||
    def.types.includes(CardType.Artifact) ||
    def.types.includes(CardType.Enchantment) ||
    def.types.includes(CardType.Planeswalker);

  if (isPermanent) {
    events.push({
      type: GameEventType.CardEnteredZone,
      cardId: card.id,
      from: Zone.Stack,
      to: Zone.Battlefield,
    });
  } else {
    // Instant / sorcery: run effect descriptors against current state, then graveyard.
    let targetIdx = 0;
    for (const effect of item.effects) {
      const target =
        effect.type === EffectType.DealDamageToAny ? item.targets[targetIdx++] : undefined;
      const ctx = {
        state,
        casterId: item.controllerId,
        sourceCardId: item.cardId,
        target,
      };
      const produced = runEffect(effect, ctx);
      if (produced.ok) {
        events.push(...produced.value);
      }
      // Illegal-at-resolve errors are swallowed — analogous to fizzling.
    }
    events.push({
      type: GameEventType.CardEnteredZone,
      cardId: card.id,
      from: Zone.Stack,
      to: Zone.Graveyard,
    });
  }

  events.push({ type: GameEventType.StackItemResolved, stackItemId: item.id });
  return events;
};
