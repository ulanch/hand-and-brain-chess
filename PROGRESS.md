# Hand and Brain Chess — Progress

## Done

### Infrastructure
- Monorepo setup (pnpm workspaces, shared types package)
- TypeScript strict mode across all packages
- ESLint + Husky pre-commit hook (lint-staged)
- Vite dev server with `/api` proxy to Express
- Playwright installed, Storybook + Vitest configured with separate unit/browser projects
- Storybook default scaffold removed (`src/stories/`)

### Shared Types (`packages/shared/types/`)
- `Player` — id, name, team, role
- `Team` — brain/hand slots
- `Room` — id, status, players, teams
- `ClientMessage` — `join_room`, `select_role`, `leave_room`
- `ServerMessage` — `lobby_update`, `error`

### Server (`packages/server/`)
- Express REST API
  - `POST /api/rooms/create` — generates unique 4-letter code, creates room, adds first player
  - `POST /api/rooms/join` — validates code, adds player, broadcasts `lobby_update` to connected tabs immediately
- WebSocket server with structured JSON message protocol
  - `join_room` — registers connection, broadcasts current lobby state to all in room
  - `select_role` — assigns team/role slot, broadcasts updated room
  - `leave_room` — explicitly removes player from room, broadcasts update
  - `close` — unregisters socket only; player stays in room (handles refresh/StrictMode without data loss)
- `connectionRegistry.ts` — shared module for WS connection tracking and `broadcastToRoom`; imported by both WS handlers and REST controllers
- `RoomService` — in-memory room store with `createNewRoom`, `addPlayer`, `removePlayer`, `selectRole`, `getRoomByPlayerId`

### Client (`packages/client/`)
- `HomeScreen` — create/join room flow, name + room code inputs, validation, "How to Play" modal, localStorage persistence
- `useSocket` — manages WS lifecycle, sends `join_room` on connect, stable `onMessage` ref to avoid reconnects
- `GameContext` — owns all game state, processes `lobby_update` messages, exposes `setRoomAndPlayer`, `leaveRoom`, `sendSelectRole`
- `LobbyScreen` — full lobby UI:
  - Room code display with copy-to-clipboard
  - Connection status badge
  - 2×2 team grid (⬜ White / ⬛ Black × Brain / Hand) with interactive role slots
  - Unassigned player list
  - Start Game button (enabled when all 4 slots filled)
  - Leave Room button (sends `leave_room` WS message before clearing state)
- `GameScreen` — full in-game UI:
  - Brain picks a piece type; Hand sees highlighted legal moves and makes the move
  - Move sync via WebSocket (`brain_pick`, `hand_move` message types)
  - Clock display with low-time warning
  - Win/loss/draw detection
- 15 passing unit tests (HomeScreen)

---

## Needs Work

### Configuration
- **Hardcoded URLs** — `localhost:3000` appears in `useSocket.ts:4` and `HomeScreen.tsx:73-74`; needs to be extracted into env config with a `.env.example` file

### Testing
- **Server tests** — zero coverage; `test` script is `echo "No tests yet" && exit 0`; need tests for `RoomService` game logic, move validation, time control, socket handlers, and API endpoints
- **Client tests** — only `HomeScreen` is tested (15 cases); missing tests for `GameScreen`, `LobbyScreen`, `GameContext`, and `useSocket` hook

### Features
- **Reconnection endpoint** — need `GET /api/rooms/:roomId` to verify room exists and return current state; currently a player who refreshes has no recovery path if the room was cleaned up
- **Pawn promotion UI** — always auto-promotes to Queen; server accepts a promotion parameter but the client never presents a choice UI
- **Post-game flow** — no "Play Again" button, no return to lobby, no stats or replay

### Data / State
- **Chat limitations** — no chat history for late-joining players, messages lost on refresh, unbounded message array in memory

### Validation & Error Handling
- **Validation gaps** — Brain/Hand role enforcement is implicit not explicit; no server-side player name length validation; chat message cap (300) is a magic number
- **Error handling** — no React error boundary; generic catch blocks in `useSocket`; no structured error codes from the server; no timeout for abandoned games; WebSocket `close` handler doesn't track close reason
- **Global error handler** — TODO in `roomController.ts` for more robust error handling

### Code Quality
- **Duplicated `PIECE_SYMBOL` map** — defined in both `GameScreen.tsx` and `roomService.ts`; should live in the shared package
- **Magic numbers** — clock low-time threshold (15000 ms), chat cap (300), pawn promotion rank checks scattered across codebase
- **`GameScreen` performance** — creates a new `Chess()` instance on every render

### Ops & Docs
- **CI/CD** — no GitHub Actions workflows
- **Documentation** — README missing deployment instructions, contributing guide, known limitations, and troubleshooting section
