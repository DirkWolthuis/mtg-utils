import { CardType, SuperType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const forest: CardDefinition = {
  id: makeCardDefinitionId('forest'),
  name: 'Forest',
  superTypes: [SuperType.Basic],
  types: [CardType.Land],
  subtypes: ['Forest'],
  manaCost: null,
  cmc: 0,
  keywords: [],
  produces: ['G'],
};
