import { Request, Response } from "express";
import { roomService } from "../services/roomService";

/**
 * @controller joinRoomController
 * @description Handles a player's request to join or create a game room.
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

    // --- Service Integration ---
    const room = roomService.findOrCreateRoom(roomCode);
    const player = roomService.addPlayer(room.id, name);

    // TODO: Associate the created player's ID with their WebSocket connection.

    if (!player) {
      res.status(409).json({ message: "This room is full." });
      return;
    }

    console.log(
      `Player '${player.name}' successfully joined room '${room.id}'`
    );

    // --- Success Response ---
    res.status(200).json({
      message: "Successfully joined room.",
      room: roomService.getRoom(room.id),
      player,
    });
  } catch (error) {
    console.error("Error in joinRoomController:", error);
    // TODO: Implement a more robust global error handler.
    res.status(500).json({ message: "An internal server error occurred." });
  }
};
