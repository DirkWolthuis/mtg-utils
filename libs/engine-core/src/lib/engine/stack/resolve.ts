import { getCardDefinition } from '../../cards/catalog';
import { runEffect } from '../../cards/effects/effect-registry';
import type { StackItem } from '../../model/stack';
import type { GameState } from '../../model/game-state';
import type { GameEvent } from '../events';

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
  if (!card) return [{ kind: 'stack_item_resolved', stackItemId: item.id }];
  const def = getCardDefinition(card.definitionId);

  const events: GameEvent[] = [];

  const isPermanent =
    def.types.includes('creature') ||
    def.types.includes('artifact') ||
    def.types.includes('enchantment') ||
    def.types.includes('planeswalker');

  if (isPermanent) {
    events.push({
      kind: 'card_entered_zone',
      cardId: card.id,
      from: 'stack',
      to: 'battlefield',
    });
  } else {
    // Instant / sorcery: run effect descriptors against current state, then graveyard.
    let targetIdx = 0;
    for (const effect of item.effects) {
      const target = effect.kind === 'deal_damage_to_any' ? item.targets[targetIdx++] : undefined;
      const ctx = {
        state,
        casterId: item.controllerId,
        sourceCardId: item.cardId,
        target,
      };
      const produced = runEffect(effect, ctx);
      if (produced.ok) events.push(...produced.value);
      // Illegal-at-resolve errors are swallowed — analogous to fizzling.
    }
    events.push({
      kind: 'card_entered_zone',
      cardId: card.id,
      from: 'stack',
      to: 'graveyard',
    });
  }

  events.push({ kind: 'stack_item_resolved', stackItemId: item.id });
  return events;
};
