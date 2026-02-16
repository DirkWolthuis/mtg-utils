import { Section } from '../section/section.model';

export interface InteractiveSection extends Section {
  visibility: VISIBILITY_TYPE;
  actions: SectionAction[];
}

export enum VISIBILITY_TYPE {
  'PUBLIC',
  'PRIVATE',
  'HIDDEN',
}

export interface SectionAction {
  isDefault: boolean;
  action: ACTION_TYPE;
}

export enum ACTION_TYPE {
  'DRAW_TO_HAND',
  'DRAG_TOP_CARD',
}
