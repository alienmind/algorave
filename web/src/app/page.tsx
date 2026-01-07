'use client';

import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Page() {
  const [activeCode, setActiveCode] = useState('// Select an example to view code');
  const [chatUrl, setChatUrl] = useState('http://localhost:8080'); // Open WebUI
  // Default to a safe starting URL
  const [playerUrl, setPlayerUrl] = useState('https://strudel.cc/?embed=1&sidebar=0');
  const [examples, setExamples] = useState<string[]>([]);

  // Fetch examples on mount
  useEffect(() => {
    fetch('/api/examples')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setExamples(data.files);
        }
      })
      .catch(err => console.error('Failed to load examples:', err));
  }, []);

  // Handle example click
  const handleExampleClick = (filename: string) => {
    // 1. Fetch the code content
    fetch(`/examples/${filename}`)
      .then(res => res.text())
      .then(code => {
        setActiveCode(code);
      })
      .catch(err => console.error('Failed to load example code:', err));
  };

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden">

      {/* SECTION A: Left Navbar (Examples & Links) */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Algorave Hub
          </h1>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Workshop Section */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Workshop
            </h2>
            <ul className="space-y-1">
              <li>
                <a
                  href="/presentation.html"
                  className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Slides
                </a>
              </li>
            </ul>
          </div>

          {/* Examples List */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Examples
            </h2>
            <ul className="space-y-1">
              {examples.map((file) => (
                <li key={file}>
                  <button
                    onClick={() => handleExampleClick(file)}
                    className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors truncate"
                    title={file}
                  >
                    {file}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-800">
              <a
                href="https://github.com/alienmind/algorave/tree/main/examples"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View on GitHub</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Useful Links
            </h2>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://strudel.cc/workshop/getting-started/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Strudel Workshop
                </a>
              </li>
              <li>
                <a
                  href="https://strudel.cc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Official Strudel Site
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Main Content Area (2x2 Grid) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* SECTION B: Upper Box (Code Viewer) */}
        <div className="h-1/3 border-b border-gray-800 bg-[#1e1e1e] flex flex-col">
          <div className="px-4 py-2 bg-[#252526] text-xs text-gray-400 border-b border-[#333] flex justify-start items-center gap-4">
            <span>Code Viewer</span>
            <button
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(activeCode);
                // Optional visual feedback could go here
              }}
            >
              Copy Code
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '14px' }}
              showLineNumbers={true}
            >
              {activeCode}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Bottom Split: Chat & Player */}
        <div className="flex-1 flex min-h-0">

          {/* SECTION C: Open WebUI Chat (Iframe) */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col bg-gray-900">
            <div className="px-4 py-2 bg-gray-800 text-xs font-semibold text-gray-400 border-b border-gray-700 flex justify-between items-center">
              <span>AI COMPOSER (Open WebUI)</span>
              <input
                type="text"
                value={chatUrl}
                onChange={(e) => setChatUrl(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-gray-500 w-48 text-right focus:text-gray-300 focus:outline-none"
              />
            </div>
            <div className="flex-1 relative">
              <iframe
                src={chatUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="microphone; camera; clipboard-write"
                title="AI Chat"
              />
            </div>
          </div>

          {/* SECTION D: Strudel Player (Iframe) */}
          <div className="w-1/2 flex flex-col bg-black">
            <div className="px-4 py-2 bg-gray-800 text-xs font-semibold text-gray-400 border-b border-gray-700">
              <span>LIVE ENVIRONMENT (Strudel)</span>
            </div>
            <div className="flex-1 relative bg-black">
              <iframe
                src={playerUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="midi; audio; microphone"
                title="Strudel Player"
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
