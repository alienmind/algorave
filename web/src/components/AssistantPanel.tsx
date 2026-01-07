"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
    { label: "Techno", prompt: "Generate a driving techno beat with a kick and hi-hats." },
    { label: "House", prompt: "Create a house drum pattern with chords." },
    { label: "Acid", prompt: "Generate an acidic bassline using 303 sounds." },
    { label: "Ambient", prompt: "Create an ambient soundscape with slow pads." },
    { label: "Breakbeat", prompt: "Generate a breakbeat drum pattern." },
    { label: "Euclidean", prompt: "Generate a euclidean rhythm for drums." },
];

interface AssistantPanelProps {
    onCodeGenerated: (code: string) => void;
}

export default function AssistantPanel({ onCodeGenerated }: AssistantPanelProps) {
    const { messages, append, status } = useChat({
        api: "/api/chat",
    } as any) as any;

    const [input, setInput] = useState("");
    const isLoading = status === "submitted" || status === "streaming" || status === "connecting";

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Extract code from messages
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "assistant" && !isLoading) {
            // Regex to find code blocks
            const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(lastMessage.content)) !== null) {
                if (match[1]) {
                    onCodeGenerated(match[1].trim());
                }
            }
        }
    }, [messages, isLoading, onCodeGenerated]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input) return;
        append({ role: "user", content: input });
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
            {/* Suggestions Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Suggesters</h3>
                <div className="grid grid-cols-3 gap-2">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => append({ role: "user", content: s.prompt })}
                            className="px-3 py-2 text-xs font-semibold text-gray-200 bg-gray-700 hover:bg-purple-600 rounded transition"
                            disabled={isLoading}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
                {messages.map((m: any) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                            className={`max-w-[90%] px-3 py-2 rounded-lg whitespace-pre-wrap ${m.role === "user"
                                ? "bg-purple-900 text-white"
                                : "bg-gray-800 text-gray-300"
                                }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="text-gray-500 text-xs animate-pulse">Thinking...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Describe your music..."
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input}
                        className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-500 disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
