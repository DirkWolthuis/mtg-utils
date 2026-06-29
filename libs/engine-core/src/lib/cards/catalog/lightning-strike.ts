import { CardType, EffectType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

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
