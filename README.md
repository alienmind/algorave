---
title: Algorave Hub
author: AlienMind
date: 2026-01-06
---

# Algorave Hub

A central hub for algoraving with Strudel, powered by AI (Open WebUI) and Model Context Protocol.

[https://github.com/alienmind/algorave](https://github.com/alienmind/algorave)

![Algorave Hub Logo](doc/logo.png)

# 🏛️ Architecture

![Project Architecture](doc/architecture.png)

- **Web App**: Next.js (React) front-end with a 4-pane grid layout (Code, Examples, Chat, Player).
- **Chat**: **Open WebUI** container connecting to LLMs (Cloud or Local) and the local MCP server.
- **MCP Server**: Custom Strudel MCP Server (bridged via SSE) for music generation logic.
    > **Why SSE?** The default MCP Protocol uses Stdio (standard input/output), which is difficult to route between Docker containers. We use a lightweight **SSE Bridge** (`sse-bridge.js`) to expose the server over HTTP, allowing Open WebUI to connect easily.
- **Docker**: Containerized environment for reproducible hybrid deployment.

# 🚀 Getting Started

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

## Stopping

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

# 🎵 Usage

1.  **Browse through examples**: Click an example in the sidebar, and manually paste code into the left pane
2.  **Chat with AI**: Ask it to "Make a dark techno bassline" or "Add a high-hat pattern". Copy and adjust the produced code to the Strudel player to the right.
3.  **Run Code**: Click the "Play" button in the Strudel pane.

# 🛠️ Development

-   **Frontend (`web/`)**: Next.js 15 application.
-   **MCP Bridge (`docker/strudel-mcp/`)**: Intermediate layer converting Stdio MCP to SSE.
-   **Base MCP (`strudel-mcp-server/`)**: Local fork of the official Strudel logic.

# 🔮 Future Improvements

- [x] Basic webapp integrated with MCP and Strudel.cc
- [x] Add easy to pick up music code examples (Dynamic Sidebar)
- [x] Cross-pane copy & paste functionality
- [x] Production-ready containerization (Hybrid Architecture)
- [x] Connect chat to LLMs via Open WebUI
- [ ] Add real-time visuals (p5.js / Hydra)

# Credits

- Strudel: [strudel.cc](https://strudel.cc)
- Strudel MCP Server: [github.com/williamzujkowski/strudel-mcp-server](https://github.com/williamzujkowski/strudel-mcp-server)
