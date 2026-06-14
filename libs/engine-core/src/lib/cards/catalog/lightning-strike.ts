import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const lightningStrike: CardDefinition = {
  id: makeCardDefinitionId('lightning-strike'),
  name: 'Lightning Strike',
  superTypes: [],
  types: ['sorcery'],
  subtypes: [],
  manaCost: { R: 1, generic: 1 },
  cmc: 2,
  keywords: [],
  effects: [{ kind: 'deal_damage_to_any', amount: 3 }],
};
