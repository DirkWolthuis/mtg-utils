import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const lightningBolt: CardDefinition = {
  id: makeCardDefinitionId('lightning-bolt'),
  name: 'Lightning Bolt',
  superTypes: [],
  types: ['instant'],
  subtypes: [],
  manaCost: { R: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ type: 'deal_damage_to_any', amount: 3 }],
};
