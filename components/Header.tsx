import React from 'react';

export const Header: React.FC = () => (
  <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-md">
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Prompt Enhancer</span>
      </div>
    </div>
  </header>
);
