import React, { useMemo } from 'react';
import { allExamplePrompts, ExamplePrompt } from '../data/examplePrompts';

interface ExamplePromptsProps {
  onSelectExample: (prompt: ExamplePrompt) => void;
  onFeelingLucky: () => void;
  isFeelingLuckyLoading: boolean;
}

const PromptCard: React.FC<{ prompt: ExamplePrompt; onSelect: (p: ExamplePrompt) => void }> = ({ prompt, onSelect }) => (
  <button
    onClick={() => onSelect(prompt)}
    className="text-left px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-200 flex-shrink-0 w-60 md:w-72 mx-1.5"
  >
    <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{prompt.text}</p>
  </button>
);

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectExample, onFeelingLucky, isFeelingLuckyLoading }) => {
  const duplicated = useMemo(() => {
    const shuffled = [...allExamplePrompts].sort(() => Math.random() - 0.5);
    return [...shuffled, ...shuffled];
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Examples</span>
        <button
          onClick={onFeelingLucky}
          disabled={isFeelingLuckyLoading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFeelingLuckyLoading ? (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
          I'm Feeling Lucky
        </button>
      </div>
      <div className="marquee-container py-1">
        <div className="marquee-content">
          {duplicated.map((prompt, i) => (
            <PromptCard key={i} prompt={prompt} onSelect={onSelectExample} />
          ))}
        </div>
      </div>
    </div>
  );
};
