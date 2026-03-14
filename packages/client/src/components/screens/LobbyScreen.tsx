import { useState } from "react";
import { useGame } from "../../context/GameContext.js";
import type { Player, TimeControl } from "@shared/types/game.js";

// ---------------------------------------------------------------------------
// Time format presets
// ---------------------------------------------------------------------------

const TIME_PRESETS: { label: string; value: TimeControl | null }[] = [
  { label: "∞",    value: null },
  { label: "1+0",  value: { initial: 60,  increment: 0 } },
  { label: "3+2",  value: { initial: 180, increment: 2 } },
  { label: "5+0",  value: { initial: 300, increment: 0 } },
  { label: "5+3",  value: { initial: 300, increment: 3 } },
  { label: "10+0", value: { initial: 600, increment: 0 } },
  { label: "10+5", value: { initial: 600, increment: 5 } },
];

// ---------------------------------------------------------------------------
// RoleSlot — one of the four team/role cells in the grid
// ---------------------------------------------------------------------------

interface RoleSlotProps {
  label: string;
  occupant: Player | null;
  currentPlayer: Player;
  team: "team1" | "team2";
  role: "brain" | "hand";
  onSelect: (team: "team1" | "team2", role: "brain" | "hand") => void;
}

function RoleSlot({
  label,
  occupant,
  currentPlayer,
  team,
  role,
  onSelect,
}: RoleSlotProps) {
  const isMe = occupant?.id === currentPlayer.id;
  const isTaken = occupant !== null && !isMe;
  const canSelect = !isTaken && !isMe;

  let containerClass =
    "flex flex-col items-center justify-center rounded-xl p-4 min-h-[88px] border-2 transition-all ";

  if (isMe) {
    containerClass += "border-sky-500 bg-sky-900/30 cursor-default";
  } else if (isTaken) {
    containerClass += "border-slate-600 bg-slate-800/50 cursor-not-allowed";
  } else {
    containerClass +=
      "border-dashed border-slate-600 bg-slate-800/30 cursor-pointer hover:border-sky-400 hover:bg-sky-900/20";
  }

  return (
    <button
      type="button"
      onClick={() => canSelect && onSelect(team, role)}
      disabled={isTaken || isMe}
      className={containerClass}
      title={
        isMe
          ? "Your current slot"
          : isTaken
          ? `Taken by ${occupant!.name}`
          : "Click to take this slot"
      }
    >
      <span
        className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
          isMe ? "text-sky-400" : "text-slate-500"
        }`}
      >
        {label}
      </span>

      {isMe ? (
        <span className="text-sm font-bold text-sky-300">
          {currentPlayer.name}
          <span className="ml-1 text-xs font-normal opacity-70">(you)</span>
        </span>
      ) : occupant ? (
        <span className="text-sm font-semibold text-slate-300">{occupant.name}</span>
      ) : (
        <span className="text-xs text-slate-500">
          {canSelect ? "Click to join" : "Empty"}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// LobbyScreen
// ---------------------------------------------------------------------------

export default function LobbyScreen() {
  const { currentRoom, currentPlayer, wsConnected, sendSelectRole, sendStartGame, leaveRoom } =
    useGame();

  const [copied, setCopied] = useState(false);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0); // 0 = unlimited

  if (!currentRoom || !currentPlayer) return null;

  const { teams, players } = currentRoom;

  const unassignedPlayers = players.filter((p) => p.team === null);
  const allSlotsFilled =
    teams.team1.brain !== null &&
    teams.team1.hand !== null &&
    teams.team2.brain !== null &&
    teams.team2.hand !== null;

  function handleCopy() {
    navigator.clipboard.writeText(currentRoom!.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSelect(team: "team1" | "team2", role: "brain" | "hand") {
    sendSelectRole(team, role);
  }

  function handleStart() {
    const preset = TIME_PRESETS[selectedPresetIdx];
    sendStartGame(preset.value ?? undefined);
  }

  const slotProps = (
    team: "team1" | "team2",
    role: "brain" | "hand",
    label: string
  ): RoleSlotProps => ({
    label,
    occupant: teams[team][role],
    currentPlayer,
    team,
    role,
    onSelect: handleSelect,
  });

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-10
      bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-slate-800/70 backdrop-blur-sm
        shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-white/[0.06] p-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-1">
              Room Code
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl font-bold tracking-widest text-white">
                {currentRoom.id}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
                title="Copy room code"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border ${
              wsConnected
                ? "bg-green-500/10 border-green-500/25 text-green-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            }`}
          >
            {wsConnected ? "● Connected" : "● Connecting…"}
          </span>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ⬜ White
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ⬛ Black
            </span>
          </div>
          <RoleSlot {...slotProps("team1", "brain", "Brain")} />
          <RoleSlot {...slotProps("team2", "brain", "Brain")} />
          <RoleSlot {...slotProps("team1", "hand", "Hand")} />
          <RoleSlot {...slotProps("team2", "hand", "Hand")} />
        </div>

        {/* Player count + unassigned list */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-200">{players.length}</span>
            {" / 4 players joined"}
            {players.length < 4 && (
              <span className="ml-2 text-xs text-slate-500">
                — share the room code to invite others
              </span>
            )}
          </p>
          {unassignedPlayers.length > 0 && (
            <ul className="space-y-1">
              {unassignedPlayers.map((p) => (
                <li key={p.id} className="text-xs text-slate-600">
                  {p.name}{p.id === currentPlayer.id ? " (you)" : ""} —{" "}
                  <span className="italic">choosing a role…</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Time format picker */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Time Control
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedPresetIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedPresetIdx === i
                    ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                    : "bg-slate-700/50 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {TIME_PRESETS[selectedPresetIdx].value && (
            <p className="text-[11px] text-slate-500">
              {TIME_PRESETS[selectedPresetIdx].value!.initial / 60} min per player
              {TIME_PRESETS[selectedPresetIdx].value!.increment > 0
                ? ` · +${TIME_PRESETS[selectedPresetIdx].value!.increment}s per move`
                : ""}
            </p>
          )}
        </div>

        {/* Start Game */}
        <button
          type="button"
          disabled={!allSlotsFilled}
          onClick={handleStart}
          className="w-full rounded-xl py-3 font-semibold text-white transition-colors
            bg-green-600 hover:bg-green-500 active:bg-green-700
            disabled:bg-slate-700 disabled:text-slate-500
            disabled:cursor-not-allowed"
          title={allSlotsFilled ? "Start the game!" : "All 4 slots must be filled"}
        >
          {allSlotsFilled
            ? "Start Game"
            : players.length < 4
            ? `Waiting for players… (${players.length}/4)`
            : "Waiting for everyone to pick a role"}
        </button>

        {/* Leave */}
        <button
          type="button"
          onClick={leaveRoom}
          className="block w-full text-center text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
