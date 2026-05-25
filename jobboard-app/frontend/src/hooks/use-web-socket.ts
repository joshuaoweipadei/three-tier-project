import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export interface WsMessage {
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef  = useRef<Set<(msg: WsMessage) => void>>(new Set());

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Determine WS URL — in dev Vite proxies it, in prod use env var
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host     = window.location.host;
    const url      = `${protocol}//${host}/ws?token=${accessToken}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Clear any pending reconnect timer
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        handlersRef.current.forEach((handler) => handler(msg));
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect unless closed intentionally (code 1000) or unauthorized (4001)
      if (event.code !== 1000 && event.code !== 4001 && isAuthenticated) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [accessToken, isAuthenticated]);

  // Subscribe to incoming messages
  const onMessage = useCallback((handler: (msg: WsMessage) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler)
    };
  }, []);

  // Disconnect cleanly
  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close(1000, "User logged out");
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { isConnected, onMessage, disconnect };
}