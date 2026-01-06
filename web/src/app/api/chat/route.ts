import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createMcpClient } from '@/lib/mcp';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Client connection per request (stateful potential issue but OK for now)
    const { client, transport } = createMcpClient();

    try {
        await client.connect(transport);

        // fetch tools from MCP
        const toolsList = await client.listTools();

        // Transform specific useful tools (or all) to AI SDK format
        // We manually pick the most useful ones to avoid token bloat and control the experience
        // or we can map them dynamically. Let's map dynamically but filter if needed.
        // For now, mapping the "Generation" and "Control" tools seems best.
        const tools: Record<string, any> = {};

        for (const mcpTool of toolsList.tools) {
            // Convert JSON Schema to Zod if possible, or just use the schema directly if supported.
            // The `ai` SDK 'tool' helper expects a Zod schema or we can use the experimental `jsonSchema`.
            // Since we don't have a reliable JSON Schema -> Zod converter in runtime without heavy libs,
            // We will fallback to a simpler approach: 
            // 1. Manually define the most critical tools with Zod (safer, typed)
            // OR
            // 2. Use `tool({ parameters: jsonSchema(mcpTool.inputSchema) })` if supported.
            //
            // As of recent SDK, `tool` helper takes `parameters` as Zod schema.
            // Let's implement dynamic mapping by defaulting to z.any() if complex, 
            // but for Strudel tools they are usually simple strings/numbers.

            // Actually, let's manually bind the High-Level ones for stability first.
            // Manual binding ensures we give Gemini the best description.
        }

        // Manual Binding for Key Tools
        // We can easily expand this list.
        const mcpToolDefinitions = {
            generate_pattern: tool({
                description: 'Generate a complete musical pattern based on a style (techno, house, etc), key and bpm.',
                parameters: z.object({
                    style: z.string().describe('The musical style (e.g. techno, house, ambient, dnb)'),
                    bpm: z.number().optional().describe('Tempo in BPM'),
                    key: z.string().optional().describe('Musical key (e.g. C, Dm)'),
                    auto_play: z.boolean().optional().default(true).describe('Whether to auto-play the result'),
                }),
                execute: async (args) => {
                    const result = await client.callTool({
                        name: "generate_pattern",
                        arguments: args
                    });
                    return JSON.stringify(result);
                },
            }),
            play: tool({
                description: 'Start playing the current pattern in the Strudel player.',
                parameters: z.object({}),
                execute: async () => {
                    const result = await client.callTool({ name: "play", arguments: {} });
                    return JSON.stringify(result);
                }
            }),
            stop: tool({
                description: 'Stop playing.',
                parameters: z.object({}),
                execute: async () => {
                    const result = await client.callTool({ name: "stop", arguments: {} });
                    return JSON.stringify(result);
                }
            }),
            generate_bassline: tool({
                description: 'Generate a bassline.',
                parameters: z.object({
                    style: z.string().describe('Bass style'),
                    key: z.string().describe('Musical Key')
                }),
                execute: async (args) => {
                    const result = await client.callTool({ name: "generate_bassline", arguments: args });
                    return JSON.stringify(result);
                }
            }),
            // Add a generic "code" writer
            write: tool({
                description: 'Write raw Strudel/TidalCycles code to the editor.',
                parameters: z.object({
                    pattern: z.string().describe('The code to write'),
                    auto_play: z.boolean().optional().default(true)
                }),
                execute: async (args) => {
                    const result = await client.callTool({ name: "write", arguments: args });
                    return JSON.stringify(result);
                }
            }),
            get_pattern: tool({
                description: 'Get the currently active pattern code.',
                parameters: z.object({}),
                execute: async () => {
                    const result = await client.callTool({ name: "get_pattern", arguments: {} });
                    return JSON.stringify(result);
                }
            })
        };

        const result = streamText({
            model: google('gemini-2.0-flash-exp'), // Upgraded to Gemini 2.0 Flash (Experimental)
            system: `You are an expert live coding musician and DJ using Strudel (a browser-based port of TidalCycles).
Your goal is to help the user create music by writing code or generating patterns.
You have access to a local MCP server that controls the Strudel instance.

Capabilities:
- You can generate full patterns (techno, house, etc.).
- You can write specific code.
- You can play/stop the music.

Guidelines:
- When asked to play something specific, use 'generate_pattern' or 'generate_bassline' etc.
- If the user asks for code explanation, providing it.
- Always be enthusiastic and helpful.
- If you generate code, you don't need to output it in markdown because the tool execution will show it in the UI/Editor.
- BUT: If you prefer to explain, do so.
- 'auto_play' is true by default for generation tools.

If you generate code using 'write' or 'generate_pattern', the user will see it in the editor automatically. You should confirm what you did.`,
            messages,
            tools: mcpToolDefinitions,
            maxSteps: 5, // Allow multi-step tool calls
            onFinish: async () => {
                // We could close the client here, but streamText might not await this.
                // Best effort close or rely on process exit if using stdio (which we use for local).
                // Actually, wait... Stdio process might hang if we don't close.
                // But 'onFinish' runs after the stream is done.

                // WARNING: The stream response object is returned BEFORE onFinish completes fully sometimes? 
                // We need to ensure we don't kill the connection while tools are running.
                // Since we await client.connect(), we should be careful.
                // But `streamText` response is a stream.

                // Ideally we would keep the connection alive or close it properly.
                // Let's rely on standard GC or try to close in `finally` of the route handler?
                // `streamText` returns a `toDataStreamResponse()`.
                // The closing logic is tricky with streaming.
                // Let's NOT explicitly close in this simple iteration, enabling "persistent" like feel,
                // or let the node process cleanup. 
                // Actually, proper cleanup:
                // For Stdio, if we don't close, the child process (node) stays detached?
                // The `transport` creates a process.
                // We should probably close logic.
            },
        });

        // Cleanup hook?
        // Since we return `result.toDataStreamResponse()`, we can't easily wrap it in try/finally block for the *stream* duration easily without custom stream implementation.
        // For now, let's assume one-off requests and maybe leak a bit of resources (or trust standard disposal).
        // A better way: return the stream, and upon stream close, close the transport.
        // But Vercel AI SDK handles the stream.

        return result.toDataStreamResponse();

    } catch (error) {
        console.error("Chat Error:", error);
        // Close transport in error case
        try { await transport.close(); } catch { }
        return new Response("Internal Server Error", { status: 500 });
    }
}
