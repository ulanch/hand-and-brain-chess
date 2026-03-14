/**
 * Defines the possible roles a player can have within a team.
 */
export type PlayerRole = "brain" | "hand";

/**
 * The six chess piece types a Brain can call.
 */
export type PieceType =
  | "pawn"
  | "knight"
  | "bishop"
  | "rook"
  | "queen"
  | "king";

/**
 * Represents a single player in the game.
 */
export interface Player {
  id: string;
  name: string;
  team: "team1" | "team2" | null;
  role: PlayerRole | null;
}

/**
 * Represents one of the two teams in a game.
 */
export interface Team {
  name: string;
  brain: Player | null;
  hand: Player | null;
}

/**
 * Time control setting chosen in the lobby.
 * initial: seconds per player. increment: seconds added per move.
 */
export interface TimeControl {
  initial: number;
  increment: number;
}

/**
 * Live state of an in-progress chess game.
 */
export interface GameState {
  fen: string;
  /** Which team's turn it is. team1 = White, team2 = Black. */
  turn: "team1" | "team2";
  /** Whether the Brain is still picking or the Hand is ready to move. */
  phase: "brain_picking" | "hand_moving";
  /** The piece type the Brain called this turn. */
  calledPiece: PieceType | null;
  result: "ongoing" | "team1_wins" | "team2_wins" | "draw";
  /** SAN move list, e.g. ["e4", "e5", "Nf3", "Nc6"]. */
  moveHistory: string[];
  /** The squares of the most recent move for highlight purposes. */
  lastMove: { from: string; to: string } | null;
  /**
   * Milliseconds remaining for each team as of `turnStartedAt`.
   * Undefined when playing without a clock.
   */
  timeLeft?: { team1: number; team2: number };
  /**
   * Unix ms timestamp when the current team's turn began.
   * Clients subtract (Date.now() - turnStartedAt) from timeLeft[turn]
   * to get the live remaining time.
   */
  turnStartedAt?: number;
}

/**
 * Represents a single game room, containing all its state.
 */
export interface Room {
  id: string;
  status: "lobby" | "in-progress" | "finished";
  players: Player[];
  teams: {
    team1: Team;
    team2: Team;
  };
  gameState?: GameState;
  /** Time control selected in the lobby. Undefined = unlimited. */
  timeControl?: TimeControl;
}
