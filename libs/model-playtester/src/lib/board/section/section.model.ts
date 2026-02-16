import { PlayerId } from '../../player/player.model';

export type SectionId = string;

export interface Section {
  id: SectionId;
  type: SECTION_TYPE;
  layout: SectionLayout;
  sections: Section[];
  ownerId: PlayerId;
}

export interface SectionLayout {
  /** Placement of this section within its parent grid */
  gridArea?: string; // e.g. 'hand' or '1 / 1 / 2 / 3' — maps to grid-area

  /** Grid definition when this section contains child sections */
  gridTemplate?: GridTemplate;

  /** Gap between child cells */
  gap?: string; // e.g. '8px' or '8px 16px'

  /** Minimum dimensions */
  minWidth?: string;
  minHeight?: string;
}

export interface GridTemplate {
  columns: string; // e.g. '1fr 1fr 1fr' or 'repeat(auto-fill, 100px)'
  rows: string; // e.g. 'auto 1fr auto'
  areas?: string[]; // e.g. ['"hand hand"', '"play play"', '"deck pile"']
}

export enum SECTION_TYPE {
  'HAND',
  'PLAY_AREA',
  'DECK',
  'PILE',
  'MARKET',
  'COUNTER',
  'STACK',
  'CONTAINER',
}
