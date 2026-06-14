import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const forest: CardDefinition = {
  id: makeCardDefinitionId('forest'),
  name: 'Forest',
  superTypes: ['basic'],
  types: ['land'],
  subtypes: ['Forest'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['G'],
};
