import type { PieceType, Room } from "./game.js";

// ---------------------------------------------------------------------------
// Client → Server messages
// ---------------------------------------------------------------------------

export interface JoinRoomMessage {
  type: "join_room";
  payload: { roomId: string; playerId: string };
}

export interface SelectRoleMessage {
  type: "select_role";
  payload: { team: "team1" | "team2"; role: "brain" | "hand" };
}

export interface LeaveRoomMessage {
  type: "leave_room";
}

/** Any player (usually the host) may send this once all 4 slots are filled. */
export interface StartGameMessage {
  type: "start_game";
  payload?: { timeControl?: { initial: number; increment: number } };
}

/** Sent by the Brain on their team's turn to call a piece type. */
export interface BrainPickMessage {
  type: "brain_pick";
  payload: { pieceType: PieceType };
}

/** Sent by the Hand after the Brain has called a piece type. */
export interface HandMoveMessage {
  type: "hand_move";
  payload: { from: string; to: string; promotion?: string };
}

/** Sent by any player to chat with everyone else in the room. */
export interface SendChatMessage {
  type: "chat_message";
  payload: { text: string };
}

export type ClientMessage =
  | JoinRoomMessage
  | SelectRoleMessage
  | LeaveRoomMessage
  | StartGameMessage
  | BrainPickMessage
  | HandMoveMessage
  | SendChatMessage;

// ---------------------------------------------------------------------------
// Server → Client messages
// ---------------------------------------------------------------------------

/**
 * Broadcast whenever room state changes — covers both lobby and in-game updates.
 */
export interface LobbyUpdateMessage {
  type: "lobby_update";
  payload: { room: Room };
}

export interface ErrorMessage {
  type: "error";
  payload: { message: string };
}

/** Broadcast to all players in a room when someone sends a chat message. */
export interface ChatBroadcastMessage {
  type: "chat_broadcast";
  payload: { playerId: string; playerName: string; text: string; timestamp: number };
}

export type ServerMessage = LobbyUpdateMessage | ErrorMessage | ChatBroadcastMessage;
