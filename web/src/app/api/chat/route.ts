
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createMcpClient } from '../../../lib/mcp';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    let mcpClient: any = null;
    let transport: any = null;

    try {
        const { messages } = await req.json();

        // 1. Connect to MCP Server
        const connection = createMcpClient();
        mcpClient = connection.client;
        transport = connection.transport;

        await transport.start();

        // 2. Fetch available tools from MCP
        const toolsResult = await mcpClient.listTools();
        const mcpTools = toolsResult.tools || [];

        // 3. Map MCP tools to AI SDK tools
        const tools: Record<string, any> = {};

        for (const t of mcpTools) {
            const toolDef: any = {
                description: t.description,
                parameters: z.object(t.inputSchema.properties || {}) as any,
                execute: async (args: any) => {
                    // Execute tool on MCP server
                    const result = await mcpClient.callTool({
                        name: t.name,
                        arguments: args
                    });

                    // Return result string
                    if (result.content && result.content[0] && result.content[0].text) {
                        return result.content[0].text;
                    }
                    return JSON.stringify(result);
                }
            };
            tools[t.name] = tool(toolDef);
        }

        // 4. Select Model
        const model = process.env.GEMINI_API_KEY ? google('gemini-1.5-pro-latest') : openai('gpt-4-turbo');

        // 5. Stream Response
        const result = await streamText({
            model: model,
            messages: messages,
            tools: tools,
            system: "You are an expert live coding musician using Strudel (TidalCycles for JS). Use the provided tools to generate or modify music patterns. Output only valid Strudel code blocks when suggesting code.",
        });

        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("Route Error:", error);
        if (transport) {
            try { await transport.close(); } catch (e) { console.error("Close error", e); }
        }
        return new Response(`Server Error: ${error.message}`, { status: 500 });
    }
}
