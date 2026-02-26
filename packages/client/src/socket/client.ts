import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '@ito/shared';

export type TypedSocket = Socket<ServerEvents, ClientEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export const socket: TypedSocket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
