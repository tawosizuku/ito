export type GamePhase =
  | 'WAITING'
  | 'LOBBY'
  | 'THEME_ANNOUNCEMENT'
  | 'CARD_DISTRIBUTION'
  | 'DISCUSSION'
  | 'PLACEMENT'
  | 'ROUND_RESULT'
  | 'GAME_OVER';

export interface GameSettings {
  maxLives: number;
  totalRounds: number;
  customTheme: string | null;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxLives: 3,
  totalRounds: 3,
  customTheme: null,
};

export interface PlacedCard {
  playerId: string;
  playerName: string;
  cardNumber: number;
  order: number;
}

export interface RoundState {
  roundNumber: number;
  theme: string;
  placedCards: PlacedCard[];
  remainingPlayers: string[];
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  lives: number;
  maxLives: number;
  round: RoundState | null;
  myCard: number | null;
  isSuccess: boolean | null;
}
