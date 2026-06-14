import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const mountain: CardDefinition = {
  id: makeCardDefinitionId('mountain'),
  name: 'Mountain',
  superTypes: ['basic'],
  types: ['land'],
  subtypes: ['Mountain'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['R'],
};
