import type { CardInstanceId, PlayerId } from '../../model/types';

export type EffectTarget =
  | { kind: 'player'; playerId: PlayerId }
  | { kind: 'permanent'; cardId: CardInstanceId };

export type DealDamageToAny = {
  kind: 'deal_damage_to_any';
  amount: number;
};

export type DrawCards = {
  kind: 'draw_cards';
  count: number;
};

export type GainLife = {
  kind: 'gain_life';
  amount: number;
};

export type Effect = DealDamageToAny | DrawCards | GainLife;

export type EffectKind = Effect['kind'];
