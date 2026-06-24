import { CardType, makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';
import { EffectType } from '../effects/effect-types';

export const lightningStrike: CardDefinition = {
  id: makeCardDefinitionId('lightning-strike'),
  name: 'Lightning Strike',
  superTypes: [],
  types: [CardType.Sorcery],
  subtypes: [],
  manaCost: { R: 1, generic: 1 },
  cmc: 2,
  keywords: [],
  effects: [{ type: EffectType.DealDamageToAny, amount: 3 }],
};
