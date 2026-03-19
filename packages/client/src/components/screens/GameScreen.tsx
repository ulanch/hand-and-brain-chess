import { useMemo, useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useGame } from "../../context/GameContext.js";
import type { PieceType, Player, Team } from "@shared/types/game.js";
import type {
  PieceHandlerArgs,
  PieceDropHandlerArgs,
  SquareHandlerArgs,
} from "react-chessboard";

const PROMOTION_PIECES: { label: string; symbol: string; value: string }[] = [
  { label: "Queen",  symbol: "♛", value: "q" },
  { label: "Rook",   symbol: "♜", value: "r" },
  { label: "Bishop", symbol: "♝", value: "b" },
  { label: "Knight", symbol: "♞", value: "n" },
];

const PIECE_LABELS: { type: PieceType; label: string; symbol: string }[] = [
  { type: "pawn",   label: "Pawn",   symbol: "♟" },
  { type: "knight", label: "Knight", symbol: "♞" },
  { type: "bishop", label: "Bishop", symbol: "♝" },
  { type: "rook",   label: "Rook",   symbol: "♜" },
  { type: "queen",  label: "Queen",  symbol: "♛" },
  { type: "king",   label: "King",   symbol: "♚" },
];

const PIECE_SYMBOL: Record<PieceType, string> = {
  pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k",
};

function boardPieceSymbol(p: string) { return p[1].toLowerCase(); }

// ---------------------------------------------------------------------------
// Clock — live countdown display
// ---------------------------------------------------------------------------

