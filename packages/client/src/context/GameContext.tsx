import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Room, Player, PieceType, TimeControl } from "@shared/types/game.js";
import type { ServerMessage } from "@shared/types/messages.js";
import { useSocket } from "../hooks/useSocket.js";

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface GameContextValue {
  currentRoom: Room | null;
  currentPlayer: Player | null;
  wsConnected: boolean;
  chatMessages: ChatMessage[];
  setRoomAndPlayer: (room: Room, player: Player) => void;
  leaveRoom: () => void;
  sendSelectRole: (team: "team1" | "team2", role: "brain" | "hand") => void;
  sendStartGame: (timeControl?: TimeControl) => void;
  sendBrainPick: (pieceType: PieceType) => void;
  sendHandMove: (from: string, to: string, promotion?: string) => void;
  sendChatMessage: (text: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(() => {
    try {
      const s = localStorage.getItem("currentRoom");
      return s ? (JSON.parse(s) as Room) : null;
    } catch {
      return null;
    }
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    try {
      const s = localStorage.getItem("currentPlayer");
      return s ? (JSON.parse(s) as Player) : null;
    } catch {
      return null;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (currentRoom) localStorage.setItem("currentRoom", JSON.stringify(currentRoom));
    else localStorage.removeItem("currentRoom");
  }, [currentRoom]);

  useEffect(() => {
    if (currentPlayer) localStorage.setItem("currentPlayer", JSON.stringify(currentPlayer));
    else localStorage.removeItem("currentPlayer");
  }, [currentPlayer]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "lobby_update": {
        const { room } = msg.payload;
        setCurrentRoom(room);
        setCurrentPlayer((prev) =>
          prev ? (room.players.find((p) => p.id === prev.id) ?? prev) : prev
        );
        break;
      }
      case "chat_broadcast":
        setChatMessages((prev) => [...prev, msg.payload]);
        break;
      case "error":
        console.error("Server WS error:", msg.payload.message);
        break;
    }
  }, []);

  const { send, connected: wsConnected } = useSocket(
    currentRoom?.id ?? null,
    currentPlayer?.id ?? null,
    handleMessage
  );

  const setRoomAndPlayer = useCallback((room: Room, player: Player) => {
    setCurrentRoom(room);
    setCurrentPlayer(player);
  }, []);

  const leaveRoom = useCallback(() => {
    send({ type: "leave_room" });
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setChatMessages([]);
  }, [send]);

  const sendSelectRole = useCallback(
    (team: "team1" | "team2", role: "brain" | "hand") => {
      send({ type: "select_role", payload: { team, role } });
    },
    [send]
  );

  const sendStartGame = useCallback(
    (timeControl?: TimeControl) =>
      send({ type: "start_game", payload: { timeControl } }),
    [send]
  );

  const sendBrainPick = useCallback(
    (pieceType: PieceType) => send({ type: "brain_pick", payload: { pieceType } }),
    [send]
  );

  const sendHandMove = useCallback(
    (from: string, to: string, promotion?: string) =>
      send({ type: "hand_move", payload: { from, to, promotion } }),
    [send]
  );

  const sendChatMessage = useCallback(
    (text: string) => send({ type: "chat_message", payload: { text } }),
    [send]
  );

  return (
    <GameContext.Provider
      value={{
        currentRoom,
        currentPlayer,
        wsConnected,
        chatMessages,
        setRoomAndPlayer,
        leaveRoom,
        sendSelectRole,
        sendStartGame,
        sendBrainPick,
        sendHandMove,
        sendChatMessage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
