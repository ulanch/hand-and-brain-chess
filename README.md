# Hand and Brain Chess

A real-time **Hand & Brain** chess web app for 4 players. Two teams of two — each team has a **Brain** who calls a piece type and a **Hand** who executes the move. Built as a pnpm monorepo with a React frontend and a Node.js WebSocket backend.

## How to Play

1. One player creates a room and shares the 4-letter code.
2. All 4 players join and assign themselves to a team (team 1 or team 2) and a role (Brain or Hand).
3. The host starts the game (with optional time control).
4. On each turn, the **Brain** calls a piece type (e.g. "Knight"). The **Hand** must move any piece of that type — no other communication allowed.
5. Standard chess rules apply. First team to deliver checkmate wins.

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 19, Vite 6, TypeScript, Tailwind CSS 4    |
| Backend    | Node.js, Express 5, `ws` (WebSockets)           |
| Chess      | `chess.js` (move validation), `react-chessboard` |
| Monorepo   | pnpm workspaces                                 |
| Linting    | ESLint v9 (flat config), Husky + lint-staged    |

## Project Structure

```
hand-and-brain/
├── packages/
│   ├── client/        # React app (Vite)
│   ├── server/        # Express + WebSocket server
│   └── shared/        # Shared TypeScript types
└── package.json       # Workspace root
```

## Setup

### Prerequisites

| Tool    | Version |
| ------- | ------- |
| Node.js | ≥ 18    |
| pnpm    | ≥ 9     |

### Install

```bash
pnpm install
```

## Development

```bash
# Run both in separate terminals
pnpm dev:client   # Vite dev server → http://localhost:5173
pnpm dev:server   # Express server  → http://localhost:3000
```

## Build

```bash
pnpm build
```

## Features

- **Room system** — create or join a room with a 4-letter code via REST API
- **WebSocket lobby** — real-time role selection with live updates to all players
- **Full game flow** — Brain picks a piece type, Hand moves it, board updates live for everyone
- **Move history** — paired SAN move list with auto-scroll
- **Last-move highlight** — yellow tint on the previous move's squares
- **Clock support** — optional time controls (1+0, 3+2, 5+0, 5+3, 10+0, 10+5); server-authoritative with per-move increment; live countdown interpolated on the client
- **In-game chat** — real-time broadcast to all players in the room
- **Disconnection handling** — player slots are preserved on disconnect; the slot is only freed on an explicit leave

## WebSocket Protocol

Messages are JSON objects with a `type` field.

**Client → Server**

| Type            | Payload                              | Description                        |
| --------------- | ------------------------------------ | ---------------------------------- |
| `join_room`     | `{ roomId, playerId }`               | Register the WebSocket connection  |
| `select_role`   | `{ team, role }`                     | Claim a team/role slot in the lobby|
| `start_game`    | `{ timeControl? }`                   | Host starts the game               |
| `brain_pick`    | `{ pieceType }`                      | Brain calls a piece type           |
| `hand_move`     | `{ from, to, promotion? }`           | Hand executes a move               |
| `chat_message`  | `{ text }`                           | Send a chat message                |
| `leave_room`    | —                                    | Explicitly vacate the room slot    |

**Server → Client**

| Type              | Payload             | Description                     |
| ----------------- | ------------------- | ------------------------------- |
| `lobby_update`    | `{ room }`          | Full room state snapshot        |
| `chat_broadcast`  | `{ playerId, playerName, text, timestamp }` | Relayed chat message |
| `error`           | `{ message }`       | Error response                  |

## License

MIT
