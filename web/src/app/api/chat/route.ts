import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export const maxDuration = 60;

export async function POST(req: Request) {
    let mcpClient: Client | null = null;
    let transport: StdioClientTransport | null = null;

    try {
        const { messages } = await req.json();
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY is missing");
            return new Response("Missing API Key", { status: 401 });
        }

        transport = new StdioClientTransport({
            command: "node",
            args: ["../strudel-mcp-server/dist/index.js"]
        });

        mcpClient = new Client(
            { name: "Strudel-Host", version: "1.0.0" },
            { capabilities: {} }
        );

        await mcpClient.connect(transport);
        const toolsList = await mcpClient.listTools();
        console.log("[TRACE] MCP Tools Available:", toolsList.tools.map(t => t.name));

        // Map MCP tools to Gemini format
        const geminiTools = [{
            functionDeclarations: toolsList.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema as any,
            })),
        }];

        const genAI = new GoogleGenAI({ apiKey });

        // Convert message history (logs for debugging)
        console.log("[TRACE] Incoming Messages Count:", messages.length);
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1];
        console.log("[TRACE] Last Message:", lastMessage.content);

        // Use new SDK API: client.chats.create
        const chat = genAI.chats.create({
            model: "gemini-2.0-flash-exp",
            history: history,
            config: {
                tools: geminiTools
            }
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    console.log("[TRACE] Sending message to Gemini stream...");
                    const result = await chat.sendMessageStream({ message: lastMessage.content });

                    for await (const chunk of result) {
                        const text = chunk.text;
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }

                        // Handle Tool Calls
                        let calls: any[] = [];
                        if (Array.isArray((chunk as any).functionCalls)) {
                            calls = (chunk as any).functionCalls;
                        }

                        if (calls && calls.length > 0) {
                            console.log(`[TRACE] Gemini requested tool execution. Count: ${calls.length}`);
                            for (const call of calls) {
                                console.log(`[TRACE] Executing tool: ${call.name}`);
                                console.log(`[TRACE] Tool Arguments:`, JSON.stringify(call.args));

                                let mcpResult;
                                try {
                                    mcpResult = await mcpClient!.callTool({
                                        name: call.name,
                                        arguments: call.args
                                    });
                                    console.log(`[TRACE] Tool Result:`, JSON.stringify(mcpResult).substring(0, 200) + "...");
                                } catch (err: any) {
                                    console.error(`[TRACE] Tool Execution Error (${call.name}):`, err);
                                    mcpResult = { error: err.message };
                                }

                                // Inject generated code into the stream for the UI
                                if (call.name === 'write' || call.name === 'generate_pattern') {
                                    let code = "";
                                    if (call.args && typeof call.args === 'object') {
                                        if ('pattern' in call.args) code = (call.args as any).pattern;
                                        if ('code' in call.args) code = (call.args as any).code;
                                    }
                                    if (code) {
                                        console.log("[TRACE] Injecting code markdown to stream");
                                        const markdown = `\n\`\`\`strudel\n${code}\n\`\`\`\n`;
                                        controller.enqueue(encoder.encode(markdown));
                                    }
                                }
                            }
                        }
                    }
                } catch (e: any) {
                    console.error("[TRACE] Streaming Error:", e);
                    controller.enqueue(encoder.encode(`Error during generation: ${e.message}`));
                } finally {
                    console.log("[TRACE] Stream closed.");
                    controller.close();
                    if (mcpClient) await mcpClient.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error: any) {
        console.error("Route Error:", error);
        if (mcpClient) try { await mcpClient.close(); } catch { }
        return new Response(`Server Error: ${error.message}`, { status: 500 });
    }
}
