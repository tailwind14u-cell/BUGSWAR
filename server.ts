import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { GameEngine, PlayerInput } from './src/game/GameEngine.ts';
import { Faction } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// Authoritative Server Simulation Engine
const engine = new GameEngine();

// Tick loop running at 30 ticks/second
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;
  engine.update(dt);
}, 1000 / 30);

// Broadcast snapshots to connected players at 25 Hz
interface ClientConnection {
  ws: WebSocket;
  playerId: string;
}

const clients = new Map<WebSocket, ClientConnection>();

setInterval(() => {
  if (clients.size === 0) return;

  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      const snapshot = engine.getSnapshot(client.playerId);
      const packet = JSON.stringify({
        type: 'snapshot',
        snapshot,
        floatingTexts: engine.floatingTexts,
        obstacles: engine.obstacles
      });
      ws.send(packet);
    }
  }
}, 1000 / 25);

// Handle engine events (severed segments, evolution, etc.)
engine.onEvent = (event) => {
  const eventMsg = JSON.stringify({ type: 'game_event', event });
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(eventMsg);
    }
  }
};

wss.on('connection', (ws) => {
  let boundPlayerId: string | null = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'join') {
        const name = (msg.name || 'YardCrawler').slice(0, 16);
        const faction: Faction = ['centipede', 'ant', 'spider'].includes(msg.faction)
          ? msg.faction
          : 'centipede';

        const playerId = `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        boundPlayerId = playerId;
        const player = engine.createPlayer(playerId, name, faction, false);

        clients.set(ws, { ws, playerId });

        ws.send(JSON.stringify({
          type: 'joined',
          playerId,
          player,
          obstacles: engine.obstacles
        }));
      } else if (msg.type === 'input' && boundPlayerId) {
        const input: PlayerInput = msg.input;
        engine.applyInput(boundPlayerId, input);
      } else if (msg.type === 'respawn' && boundPlayerId) {
        const respawned = engine.respawnPlayer(boundPlayerId);
        if (respawned) {
          ws.send(JSON.stringify({
            type: 'respawned',
            playerId: boundPlayerId,
            player: respawned
          }));
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    if (boundPlayerId) {
      engine.players.delete(boundPlayerId);
    }
    clients.delete(ws);
  });
});

// REST Health and info endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    title: 'BUGS WAR Authoritative Server',
    bugsAlive: engine.players.size,
    sugarDrops: engine.sugarDrops.length,
    crystals: engine.giantCrystals.length,
    connectedPlayers: clients.size
  });
});

// Integrate Vite in development or serve static dist in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐜 BUGS WAR server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
