import HomeScreen from "./components/screens/HomeScreen.js";
import LobbyScreen from "./components/screens/LobbyScreen.js";
import GameScreen from "./components/screens/GameScreen.js";
import { useGame } from "./context/GameContext.js";

export default function App() {
  const { currentRoom, currentPlayer, setRoomAndPlayer } = useGame();

  if (currentRoom && currentPlayer) {
    if (currentRoom.status === "in-progress" || currentRoom.status === "finished") {
      return <GameScreen />;
    }
    return <LobbyScreen />;
  }

  return <HomeScreen onJoinSuccess={setRoomAndPlayer} />;
}
