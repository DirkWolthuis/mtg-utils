import { createEngine } from './run';
import type { Engine } from './run';
import { registerStepAdvanceSubscriber } from './phases/advance-step';
import { registerPriorityLoop } from './stack/priority';
import { checkStateBasedActions } from './state-based-actions';

export const createDefaultEngine = (): Engine =>
  createEngine({
    registrars: [registerStepAdvanceSubscriber, registerPriorityLoop],
    sbaChecks: [checkStateBasedActions],
  });
