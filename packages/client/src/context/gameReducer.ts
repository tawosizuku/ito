import type { AppState, Action } from './types';
import { initialState } from './types';

export function gameReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ─── Connection ───
    case 'SOCKET_CONNECTED':
      return {
        ...state,
        connection: { isConnected: true, isReconnecting: false },
      };

    case 'SOCKET_DISCONNECTED':
      return {
        ...state,
        connection: {
          isConnected: false,
          isReconnecting: state.room.roomCode !== null,
        },
      };

    // ─── Room ───
    case 'ROOM_CREATED':
      return {
        ...state,
        room: {
          ...state.room,
          roomCode: action.roomCode,
          myPlayerId: action.myPlayerId,
          myName: action.myName,
        },
        ui: { error: null, isLoading: false },
      };

    case 'ROOM_JOINED':
      return {
        ...state,
        room: {
          ...state.room,
          roomCode: action.roomCode,
          myPlayerId: action.myPlayerId,
          myName: action.myName,
        },
        ui: { error: null, isLoading: false },
      };

    case 'ROOM_LEFT':
      return {
        ...initialState,
        connection: state.connection,
      };

    case 'PLAYER_JOINED':
      return {
        ...state,
        room: {
          ...state.room,
          players: [...state.room.players, action.player],
        },
      };

    case 'PLAYER_LEFT':
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.id !== action.playerId),
        },
      };

    case 'HOST_CHANGED':
      return {
        ...state,
        room: {
          ...state.room,
          hostId: action.newHostId,
          players: state.room.players.map((p) => ({
            ...p,
            isHost: p.id === action.newHostId,
          })),
        },
      };

    // ─── Lobby ───
    case 'LOBBY_STATE_RECEIVED':
      return {
        ...state,
        room: {
          ...state.room,
          players: action.players,
          settings: action.settings,
          hostId: action.hostId,
        },
        game: { ...state.game, phase: 'LOBBY' },
      };

    case 'SETTINGS_UPDATED':
      return {
        ...state,
        room: { ...state.room, settings: action.settings },
      };

    // ─── Game ───
    case 'GAME_STARTED':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'THEME_ANNOUNCEMENT',
          gameResult: null,
          isSuccess: null,
          hasPlacedCard: false,
          myCard: null,
        },
      };

    case 'THEME_ANNOUNCED':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'THEME_ANNOUNCEMENT',
          round: {
            roundNumber: state.game.currentRound,
            theme: action.theme,
            placedCards: [],
            remainingPlayers: [],
          },
        },
      };

    case 'CARD_DEALT':
      return {
        ...state,
        game: {
          ...state.game,
          myCard: action.cardNumber,
          hasPlacedCard: false,
        },
      };

    case 'DISCUSSION_STARTED':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'DISCUSSION',
        },
      };

    case 'PLACEMENT_STARTED':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'PLACEMENT',
          round: state.game.round
            ? { ...state.game.round, placedCards: [], remainingPlayers: state.room.players.map((p) => p.id) }
            : null,
        },
      };

    // ─── Placement ───
    case 'CARD_PLACED':
      return {
        ...state,
        game: {
          ...state.game,
          round: state.game.round
            ? {
                ...state.game.round,
                placedCards: [...state.game.round.placedCards, action.card],
                remainingPlayers: state.game.round.remainingPlayers.filter(
                  (id) => id !== action.card.playerId,
                ),
              }
            : null,
        },
      };

    case 'MY_CARD_PLACED':
      return {
        ...state,
        game: { ...state.game, hasPlacedCard: true },
      };

    case 'LIFE_LOST':
      return {
        ...state,
        game: { ...state.game, lives: action.lives },
      };

    // ─── Results ───
    case 'ROUND_RESULT':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'ROUND_RESULT',
          isSuccess: action.success,
          lives: action.lives,
          round: state.game.round
            ? { ...state.game.round, placedCards: action.placedCards }
            : null,
        },
      };

    case 'GAME_OVER':
      return {
        ...state,
        game: {
          ...state.game,
          phase: 'GAME_OVER',
          gameResult: { won: action.won, finalRound: action.finalRound },
        },
      };

    // ─── Reconnection ───
    case 'FULL_STATE_RECEIVED': {
      const { players, messages, ...gameState } = action.state;
      const myCard = gameState.myCard;
      const hasPlacedCard =
        gameState.round?.placedCards.some(
          (c) => c.playerId === state.room.myPlayerId,
        ) ?? false;

      return {
        ...state,
        room: {
          ...state.room,
          players,
          hostId: players.find((p) => p.isHost)?.id ?? state.room.hostId,
          settings: {
            maxLives: gameState.maxLives,
            totalRounds: gameState.totalRounds,
            customTheme: null,
          },
        },
        game: {
          phase: gameState.phase,
          currentRound: gameState.currentRound,
          totalRounds: gameState.totalRounds,
          lives: gameState.lives,
          maxLives: gameState.maxLives,
          round: gameState.round,
          myCard,
          hasPlacedCard,
          isSuccess: gameState.isSuccess,
          gameResult: null,
        },
        chat: {
          messages,
          unreadCount: 0,
        },
        connection: { isConnected: true, isReconnecting: false },
      };
    }

    // ─── Chat ───
    case 'CHAT_MESSAGE_RECEIVED':
      return {
        ...state,
        chat: {
          messages: [...state.chat.messages, action.message],
          unreadCount: state.chat.unreadCount + 1,
        },
      };

    case 'CHAT_READ':
      return {
        ...state,
        chat: { ...state.chat, unreadCount: 0 },
      };

    // ─── UI ───
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.error },
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.isLoading },
      };

    default:
      return state;
  }
}
