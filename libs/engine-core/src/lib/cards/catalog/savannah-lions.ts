import { CardType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const savannahLions: CardDefinition = {
  id: makeCardDefinitionId('savannah-lions'),
  name: 'Savannah Lions',
  superTypes: [],
  types: [CardType.Creature],
  subtypes: ['Cat'],
  manaCost: { W: 1 },
  cmc: 1,
  power: 2,
  toughness: 1,
  keywords: [],
};
