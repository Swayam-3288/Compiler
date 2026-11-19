import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocket, WebSocketServer } from 'ws';
import { createRequire } from 'module';
import executeRouter from './routes/execute.js';

dotenv.config();

const require = createRequire(import.meta.url);
const { setupWSConnection } = require('./node_modules/y-websocket/bin/utils.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pistonEndpoint: process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute',
    websocket: 'enabled',
    webrtcSignaling: 'enabled'
  });
});

// Execute Route
app.use('/api', executeRouter);

// Create combined HTTP & WebSocket server
const server = http.createServer(app);

// 1. WebSocket Server for Yjs editor collaboration
const yWss = new WebSocketServer({ noServer: true });

yWss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
});

// 2. WebSocket Server for WebRTC Audio/Video signaling
const signalWss = new WebSocketServer({ noServer: true });

// In-memory room manager for WebRTC peers: Map<roomId, Map<userId, PeerInfo>>
const webrtcRooms = new Map();

signalWss.on('connection', (ws) => {
  let currentRoomId = null;
  let currentUserId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join': {
          const { roomId, userId, name, color, isHost } = data;
          currentRoomId = roomId;
          currentUserId = userId;

          if (!webrtcRooms.has(roomId)) {
            webrtcRooms.set(roomId, new Map());
          }
          const room = webrtcRooms.get(roomId);

          // Collect list of existing peers in this room
          const existingPeers = [];
          room.forEach((peer, pId) => {
            existingPeers.push({
              userId: pId,
              name: peer.name,
              color: peer.color,
              isHost: peer.isHost,
              isMuted: peer.isMuted,
              isCameraOn: peer.isCameraOn
            });
          });

          // Register new peer
          room.set(userId, {
            ws,
            userId,
            name,
            color,
            isHost: Boolean(isHost),
            isMuted: true,
            isCameraOn: false
          });

          // Notify existing peers that a new user joined
          room.forEach((peer, pId) => {
            if (pId !== userId && peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(JSON.stringify({
                type: 'user-joined',
                userId,
                name,
                color,
                isHost: Boolean(isHost),
                isMuted: true,
                isCameraOn: false
              }));
            }
          });

          // Send list of existing peers to joining user
          ws.send(JSON.stringify({
            type: 'room-users',
            users: existingPeers
          }));
          break;
        }

        case 'signal': {
          // Forward SDP offer/answer or ICE candidate to target peer
          const { targetUserId, signal } = data;
          if (currentRoomId && webrtcRooms.has(currentRoomId)) {
            const room = webrtcRooms.get(currentRoomId);
            const target = room.get(targetUserId);
            if (target && target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(JSON.stringify({
                type: 'signal',
                senderUserId: currentUserId,
                signal
              }));
            }
          }
          break;
        }

        case 'media-state': {
          // Broadcast mic / camera toggle updates
          const { isMuted, isCameraOn } = data;
          if (currentRoomId && webrtcRooms.has(currentRoomId)) {
            const room = webrtcRooms.get(currentRoomId);
            const self = room.get(currentUserId);
            if (self) {
              self.isMuted = isMuted;
              self.isCameraOn = isCameraOn;
            }
            room.forEach((peer, pId) => {
              if (pId !== currentUserId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'user-media-state',
                  userId: currentUserId,
                  isMuted,
                  isCameraOn
                }));
              }
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Signaling error:', err);
    }
  });

  const cleanup = () => {
    if (currentRoomId && currentUserId && webrtcRooms.has(currentRoomId)) {
      const room = webrtcRooms.get(currentRoomId);
      room.delete(currentUserId);
      if (room.size === 0) {
        webrtcRooms.delete(currentRoomId);
      } else {
        room.forEach((peer) => {
          if (peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(JSON.stringify({
              type: 'user-left',
              userId: currentUserId
            }));
          }
        });
      }
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// Upgrade router: direct /signal to signalWss and other paths to yWss
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/signal' || pathname === '/webrtc') {
    signalWss.handleUpgrade(request, socket, head, (ws) => {
      signalWss.emit('connection', ws, request);
    });
  } else {
    yWss.handleUpgrade(request, socket, head, (ws) => {
      yWss.emit('connection', ws, request);
    });
  }
});

// Start combined server
server.listen(PORT, () => {
  console.log(`[Server] Online Code Compiler API & Yjs WebSocket running on http://localhost:${PORT}`);
  console.log(`[Server] WebRTC Signaling Server listening on ws://localhost:${PORT}/signal`);
});
