import type { Player } from './player.js';
import type { GameSettings, GameState, PlacedCard } from './game.js';
import type { ChatMessage } from './chat.js';

// Client → Server events
export interface ClientEvents {
  'room:create': (playerName: string, callback: (response: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => void;
  'room:join': (roomCode: string, playerName: string, callback: (response: { success: boolean; playerId?: string; error?: string }) => void) => void;
  'room:leave': () => void;
  'lobby:updateSettings': (settings: Partial<GameSettings>) => void;
  'lobby:startGame': () => void;
  'chat:sendMessage': (text: string) => void;
  'game:placeCard': () => void;
  'game:nextRound': () => void;
  'game:startPlacement': () => void;
  'game:playAgain': () => void;
}

// Server → Client events
export interface ServerEvents {
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:hostChanged': (newHostId: string) => void;
  'lobby:settingsUpdated': (settings: GameSettings) => void;
  'lobby:state': (data: { players: Player[]; settings: GameSettings; hostId: string }) => void;
  'game:started': () => void;
  'game:themeAnnounced': (theme: string) => void;
  'game:cardDealt': (cardNumber: number) => void;
  'game:discussionStarted': () => void;
  'game:placementStarted': () => void;
  'game:cardPlaced': (card: PlacedCard) => void;
  'game:lifeLost': (lives: number) => void;
  'game:roundResult': (data: { success: boolean; lives: number; placedCards: PlacedCard[] }) => void;
  'game:over': (data: { won: boolean; finalRound: number }) => void;
  'game:fullState': (state: GameState & { players: Player[]; messages: ChatMessage[] }) => void;
  'chat:newMessage': (message: ChatMessage) => void;
  'error': (message: string) => void;
}
