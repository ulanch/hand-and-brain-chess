import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { roomRoutes } from "./api/roomRoutes";

const app = express();
const server = http.createServer(app);

// TODO: For production, configure the origin from an environment variable.
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  // TODO: Upon connection, assign a unique ID to this client.
  // This ID will be used to identify the player in a room.
  // const playerId = generateUniqueId();
  // ws.id = playerId;
  console.log("✅ Client connected via WebSocket");

  ws.on("message", (message: string) => {
    // TODO: Implement a structured message protocol (e.g., JSON with a 'type' field).
    // The current implementation just broadcasts every message to every other client.
    // Example: const { type, payload } = JSON.parse(message);
    // switch(type) { case 'selectRole': ... }
    console.log("received: %s", message);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    // TODO: Implement logic to remove the disconnected player from their room.
    // This will require knowing which player and room this WebSocket was associated with.
    // roomService.removePlayer(playerId);
    console.log("❌ Client disconnected");
  });

  ws.send("Welcome! You are connected to the Hand and Brain server.");
});

app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.send("Hand and Brain Server is running!");
});

// TODO: Add a global error handling middleware for unhandled errors.

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
