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

## 🛠️ Tools Catalog

This "hub" aims to integrate a conglomerate of useful tools for Algorave:

*   [**strudel.cc**](https://strudel.cc) - The official Strudel website and player.
*   [**Self-hosted Strudel**](https://alienmind.github.io/algorave/strudel/) - The local fork hosted on GitHub Pages.
*   [**strudel-mcp-server**](https://github.com/williamzujkowski/strudel-mcp-server) - MCP Server for Strudel (local integration) (see also [npm page](https://libraries.io/npm/@williamzujkowski%2Fstrudel-mcp-server))
*   [**midi-to-strudel**](https://github.com/alienmind/MIDI-To-Strudel) - Scripts to convert MIDI files to Strudel code.
*   **Other useful stuff** - More integrations coming soon!

The intention of the project is accelerating learning plus making easier to spin up everything locally for airgapped music production.
I spend a portion of my life in planes so this is something I needed to do anyway ;-)

## 🏛️ Architecture

![Project Architecture](web/public/doc/architecture.png)

- **Web App**: Next.js (React) front-end with a 4-pane grid layout (Code, Examples, Chat, Player).
- **Chat**: **Open WebUI** container connecting to LLMs (Cloud or Local) and the local MCP server.
- **MCP Server**: Custom Strudel MCP Server (bridged via SSE) for music generation logic.
    > **Why SSE?** The default MCP Protocol uses Stdio (standard input/output), which is difficult to route between Docker containers. We use a lightweight **SSE Bridge** (`sse-bridge.js`) to expose the server over HTTP, allowing Open WebUI to connect easily.
- **Docker**: Containerized environment for reproducible hybrid deployment.

## 🚀 Getting Started

**Prerequisites**

- Node.js (v18+)
- Docker & Docker Compose

## Quick Start (Recommended)

We provide a streamlined npm script to handle the **Layered Docker Build** automatically.

```bash
npm install
npm start
# or
docker-compose up --build
```

This command will:
1.  Build the `mcp-base` image from your local source.
2.  Launch the entire stack on `localhost:3000`.

## Manual Method

If you prefer running commands manually or need to debug:

```bash
# 1. Build the Base Image (Required first!)
docker-compose build mcp-base

# 2. Launch the Stack
docker-compose up --build
```

### Stopping

```bash
npm run docker:down
# or
docker-compose down
```

---

# 🤖 Connecting an AI (Open WebUI)

The chat interface is powered by **Open WebUI**. On first launch, you must complete the setup:

1.  **Create Admin Account**:
    -   Go to the chat pane (bottom-left) or open [http://localhost:8080](http://localhost:8080).
    -   Sign up to create the first admin account (data is stored locally in the `open-webui` volume).

2.  **Connect an LLM (Required)**:
    -   **Cloud (Gemini, OpenAI, Claude)**:
        -   Click on your profile icon (bottom-left) -> **Settings** -> **Admin Settings** -> **Connections**.
        -   Enter your API Key (e.g., `GOOGLE_API_KEY` or `OPENAI_API_KEY`).
        -   Save and select the model in the new chat dropdown.
    -   **Local (Ollama/LlamaCpp)**:
        -   If running Ollama on your host: `http://host.docker.internal:11434`.
        -   If running in a container: Ensure they share the network.

3.  **Strudel MCP (Pre-configured)**:
    -   The **Strudel Tool** is already connected via `http://strudel-mcp:3001/sse`.
    -   It enables the AI to: "Play Music", "Stop", "Get Pattern", etc.

# ⚙️ Configuration

-   **Web App**: [http://localhost:3000](http://localhost:3000)
-   **Open WebUI**: [http://localhost:8080](http://localhost:8080)
-   **Strudel Player**: Embedded in the top-right pane.

## 🎵 Usage

1.  **Browse through examples**: Click an example in the sidebar, and manually paste code into the Strudel player.
2.  **Chat with AI**: Ask it to "Make a dark techno bassline" or "Add a high-hat pattern". Copy and adjust the produced code to the Strudel player.
3.  **Run Code**: Click the "Play" button in the Strudel player.

## 🛠️ Development

-   **Frontend (`web/`)**: Next.js 15 application.
-   **MCP Bridge (`docker/strudel-mcp/`)**: Intermediate layer converting Stdio MCP to SSE.
-   **Base MCP (`strudel-mcp-server/`)**: Local fork of the official Strudel logic.

## 🔮 Future Improvements

- [x] Basic webapp integrated with MCP and Strudel.cc
- [x] Add easy to pick up music code examples (Dynamic Sidebar)
- [x] Cross-pane copy & paste functionality
- [x] Production-ready containerization (Hybrid Architecture)
- [x] Connect chat to LLMs via Open WebUI
- [ ] Fix [strudel mcp server issue](https://github.com/williamzujkowski/strudel-mcp-server/issues/54) with headless browser synchronization 
- [ ] Automagically paste the code into strudel player
- [ ] Add magical buttons that produce prompts to the LLM running on OpenWebUI
- [ ] Integrate midi-to-strudel as a separate MCP tool
- [ ] Add real-time visuals (p5.js / Hydra)

## Credits

- Strudel: [strudel.cc](https://strudel.cc)
- Strudel MCP Server: [github.com/williamzujkowski/strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
- The amazing Strudel community out there