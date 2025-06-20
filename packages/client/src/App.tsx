import { useState } from "react";
import HomeScreen from "./components/screens/HomeScreen";
import LobbyScreen from "./components/screens/LobbyScreen";
import type { Room, Player } from "../../server/src/models/types"; // Assuming these types are accessible

/**
 * @component App
 * @description The root component of the client application, managing the
 * overall view based on the user's current state (e.g., in a lobby or on home screen).
 */
export default function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

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
  };

  // Conditionally render HomeScreen or LobbyScreen based on whether a room is joined
  if (currentRoom && currentPlayer) {
    return <LobbyScreen />; // TODO: Pass room and player data to LobbyScreen
  } else {
    return <HomeScreen onJoinSuccess={handleJoinSuccess} />;
  }
}
