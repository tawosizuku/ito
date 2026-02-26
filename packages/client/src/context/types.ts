import type {
  Player,
  GamePhase,
  GameSettings,
  PlacedCard,
  RoundState,
  ChatMessage,
  GameState,
} from '@ito/shared';

// ─── Application State ───

export interface AppState {
  connection: {
    isConnected: boolean;
    isReconnecting: boolean;
  };
  room: {
    roomCode: string | null;
    myPlayerId: string | null;
    myName: string | null;
    players: Player[];
    hostId: string | null;
    settings: GameSettings;
  };
  game: {
    phase: GamePhase;
    currentRound: number;
    totalRounds: number;
    lives: number;
    maxLives: number;
    round: RoundState | null;
    myCard: number | null;
    hasPlacedCard: boolean;
    isSuccess: boolean | null;
    gameResult: { won: boolean; finalRound: number } | null;
  };
  chat: {
    messages: ChatMessage[];
    unreadCount: number;
  };
  ui: {
    error: string | null;
    isLoading: boolean;
  };
}

export const initialState: AppState = {
  connection: {
    isConnected: false,
    isReconnecting: false,
  },
  room: {
    roomCode: null,
    myPlayerId: null,
    myName: null,
    players: [],
    hostId: null,
    settings: { maxLives: 3, totalRounds: 3, customTheme: null },
  },
  game: {
    phase: 'WAITING',
    currentRound: 0,
    totalRounds: 0,
    lives: 0,
    maxLives: 0,
    round: null,
    myCard: null,
    hasPlacedCard: false,
    isSuccess: null,
    gameResult: null,
  },
  chat: {
    messages: [],
    unreadCount: 0,
  },
  ui: {
    error: null,
    isLoading: false,
  },
};

// ─── Actions ───

export type Action =
  // Connection
  | { type: 'SOCKET_CONNECTED' }
  | { type: 'SOCKET_DISCONNECTED' }
  // Room
  | { type: 'ROOM_CREATED'; roomCode: string; myPlayerId: string; myName: string }
  | { type: 'ROOM_JOINED'; roomCode: string; myPlayerId: string; myName: string }
  | { type: 'ROOM_LEFT' }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'HOST_CHANGED'; newHostId: string }
  // Lobby
  | { type: 'LOBBY_STATE_RECEIVED'; players: Player[]; settings: GameSettings; hostId: string }
  | { type: 'SETTINGS_UPDATED'; settings: GameSettings }
  // Game
  | { type: 'GAME_STARTED' }
  | { type: 'THEME_ANNOUNCED'; theme: string }
  | { type: 'CARD_DEALT'; cardNumber: number }
  | { type: 'DISCUSSION_STARTED' }
  | { type: 'PLACEMENT_STARTED' }
  // Placement
  | { type: 'CARD_PLACED'; card: PlacedCard }
  | { type: 'MY_CARD_PLACED' }
  | { type: 'LIFE_LOST'; lives: number }
  // Results
  | { type: 'ROUND_RESULT'; success: boolean; lives: number; placedCards: PlacedCard[] }
  | { type: 'GAME_OVER'; won: boolean; finalRound: number }
  // Reconnection
  | { type: 'FULL_STATE_RECEIVED'; state: GameState & { players: Player[]; messages: ChatMessage[] } }
  // Chat
  | { type: 'CHAT_MESSAGE_RECEIVED'; message: ChatMessage }
  | { type: 'CHAT_READ' }
  // UI
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; isLoading: boolean };
