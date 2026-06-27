import { CardType, SuperType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const swamp: CardDefinition = {
  id: makeCardDefinitionId('swamp'),
  name: 'Swamp',
  superTypes: [SuperType.Basic],
  types: [CardType.Land],
  subtypes: ['Swamp'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['B'],
};
