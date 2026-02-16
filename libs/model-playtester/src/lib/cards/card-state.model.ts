import { SectionId } from '../board/section/section.model';
import { PlayerId } from '../player/player.model';

export type CardId = string;

export interface CardState {
  cards: Record<CardId, Card>;
  cardOrder: Record<SectionId, CardId[]>; // sectionId -> ordered card IDs
}

export interface Card {
  id: CardId;
  definitionId: string; // reference to shared card definition
  sectionId: SectionId;
  ownerId: PlayerId | null;
  faceDown: boolean;
  tapped: boolean;
  counters: Record<string, number>;
}
