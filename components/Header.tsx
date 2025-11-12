
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-950/70 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-5 max-w-screen-xl flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-center tracking-wide text-gray-100">
          AI Prompt Enhancer
        </h1>
      </div>
    </header>
  );
};