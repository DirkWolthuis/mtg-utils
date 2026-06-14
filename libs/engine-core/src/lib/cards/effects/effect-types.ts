import type { CardInstanceId, PlayerId } from '../../model/types';

export type EffectTarget =
  | { kind: 'player'; playerId: PlayerId }
  | { kind: 'permanent'; cardId: CardInstanceId };

export type DealDamageToAny = {
  type: 'deal_damage_to_any';
  amount: number;
};

export type DrawCards = {
  type: 'draw_cards';
  count: number;
};

export type GainLife = {
  type: 'gain_life';
  amount: number;
};

export type Effect = DealDamageToAny | DrawCards | GainLife;

export type EffectType = Effect['type'];
