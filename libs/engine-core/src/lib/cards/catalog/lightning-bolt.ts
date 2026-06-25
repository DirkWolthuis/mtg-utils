import { CardType, EffectType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const lightningBolt: CardDefinition = {
  id: makeCardDefinitionId('lightning-bolt'),
  name: 'Lightning Bolt',
  superTypes: [],
  types: [CardType.Instant],
  subtypes: [],
  manaCost: { R: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ type: EffectType.DealDamageToAny, amount: 3 }],
};
