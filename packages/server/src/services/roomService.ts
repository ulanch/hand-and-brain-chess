import { Chess } from "chess.js";
import type { Square } from "chess.js";
import { Room, Player, PlayerRole, PieceType, GameState, TimeControl } from "@shared/types/game.js";
import { randomUUID } from "crypto";

/** Maps our PieceType names to chess.js single-char symbols. */
const PIECE_SYMBOL: Record<PieceType, string> = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
};

class RoomService {
  private rooms: Map<string, Room>;
  /** Parallel map of live Chess instances, keyed by roomId. */
  private games: Map<string, Chess>;

  constructor() {
    this.rooms = new Map();
    this.games = new Map();
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.id === playerId)) return room;
    }
    return undefined;
  }

  public createNewRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room with ID ${roomId} already exists.`);
    }
    const room: Room = {
      id: roomId,
      status: "lobby",
      players: [],
      teams: {
        team1: { name: "Team 1", brain: null, hand: null },
        team2: { name: "Team 2", brain: null, hand: null },
      },
    };
    this.rooms.set(roomId, room);
    console.log(`Created new room: ${roomId}`);
    return room;
  }

  public addPlayer(roomId: string, playerName: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found.`);
    if (room.players.length >= 4) return null;

    const newPlayer: Player = {
      id: randomUUID(),
      name: playerName,
      team: null,
      role: null,
    };
    room.players.push(newPlayer);
    console.log(`Player ${playerName} (${newPlayer.id}) added to room ${roomId}.`);
    return newPlayer;
  }

  public removePlayer(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const idx = room.players.findIndex((p) => p.id === playerId);
      if (idx === -1) continue;

      const player = room.players[idx];
      if (player.team && player.role) {
        room.teams[player.team][player.role] = null;
      }
      room.players.splice(idx, 1);
      console.log(`Player ${player.name} (${playerId}) removed from room ${room.id}.`);

      if (room.players.length === 0) {
        this.rooms.delete(room.id);
        this.games.delete(room.id);
        console.log(`Room ${room.id} deleted (empty).`);
        return undefined;
      }
      return room;
    }
    return undefined;
  }

  public selectRole(
    roomId: string,
    playerId: string,
    team: "team1" | "team2",
    role: PlayerRole
  ): Room | string {
    const room = this.rooms.get(roomId);
    if (!room) return `Room ${roomId} not found.`;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return `Player ${playerId} not in room ${roomId}.`;

    const occupant = room.teams[team][role];
    if (occupant && occupant.id !== playerId) return `Slot ${team}/${role} is already taken.`;

    if (player.team && player.role) {
      room.teams[player.team][player.role] = null;
    }
    room.teams[team][role] = player;
    player.team = team;
    player.role = role;

    console.log(`Player ${player.name} selected ${team}/${role} in room ${roomId}.`);
    return room;
  }

  // ---------------------------------------------------------------------------
  // Game lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Starts the game. Validates all 4 slots are filled, initialises a Chess
   * instance, and sets the room status to "in-progress".
   */
  public startGame(roomId: string, timeControl?: TimeControl): Room | string {
    const room = this.rooms.get(roomId);
    if (!room) return `Room ${roomId} not found.`;
    if (room.status !== "lobby") return "Game has already started.";

    const { team1, team2 } = room.teams;
    if (!team1.brain || !team1.hand || !team2.brain || !team2.hand) {
      return "All 4 slots must be filled before starting.";
    }

    const chess = new Chess();
    this.games.set(roomId, chess);

    room.status = "in-progress";
    if (timeControl) room.timeControl = timeControl;

    const initialMs = timeControl ? timeControl.initial * 1000 : undefined;
    const now = Date.now();

    room.gameState = {
      fen: chess.fen(),
      turn: "team1",
      phase: "brain_picking",
      calledPiece: null,
      result: "ongoing",
      moveHistory: [],
      lastMove: null,
      ...(initialMs !== undefined && {
        timeLeft: { team1: initialMs, team2: initialMs },
        turnStartedAt: now,
      }),
    };

    console.log(
      `Game started in room ${roomId}` +
      (timeControl ? ` with time control ${timeControl.initial}+${timeControl.increment}` : " (unlimited)") +
      "."
    );
    return room;
  }

  /**
   * The Brain calls a piece type. Validates it's their turn and that the piece
   * type has at least one legal move.
   */
  public brainPick(
    roomId: string,
    playerId: string,
    pieceType: PieceType
  ): Room | string {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return "Game not found.";
    const chess = this.games.get(roomId);
    if (!chess) return "Game not found.";

    const { turn, phase } = room.gameState;
    if (phase !== "brain_picking") return "It is not the brain-picking phase.";

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.team !== turn || player.role !== "brain") {
      return "It is not your turn to pick.";
    }

    const symbol = PIECE_SYMBOL[pieceType];
    const hasLegalMove = chess
      .moves({ verbose: true })
      .some((m) => m.piece === symbol);

    if (!hasLegalMove) {
      return `No legal moves for ${pieceType}. Call a different piece.`;
    }

    room.gameState = { ...room.gameState, phase: "hand_moving", calledPiece: pieceType };
    console.log(`Brain ${player.name} called ${pieceType} in room ${roomId}.`);
    return room;
  }

  /**
   * The Hand makes a move. Validates it's their turn, the piece matches the
   * called type, and the move is legal. Updates FEN, move history, last move,
   * clocks, and checks for game-over.
   */
  public handMove(
    roomId: string,
    playerId: string,
    from: string,
    to: string,
    promotion?: string
  ): Room | string {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return "Game not found.";
    const chess = this.games.get(roomId);
    if (!chess) return "Game not found.";

    const { turn, phase, calledPiece } = room.gameState;
    if (phase !== "hand_moving") return "It is not the hand-moving phase.";

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.team !== turn || player.role !== "hand") {
      return "It is not your turn to move.";
    }

    // Ensure the moved piece matches the called type
    const pieceOnSquare = chess.get(from as Square);
    if (!pieceOnSquare || pieceOnSquare.type !== PIECE_SYMBOL[calledPiece!]) {
      return `You must move a ${calledPiece}.`;
    }

    let moveResult;
    try {
      moveResult = chess.move({ from, to, promotion: promotion ?? "q" });
    } catch {
      return "Illegal move.";
    }
    if (!moveResult) return "Illegal move.";

    // Determine result
    let result: GameState["result"] = "ongoing";
    if (chess.isCheckmate()) {
      result = turn === "team1" ? "team1_wins" : "team2_wins";
      room.status = "finished";
    } else if (chess.isDraw()) {
      result = "draw";
      room.status = "finished";
    }

    // ── Clock update ─────────────────────────────────────────────────────────
    const now = Date.now();
    let newTimeLeft = room.gameState.timeLeft;
    let newTurnStartedAt: number | undefined = room.gameState.turnStartedAt;

    if (
      room.timeControl &&
      newTimeLeft !== undefined &&
      newTurnStartedAt !== undefined
    ) {
      const elapsed = now - newTurnStartedAt;
      const remaining = Math.max(0, newTimeLeft[turn] - elapsed);
      const withIncrement =
        result === "ongoing"
          ? remaining + room.timeControl.increment * 1000
          : remaining;

      newTimeLeft = { ...newTimeLeft, [turn]: withIncrement };
      newTurnStartedAt = now;

      // Flag: team ran out of time before increment
      if (remaining <= 0 && result === "ongoing") {
        result = turn === "team1" ? "team2_wins" : "team1_wins";
        room.status = "finished";
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const nextTurn: "team1" | "team2" = turn === "team1" ? "team2" : "team1";

    room.gameState = {
      fen: chess.fen(),
      turn: result === "ongoing" ? nextTurn : turn,
      phase: "brain_picking",
      calledPiece: null,
      result,
      moveHistory: chess.history(),
      lastMove: { from, to },
      ...(newTimeLeft !== undefined && {
        timeLeft: newTimeLeft,
        turnStartedAt: newTurnStartedAt,
      }),
    };

    console.log(
      `Hand ${player.name} moved ${from}→${to} in room ${roomId}. Result: ${result}`
    );
    return room;
  }
}

export const roomService = new RoomService();
