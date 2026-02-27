import type { Dispatch } from 'react';
import type { Action } from '../context/types';
import type { TypedSocket } from './client';

export function registerServerEvents(socket: TypedSocket, dispatch: Dispatch<Action>) {
  // ─── Room Events ───
  socket.on('room:playerJoined', (player) => {
    dispatch({ type: 'PLAYER_JOINED', player });
  });

  socket.on('room:playerLeft', (playerId) => {
    dispatch({ type: 'PLAYER_LEFT', playerId });
  });

  socket.on('room:hostChanged', (newHostId) => {
    dispatch({ type: 'HOST_CHANGED', newHostId });
  });

  // ─── Lobby Events ───
  socket.on('lobby:state', (data) => {
    dispatch({
      type: 'LOBBY_STATE_RECEIVED',
      players: data.players,
      settings: data.settings,
      hostId: data.hostId,
    });
  });

  socket.on('lobby:settingsUpdated', (settings) => {
    dispatch({ type: 'SETTINGS_UPDATED', settings });
  });

  // ─── Game Events ───
  socket.on('game:started', () => {
    dispatch({ type: 'GAME_STARTED' });
  });

  socket.on('game:themeAnnounced', (theme) => {
    dispatch({ type: 'THEME_ANNOUNCED', theme });
  });

  socket.on('game:cardDealt', (cardNumber) => {
    dispatch({ type: 'CARD_DEALT', cardNumber });
  });

  socket.on('game:discussionStarted', () => {
    dispatch({ type: 'DISCUSSION_STARTED' });
  });

  socket.on('game:placementStarted', () => {
    dispatch({ type: 'PLACEMENT_STARTED' });
  });

  socket.on('game:cardPlaced', (card) => {
    dispatch({ type: 'CARD_PLACED', card });
  });

  socket.on('game:orderingStarted', (placedCards) => {
    dispatch({ type: 'ORDERING_STARTED', placedCards });
  });

  socket.on('game:cardsReordered', (cardOrder) => {
    dispatch({ type: 'CARDS_REORDERED', cardOrder });
  });

  socket.on('game:lifeLost', (lives) => {
    dispatch({ type: 'LIFE_LOST', lives });
  });

  socket.on('game:roundResult', (data) => {
    dispatch({
      type: 'ROUND_RESULT',
      success: data.success,
      lives: data.lives,
      placedCards: data.placedCards,
    });
  });

  socket.on('game:over', (data) => {
    dispatch({ type: 'GAME_OVER', won: data.won, finalRound: data.finalRound });
  });

  // ─── Reconnection ───
  socket.on('game:fullState', (state) => {
    dispatch({ type: 'FULL_STATE_RECEIVED', state });
  });

  // ─── Chat ───
  socket.on('chat:newMessage', (message) => {
    dispatch({ type: 'CHAT_MESSAGE_RECEIVED', message });
  });

  // ─── Error ───
  socket.on('error', (message) => {
    dispatch({ type: 'SET_ERROR', error: message });
  });
}

export function unregisterServerEvents(socket: TypedSocket) {
  socket.off('room:playerJoined');
  socket.off('room:playerLeft');
  socket.off('room:hostChanged');
  socket.off('lobby:state');
  socket.off('lobby:settingsUpdated');
  socket.off('game:started');
  socket.off('game:themeAnnounced');
  socket.off('game:cardDealt');
  socket.off('game:discussionStarted');
  socket.off('game:placementStarted');
  socket.off('game:cardPlaced');
  socket.off('game:orderingStarted');
  socket.off('game:cardsReordered');
  socket.off('game:lifeLost');
  socket.off('game:roundResult');
  socket.off('game:over');
  socket.off('game:fullState');
  socket.off('chat:newMessage');
  socket.off('error');
}
