import { CardType, EffectType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const darkBanishing: CardDefinition = {
  id: makeCardDefinitionId('dark-banishing'),
  name: 'Dark Banishing',
  superTypes: [],
  types: [CardType.Instant],
  subtypes: [],
  manaCost: { B: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ type: EffectType.DestroyPermanent }],
};
