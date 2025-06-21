import { useState, useEffect } from "react"; // Import useEffect
import HomeScreen from "./components/screens/HomeScreen.js";
import LobbyScreen from "./components/screens/LobbyScreen.js";
import type { Room, Player } from "@shared/types/game.js";

/**
 * @component App
 * @description The root component of the client application, managing the
 * overall view based on the user's current state (e.g., in a lobby or on home screen).
 */
export default function App() {
  // Initialize state from localStorage or null
  const [currentRoom, setCurrentRoom] = useState<Room | null>(() => {
    try {
      const storedRoom = localStorage.getItem("currentRoom");
      return storedRoom ? JSON.parse(storedRoom) : null;
    } catch (error) {
      console.error("Failed to parse stored room from localStorage:", error);
      return null;
    }
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    try {
      const storedPlayer = localStorage.getItem("currentPlayer");
      return storedPlayer ? JSON.parse(storedPlayer) : null;
    } catch (error) {
      console.error("Failed to parse stored player from localStorage:", error);
      return null;
    }
  });

  /**
   * @function handleJoinSuccess
   * @description Callback function passed to HomeScreen to update the room and player
   * state upon successful room join.
   * @param {Room} room - The room object returned from the join API.
   * @param {Player} player - The player object returned from the join API.
   */
  const handleJoinSuccess = (room: Room, player: Player) => {
    setCurrentRoom(room);
    setCurrentPlayer(player);
    // State will be persisted by the useEffect hook below
  };

  // Effect to persist currentRoom and currentPlayer to localStorage
  useEffect(() => {
    if (currentRoom) {
      localStorage.setItem("currentRoom", JSON.stringify(currentRoom));
    } else {
      localStorage.removeItem("currentRoom");
    }
  }, [currentRoom]);

  useEffect(() => {
    if (currentPlayer) {
      localStorage.setItem("currentPlayer", JSON.stringify(currentPlayer));
    } else {
      localStorage.removeItem("currentPlayer");
    }
  }, [currentPlayer]);

  if (currentRoom && currentPlayer) {
    return <LobbyScreen room={currentRoom} player={currentPlayer} />;
  } else {
    return <HomeScreen onJoinSuccess={handleJoinSuccess} />;
  }
}
