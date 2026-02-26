import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientEvents, ServerEvents } from '@ito/shared';
import { ROOM_CLEANUP_INTERVAL_MS } from '@ito/shared';
import { PORT, CORS_ORIGIN } from './config.js';
import { RoomManager } from './RoomManager.js';
import { GameEngine } from './GameEngine.js';
import { ChatManager } from './ChatManager.js';
import { registerHandlers } from './SocketHandlers.js';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: CORS_ORIGIN
    ? { origin: CORS_ORIGIN, methods: ['GET', 'POST'] }
    : undefined,
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine();
const chatManager = new ChatManager();

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve client static files
const clientDistPath = path.join(import.meta.dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback: serve index.html for non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Register Socket.IO handlers
registerHandlers(io, roomManager, gameEngine, chatManager);

// Cleanup stale rooms periodically
setInterval(() => {
  const cleaned = roomManager.cleanupStaleRooms();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} stale rooms`);
  }
}, ROOM_CLEANUP_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`ito server running on http://localhost:${PORT}`);
});
