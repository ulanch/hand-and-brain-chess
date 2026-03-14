import { useEffect, useRef, useCallback, useState } from "react";
import type { ClientMessage, ServerMessage } from "@shared/types/messages.js";

const WS_URL = "ws://localhost:3000";

/**
 * Manages a WebSocket connection for a player in a room.
 *
 * Opens the socket when both roomId and playerId are provided, sends a
 * `join_room` message on connect, and tears down cleanly on unmount or
 * when the ids change.
 */
export function useSocket(
  roomId: string | null,
  playerId: string | null,
  onMessage: (msg: ServerMessage) => void
): { send: (msg: ClientMessage) => void; connected: boolean } {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep onMessage stable so we don't re-open the socket when the callback
  // identity changes (e.g. every render of the context provider).
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!roomId || !playerId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({ type: "join_room", payload: { roomId, playerId } })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        onMessageRef.current(msg);
      } catch {
        console.error("Failed to parse WS message:", event.data);
      }
    };

    ws.onerror = (e) => console.error("WebSocket error:", e);

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [roomId, playerId]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.warn("WebSocket not ready, dropping message:", msg);
    }
  }, []);

  return { send, connected };
}
