import { CardType, SuperType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const mountain: CardDefinition = {
  id: makeCardDefinitionId('mountain'),
  name: 'Mountain',
  superTypes: [SuperType.Basic],
  types: [CardType.Land],
  subtypes: ['Mountain'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['R'],
};
