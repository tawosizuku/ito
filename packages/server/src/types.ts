import type { GamePhase, GameSettings, PlacedCard, ChatMessage } from '@ito/shared';

export interface ServerPlayer {
  id: string;
  name: string;
  socketId: string | null;
  isHost: boolean;
  disconnectedAt: number | null;
}

export interface ServerPlayerCard {
  playerId: string;
  cardNumber: number;
  hasPlaced: boolean;
}

export interface ServerRoundState {
  roundNumber: number;
  theme: string;
  playerCards: ServerPlayerCard[];
  placedCards: PlacedCard[];
  remainingPlayers: string[];
}

export interface ServerRoom {
  code: string;
  players: ServerPlayer[];
  hostId: string;
  settings: GameSettings;
  phase: GamePhase;
  currentRound: number;
  lives: number;
  round: ServerRoundState | null;
  usedThemes: string[];
  messages: ChatMessage[];
}
