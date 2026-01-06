
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Since we can't modify the server code, we act as a "Client" to the local Stdio Server
// and a "Server" to the remote SSE Client (Open WebUI).
// Wait, this is a proxy pattern: Open WebUI (Client) -> SSE -> THIS BRIDGE -> Stdio -> MCP Server.

const app = express();
const PORT = 3001;

// Path to the actual MCP server script
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = join(__dirname, 'dist/index.js');

// We use a mapping of sessionId -> StdioClient
const clients = new Map();

app.get("/sse", async (req, res) => {
    console.log("New SSE connection");

    // Implementation of SSE Server Transport
    // Note: The SDK's SSEServerTransport is designed to WRAP a Server class.
    // But we don't have the Server class instance (it's inside the child process).
    // So we need to proxy the protocol messages.

    // Actually, simplest way with SDK is to just use standard input/output piping manually
    // OR use the SDK's internal transport logic if possible.

    // Let's implement a simple localized transport bridge.
    // 1. Spawn the child process for THIS connection.
    // 2. Pipe stdout (server JSON-RPC) to SSE 'message' events.
    // 3. Receive POST JSON-RPC and write to stdin.

    const transport = new SSEServerTransport("/message", res);
    // transport.start() requires an MCP Server instance to connect TO.
    // But we want to connect to a Stdio Client.

    // Since we are proxying, we can't easily use the SDK's higher level classes because they expect (Server <-> Transport).
    // We want (Transport <-> Transport).

    // Simplified manual proxy:
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });

    const { spawn } = await import("child_process");
    console.log(`Spawning ${SERVER_SCRIPT}`);

    const child = spawn("node", [SERVER_SCRIPT], {
        stdio: ["pipe", "pipe", "inherit"], // Stdin, Stdout, Stderr
    });

    const sessionId = Date.now().toString();
    clients.set(sessionId, child);

    // Forward Child Stdout -> SSE
    child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            if (line.trim()) {
                try {
                    // Verify it's JSON
                    JSON.parse(line);
                    res.write(`event: message\ndata: ${line.trim()}\n\n`);
                } catch (e) {
                    // Log non-JSON output (debug info)
                    console.log("Server Log:", line);
                }
            }
        }
    });

    req.on("close", () => {
        console.log("SSE Connection closed, killing child process");
        child.kill();
        clients.delete(sessionId);
    });

    // Send initial endpoint event
    res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);
});

app.post("/message", express.json(), (req, res) => {
    const sessionId = req.query.sessionId;
    const child = clients.get(sessionId);

    if (!child) {
        return res.status(404).send("Session not found");
    }

    const message = req.body;
    // Write to child stdin
    const json = JSON.stringify(message);
    child.stdin.write(json + "\n");

    res.status(200).send("Accepted");
});

app.listen(PORT, () => {
    console.log(`MCP Bridge running on port ${PORT}`);
});
