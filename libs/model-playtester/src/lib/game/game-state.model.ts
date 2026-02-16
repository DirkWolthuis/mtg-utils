import { Player, PlayerId } from '../player/player.model';

export interface GameState {
  players: Player[];
  playerOrder: PlayerId[];
  turn: number;
  round: number;
}
