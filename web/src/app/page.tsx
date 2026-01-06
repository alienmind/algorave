"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";

export default function Home() {
  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_STRUDEL === "true";
  const BASE_URL = useLocal ? "http://localhost:4321" : "https://strudel.cc";
  const [strudelUrl, setStrudelUrl] = useState(BASE_URL);

  // Chat Hook
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message: Message) => {
      // Auto-detect code blocks to update the preview
      // Simple regex to find content between ``` and ```
      const codeBlock = message.content.match(/```(?:tidal|strudel)?\s*([\s\S]*?)```/);
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
    setInput((prev) => prev ? prev + " (loaded example code)" : "Explain this code");
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
    setInput((prev) => prev ? `${prev} and ${enrichment}` : enrichment);
  };

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

        <div className="w-full flex flex-col flex-1 min-h-0 p-4">

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 mb-4 bg-gray-900 border border-gray-700 rounded overflow-hidden">

            {/* Messages List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-gray-500 text-center mt-10">
                  <p>👋 I'm your AI Live Coding Assistant.</p>
                  <p className="text-sm mt-2">Ask me to generate a beat, play a bassline, or explain code!</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl rounded-lg p-3 ${m.role === 'user' ? 'bg-purple-900 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    {/* Render tool invocations if any? m.toolInvocations */}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-950 border-t border-gray-800">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                  className="flex-1 p-4 rounded bg-gray-900 border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Describe the music you want..."
                />
                <button
                  type="submit"
                  disabled={isLoading || !input}
                  className="px-6 py-4 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 font-bold transition-colors"
                >
                  {isLoading ? "..." : "Send"}
                </button>
              </form>
              {/* Helper Tags */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {['techno', 'house', 'dnb', 'ambient', 'jungle'].map(style => (
                  <button
                    key={style}
                    onClick={() => enrichPrompt(style)}
                    className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 text-xs border border-gray-700 transition-colors text-gray-400 hover:text-white"
                    type="button"
                  >
                    + {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editors Grid (Code + Strudel) - Reduced height to fit Chat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-1/3 min-h-[300px]">
            {/* Editor Pane (Read-only / Copy source) */}
            <div className="h-full flex flex-col min-h-0 bg-gray-900 border border-gray-700 rounded">
              <div className="flex justify-between items-center p-2 border-b border-gray-700 bg-gray-950">
                <span className="text-xs text-gray-500 font-bold uppercase">Active Pattern Code</span>
                <button
                  onClick={handleInsertSelection}
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white transition-colors flex items-center gap-1"
                  title="Copy selected text to clipboard (wrapped with newlines)"
                >
                  <span>{copyFeedback || "📋 Copy Selection"}</span>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full flex-1 p-4 bg-transparent font-mono text-sm resize-none focus:outline-none text-green-400"
                placeholder="Generated code will appear here..."
              />
            </div>

            {/* Strudel Iframe */}
            <div className="h-full flex flex-col min-h-0 bg-white border border-gray-700 rounded">
              <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500 font-bold uppercase">Strudel Player</span>
                <a
                  href={getFullScreenUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700 transition-colors flex items-center gap-1"
                >
                  <span>↗ Open Full</span>
                </a>
              </div>
              <iframe
                ref={iframeRef}
                src={strudelUrl}
                className="w-full flex-1"
                allow="midi; audio"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
