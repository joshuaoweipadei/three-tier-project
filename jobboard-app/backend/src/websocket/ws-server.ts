import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";
import { Server } from "http";

// Track connected clients: userId → Set of WebSocket connections
// (one user might have multiple tabs open)
const clients = new Map<string, Set<WebSocket>>();

// Map WebSocket back to userId for cleanup on disconnect
const socketToUser = new Map<WebSocket, string>();

function parseTokenFromRequest(req: IncomingMessage): JwtPayload | null {
  try {
    // Token comes from query string: ws://localhost:5000/ws?token=...
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) return null;

    const secret = process.env.JWT_ACCESS_SECRET!;
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const payload = parseTokenFromRequest(req);

    if (!payload) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const userId = payload.id;

    // Register this connection
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);
    socketToUser.set(ws, userId);

    console.log(`🔌 WS connected: user ${userId} (${clients.get(userId)!.size} connections)`);

    // Send a welcome confirmation
    ws.send(JSON.stringify({ type: "connected", message: "Real-time updates active" }));

    ws.on("close", () => {
      const uid = socketToUser.get(ws);
      if (uid) {
        clients.get(uid)?.delete(ws);
        if (clients.get(uid)?.size === 0) {
          clients.delete(uid);
        }
        socketToUser.delete(ws);
        console.log(`🔌 WS disconnected: user ${uid}`);
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
    });
  });

  return wss;
}

// Public helper — push an event to a specific user
export function notifyUser(userId: string, event: object): void {
  const connections = clients.get(userId);
  if (!connections) return;

  const payload = JSON.stringify(event);

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

// Public helper — broadcast to all connected clients 
export function broadcast(event: object): void {
  const payload = JSON.stringify(event);

  clients.forEach((connections) => {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  });
}