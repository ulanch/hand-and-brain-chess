import express from "express";
import { joinRoomController } from "../controllers/roomController";

const router = express.Router();

/**
 * @route   POST /api/rooms/join
 * @desc    Allows a player to join or create a game room.
 * @access  Public
 */
router.post("/join", joinRoomController);

// TODO: Implement a route to get the current state of a specific room.
// router.get('/:roomId', getRoomDetailsController);

// TODO: Implement a route for players to select their team and role (brain/hand).
// router.post('/:roomId/select-role', selectRoleController);

// TODO: Implement a route to start the game once the lobby is full.
// router.post('/:roomId/start', startGameController);

export const roomRoutes = router;
