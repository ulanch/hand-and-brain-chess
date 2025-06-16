import { Room, Player } from "../models/types";
import { randomUUID } from "crypto";

/**
 * Manages the state of all game rooms in memory.
 * This class follows a singleton pattern, exporting a single instance.
 */
class RoomService {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map<string, Room>();
  }

  /**
   * Finds a room by its ID or creates a new one if it doesn't exist.
   * @param roomId The 4-letter code of the room.
   * @returns The existing or newly created room.
   */
  public findOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);

    if (!room) {
      console.log(`Creating new room with ID: ${roomId}`);
      room = this.createRoom(roomId);
      this.rooms.set(roomId, room);
    }

    return room;
  }

  /**
   * Adds a new player to a specified room.
   * @param roomId The ID of the room to join.
   * @param playerName The name of the player.
   * @returns The newly created player object or null if the room is full.
   */
  public addPlayer(roomId: string, playerName: string): Player | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error(`Room with ID ${roomId} not found.`);
    }

    if (room.players.length >= 4) {
      console.warn(`Room ${roomId} is full. Cannot add player ${playerName}.`);
      return null;
    }

    const newPlayer: Player = {
      id: randomUUID(),
      name: playerName,
    };

    room.players.push(newPlayer);
    console.log(
      `Player ${playerName} (${newPlayer.id}) added to room ${roomId}.`
    );

    // TODO: Broadcast an update to all clients in this room about the new player.

    return newPlayer;
  }

  /**
   * Retrieves the details of a specific room.
   * @param roomId The ID of the room.
   * @returns The room object or undefined if not found.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Creates a new, empty room object.
   * @param roomId The 4-letter code for the new room.
   * @returns A new Room object.
   */
  private createRoom(roomId: string): Room {
    return {
      id: roomId,
      players: [],
      teams: {
        team1: { name: "Team 1", brain: null, hand: null },
        team2: { name: "Team 2", brain: null, hand: null },
      },
      // gameState: 'lobby' // Default game state
    };
  }

  // TODO: Implement a method to remove a player from a room when they disconnect.
  // public removePlayer(playerId: string): void { ... }
}

export const roomService = new RoomService();
