import { Request, Response } from "express";
import { roomService } from "../services/roomService.js";
import { broadcastToRoom } from "../connectionRegistry.js";

/**
 * Generates a random 4-letter uppercase room code.
 * @returns {string} A 4-letter room code.
 */
function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * @controller createRoomController
 * @description Handles a player's request to create a new game room.
 * It validates the request, generates a unique room code, uses the roomService
 * to create the room and add the player, and sends back the appropriate response.
 *
 * @param req The Express request object. Expects { name: string } in the body.
 * @param res The Express response object.
 */
export const createRoomController = (req: Request, res: Response): void => {
  try {
    const { name } = req.body;

    // --- Validation ---
    if (!name) {
      res.status(400).json({ message: "Player name is required." });
      return;
    }
    if (typeof name !== "string") {
      res.status(400).json({ message: "Invalid data format for name." });
      return;
    }

    let roomCode = generateRoomCode();
    // Ensure the generated room code is unique (simple check, could be more robust)
    while (roomService.getRoom(roomCode)) {
      // Use getRoom to check for existence
      roomCode = generateRoomCode();
    }

    // --- Service Integration ---
    const room = roomService.createNewRoom(roomCode); // Correctly using createNewRoom
    const player = roomService.addPlayer(room.id, name);

    if (!player) {
      // This case ideally shouldn't happen for a newly created room unless there's an internal error
      res.status(500).json({ message: "Failed to add player to new room." });
      return;
    }

    console.log(
      `Player '${player.name}' successfully created and joined room '${room.id}'`
    );

    // --- Success Response ---
    res.status(200).json({
      message: "Successfully created and joined room.",
      room: roomService.getRoom(room.id),
      player,
    });
  } catch (error) {
    console.error("Error in createRoomController:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

/**
 * @controller joinRoomController
 * @description Handles a player's request to join an existing game room.
 * It validates the request, uses the roomService to perform the action,
 * and sends back the appropriate response.
 *
 * @param req The Express request object. Expects { name: string, roomCode: string } in the body.
 * @param res The Express response object.
 */
export const joinRoomController = (req: Request, res: Response): void => {
  try {
    const { name, roomCode } = req.body;

    // --- Validation ---
    if (!name || !roomCode) {
      res
        .status(400)
        .json({ message: "Player name and room code are required." });
      return;
    }
    if (typeof name !== "string" || typeof roomCode !== "string") {
      res
        .status(400)
        .json({ message: "Invalid data format for name or room code." });
      return;
    }
    if (!/^[A-Z]{4}$/.test(roomCode)) {
      res
        .status(400)
        .json({ message: "Room code must be 4 uppercase letters." });
      return;
    }

    // Check if room exists before trying to add player
    const existingRoom = roomService.getRoom(roomCode);
    if (!existingRoom) {
      res.status(404).json({ message: `Room '${roomCode}' not found.` });
      return;
    }

    // --- Service Integration ---
    const player = roomService.addPlayer(existingRoom.id, name);

    if (!player) {
      res.status(409).json({ message: "This room is full." });
      return;
    }

    console.log(
      `Player '${player.name}' successfully joined room '${existingRoom.id}'`
    );

    // Notify already-connected players that someone new joined
    const updatedRoom = roomService.getRoom(existingRoom.id)!;
    broadcastToRoom(updatedRoom.id, { type: "lobby_update", payload: { room: updatedRoom } });

    // --- Success Response ---
    res.status(200).json({
      message: "Successfully joined room.",
      room: updatedRoom,
      player,
    });
  } catch (error) {
    console.error("Error in joinRoomController:", error);
    // TODO: Implement a more robust global error handler.
    res.status(500).json({ message: "An internal server error occurred." });
  }
};
