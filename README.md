# BUGS WAR: Backyard Battlefield

BUGS WAR is a multiplayer arcade evolution arena featuring Centipedes, Ants, and Spiders.

## Run locally

**Prerequisites:** [Bun](https://bun.sh/) (or Node.js with npm)

Install dependencies and start the game server:

```sh
bun install
bun run dev
```

Open <http://localhost:3000>. The server provides multiplayer over WebSockets; if it is unavailable, the game falls back to a local simulation.

## Deploy to GitHub Pages

The included GitHub Actions workflow builds and deploys the static game to GitHub Pages whenever changes are pushed to `main`, or when started manually from the Actions tab.

To enable it, open the repository's **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. After the workflow completes, GitHub Pages will show the published URL.

GitHub Pages hosts only the static frontend. The local simulation works there, but online multiplayer requires deploying `server.ts` to a host that supports persistent Node.js processes and WebSockets. The client currently connects to the WebSocket server on the same origin.
