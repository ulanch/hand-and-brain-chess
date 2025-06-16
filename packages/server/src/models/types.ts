/**
 * Defines the possible roles a player can have within a team.
 */
export type PlayerRole = "brain" | "hand";

/**
 * Represents a single player in the game.
 */
export interface Player {
  id: string; // A unique identifier, e.g., a WebSocket ID or a session ID
  name: string;
}

/**
 * Represents one of the two teams in a game.
 * It can have a Brain and a Hand, but they might be null if no one has joined yet.
 */
export interface Team {
  name: string;
  brain: Player | null;
  hand: Player | null;
}

/**
 * Represents a single game room, containing all its state.
 */
export interface Room {
  id: string; // The 4-letter room code
  players: Player[]; // A list of all players currently in the room
  teams: {
    team1: Team;
    team2: Team;
  };
  // TODO: Implement a state machine for game status (e.g., 'lobby', 'in-progress', 'finished').
  // gameState?: 'lobby' | 'in-progress' | 'finished';

  // TODO: Add support for configurable time controls.
  // timeControl?: string;
}
