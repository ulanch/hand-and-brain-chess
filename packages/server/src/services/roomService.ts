import { Room, Player } from "@shared/types/game.js";
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
   * Finds a room by its ID.
   * @param roomId The 4-letter code of the room.
   * @returns The existing room or undefined if it doesn't exist.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Creates a new room with a given ID.
   * @param roomId The 4-letter code of the room.
   * @returns The newly created room.
   * @throws Error if a room with the given ID already exists.
   */
  public createNewRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room with ID ${roomId} already exists.`);
    }

    const room = {
      id: roomId,
      players: [],
      teams: {
        team1: { name: "Team 1", brain: null, hand: null },
        team2: { name: "Team 2", brain: null, hand: null },
      },
    };
    this.rooms.set(roomId, room);
    console.log(`Created new room with ID: ${roomId}`);
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

  // TODO: Implement a method to remove a player from a room when they disconnect.
  // public removePlayer(playerId: string): void { ... }
}

export const roomService = new RoomService();
