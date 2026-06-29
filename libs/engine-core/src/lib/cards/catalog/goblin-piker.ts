import { CardType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const goblinPiker: CardDefinition = {
  id: makeCardDefinitionId('goblin-piker'),
  name: 'Goblin Piker',
  superTypes: [],
  types: [CardType.Creature],
  subtypes: ['Goblin', 'Warrior'],
  manaCost: { R: 1 },
  cmc: 1,
  power: 2,
  toughness: 1,
  keywords: [],
};
