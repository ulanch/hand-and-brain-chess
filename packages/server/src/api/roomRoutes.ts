import express from "express";
import {
  joinRoomController,
  createRoomController,
} from "../controllers/roomController.js";

const router = express.Router();

/**
 * @route   POST /api/rooms/join
 * @desc    Allows a player to join or create a game room.
 * @access  Public
 */
router.post("/join", joinRoomController);

/**
 * @route   POST /api/rooms/create
 * @desc    Allows a player to create a new game room.
 * @access  Public
 */
router.post("/create", createRoomController); // New route for creating a room

// TODO: Implement a route to get the current state of a specific room.
// import { getRoomDetailsController } from "../controllers/roomController.js";
// router.get('/:roomId', getRoomDetailsController);

// TODO: Implement a route for players to select their team and role (brain/hand).
// import { selectRoleController } = "../controllers/roomController.js";
// router.post('/:roomId/select-role', selectRoleController);

// TODO: Implement a route to start the game once the lobby is full.
// import { startGameController } = "../controllers/roomController.js";
// router.post('/:roomId/start', startGameController);

export const roomRoutes = router;
