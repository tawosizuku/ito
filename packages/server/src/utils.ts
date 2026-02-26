import crypto from 'node:crypto';
import { CARD_MIN, CARD_MAX, THEMES } from '@ito/shared';

export function generateRoomCode(existingCodes: Set<string>): string {
  let code: string;
  do {
    code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  } while (existingCodes.has(code));
  return code;
}

export function dealCards(count: number): number[] {
  const pool: number[] = [];
  for (let i = CARD_MIN; i <= CARD_MAX; i++) {
    pool.push(i);
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function selectTheme(usedThemes: string[], customTheme: string | null): string {
  if (customTheme) return customTheme;

  const available = THEMES.filter((t) => !usedThemes.includes(t));
  const pool = available.length > 0 ? available : THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}
