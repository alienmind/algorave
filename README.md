# 🛠️ Algorave Hub

![Algorave Hub Logo](doc/logo.png)

## Introduction

This project started as a notebook of [Strudel](https://strudel.cc) code snippets while learning the language and reading through amazing content out there.
Over time it became a playground of ideas for a [Workshop](WORKSHOP.md) planned to give at some point in 2025/2026

The project is a composite of:
- A few Strudel code examples either manually composed or ripped off from the web (reference to authors kept)
- The Strudel player - which is by itself running locally in the browser, via direct integration with the official website (https://strudel.cc) or locally served from a container (for any locally running fork, pinned versions or airgapped music creation)
- A locally running MCP server from the amazing [strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
- A companion web app for easy picking up examples and integrate everything together

The intention of the project is accelerating learning plus making easier to spin up everything locally for airgapped music production.
I spend a portion of my life in planes so this is something I needed to do anyway ;-)

## 🏛️ Architecture

![Project Architecture](web/public/doc/architecture.png)

- **NGINX Proxy** (Port 8080): The entry point. Routes traffic to the Web App or the local Strudel instance (if enabled).
- **Web App** (Port 3001): Next.js application acting as the workshop hub. It sends prompts to the MCP server and loads Strudel for playback.
- **MCP Server** (Port 3000): Host the custom Strudel MCP server instance. Generates music patterns from natural language.
- **Strudel** (Port 4321): A local instance of the Strudel REPL. Allowed to run offline/airgapped.
- **Docker**: Orchestrates the entire stack.

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

Running locally without docker is possible and faster, but Docker is required for building some of the documentation artifacts.

```bash
npm start
```
This starts the web app at [http://localhost:3001](http://localhost:3001) plus the MCP server running locally on http://localhost:4321

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
- [x] Containerization
- [ ] Complete the full LLM stack with an actual LLM integration (Claude, Gemini or ChatGPT) for smarter code generation
- [ ] Allow locally hosting an LLM with Ollama
- [ ] Add syntax highlighting to the examples pane
- [ ] Add visuals?

## Credits

- Strudel: [strudel.cc](https://strudel.cc)
- Strudel MCP Server: [github.com/williamzujkowski/strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
- The amazing Strudel community out there