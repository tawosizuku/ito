import type { Server, Socket } from 'socket.io';
import type { ClientEvents, ServerEvents, GameSettings } from '@ito/shared';
import { MIN_PLAYERS } from '@ito/shared';
import type { RoomManager } from './RoomManager.js';
import type { GameEngine } from './GameEngine.js';
import type { ChatManager } from './ChatManager.js';

type IOServer = Server<ClientEvents, ServerEvents>;
type IOSocket = Socket<ClientEvents, ServerEvents>;

interface SocketData {
  roomCode: string | null;
  playerId: string | null;
}

export function registerHandlers(
  io: IOServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  chatManager: ChatManager,
): void {
  io.on('connection', (socket: IOSocket) => {
    const data: SocketData = { roomCode: null, playerId: null };

    // --- Room events ---

    socket.on('room:create', (playerName, callback) => {
      const result = roomManager.createRoom(playerName, socket.id);
      if ('error' in result) {
        callback({ success: false, error: result.error });
        return;
      }
      const { room, playerId } = result;
      data.roomCode = room.code;
      data.playerId = playerId;
      socket.join(room.code);
      callback({ success: true, roomCode: room.code, playerId });

      io.to(room.code).emit('lobby:state', {
        players: room.players.map((p) => gameEngine.getClientPlayer(p)),
        settings: room.settings,
        hostId: room.hostId,
      });
    });

    socket.on('room:join', (roomCode, playerName, callback) => {
      const result = roomManager.joinRoom(roomCode, playerName, socket.id);
      if ('error' in result) {
        callback({ success: false, error: result.error });
        return;
      }
      const { room, playerId, reconnected } = result;
      data.roomCode = room.code;
      data.playerId = playerId;
      socket.join(room.code);

      if (reconnected && room.phase !== 'LOBBY') {
        // Send full game state on reconnection
        const state = gameEngine.getGameStateForPlayer(room, playerId);
        socket.emit('game:fullState', {
          ...state,
          players: room.players.map((p) => gameEngine.getClientPlayer(p)),
          messages: room.messages,
        });
        // Notify others of reconnection
        const player = room.players.find((p) => p.id === playerId)!;
        socket.to(room.code).emit('room:playerJoined', gameEngine.getClientPlayer(player));
        const sysMsg = chatManager.addSystemMessage(room, `${player.name} が再接続しました`);
        io.to(room.code).emit('chat:newMessage', sysMsg);
        callback({ success: true, playerId });
        return;
      }

      // Normal join or reconnect to lobby
      const player = room.players.find((p) => p.id === playerId)!;
      socket.to(room.code).emit('room:playerJoined', gameEngine.getClientPlayer(player));
      io.to(room.code).emit('lobby:state', {
        players: room.players.map((p) => gameEngine.getClientPlayer(p)),
        settings: room.settings,
        hostId: room.hostId,
      });

      if (reconnected) {
        const sysMsg = chatManager.addSystemMessage(room, `${player.name} が再接続しました`);
        io.to(room.code).emit('chat:newMessage', sysMsg);
      } else {
        const sysMsg = chatManager.addSystemMessage(room, `${player.name} が参加しました`);
        io.to(room.code).emit('chat:newMessage', sysMsg);
      }

      callback({ success: true, playerId });
    });

    socket.on('room:leave', () => {
      leaveRoom(socket, data, io, roomManager, gameEngine, chatManager);
    });

    // --- Lobby events ---

    socket.on('lobby:updateSettings', (settings: Partial<GameSettings>) => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = roomManager.updateSettings(room, data.playerId, settings);
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }
      io.to(room.code).emit('lobby:settingsUpdated', room.settings);
    });

    socket.on('lobby:startGame', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.startGame(room);
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      io.to(room.code).emit('game:started');
      const sysMsg = chatManager.addSystemMessage(room, 'ゲームが開始されました！');
      io.to(room.code).emit('chat:newMessage', sysMsg);

      // Start first round
      const round = gameEngine.startRound(room);
      io.to(room.code).emit('game:themeAnnounced', round.theme);

      // Deal cards to each player
      for (const pc of round.playerCards) {
        const player = room.players.find((p) => p.id === pc.playerId);
        if (player?.socketId) {
          io.to(player.socketId).emit('game:cardDealt', pc.cardNumber);
        }
      }

      io.to(room.code).emit('game:discussionStarted');
    });

    // --- Game events ---

    socket.on('game:startPlacement', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.startPlacement(room);
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }
      io.to(room.code).emit('game:placementStarted');
    });

    socket.on('game:placeCard', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.placeCard(room, data.playerId);
      if ('error' in result) {
        socket.emit('error', result.error);
        return;
      }

      // Hide cardNumber from other players during placement
      const hiddenCard = { ...result.placed, cardNumber: 0 };
      io.to(room.code).emit('game:cardPlaced', hiddenCard);

      // When all players have placed, transition to ordering phase
      if (gameEngine.checkRoundEnd(room)) {
        const orderResult = gameEngine.startOrdering(room);
        if (!orderResult.error) {
          const hiddenCards = room.round!.placedCards.map((c) => ({ ...c, cardNumber: 0 }));
          io.to(room.code).emit('game:orderingStarted', hiddenCards);
        }
      }
    });

    socket.on('game:reorderCards', (cardOrder: string[]) => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.reorderCards(room, cardOrder);
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      io.to(room.code).emit('game:cardsReordered', cardOrder);
    });

    socket.on('game:confirmOrder', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.confirmOrder(room);
      if ('error' in result) {
        socket.emit('error', result.error);
        return;
      }

      io.to(room.code).emit('game:roundResult', {
        success: result.success,
        lives: result.lives,
        placedCards: result.placedCards,
      });

      const gameEnd = gameEngine.checkGameEnd(room);
      if (gameEnd.ended) {
        io.to(room.code).emit('game:over', {
          won: gameEnd.won,
          finalRound: room.currentRound,
        });
        const msg = gameEnd.won ? '全ラウンドクリア！おめでとう！' : 'ゲームオーバー...';
        const sysMsg = chatManager.addSystemMessage(room, msg);
        io.to(room.code).emit('chat:newMessage', sysMsg);
      }
    });

    socket.on('game:nextRound', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = gameEngine.advanceToNextRound(room);
      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      const round = gameEngine.startRound(room);
      io.to(room.code).emit('game:themeAnnounced', round.theme);

      for (const pc of round.playerCards) {
        const player = room.players.find((p) => p.id === pc.playerId);
        if (player?.socketId) {
          io.to(player.socketId).emit('game:cardDealt', pc.cardNumber);
        }
      }

      io.to(room.code).emit('game:discussionStarted');
    });

    socket.on('game:playAgain', () => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      gameEngine.resetForNewGame(room);
      io.to(room.code).emit('lobby:state', {
        players: room.players.map((p) => gameEngine.getClientPlayer(p)),
        settings: room.settings,
        hostId: room.hostId,
      });

      const sysMsg = chatManager.addSystemMessage(room, 'ロビーに戻りました');
      io.to(room.code).emit('chat:newMessage', sysMsg);
    });

    // --- Chat ---

    socket.on('chat:sendMessage', (text: string) => {
      if (!data.roomCode || !data.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const result = chatManager.addMessage(room, data.playerId, text);
      if ('error' in result) {
        socket.emit('error', result.error);
        return;
      }
      io.to(room.code).emit('chat:newMessage', result);
    });

    // --- Disconnect ---

    socket.on('disconnect', () => {
      leaveRoom(socket, data, io, roomManager, gameEngine, chatManager);
    });
  });
}

