import { CardType, SuperType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const plains: CardDefinition = {
  id: makeCardDefinitionId('plains'),
  name: 'Plains',
  superTypes: [SuperType.Basic],
  types: [CardType.Land],
  subtypes: ['Plains'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['W'],
};
