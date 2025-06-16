# Hand and Brain Chess

> **⚠️ Work in progress**  
> This project is under active development and **not yet ready for production use**. Expect breaking changes and missing features while the core gameplay is being built.

A lightweight web app for hosting **Hand & Brain** chess games with friends. Built with **Vite + React + TypeScript** and styled using **Tailwind CSS**, it lets players spin up a room, share a 4-letter code, and jump straight into the game.

---

## Game Rules (Quick Reference)

1. **Teams of two** – one **Hand**, one **Brain**.
2. On each turn the Brain names any _piece type_ (e.g. “Knight”).
3. The Hand must move one piece of that type—no hints allowed.
4. Standard chess rules apply; first team to deliver checkmate wins.
5. Exactly **4 players** needed.

---

## Getting Started

### Prerequisites

| Tool                     | Version |
| ------------------------ | ------- |
| **Node.js**              | ≥ 18    |
| **pnpm** (or npm / yarn) | Latest  |

### Installation

```bash
# Install dependencies for the entire workspace
pnpm install
```

### Development

```bash
# Start the Vite dev server for the client
pnpm dev:client

# Start the backend server
pnpm dev:server
```

### Build

```bash
# Build both client and server for production
pnpm build
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
