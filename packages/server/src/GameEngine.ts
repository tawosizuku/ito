import {
  MIN_PLAYERS,
  validatePlayerCount,
} from '@ito/shared';
import type { GameState, PlacedCard, Player } from '@ito/shared';
import type { ServerRoom, ServerRoundState } from './types.js';
import { dealCards, selectTheme } from './utils.js';

export class GameEngine {
  startGame(room: ServerRoom): { error?: string } {
    const countError = validatePlayerCount(room.players.length);
    if (countError) return { error: countError };
    if (room.phase !== 'LOBBY') return { error: 'ロビーからのみゲームを開始できます' };

    room.lives = room.settings.maxLives;
    room.currentRound = 0;
    room.usedThemes = [];
    room.phase = 'THEME_ANNOUNCEMENT';
    return {};
  }

  startRound(room: ServerRoom): ServerRoundState {
    room.currentRound++;
    const theme = selectTheme(room.usedThemes, room.settings.customTheme);
    room.usedThemes.push(theme);

    const activePlayers = room.players.filter((p) => p.socketId !== null || p.disconnectedAt !== null);
    const playerIds = activePlayers.map((p) => p.id);
    const cards = dealCards(playerIds.length);

    const playerCards = playerIds.map((id, i) => ({
      playerId: id,
      cardNumber: cards[i],
      hasPlaced: false,
    }));

    const round: ServerRoundState = {
      roundNumber: room.currentRound,
      theme,
      playerCards,
      placedCards: [],
      remainingPlayers: [...playerIds],
    };

    room.round = round;
    room.phase = 'DISCUSSION';
    return round;
  }

  startPlacement(room: ServerRoom): { error?: string } {
    if (room.phase !== 'DISCUSSION') return { error: 'ディスカッション中のみ配置を開始できます' };
    room.phase = 'PLACEMENT';
    return {};
  }

  placeCard(
    room: ServerRoom,
    playerId: string,
    label: string,
  ): { placed: PlacedCard } | { error: string } {
    if (room.phase !== 'PLACEMENT') return { error: '配置フェーズではありません' };
    if (!room.round) return { error: 'ラウンドが開始されていません' };

    const card = room.round.playerCards.find((c) => c.playerId === playerId);
    if (!card) return { error: 'カードが見つかりません' };
    if (card.hasPlaced) return { error: '既にカードを配置しています' };

    card.hasPlaced = true;
    room.round.remainingPlayers = room.round.remainingPlayers.filter((id) => id !== playerId);

    const playerName = room.players.find((p) => p.id === playerId)?.name ?? '';
    const placed: PlacedCard = {
      playerId,
      playerName,
      cardNumber: card.cardNumber,
      order: room.round.placedCards.length + 1,
      label,
    };
    room.round.placedCards.push(placed);

    return { placed };
  }

  startOrdering(room: ServerRoom): { error?: string } {
    if (room.phase !== 'PLACEMENT') return { error: '配置フェーズではありません' };
    room.phase = 'ORDERING';
    return {};
  }

  reorderCards(room: ServerRoom, cardOrder: string[]): { error?: string } {
    if (room.phase !== 'ORDERING') return { error: '並び替えフェーズではありません' };
    if (!room.round) return { error: 'ラウンドが開始されていません' };

    const reordered: PlacedCard[] = [];
    for (const playerId of cardOrder) {
      const card = room.round.placedCards.find((c) => c.playerId === playerId);
      if (!card) return { error: 'カードが見つかりません' };
      reordered.push({ ...card, order: reordered.length + 1 });
    }
    room.round.placedCards = reordered;
    return {};
  }

  confirmOrder(room: ServerRoom): { success: boolean; lives: number; placedCards: PlacedCard[] } | { error: string } {
    if (room.phase !== 'ORDERING') return { error: '並び替えフェーズではありません' };
    if (!room.round) return { error: 'ラウンドが開始されていません' };

    // Count inversions (adjacent pairs in wrong order)
    const placed = room.round.placedCards;
    let inversions = 0;
    for (let i = 1; i < placed.length; i++) {
      if (placed[i].cardNumber < placed[i - 1].cardNumber) {
        inversions++;
      }
    }

    // Lose life for each inversion
    for (let i = 0; i < inversions; i++) {
      this.loseLife(room);
    }

    const success = inversions === 0;
    this.setRoundResult(room);

    return { success, lives: room.lives, placedCards: placed };
  }

  loseLife(room: ServerRoom): number {
    room.lives = Math.max(0, room.lives - 1);
    return room.lives;
  }

  checkRoundEnd(room: ServerRoom): boolean {
    if (!room.round) return false;
    return room.round.remainingPlayers.length === 0;
  }

  isRoundSuccess(room: ServerRoom): boolean {
    if (!room.round) return false;
    const placed = room.round.placedCards;
    for (let i = 1; i < placed.length; i++) {
      if (placed[i].cardNumber < placed[i - 1].cardNumber) return false;
    }
    return true;
  }

  checkGameEnd(room: ServerRoom): { ended: boolean; won: boolean } {
    if (room.lives <= 0) {
      room.phase = 'GAME_OVER';
      return { ended: true, won: false };
    }
    if (room.currentRound >= room.settings.totalRounds) {
      room.phase = 'GAME_OVER';
      return { ended: true, won: true };
    }
    return { ended: false, won: false };
  }

  advanceToNextRound(room: ServerRoom): { error?: string } {
    if (room.phase !== 'ROUND_RESULT') return { error: 'ラウンド結果フェーズではありません' };
    room.phase = 'THEME_ANNOUNCEMENT';
    return {};
  }

  setRoundResult(room: ServerRoom): void {
    room.phase = 'ROUND_RESULT';
  }

  resetForNewGame(room: ServerRoom): void {
    room.phase = 'LOBBY';
    room.currentRound = 0;
    room.lives = room.settings.maxLives;
    room.round = null;
    room.usedThemes = [];
  }

  getGameStateForPlayer(room: ServerRoom, playerId: string): GameState {
    let myCard: number | null = null;
    if (room.round) {
      const card = room.round.playerCards.find((c) => c.playerId === playerId);
      if (card) myCard = card.cardNumber;
    }

    return {
      phase: room.phase,
      currentRound: room.currentRound,
      totalRounds: room.settings.totalRounds,
      lives: room.lives,
      maxLives: room.settings.maxLives,
      round: room.round
        ? {
            roundNumber: room.round.roundNumber,
            theme: room.round.theme,
            placedCards:
              room.phase === 'PLACEMENT' || room.phase === 'ORDERING'
                ? room.round.placedCards.map((c) => ({ ...c, cardNumber: 0 }))
                : room.round.placedCards,
            remainingPlayers: room.round.remainingPlayers,
          }
        : null,
      myCard,
      isSuccess: room.phase === 'GAME_OVER' ? room.lives > 0 : null,
    };
  }

  getClientPlayer(player: { id: string; name: string; isHost: boolean; socketId: string | null }): Player {
    return {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: player.socketId !== null,
    };
  }
}
