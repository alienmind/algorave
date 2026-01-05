"use client";

import { useState, useEffect, useRef } from "react";
import { generatePattern } from "./actions";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_STRUDEL === "true";
  const BASE_URL = useLocal ? "http://localhost:4321" : "https://strudel.cc";
  const [strudelUrl, setStrudelUrl] = useState(BASE_URL);

  // Examples State
  const [examples, setExamples] = useState<{ filename: string; title: string; content: string }[]>([]);

  useEffect(() => {
    fetch('/examples/manifest.json')
      .then(res => res.json())
      .then(data => setExamples(data))
      .catch(err => console.error('Failed to load examples:', err));
  }, []);

  const handleGenerate = async (styleToUse: string) => {
    setIsLoading(true);
    try {
      const result = await generatePattern(styleToUse);
      if (result.success && result.data && (result.data as any).content) {
        const textContent = (result.data as any).content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');

        // When AI generates, we auto-play
        setCode(textContent);
        updatePreview(textContent);
      } else {
        alert("Failed to generate: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (newCode: string) => {
    // Only update the editor, do NOT auto-reload iframe
    setCode(newCode);
  };

  const updatePreview = (codeToRun: string) => {
    const encoded = encodeURIComponent(codeToRun);
    setStrudelUrl(`${BASE_URL}/?code=${encoded}`);
  };

  // Ref for textarea to access selection
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

      // 1. Always copy to clipboard
      navigator.clipboard.writeText(textToHandle).then(() => {
        setCopyFeedback("Copied!");
        setTimeout(() => setCopyFeedback(""), 2000);
      });

      // 2. Try to insert directly into iframe (Works if Same-Origin)
      try {
        const win = iframeRef.current?.contentWindow as any;
        // Access strudelMirror exposed by Strudel
        if (win && win.strudelMirror && win.strudelMirror.editor) {
          const view = win.strudelMirror.editor;
          const cursor = view.state.selection.main.head;
          view.dispatch({
            changes: { from: cursor, insert: textToHandle },
            selection: { anchor: cursor + textToHandle.length },
            scrollIntoView: true
          });
          // Also give feedback for insertion if successful
          setCopyFeedback("Inserted!");
        }
      } catch (e) {
        // Cross-origin restriction will trigger this if not on proxy
        console.log("Auto-insert blocked by CORS (Expected if not using Local Proxy)");
      }
    } else {
      alert("Please select some code to insert.");
    }
  };

  const getFullScreenUrl = () => {
    // Use current code state
    const encoded = encodeURIComponent(code);
    return `${BASE_URL}/?code=${encoded}`;
  };

  return (
    <main className="flex h-screen bg-black text-white overflow-hidden font-mono">
      {/* Sidebar - Examples */}
      <aside className="w-64 border-r border-gray-800 flex flex-col hidden lg:flex bg-gray-950">
        <div className="flex-1 overflow-y-auto">
          {/* Examples Section */}
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

          {/* Resources Section */}
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
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter style (e.g. techno, house)"
              className="flex-1 p-4 rounded bg-gray-900 border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={() => handleGenerate(prompt)}
              disabled={isLoading || !prompt}
              className="px-6 py-4 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 font-bold transition-colors"
            >
              {isLoading ? "Generaving..." : "Algorave!"}
            </button>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {['techno', 'house', 'dnb', 'ambient', 'jungle'].map(style => (
              <button
                key={style}
                onClick={() => { setPrompt(style); handleGenerate(style); }}
                className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 text-xs border border-gray-700 transition-colors"
              >
                {style}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="h-full flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={handleInsertSelection}
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white transition-colors flex items-center gap-1"
                  title="Copy selected text to clipboard (wrapped with newlines)"
                >
                  <span>📋 Copy Selection</span>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full flex-1 p-4 bg-gray-900 font-mono text-sm border border-gray-700 rounded resize-none focus:outline-none text-green-400"
                placeholder="Generated code will appear here..."
              />
            </div>
            <div className="h-full flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <button>
                  <a
                    href={getFullScreenUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white transition-colors flex items-center gap-1"
                    title="Click on the strudel logo for full screen strudel.cc"
                  >
                    <span>↗ Open Full Screen</span>
                  </a>
                </button>
              </div>
              <iframe
                src={strudelUrl}
                className="w-full flex-1 border border-gray-700 rounded bg-white"
                allow="midi; audio"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
