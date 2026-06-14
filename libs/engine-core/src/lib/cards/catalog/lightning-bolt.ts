import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const lightningBolt: CardDefinition = {
  id: makeCardDefinitionId('lightning-bolt'),
  name: 'Lightning Bolt',
  superTypes: [],
  types: ['instant'],
  subtypes: [],
  manaCost: { R: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ kind: 'deal_damage_to_any', amount: 3 }],
};
