"use client";

import { useState } from "react";
import { generatePattern } from "./actions";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_STRUDEL === "true";
  const BASE_URL = useLocal ? "http://localhost:4321" : "https://strudel.cc";
  const [strudelUrl, setStrudelUrl] = useState(BASE_URL);

  const handleGenerate = async (styleToUse: string) => {
    setIsLoading(true);
    try {
      const result = await generatePattern(styleToUse);
      if (result.success && result.data && (result.data as any).content) {
        const textContent = (result.data as any).content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');

        setCode(textContent);

        const encoded = encodeURIComponent(textContent);
        setStrudelUrl(`${BASE_URL}/?code=${encoded}`);
      } else {
        alert("Failed to generate: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen flex-col items-stretch p-4 bg-black text-white overflow-hidden">
      <div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex border-b border-gray-800 pb-4 mb-4">
        <div className="flex w-full items-center justify-start">
          <img src="/logo.png" alt="Algorave Hub" className="h-8 w-auto mr-4" />
          <p className="text-lg font-bold">Algorave Hub</p>
        </div>
        <a href="/presentation.html" target="_blank" rel="noopener noreferrer" className="mt-4 lg:mt-0 text-gray-400 hover:text-white underline">
          See documentation
        </a>
      </div>

      <div className="w-full flex flex-col flex-1 min-h-0">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter style (e.g. techno, house)"
            className="flex-1 p-4 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <button
            onClick={() => handleGenerate(prompt)}
            disabled={isLoading || !prompt}
            className="px-6 py-4 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? "Generaving..." : "Algorave!"}
          </button>
        </div>

        <div className="flex gap-4 mb-4 flex-wrap">
          {['techno', 'house', 'dnb', 'ambient', 'jungle'].map(style => (
            <button
              key={style}
              onClick={() => { setPrompt(style); handleGenerate(style); }}
              className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm"
            >
              {style}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="h-full flex flex-col">
            <h2 className="text-xl mb-2">Code Pattern</h2>
            <textarea
              value={code}
              readOnly
              className="w-full flex-1 p-4 bg-gray-900 font-mono text-sm border border-gray-700 rounded resize-none"
              placeholder="Generated code will appear here..."
            />
          </div>
          <div className="h-full flex flex-col">
            <h2 className="text-xl mb-2">Live Preview</h2>
            <iframe
              src={strudelUrl}
              className="w-full flex-1 border border-gray-700 rounded bg-white"
              allow="midi; audio"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
