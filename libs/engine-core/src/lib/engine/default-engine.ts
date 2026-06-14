import { registerStepAdvanceSubscriber } from './phases/advance-step';
import type { Engine } from './run';
import { createEngine } from './run';
import { registerPriorityLoop } from './stack/priority';
import { checkStateBasedActions } from './state-based-actions';

export const createDefaultEngine = (): Engine =>
  createEngine({
    registrars: [registerStepAdvanceSubscriber, registerPriorityLoop],
    sbaChecks: [checkStateBasedActions],
  });
