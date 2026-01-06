# 🛠️ Algorave Hub

![Algorave Hub Logo](doc/logo.png)

## Introduction

This project started as a notebook of ![Strudel](https://strudel.cc) code snippets while learning the language and reading through amazing content out there.
Over time it became a playground of ideas for a ![Workshop](WORKSHOP.md) planned to give at some point in 2025/2026

The project is a composite of:
- A few Strudel code examples either manually composed or ripped off from the web (reference to authors kept)
- The Strudel player - which is by itself running locally in the browser, via direct integration with the official website (https://strudel.cc) or locally served from a container (for any locally running fork, pinned versions or airgapped music creation)
- A locally running MCP server from the amazing [strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
- A companion web app for easy picking up examples and integrate everything together

The intention of the project is accelerating learning plus making easier to spin up everything locally for airgapped music production.
I spend a portion of my life in planes so this is something I needed to do anyway ;-)

## 🏛️ Architecture

![Project Architecture](doc/architecture.png)

- **Web App**: Next.js front-end + back-end for prompts and playback (served locally or via Docker)
- **NGINX Proxy**: NGINX proxy for routing requests to the correct service (served locally or via Docker)
- **MCP Server**: Williamzujkowski's Strudel MCP Server for music generation logic (served locally or via Docker)
- **Strudel**: Strudel player (served locally or via Docker)
- **Docker**: Used as part of the documentation pipeline or to serve the whole stack

## 🚀 Getting Started

**Prerequisites**

- Node.js (v18+)
- Docker (Optional, for containerized run)

### Installation

```bash
npm install
npm run build
```

### Running

#### Option 1: Local (Default)

Running locally is possible and faster but Docker is required for building some of the artifacts.

```bash
npm start
```
This starts the web app at [http://localhost:3001](http://localhost:3001) plus the MCP server running locally on http://localhost:4351

#### Option 2: Docker

To run the entire stack with containers:

```bash
npm run docker:up
```

### Stopping

To stop the local running app or the containers:

```bash
npm stop
# or
npm run docker:down
```

## ⚙️ Configuration

**Local Strudel Instance**

You can run a local instance of Strudel (e.g. for offline usage) instead of `strudel.cc`.
This is ideal for airgapped mode

1.  **Enable Local Strudel**:
    -   **For Local Run**: Create `web/.env` and add:
        ```bash
        NEXT_PUBLIC_USE_LOCAL_STRUDEL=true
        ```
    -   **For Docker Run**:
        The `docker-compose.yml` is configured to use `false` (external) by default. To change it, set the environment variable before building:
        ```bash
        NEXT_PUBLIC_USE_LOCAL_STRUDEL=true npm run docker:up -- --build
        ```
    
2.  **Access**:
    -   Web App: http://localhost:3001
    -   Strudel (Direct): http://localhost:4321

## 🎵 Usage

1.  **Start the App** (Local or Docker).
2.  **Open** [http://localhost:3001](http://localhost:3001).
3.  **Generate Music**:
    -   Enter a style (e.g., "techno", "house", "dnb").
    -   Click "Algorave!".
    -   Wait for the code to generate and the Strudel player to load.

## 🛠️ Development

- **VS Code DevContainer**: Open this folder in VS Code and click "Reopen in Container" for a configured environment.
- `npm run docker:up`: Start everything in Docker.
- `npm start`: Start locally in dev mode.
- `npm run docs`: Generate this presentation (Reveal.js).

## 🔮 Future Improvements

- [x] Basic webapp integrated with MCP and Strudel.cc
- [x] Add easy to pick up music code examples
- [x] Cross-pane copy & paste functionality
- [x] Production-ready containerization
- [ ] Connect the chat prompt to an actual LLM (Claude, Gemini or ChatGPT) for smarter code generation
- [ ] Allow locally hosting an LLM with ollama
- [ ] Add visuals

## Credits

- Strudel: [strudel.cc](https://strudel.cc)
- Strudel MCP Server: [github.com/williamzujkowski/strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