function Clock({
  timeLeftMs,
  turnStartedAt,
  isActive,
}: {
  timeLeftMs: number;
  turnStartedAt: number;
  isActive: boolean;
}) {
  const [displayMs, setDisplayMs] = useState(timeLeftMs);

  useEffect(() => {
    if (!isActive) {
      setDisplayMs(timeLeftMs);
      return;
    }
    // Sync immediately then tick every 100ms
    const update = () => setDisplayMs(Math.max(0, timeLeftMs - (Date.now() - turnStartedAt)));
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [timeLeftMs, turnStartedAt, isActive]);

  const totalSeconds = Math.ceil(displayMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const isLow = displayMs < 15_000;

  return (
    <span
      className={`font-mono text-base font-bold tabular-nums tracking-tight transition-colors ${
        isLow ? "text-red-400" : "text-slate-200"
      }`}
    >
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// RoleTag — one player cell inside a PlayerStrip
// ---------------------------------------------------------------------------

function RoleTag({
  player,
  role,
  active,
  dimmed,
  currentPlayerId,
}: {
  player: Player | null;
  role: "brain" | "hand";
  active: boolean;
  dimmed: boolean;
  currentPlayerId: string;
}) {
  const isMe = player?.id === currentPlayerId;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 min-w-0 ${
        active ? "bg-sky-500/15 border-sky-500/25" : "border-transparent"
      }`}
    >
      <span
        className={`shrink-0 text-[10px] font-bold tracking-[0.14em] uppercase ${
          active ? "text-sky-400" : "text-slate-600"
        }`}
      >
        {role}
      </span>
      {active && (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.85)]" />
      )}
      <span
        className={`text-sm truncate ${
          active ? "text-white font-semibold" : dimmed ? "text-slate-500" : "text-slate-300"
        }`}
      >
        {player?.name ?? <span className="italic text-slate-600">—</span>}
      </span>
      {isMe && (
        <span className="shrink-0 text-[10px] font-semibold text-sky-500 tracking-wide">you</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlayerStrip — team row shown above/below the board, with optional clock
// ---------------------------------------------------------------------------

function PlayerStrip({
  team,
  teamKey,
  turn,
  phase,
  result,
  currentPlayerId,
  timeLeft,
  turnStartedAt,
}: {
  team: Team;
  teamKey: "team1" | "team2";
  turn: "team1" | "team2";
  phase: "brain_picking" | "hand_moving";
  result: string;
  currentPlayerId: string;
  timeLeft?: { team1: number; team2: number };
  turnStartedAt?: number;
}) {
  const isWhite      = teamKey === "team1";
  const isActiveTurn = result === "ongoing" && turn === teamKey;
  const brainActive  = isActiveTurn && phase === "brain_picking";
  const handActive   = isActiveTurn && phase === "hand_moving";
  const dimmed       = !isActiveTurn;

  return (
    <div
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 ${
        isActiveTurn
          ? "bg-white/[0.06] border-slate-600/50"
          : "bg-slate-800/25 border-slate-700/25"
      }`}
    >
      {/* Color dot + label */}
      <div className="flex items-center gap-2 shrink-0 w-16">
        <span
          className={`w-3 h-3 rounded-full ring-1 shrink-0 ${
            isWhite ? "bg-white ring-slate-300" : "bg-slate-950 ring-slate-500"
          }`}
        />
        <span
          className={`text-[11px] font-bold tracking-wide uppercase ${
            isActiveTurn ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {isWhite ? "White" : "Black"}
        </span>
      </div>

      <div className="h-5 w-px bg-slate-700/60 shrink-0" />

      <RoleTag player={team.brain} role="brain" active={brainActive} dimmed={dimmed} currentPlayerId={currentPlayerId} />

      <div className="h-4 w-px bg-slate-700/40 shrink-0" />

      <RoleTag player={team.hand} role="hand" active={handActive} dimmed={dimmed} currentPlayerId={currentPlayerId} />

      {/* Clock + phase label pushed right */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {isActiveTurn && result === "ongoing" && (
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-sky-400">
            {phase === "brain_picking" ? "calling" : "moving"}
          </span>
        )}
        {timeLeft !== undefined && turnStartedAt !== undefined && (
          <Clock
            timeLeftMs={timeLeft[teamKey]}
            turnStartedAt={turnStartedAt}
            isActive={isActiveTurn && result === "ongoing"}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MoveHistory — scrollable move list in the sidebar
// ---------------------------------------------------------------------------

function MoveHistory({ moves }: { moves: string[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves]);

  // Pair moves: [[w1, b1], [w2, b2], ...]
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="overflow-y-auto px-4 py-3 space-y-0.5 min-h-0">
      {pairs.length === 0 ? (
        <p className="text-xs text-center text-slate-600 mt-4 select-none">No moves yet</p>
      ) : (
        pairs.map(([w, b], i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="shrink-0 w-6 text-right text-[11px] text-slate-600 font-mono">
              {i + 1}.
            </span>
            <span className="w-16 font-mono text-slate-300">{w}</span>
            <span className="font-mono text-slate-500">{b ?? ""}</span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

function ChatPanel() {
  const { currentPlayer, chatMessages, sendChatMessage } = useGame();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendChatMessage(text);
    setInput("");
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {chatMessages.length === 0 && (
          <p className="text-xs text-center text-slate-600 mt-4 select-none">
            No messages yet — say hi!
          </p>
        )}
        {chatMessages.map((msg, i) => {
          const isMe = msg.playerId === currentPlayer?.id;
          return (
            <div key={i} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[11px] font-medium text-slate-500 px-1">
                {isMe ? "You" : msg.playerName}
              </span>
              <span
                className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-snug break-words ${
                  isMe
                    ? "bg-sky-600 text-white rounded-tr-[4px]"
                    : "bg-slate-700 text-slate-100 rounded-tl-[4px]"
                }`}
              >
                {msg.text}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 px-4 pb-4 pt-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          placeholder="Message…"
          className="flex-1 rounded-xl border border-slate-600 bg-slate-700/60 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↑
        </button>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// PromotionModal — lets the Hand player choose a promotion piece
// ---------------------------------------------------------------------------

function PromotionModal({ onChoose }: { onChoose: (piece: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div
        className="rounded-2xl border border-white/[0.08] bg-slate-800/95
          shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-6 flex flex-col gap-4 w-72"
      >
        <p className="text-center text-[11px] font-bold tracking-[0.18em] uppercase text-sky-400">
          Promote pawn
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PROMOTION_PIECES.map(({ label, symbol, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChoose(value)}
              className="flex flex-col items-center justify-center rounded-xl h-24 gap-1
                border-2 border-slate-600 bg-slate-700/80 text-slate-200 font-semibold
                hover:border-sky-500 hover:bg-sky-600 hover:text-white
                hover:shadow-lg hover:shadow-sky-500/20
                active:scale-95 cursor-pointer transition-all duration-150"
            >
              <span className="text-4xl leading-none">{symbol}</span>
              <span className="text-[12px] tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameScreen
// ---------------------------------------------------------------------------

export default function GameScreen() {
  const {
    currentRoom,
    currentPlayer,
    sendBrainPick,
    sendHandMove,
    leaveRoom,
    wsConnected,
  } = useGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  if (!currentRoom || !currentPlayer || !currentRoom.gameState) return null;

  const { gameState, teams } = currentRoom;
  const { fen, turn, phase, calledPiece, result, moveHistory, lastMove, timeLeft, turnStartedAt } = gameState;

  const myTeam  = currentPlayer.team!;
  const myRole  = currentPlayer.role;
  const oppTeam = myTeam === "team1" ? "team2" : "team1";

  const isMyTeamsTurn = myTeam === turn;
  const iAmBrain      = myRole === "brain";
  const iAmHand       = myRole === "hand";

  const boardOrientation = myTeam === "team2" ? "black" : "white";
  const currentColor     = turn === "team1" ? "w" : "b";
  const isHandTurn       = isMyTeamsTurn && iAmHand  && phase === "hand_moving"   && result === "ongoing";
  const isBrainActive    = isMyTeamsTurn && iAmBrain && phase === "brain_picking" && result === "ongoing";

  useEffect(() => { setSelectedSquare(null); }, [fen, phase]);

  // Square highlights
  const squareStyles = useMemo((): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};

    // Last move: subtle amber tint
    if (lastMove) {
      styles[lastMove.from] = { background: "rgba(205,170,0,0.3)" };
      styles[lastMove.to]   = { background: "rgba(205,170,0,0.3)" };
    }

    if (phase !== "hand_moving" || !calledPiece) return styles;

    const chess  = new Chess(fen);
    const symbol = PIECE_SYMBOL[calledPiece];

    // Highlight all pieces of the called type
    chess.board().forEach((row) =>
      row.forEach((p) => {
        if (p && p.type === symbol && p.color === currentColor)
          styles[p.square] = { background: "rgba(251,191,36,0.45)" };
      })
    );

    const sq = selectedSquare as Parameters<typeof chess.moves>[0]["square"];
    const moves = sq
      ? chess.moves({ verbose: true, square: sq }).filter((m) => m.piece === symbol)
      : chess.moves({ verbose: true }).filter((m) => m.piece === symbol);

    if (selectedSquare)
      styles[selectedSquare] = { background: "rgba(99,149,255,0.7)" };

    moves.forEach((m) => {
      styles[m.to] = { background: "rgba(34,197,94,0.45)", borderRadius: "50%" };
    });

    return styles;
  }, [fen, phase, calledPiece, currentColor, selectedSquare, lastMove]);

  // Available piece types for Brain
  const movablePieces = useMemo((): Set<PieceType> => {
    if (phase !== "brain_picking") return new Set();
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true }).filter((m) => m.color === currentColor);
    const out   = new Set<PieceType>();
    for (const [pt, sym] of Object.entries(PIECE_SYMBOL) as [PieceType, string][])
      if (moves.some((m) => m.piece === sym)) out.add(pt);
    return out;
  }, [fen, phase, currentColor]);

  // Move helpers
  function tryMove(from: string, to: string) {
    if (!calledPiece) return;
    const isPromotion = calledPiece === "pawn" &&
      ((turn === "team1" && to[1] === "8") || (turn === "team2" && to[1] === "1"));
    setSelectedSquare(null);
    if (isPromotion) {
      setPromotionPending({ from, to });
      return;
    }
    sendHandMove(from, to);
  }

  function handlePromotionChoice(piece: string) {
    if (!promotionPending) return;
    sendHandMove(promotionPending.from, promotionPending.to, piece);
    setPromotionPending(null);
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!isHandTurn || !calledPiece) return;
    const sym = PIECE_SYMBOL[calledPiece];
    const isValidPiece = piece !== null && piece.pieceType[0] === currentColor && boardPieceSymbol(piece.pieceType) === sym;

    if (selectedSquare) {
      if (isValidPiece && square !== selectedSquare) { setSelectedSquare(square); return; }
      const chessInst = new Chess(fen);
      const sq2 = selectedSquare as Parameters<typeof chessInst.moves>[0]["square"];
      const legal = chessInst
        .moves({ verbose: true, square: sq2 })
        .some((m) => m.piece === sym && m.to === square);
      if (legal) { tryMove(selectedSquare, square); return; }
      setSelectedSquare(null);
    } else {
      if (isValidPiece) setSelectedSquare(square);
    }
  }

  function canDragPiece({ piece }: PieceHandlerArgs) {
    return isHandTurn && !!calledPiece &&
      piece.pieceType[0] === currentColor &&
      boardPieceSymbol(piece.pieceType) === PIECE_SYMBOL[calledPiece];
  }

  function onPieceDrop({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!isHandTurn || !calledPiece || !targetSquare) return false;
    if (boardPieceSymbol(piece.pieceType) !== PIECE_SYMBOL[calledPiece]) return false;
    const chess2 = new Chess(fen);
    const src = sourceSquare as Parameters<typeof chess2.moves>[0]["square"];
    const legal = chess2
      .moves({ verbose: true, square: src })
      .some((m) => m.piece === PIECE_SYMBOL[calledPiece] && m.to === targetSquare);
    if (!legal) return false;
    tryMove(sourceSquare, targetSquare);
    return true;
  }

  // Status text
  function statusMessage() {
    if (result !== "ongoing") {
      if (result === "draw") return "It's a draw!";
      const w = result === "team1_wins" ? teams.team1 : teams.team2;
      const mine = (result === "team1_wins" && myTeam === "team1") || (result === "team2_wins" && myTeam === "team2");
      return mine ? `🎉 ${w.name} wins — you won!` : `${w.name} wins. Better luck next time.`;
    }
    const at = turn === "team1" ? teams.team1 : teams.team2;
    if (!isMyTeamsTurn)
      return phase === "brain_picking"
        ? `Waiting for ${at.brain?.name ?? "Brain"} to call…`
        : `Waiting for ${at.hand?.name ?? "Hand"} to move the ${calledPiece}…`;
    if (iAmBrain && phase === "brain_picking") return "Your turn — call a piece for your Hand.";
    if (iAmBrain && phase === "hand_moving")   return `You called ${calledPiece}. Waiting for your Hand…`;
    if (iAmHand  && phase === "brain_picking") return "Waiting for your Brain to call a piece…";
    if (iAmHand  && phase === "hand_moving")   return `Move a ${calledPiece}!`;
    return "";
  }

  const statusColor =
    result !== "ongoing"  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20" :
    isMyTeamsTurn         ? "bg-sky-500/15 text-sky-300 border border-sky-500/20" :
                            "bg-slate-700/50 text-slate-400 border border-slate-600/30";

  const stripProps = { turn, phase, result, currentPlayerId: currentPlayer.id, timeLeft, turnStartedAt };

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 55% 45%, #1e293b 0%, #0f172a 55%, #020617 100%)",
      }}
    >
      {/* ── Promotion modal ───────────────────────────────────────────────── */}
      {promotionPending && <PromotionModal onChoose={handlePromotionChoice} />}

      {/* ── Disconnection banner ─────────────────────────────────────────── */}
      {!wsConnected && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2
          bg-red-950/95 backdrop-blur-sm border-b border-red-800/50
          px-4 py-2.5 text-sm font-medium text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          Connection lost — reconnecting…
        </div>
      )}

      {/* ── Left: board column ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 lg:pr-4">
        <div
          className="w-full max-w-2xl flex flex-col gap-4"
          style={{ maxWidth: "min(42rem, calc(100vh - 216px))" }}
        >
          {/* Opponent team strip */}
          <PlayerStrip team={teams[oppTeam]} teamKey={oppTeam} {...stripProps} />

          {/* Board — explicit boardWidth keeps it a perfect square */}
          <Chessboard
            options={{
              position: fen,
              boardOrientation,
              squareStyles,
              allowDragging: isHandTurn,
              canDragPiece,
              onPieceDrop,
              onSquareClick,
            }}
          />

          {/* My team strip */}
          <PlayerStrip team={teams[myTeam]} teamKey={myTeam} {...stripProps} />

          {/* Called piece — mobile only */}
          {phase === "hand_moving" && calledPiece && (
            <div className="lg:hidden w-full rounded-xl bg-slate-800/80 border border-slate-700 px-6 py-3 text-center">
              <p className="font-mono text-[10px] tracking-widest text-slate-500 uppercase mb-1">Called piece</p>
              <p className="text-lg font-bold text-white capitalize">{calledPiece}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: floating sidebar ──────────────────────────────────────── */}
      {/*
          p-5 (20px) on all four sides — the card's border-radius and margin
          together give it the "floating component" feel from the spec.
      */}
      <div className="p-5 flex flex-col">
        <div
          className="flex-1 flex flex-col w-full lg:w-80 xl:w-[22rem] rounded-2xl overflow-hidden
            bg-slate-800/70 backdrop-blur-sm
            shadow-[0_8px_40px_rgba(0,0,0,0.55)]
            border border-white/[0.06]"
        >
          {/* Sidebar header — status + leave */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col gap-3 shrink-0">
            {/* Top row: room code + leave */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.16em] text-slate-600 uppercase">
                {currentRoom.id}
              </span>
              <button
                onClick={leaveRoom}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold
                  text-slate-500 hover:text-red-400
                  border border-transparent hover:border-red-500/25 hover:bg-red-500/10
                  transition-colors"
              >
                Leave
              </button>
            </div>
            {/* Status banner */}
            <div className={`rounded-lg px-4 py-2.5 text-xs font-medium text-center transition-colors ${statusColor}`}>
              {statusMessage()}
            </div>
          </div>

          {/* ── 1. Brain piece picker ────────────────────────────────────── */}
          <div
            className={`shrink-0 border-b border-white/[0.06] p-4 space-y-3
              transition-opacity duration-300
              ${isBrainActive ? "opacity-100" : "opacity-20 pointer-events-none select-none"}`}
          >
            <p
              className={`text-[11px] font-semibold tracking-[0.15em] uppercase text-center
                transition-colors ${isBrainActive ? "text-sky-400" : "text-slate-500"}`}
            >
              {isBrainActive ? "Call a piece" : "Piece caller"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PIECE_LABELS.map(({ type, label, symbol }) => {
                const available = isBrainActive && movablePieces.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={!available}
                    onClick={() => sendBrainPick(type)}
                    className={`
                      flex flex-col items-center justify-center rounded-xl h-20 gap-1
                      border-2 font-semibold transition-all duration-150
                      ${available
                        ? `border-slate-600 bg-slate-700/80 text-slate-200
                           hover:border-sky-500 hover:bg-sky-600 hover:text-white
                           hover:shadow-lg hover:shadow-sky-500/20
                           active:scale-95 cursor-pointer`
                        : "border-slate-700/50 bg-slate-800/30 text-slate-600 cursor-not-allowed"
                      }
                    `}
                  >
                    <span className="text-3xl leading-none">{symbol}</span>
                    <span className="text-[11px] tracking-wide">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Move history ──────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-white/[0.06] flex flex-col" style={{ maxHeight: "11rem" }}>
            <div className="px-5 py-2.5 shrink-0">
              <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-600">
                Moves
              </h2>
            </div>
            <MoveHistory moves={moveHistory} />
          </div>

          {/* ── 3. Chat ──────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 py-2.5 shrink-0 border-b border-white/[0.04]">
              <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-600">
                Chat
              </h2>
            </div>
            <ChatPanel />
          </div>

        </div>
      </div>

    </div>
  );
}
