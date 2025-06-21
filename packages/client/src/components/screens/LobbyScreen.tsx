import type { Room, Player } from "@shared/types/game.ts";

interface LobbyScreenProps {
  room: Room;
  player: Player;
}

/**
 * @component LobbyScreen
 * @description Displays the game lobby where players can see room information,
 * other players, and potentially assign roles before starting the game.
 */
export default function LobbyScreen({ room, player }: LobbyScreenProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-4xl font-bold mb-4">Lobby Screen</h1>
      <p className="text-lg">
        Welcome, {player.name}! You are in room:{" "}
        <span className="font-semibold">{room.id}</span>
      </p>
      <p className="text-lg mt-2">Waiting for other players...</p>
      {/* TODO: Add more lobby specific UI here (e.g., player list, start game button) */}
    </div>
  );
}
