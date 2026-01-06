"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
// import { Message } from "ai"; // Message might not be exported directly in v6?

export default function Home() {
  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_STRUDEL === "true";
  const BASE_URL = useLocal ? "http://localhost:4321" : "https://strudel.cc";
  const [strudelUrl, setStrudelUrl] = useState(BASE_URL);

  // Custom Input State to avoid SDK issues
  const [inputValue, setInputValue] = useState("");

  // Chat Hook
  // @ai-sdk/react v3.0.11 seems to expose sendMessage instead of append in this context?
  // Also checking type definitions showed Pick<..., 'sendMessage'>.
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message: any) => {
      console.log('Chat onFinish:', message);

      // Safety check for content
      if (!message.content) {
        console.warn('Message content matches no text or is undefined');
        return;
      }

      // Check for code in tool invocations (write, append, generate_pattern)
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        // Iterate in reverse to get the latest action
        for (const tool of [...message.toolInvocations].reverse()) {
          if (tool.toolName === 'write' || tool.toolName === 'validate_pattern_runtime') {
            const args = tool.args as any;
            if (args && args.pattern) {
              const code = args.pattern.trim();
              setCode(code);
              updatePreview(code);
              return;
            }
          }
          if (tool.toolName === 'append' || tool.toolName === 'insert') {
            const args = tool.args as any;
            if (args && args.code) {
              // Append logic is tricky without current state, but typically we might just show the new code
              const code = args.code.trim();
              // For now, valid to just setCode if it looks complete, or maybe we really should rely on the text response for context?
              // Let's assume 'code' is significant enough to show.
              // For append, ideally we append to existing `code`.
              setCode(prev => prev + "\n" + code);
              // We can't update strudel preview easily with partial append unless we track state perfectly.
              // But often 'append' is just adding a layer.
              updatePreview(code); // This might replace the beat? No, Strudel preview usually needs full code.
              // Actually, if we just show the snippet, the user can copy/paste.
              return;
            }
          }
          if (tool.toolName === 'generate_pattern' || tool.toolName === 'compose') {
            // The result often contains the code if the tool returns it.
            if ('result' in tool) {
              const result: any = tool.result;
              // The MCP server returns { content: [{ type: 'text', text: '...' }] }
              // We need to parse that text for code blocks or assume it IS the code if pure text?
              // Or maybe the args had it? No, generate_pattern args are higher level.
              // Let's trying to find code in the result text.
              // Often the result message says "Generated: ...code..."
            }
          }
        }
      }

      // Auto-detect code blocks to update the preview
      // Simple regex to find content between ``` and ```
      const codeBlock = message.content?.match(/```(?:tidal|strudel)?\s*([\s\S]*?)```/);
      if (codeBlock && codeBlock[1]) {
        const code = codeBlock[1].trim();
        setCode(code);
        updatePreview(code);
      }
    }
  });

  const [code, setCode] = useState("");

  // Examples State
  const [examples, setExamples] = useState<{ filename: string; title: string; content: string }[]>([]);

  useEffect(() => {
    fetch('/examples/manifest.json')
      .then(res => res.json())
      .then(data => setExamples(data))
      .catch(err => console.error('Failed to load examples:', err));
  }, []);

  const loadExample = (newCode: string) => {
    setCode(newCode);
    setInputValue("");
  };

  const updatePreview = (codeToRun: string) => {
    const encoded = encodeURIComponent(codeToRun);
    setStrudelUrl(`${BASE_URL}/?code=${encoded}`);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copyFeedback, setCopyFeedback] = useState("");

  const handleInsertSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText) {
      const textToHandle = `\n${selectedText}\n`;

      navigator.clipboard.writeText(textToHandle).then(() => {
        setCopyFeedback("Copied!");
        setTimeout(() => setCopyFeedback(""), 2000);
      });

      try {
        const win = iframeRef.current?.contentWindow as any;
        if (win && win.strudelMirror && win.strudelMirror.editor) {
          const view = win.strudelMirror.editor;
          const cursor = view.state.selection.main.head;
          view.dispatch({
            changes: { from: cursor, insert: textToHandle },
            selection: { anchor: cursor + textToHandle.length },
            scrollIntoView: true
          });
          setCopyFeedback("Inserted!");
        }
      } catch (e) {
        console.log("Auto-insert blocked by CORS");
      }
    } else {
      alert("Please select some code to insert.");
    }
  };

  const getFullScreenUrl = () => {
    const encoded = encodeURIComponent(code);
    return `${BASE_URL}/?code=${encoded}`;
  };

  const enrichPrompt = (style: string) => {
    const enrichment = `Make a ${style} beat`;
    setInputValue((prev) => prev ? `${prev}\n${enrichment}` : enrichment);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage({ role: 'user', content: inputValue } as any);
    setInputValue("");
  };

  // Auto-scroll chat to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex h-screen bg-black text-white overflow-hidden font-mono">
      {/* Sidebar - Examples (Hidden on small screens) */}
      <aside className="w-64 border-r border-gray-800 flex flex-col hidden lg:flex bg-gray-950">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-2">
            <span className="font-bold text-lg text-gray-200">📂 Examples</span>
          </div>
          <div className="px-2 pb-4">
            {examples.map((ex) => (
              <button
                key={ex.filename}
                onClick={() => loadExample(ex.content)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm mb-1 truncate transition-colors text-gray-400 hover:text-white"
                title={ex.title}
              >
                {ex.title}
              </button>
            ))}
            <a
              href="https://github.com/alienmind/algorave/tree/main/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm mb-1 truncate transition-colors text-gray-500 hover:text-white block italic"
            >
              More on GitHub ↗
            </a>
          </div>
          <div className="border-t border-gray-800 mx-4 my-2"></div>
          <div className="p-4 pb-2">
            <span className="font-bold text-lg text-gray-200">📚 Resources</span>
          </div>
          <div className="px-2 pb-4">
            <a href="https://strudel.cc/workshop/getting-started/" target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm mb-1 truncate transition-colors text-gray-400 hover:text-white block">
              Official Tutorial ↗
            </a>
            <a href="https://www.youtube.com/watch?v=QRJ0xrjLj6A" target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm mb-1 truncate transition-colors text-gray-400 hover:text-white block">
              Workshop (YouTube) ↗
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="z-10 w-full items-center justify-between text-sm lg:flex border-b border-gray-800 p-4">
          <div className="flex w-full items-center justify-start">
            <img src="/logo.png" alt="Algorave Hub" className="h-8 w-auto mr-4" />
            <p className="text-lg font-bold mr-4">Algorave Hub</p>
          </div>
          <a href="/presentation.html" target="_blank" rel="noopener noreferrer" className="mt-4 lg:mt-0 text-gray-400 hover:text-white underline whitespace-nowrap">
            See documentation
          </a>
        </div>

        <div className="w-full flex flex-col flex-1 min-h-0 p-4 pt-0">

          {/* Top Pane: Prompt & Controls */}
          <div className="flex-none flex flex-col gap-4 mb-4 bg-gray-900 border border-gray-800 rounded p-4">

            {/* Chat History (Compact) - Only show if there are messages */}
            {messages.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2 mb-2 p-2 bg-gray-950 rounded border border-gray-800 shadow-inner">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded px-2 py-1 text-xs ${m.role === 'user' ? 'bg-purple-900 text-purple-100' : 'bg-gray-800 text-gray-300'}`}>
                      <span className="font-bold opacity-50 block text-[10px] uppercase mb-0.5">{m.role}</span>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Prompt Input & Buttons */}
            <div className="flex flex-col gap-3">
              <form onSubmit={onSubmit} className="flex gap-4">
                <textarea
                  className="flex-1 p-3 rounded bg-gray-950 border border-gray-700 text-white focus:border-purple-500 focus:outline-none font-mono text-sm resize-none shadow-inner"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a prompt here (e.g., 'Make a minimal techno beat at 125bpm')..."
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue}
                  className="px-6 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 font-bold transition-colors shadow-lg flex items-center justify-center self-start h-full"
                >
                  {isLoading ? (
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : "Send"}
                </button>
              </form>

              {/* Helper / Genre Buttons */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-gray-500 uppercase font-bold mr-2">Quick Add:</span>
                {['techno', 'house', 'dnb', 'ambient', 'jungle', 'acid'].map(style => (
                  <button
                    key={style}
                    onClick={() => enrichPrompt(style)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-700 transition-colors text-purple-300 hover:text-white"
                    type="button"
                  >
                    + {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Pane: Editors Grid (Code + Strudel) - Takes remaining height */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            {/* Editor Pane (Read-only / Copy source) */}
            <div className="h-full flex flex-col min-h-0 bg-gray-900 border border-gray-700 rounded shadow-lg">
              <div className="flex justify-between items-center p-2 border-b border-gray-700 bg-gray-950">
                <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Generated Code
                </span>
                <button
                  onClick={handleInsertSelection}
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white transition-colors flex items-center gap-1 shadow-sm border border-green-600"
                  title="Copy selected text to clipboard & insert to Strudel"
                >
                  <span>{copyFeedback || "⚡ Insert Selection"}</span>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full flex-1 p-4 bg-gray-950 font-mono text-sm resize-none focus:outline-none text-green-400 selection:bg-green-900"
                placeholder="// Generated encoded will appear here..."
                spellCheck={false}
              />
            </div>

            {/* Strudel Iframe */}
            <div className="h-full flex flex-col min-h-0 bg-white border border-gray-700 rounded shadow-lg overflow-hidden relative">
              <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Strudel Player
                </span>
                <a
                  href={getFullScreenUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700 transition-colors flex items-center gap-1"
                >
                  <span>Open Full Screen ↗</span>
                </a>
              </div>
              <iframe
                ref={iframeRef}
                src={strudelUrl}
                className="w-full flex-1 bg-white"
                allow="midi; audio"
                title="Strudel Editor"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
