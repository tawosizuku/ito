import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  PLAYER_NAME_MAX_LENGTH,
  ROOM_CODE_LENGTH,
  MIN_LIVES,
  MAX_LIVES,
  MIN_ROUNDS,
  MAX_ROUNDS,
  CHAT_MESSAGE_MAX_LENGTH,
} from '../constants/game.js';

export function validatePlayerName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'プレイヤー名を入力してください';
  if (trimmed.length > PLAYER_NAME_MAX_LENGTH) return `プレイヤー名は${PLAYER_NAME_MAX_LENGTH}文字以内にしてください`;
  return null;
}

export function validateRoomCode(code: string): string | null {
  if (code.length !== ROOM_CODE_LENGTH) return `ルームコードは${ROOM_CODE_LENGTH}桁です`;
  if (!/^\d+$/.test(code)) return 'ルームコードは数字のみです';
  return null;
}

export function validatePlayerCount(count: number): string | null {
  if (count < MIN_PLAYERS) return `最低${MIN_PLAYERS}人必要です`;
  if (count > MAX_PLAYERS) return `最大${MAX_PLAYERS}人までです`;
  return null;
}

export function validateLives(lives: number): boolean {
  return Number.isInteger(lives) && lives >= MIN_LIVES && lives <= MAX_LIVES;
}

export function validateRounds(rounds: number): boolean {
  return Number.isInteger(rounds) && rounds >= MIN_ROUNDS && rounds <= MAX_ROUNDS;
}

export function validateChatMessage(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'メッセージを入力してください';
  if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) return `メッセージは${CHAT_MESSAGE_MAX_LENGTH}文字以内にしてください`;
  return null;
}
