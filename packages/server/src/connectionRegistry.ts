import { WebSocket } from "ws";
import { roomService } from "./services/roomService.js";
import type { ServerMessage } from "@shared/types/messages.js";

/**
 * Tracks live WebSocket connections by player ID.
 * Shared between the WS handlers (index.ts) and REST controllers so that
 * HTTP-triggered events (e.g. a player joining via POST) can broadcast to
 * already-connected clients.
 */
const playerConnections = new Map<string, WebSocket>();
const connectionPlayers = new Map<WebSocket, string>();

export function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

/** Sends a message to every connected player currently in a room. */
export function broadcastToRoom(roomId: string, msg: ServerMessage) {
  const room = roomService.getRoom(roomId);
  if (!room) return;
  for (const player of room.players) {
    const ws = playerConnections.get(player.id);
    if (ws) send(ws, msg);
  }
}

/**
 * Associates a WebSocket with a player ID.
 * Safe to call multiple times for the same player (handles reconnection).
 */
export function registerConnection(playerId: string, ws: WebSocket) {
  // Clean up any previous socket for this player (e.g. reconnect after refresh)
  const previous = playerConnections.get(playerId);
  if (previous && previous !== ws) {
    connectionPlayers.delete(previous);
  }

  playerConnections.set(playerId, ws);
  connectionPlayers.set(ws, playerId);
}

/**
 * Removes the WebSocket↔player mapping on disconnect.
 * Does NOT remove the player from their room — that requires an explicit
 * leave_room message so that refreshes / brief disconnects don't lose the slot.
 *
 * @returns the playerId that was unregistered, or undefined if unknown
 */
export function unregisterConnection(ws: WebSocket): string | undefined {
  const playerId = connectionPlayers.get(ws);
  if (!playerId) return undefined;

  connectionPlayers.delete(ws);
  playerConnections.delete(playerId);
  return playerId;
}

export function getConnectionPlayer(ws: WebSocket): string | undefined {
  return connectionPlayers.get(ws);
}
