import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { roomRoutes } from "./api/roomRoutes.js";
import { roomService } from "./services/roomService.js";
import {
  send,
  broadcastToRoom,
  registerConnection,
  unregisterConnection,
  getConnectionPlayer,
} from "./connectionRegistry.js";
import type { ClientMessage } from "@shared/types/messages.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("✅ Client connected via WebSocket");

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send(ws, { type: "error", payload: { message: "Invalid JSON." } });
      return;
    }

    switch (msg.type) {
      case "join_room": {
        const { roomId, playerId } = msg.payload;
        const room = roomService.getRoom(roomId);

        if (!room) {
          send(ws, { type: "error", payload: { message: `Room ${roomId} not found.` } });
          return;
        }

        const player = room.players.find((p) => p.id === playerId);
        if (!player) {
          send(ws, { type: "error", payload: { message: "Player not found in room." } });
          return;
        }

        registerConnection(playerId, ws);
        console.log(`Player ${player.name} (${playerId}) connected to room ${roomId}.`);

        // Broadcast current state to everyone in the room (including the joining player)
        broadcastToRoom(roomId, { type: "lobby_update", payload: { room } });
        break;
      }

      case "select_role": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) {
          send(ws, { type: "error", payload: { message: "Not registered. Send join_room first." } });
          return;
        }

        const playerRoom = roomService.getRoomByPlayerId(playerId);
        if (!playerRoom) {
          send(ws, { type: "error", payload: { message: "You are not in a room." } });
          return;
        }

        const { team, role } = msg.payload;
        const result = roomService.selectRole(playerRoom.id, playerId, team, role);

        if (typeof result === "string") {
          send(ws, { type: "error", payload: { message: result } });
          return;
        }

        broadcastToRoom(result.id, { type: "lobby_update", payload: { room: result } });
        break;
      }

      case "start_game": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) {
          send(ws, { type: "error", payload: { message: "Not registered." } });
          return;
        }
        const playerRoom = roomService.getRoomByPlayerId(playerId);
        if (!playerRoom) {
          send(ws, { type: "error", payload: { message: "You are not in a room." } });
          return;
        }
        const result = roomService.startGame(playerRoom.id, msg.payload?.timeControl);
        if (typeof result === "string") {
          send(ws, { type: "error", payload: { message: result } });
          return;
        }
        broadcastToRoom(result.id, { type: "lobby_update", payload: { room: result } });
        break;
      }

      case "brain_pick": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) {
          send(ws, { type: "error", payload: { message: "Not registered." } });
          return;
        }
        const playerRoom = roomService.getRoomByPlayerId(playerId);
        if (!playerRoom) {
          send(ws, { type: "error", payload: { message: "You are not in a room." } });
          return;
        }
        const result = roomService.brainPick(playerRoom.id, playerId, msg.payload.pieceType);
        if (typeof result === "string") {
          send(ws, { type: "error", payload: { message: result } });
          return;
        }
        broadcastToRoom(result.id, { type: "lobby_update", payload: { room: result } });
        break;
      }

      case "hand_move": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) {
          send(ws, { type: "error", payload: { message: "Not registered." } });
          return;
        }
        const playerRoom = roomService.getRoomByPlayerId(playerId);
        if (!playerRoom) {
          send(ws, { type: "error", payload: { message: "You are not in a room." } });
          return;
        }
        const { from, to, promotion } = msg.payload;
        const result = roomService.handMove(playerRoom.id, playerId, from, to, promotion);
        if (typeof result === "string") {
          send(ws, { type: "error", payload: { message: result } });
          return;
        }
        broadcastToRoom(result.id, { type: "lobby_update", payload: { room: result } });
        break;
      }

      case "chat_message": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) return;
        const playerRoom = roomService.getRoomByPlayerId(playerId);
        if (!playerRoom) return;
        const player = playerRoom.players.find((p) => p.id === playerId);
        if (!player) return;
        const text = msg.payload.text.trim().slice(0, 300);
        if (!text) return;
        broadcastToRoom(playerRoom.id, {
          type: "chat_broadcast",
          payload: { playerId, playerName: player.name, text, timestamp: Date.now() },
        });
        break;
      }

      case "leave_room": {
        const playerId = getConnectionPlayer(ws);
        if (!playerId) return;

        unregisterConnection(ws);
        const updatedRoom = roomService.removePlayer(playerId);

        if (updatedRoom) {
          broadcastToRoom(updatedRoom.id, {
            type: "lobby_update",
            payload: { room: updatedRoom },
          });
        }

        console.log(`Player ${playerId} left their room.`);
        break;
      }

      default: {
        send(ws, { type: "error", payload: { message: "Unknown message type." } });
      }
    }
  });

  ws.on("close", () => {
    const playerId = unregisterConnection(ws);
    // Note: we intentionally do NOT remove the player from the room here.
    // Refreshing the page or a brief network drop would otherwise wipe their
    // slot. Removal only happens via an explicit leave_room message.
    if (playerId) {
      console.log(`❌ Player ${playerId} disconnected (slot preserved).`);
    }
  });
});

app.use("/api/rooms", roomRoutes);

app.get("/", (_, res) => {
  res.send("Hand and Brain Server is running!");
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "An internal server error occurred." });
  }
);

const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
