import { EffectType, type CardInstanceId, type PlayerId, type TargetKind } from '../../model/types';

// EffectType lives in the model (`model/enums.ts`); re-exported so existing
// `from './effect-types'` imports keep resolving.
export { EffectType };

export type EffectTarget =
  | { kind: TargetKind.Player; playerId: PlayerId }
  | { kind: TargetKind.Permanent; cardId: CardInstanceId };

export type DealDamageToAny = {
  type: EffectType.DealDamageToAny;
  amount: number;
};

export type DrawCards = {
  type: EffectType.DrawCards;
  count: number;
};

export type GainLife = {
  type: EffectType.GainLife;
  amount: number;
};

export type Effect = DealDamageToAny | DrawCards | GainLife;
