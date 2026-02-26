import {
  MAX_PLAYERS,
  DEFAULT_GAME_SETTINGS,
  RECONNECT_TIMEOUT_MS,
  validatePlayerName,
  validateRoomCode,
  validateLives,
  validateRounds,
} from '@ito/shared';
import type { GameSettings } from '@ito/shared';
import type { ServerRoom, ServerPlayer } from './types.js';
import { generateRoomCode, generatePlayerId } from './utils.js';

export class RoomManager {
  private rooms = new Map<string, ServerRoom>();

  getRoomCodes(): Set<string> {
    return new Set(this.rooms.keys());
  }

  getRoom(code: string): ServerRoom | undefined {
    return this.rooms.get(code);
  }

  createRoom(playerName: string, socketId: string): { room: ServerRoom; playerId: string } | { error: string } {
    const nameError = validatePlayerName(playerName);
    if (nameError) return { error: nameError };

    const code = generateRoomCode(this.getRoomCodes());
    const playerId = generatePlayerId();

    const player: ServerPlayer = {
      id: playerId,
      name: playerName.trim(),
      socketId,
      isHost: true,
      disconnectedAt: null,
    };

    const room: ServerRoom = {
      code,
      players: [player],
      hostId: playerId,
      settings: { ...DEFAULT_GAME_SETTINGS },
      phase: 'LOBBY',
      currentRound: 0,
      lives: DEFAULT_GAME_SETTINGS.maxLives,
      round: null,
      usedThemes: [],
      messages: [],
    };

    this.rooms.set(code, room);
    return { room, playerId };
  }

  joinRoom(
    code: string,
    playerName: string,
    socketId: string,
  ): { room: ServerRoom; playerId: string; reconnected: boolean } | { error: string } {
    const codeError = validateRoomCode(code);
    if (codeError) return { error: codeError };

    const nameError = validatePlayerName(playerName);
    if (nameError) return { error: nameError };

    const room = this.rooms.get(code);
    if (!room) return { error: 'ルームが見つかりません' };

    const trimmedName = playerName.trim();

    // Check for reconnection (same name, disconnected)
    const disconnected = room.players.find(
      (p) => p.name === trimmedName && p.socketId === null,
    );
    if (disconnected) {
      disconnected.socketId = socketId;
      disconnected.disconnectedAt = null;
      return { room, playerId: disconnected.id, reconnected: true };
    }

    // New player joining
    if (room.phase !== 'LOBBY') {
      return { error: 'ゲームが進行中です' };
    }

    if (room.players.length >= MAX_PLAYERS) {
      return { error: 'ルームが満員です' };
    }

    if (room.players.some((p) => p.name === trimmedName)) {
      return { error: 'この名前は既に使われています' };
    }

    const playerId = generatePlayerId();
    const player: ServerPlayer = {
      id: playerId,
      name: trimmedName,
      socketId,
      isHost: false,
      disconnectedAt: null,
    };

    room.players.push(player);
    return { room, playerId, reconnected: false };
  }

  removePlayer(room: ServerRoom, playerId: string): { hostChanged: boolean; newHostId: string | null; roomDeleted: boolean } {
    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return { hostChanged: false, newHostId: null, roomDeleted: true };
    }

    let hostChanged = false;
    let newHostId: string | null = null;

    if (room.hostId === playerId) {
      const connectedPlayer = room.players.find((p) => p.socketId !== null) ?? room.players[0];
      connectedPlayer.isHost = true;
      room.hostId = connectedPlayer.id;
      hostChanged = true;
      newHostId = connectedPlayer.id;
    }

    return { hostChanged, newHostId, roomDeleted: false };
  }

  disconnectPlayer(room: ServerRoom, playerId: string): void {
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = null;
      player.disconnectedAt = Date.now();
    }
  }

  reconnectPlayer(room: ServerRoom, playerId: string, socketId: string): void {
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.disconnectedAt = null;
    }
  }

  updateSettings(room: ServerRoom, playerId: string, settings: Partial<GameSettings>): { error?: string } {
    if (room.hostId !== playerId) return { error: 'ホストのみ設定を変更できます' };
    if (room.phase !== 'LOBBY') return { error: 'ロビーでのみ設定を変更できます' };

    if (settings.maxLives !== undefined) {
      if (!validateLives(settings.maxLives)) return { error: 'ライフの値が不正です' };
      room.settings.maxLives = settings.maxLives;
      room.lives = settings.maxLives;
    }
    if (settings.totalRounds !== undefined) {
      if (!validateRounds(settings.totalRounds)) return { error: 'ラウンド数が不正です' };
      room.settings.totalRounds = settings.totalRounds;
    }
    if (settings.customTheme !== undefined) {
      room.settings.customTheme = settings.customTheme;
    }

    return {};
  }

  cleanupStaleRooms(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [code, room] of this.rooms) {
      // Remove timed-out disconnected players
      room.players = room.players.filter((p) => {
        if (p.disconnectedAt && now - p.disconnectedAt > RECONNECT_TIMEOUT_MS) {
          return false;
        }
        return true;
      });

      // Delete empty rooms
      if (room.players.length === 0) {
        this.rooms.delete(code);
        cleaned++;
        continue;
      }

      // Reassign host if needed
      if (!room.players.find((p) => p.id === room.hostId)) {
        const newHost = room.players.find((p) => p.socketId !== null) ?? room.players[0];
        newHost.isHost = true;
        room.hostId = newHost.id;
      }
    }

    return cleaned;
  }
}