function leaveRoom(
  socket: IOSocket,
  data: SocketData,
  io: IOServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  chatManager: ChatManager,
): void {
  if (!data.roomCode || !data.playerId) return;
  const room = roomManager.getRoom(data.roomCode);
  if (!room) return;

  const player = room.players.find((p) => p.id === data.playerId);
  if (!player) return;

  const playerName = player.name;
  const roomCode = data.roomCode;

  if (room.phase === 'LOBBY') {
    // In lobby: remove immediately
    const result = roomManager.removePlayer(room, data.playerId);
    socket.leave(roomCode);
    data.roomCode = null;
    data.playerId = null;

    if (result.roomDeleted) return;

    io.to(roomCode).emit('room:playerLeft', player.id);
    if (result.hostChanged && result.newHostId) {
      io.to(roomCode).emit('room:hostChanged', result.newHostId);
    }
    io.to(roomCode).emit('lobby:state', {
      players: room.players.map((p) => gameEngine.getClientPlayer(p)),
      settings: room.settings,
      hostId: room.hostId,
    });

    const sysMsg = chatManager.addSystemMessage(room, `${playerName} が退出しました`);
    io.to(roomCode).emit('chat:newMessage', sysMsg);
  } else {
    // During game: soft disconnect (allow reconnection)
    roomManager.disconnectPlayer(room, data.playerId);
    socket.leave(roomCode);
    data.roomCode = null;
    data.playerId = null;

    io.to(roomCode).emit('room:playerLeft', player.id);
    const sysMsg = chatManager.addSystemMessage(room, `${playerName} が切断されました`);
    io.to(roomCode).emit('chat:newMessage', sysMsg);
  }
}
