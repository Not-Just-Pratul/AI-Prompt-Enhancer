import React, { useState } from 'react';

interface RefinementPanelProps {
  onRefine: (text: string) => void;
  isLoading: boolean;
}

export const RefinementPanel: React.FC<RefinementPanelProps> = ({ onRefine, isLoading }) => {
  const [text, setText] = useState('');

  const submit = () => {
    if (text.trim()) { onRefine(text); setText(''); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="panel fade-up flex flex-col gap-3">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Refine</span>
      <textarea
        id="refinement-input"
        rows={2}
        className="input-field resize-none"
        placeholder="e.g., Make the tone more professional…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isLoading}
      />
      <button
        onClick={submit}
        disabled={isLoading || !text.trim()}
        className="self-end flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] text-gray-200 text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Refining…
          </>
        ) : 'Apply'}
      </button>
    </div>
  );
};
