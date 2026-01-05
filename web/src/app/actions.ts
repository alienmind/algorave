"use server";

import { createMcpClient } from "@/lib/mcp";

export async function generatePattern(style: string) {
    const { client, transport } = createMcpClient();
    try {
        await client.connect(transport);

        // 1. Generate the pattern
        // This writes to the MCP server's internal state but returns a success message
        await client.callTool({
            name: "generate_pattern",
            arguments: {
                style: style,
                auto_play: false
            },
        });

        // 2. Retrieve the generated pattern
        // We fetch the code that was just generated
        const patternResult = await client.callTool({
            name: "get_pattern",
            arguments: {}
        });

        return {
            success: true,
            data: patternResult
        };
    } catch (error: any) {
        console.error("MCP call failed:", error);
        return {
            success: false,
            error: error.message || String(error)
        };
    } finally {
        try {
            await transport.close();
        } catch (e) {
            // Ignore close errors
        }
    }
}
