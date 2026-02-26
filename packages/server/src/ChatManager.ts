import crypto from 'node:crypto';
import { validateChatMessage, CHAT_MESSAGE_MAX_LENGTH } from '@ito/shared';
import type { ChatMessage } from '@ito/shared';
import type { ServerRoom } from './types.js';

export class ChatManager {
  addMessage(room: ServerRoom, playerId: string, text: string): ChatMessage | { error: string } {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: 'プレイヤーが見つかりません' };

    const validationError = validateChatMessage(text);
    if (validationError) return { error: validationError };

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      text: text.trim(),
      timestamp: Date.now(),
      isSystem: false,
    };

    room.messages.push(message);
    return message;
  }

  addSystemMessage(room: ServerRoom, text: string): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      playerId: '',
      playerName: '',
      text,
      timestamp: Date.now(),
      isSystem: true,
    };

    room.messages.push(message);
    return message;
  }
}
