import { useState } from "react";
import type { FormEvent } from "react";
import logo from "@/assets/logo.svg";
import type { Room, Player } from "../../../../server/src/models/types";

interface HomeScreenProps {
  onJoinSuccess: (room: Room, player: Player) => void;
}

/**
 * @component HomeScreen
 * @description The main landing page for the application. It allows users to enter
 * their name and a room code to join or create a game. It also provides access
 * to a modal explaining the game rules.
 */
export default function HomeScreen({ onJoinSuccess }: HomeScreenProps) {
  // --- State Management ---
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  // --- Input Handlers ---

  /**
   * @handler handleNameChange
   * @description Updates the name state, ensuring it is uppercase and contains only letters and spaces.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Modified regex to allow spaces (\s) in addition to uppercase letters (A-Z)
    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, "");
    setName(value);
  };

  /**
   * @handler handleRoomCodeChange
   * @description Updates the room code state, ensuring it is uppercase and contains only letters.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    setRoomCode(value);
  };

  // --- API Logic ---

  /**
   * @function submit
   * @description Handles the form submission. It validates user input and sends a request
   * to the backend API to join a room.
   * @param {FormEvent} e - The form submission event.
   */
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim()) {
      setError("A name is required.");
      return;
    }
    if (!/^[A-Z]{4}$/.test(roomCode)) {
      setError("Room code must be 4 letters.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roomCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An unknown error occurred.");
      }

      console.log("Successfully joined room:", data);
      onJoinSuccess(data.room, data.player);
    } catch (err: any) {
      console.error("Failed to join room:", err);
      setError(err.message);
    }
  };

  // --- JSX Rendering ---
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <form
        onSubmit={submit}
        className="mx-4 w-full max-w-sm rounded-xl bg-white/80 p-10 backdrop-blur ring-1 ring-black/5 shadow-2xl dark:bg-gray-800/70 dark:ring-white/10 sm:p-12"
      >
        <img src={logo} alt="Hand & Brain Logo" className="mx-auto h-24 w-24" />
        <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-8">
          Hand and Brain Chess
        </h1>

        <div className="space-y-6">
          {/* Player Name Input Group */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 pl-2"
            >
              NAME
            </label>
            <input
              id="player-name"
              type="text"
              placeholder="ENTER YOUR NAME"
              value={name}
              onChange={handleNameChange}
              maxLength={20}
              className="w-full rounded-md border border-gray-300 bg-white/80 px-4 py-3 text-left font-semibold tracking-wider text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-700/80 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-sky-400"
              aria-required
            />
          </div>

          {/* Room Code Input Group */}
          <div>
            <label
              htmlFor="room-code"
              className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 pl-2"
            >
              ROOM CODE
            </label>
            <input
              id="room-code"
              type="text"
              placeholder="ENTER A 4-LETTER CODE"
              value={roomCode}
              onChange={handleRoomCodeChange}
              maxLength={4}
              className="w-full rounded-md border border-gray-300 bg-white/80 px-4 py-3 text-left font-semibold tracking-widest text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-700/80 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-sky-400"
              aria-required
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-sky-500 py-3 font-semibold text-white transition-colors hover:bg-sky-600 active:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-700 mt-6"
          >
            Play
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="mt-8 block w-full text-center text-xs text-sky-500 hover:underline"
        >
          How to play
        </button>

        <p className="mt-6 text-center text-xs text-black/50 dark:text-white/40">
          Built&nbsp;with&nbsp;❤️&nbsp;by&nbsp;Alex
        </p>
      </form>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 dark:ring-1 dark:ring-white/10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Hand &amp; Brain – Rules
            </h2>
            <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
              <li>Play in teams of two: one Hand, one Brain.</li>
              <li>On each turn the Brain names a piece type (e.g. Knight).</li>
              <li>The Hand must move one piece of that type—no hints.</li>
              <li>No talking about squares; standard chess rules apply.</li>
              <li>Alternate turns like regular chess; touch-move stands.</li>
              <li>First team to give checkmate wins.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full rounded-md bg-sky-500 py-2 text-white hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
