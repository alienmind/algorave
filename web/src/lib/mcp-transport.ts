import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { Socket } from "net";

/**
 * TCP Client Transport for MCP
 * Connects to a TCP port where an MCP server is listening (via socat or similar)
 */
export class TCPClientTransport implements Transport {
    private socket: Socket;
    private _isConnected = false;

    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;

    constructor(private host: string, private port: number) {
        this.socket = new Socket();
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.connect(this.port, this.host, () => {
                this.socket.setEncoding("utf-8");
                this._isConnected = true;
                resolve();
            });

            let buffer = "";

            this.socket.on("data", (data) => {
                buffer += data.toString();

                // Process buffer for complete lines
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
                    const line = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);

                    if (!line.trim()) continue;

                    try {
                        const message = JSON.parse(line);
                        if (this.onmessage) {
                            this.onmessage(message);
                        }
                    } catch (e) {
                        console.error("Failed to parse JSONRPC message:", e, "Line:", line);
                        if (this.onerror) {
                            this.onerror(new Error(`Failed to parse JSONRPC message: ${e}`));
                        }
                    }
                }
            });

            this.socket.on("error", (err) => {
                if (this.onerror) this.onerror(err);
                // Only reject if we failed to connect initially
                if (!this._isConnected) reject(err);
            });

            this.socket.on("close", () => {
                this._isConnected = false;
                if (this.onclose) this.onclose();
            });
        });
    }

    async send(message: JSONRPCMessage): Promise<void> {
        if (!this._isConnected) {
            throw new Error("Not connected");
        }
        // Write JSON followed by newline
        this.socket.write(JSON.stringify(message) + "\n");
    }

    async close(): Promise<void> {
        this.socket.end();
        this._isConnected = false;
    }
}
