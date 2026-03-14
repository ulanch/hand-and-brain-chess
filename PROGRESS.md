# Hand and Brain Chess — Progress

## Done

### Infrastructure
- Monorepo setup (pnpm workspaces, shared types package)
- TypeScript strict mode across all packages
- ESLint + Husky pre-commit hook (lint-staged)
- Vite dev server with `/api` proxy to Express
- Playwright installed, Storybook + Vitest configured with separate unit/browser projects

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
  - Start Game button (enabled when all 4 slots filled — wired up visually, not yet functional)
  - Leave Room button (sends `leave_room` WS message before clearing state)
- 29 passing tests (15 unit + 14 Storybook)

---

## Up Next

### Start Game (small)
- Add `start_game` client → server WS message
- Server: validate all 4 slots filled, set `room.status = "in-progress"`, broadcast `lobby_update`
- Client: navigate from `LobbyScreen` → `GameScreen` when `room.status === "in-progress"`

### GameScreen + Chess (large — main remaining work)
- Chessboard rendering (`react-chessboard` + `chess.js` recommended)
- Turn flow:
  - **Brain's turn**: picks a piece type from a list → server broadcasts to their Hand
  - **Hand's turn**: legal moves for that piece type highlighted on board → makes the move
- Move sync via WebSocket (new message types: `brain_pick`, `hand_move`)
- Win condition (checkmate / stalemate)

### Reconnection resilience
- `GET /api/rooms/:id` route — lets a refreshed client re-fetch current game state
- Handle "room not found" on reconnect gracefully (redirect home with message)

### Cleanup
- Remove default Storybook scaffold (`src/stories/`) — pre-existing TS errors, not relevant
- Add server-side tests
