import type { Player } from './player.js';
import type { GameSettings } from './game.js';

export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  settings: GameSettings;
}
