export type CardColor = 'W' | 'U' | 'B' | 'R' | 'G';

export type CubeCard = {
  id: string;
  name: string;
  type: string;
  colors: CardColor[];
  cmc: number;
  imageUrl?: string;
};

export type Relationship = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
};
