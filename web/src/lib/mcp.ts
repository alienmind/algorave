import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TCPClientTransport } from "./mcp-transport";
import path from "path";
import os from "os";

export function createMcpClient() {
    const host = process.env.MCP_SERVER_HOST;
    const port = parseInt(process.env.MCP_SERVER_PORT || "3000");

    let transport;

    if (host) {
        // Docker/Remote mode
        transport = new TCPClientTransport(host, port);
    } else {
        // Local mode (Stdio)
        console.log("MCP_SERVER_HOST not set, utilizing StdioClientTransport (Local Mode)");

        // Resolve path to the MCP server executable
        // Assuming we are running from 'web' directory, and mcp-server is in '../strudel-mcp-server'
        const serverPath = path.resolve(process.cwd(), '..', 'strudel-mcp-server', 'dist', 'index.js');

        transport = new StdioClientTransport({
            command: "node",
            args: [serverPath]
        });
    }

    const client = new Client(
        {
            name: "algorave-web-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    return { client, transport };
}
