import { useCallback } from 'react';
import { socket } from '../socket/client';
import { useGame } from '../context/GameContext';
import type { GameSettings } from '@ito/shared';

export function useGameActions() {
  const { dispatch } = useGame();

  const createRoom = useCallback(
    (playerName: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        socket.emit('room:create', playerName, (response) => {
          if (response.success && response.roomCode && response.playerId) {
            const roomCode = response.roomCode;
            sessionStorage.setItem('ito:roomCode', roomCode);
            sessionStorage.setItem('ito:myName', playerName);
            dispatch({
              type: 'ROOM_CREATED',
              roomCode,
              myPlayerId: response.playerId,
              myName: playerName,
            });
            resolve(roomCode);
          } else {
            dispatch({ type: 'SET_LOADING', isLoading: false });
            dispatch({ type: 'SET_ERROR', error: response.error ?? 'ルーム作成に失敗しました' });
            reject(new Error(response.error));
          }
        });
      });
    },
    [dispatch],
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        socket.emit('room:join', roomCode, playerName, (response) => {
          if (response.success && response.playerId) {
            sessionStorage.setItem('ito:roomCode', roomCode);
            sessionStorage.setItem('ito:myName', playerName);
            dispatch({
              type: 'ROOM_JOINED',
              roomCode,
              myPlayerId: response.playerId,
              myName: playerName,
            });
            resolve();
          } else {
            dispatch({ type: 'SET_LOADING', isLoading: false });
            dispatch({ type: 'SET_ERROR', error: response.error ?? 'ルーム参加に失敗しました' });
            reject(new Error(response.error));
          }
        });
      });
    },
    [dispatch],
  );

  const leaveRoom = useCallback(() => {
    socket.emit('room:leave');
    sessionStorage.removeItem('ito:roomCode');
    sessionStorage.removeItem('ito:myName');
    dispatch({ type: 'ROOM_LEFT' });
  }, [dispatch]);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    socket.emit('lobby:updateSettings', settings);
  }, []);

  const startGame = useCallback(() => {
    socket.emit('lobby:startGame');
  }, []);

  const sendMessage = useCallback((text: string) => {
    socket.emit('chat:sendMessage', text);
  }, []);

  const placeCard = useCallback(() => {
    socket.emit('game:placeCard');
    dispatch({ type: 'MY_CARD_PLACED' });
  }, [dispatch]);

  const reorderCards = useCallback(
    (cardOrder: string[]) => {
      socket.emit('game:reorderCards', cardOrder);
      dispatch({ type: 'CARDS_REORDERED', cardOrder });
    },
    [dispatch],
  );

  const confirmOrder = useCallback(() => {
    socket.emit('game:confirmOrder');
  }, []);

  const startPlacement = useCallback(() => {
    socket.emit('game:startPlacement');
  }, []);

  const nextRound = useCallback(() => {
    socket.emit('game:nextRound');
  }, []);

  const playAgain = useCallback(() => {
    socket.emit('game:playAgain');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, [dispatch]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    startGame,
    sendMessage,
    placeCard,
    reorderCards,
    confirmOrder,
    startPlacement,
    nextRound,
    playAgain,
    clearError,
  };
}
