import React, { useState } from 'react';

interface RefinementPanelProps {
  onRefine: (text: string) => void;
  isLoading: boolean;
}

export const RefinementPanel: React.FC<RefinementPanelProps> = ({ onRefine, isLoading }) => {
  const [refinementText, setRefinementText] = useState('');

  const handleRefineClick = () => {
    if (refinementText.trim()) {
      onRefine(refinementText);
      setRefinementText('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleRefineClick();
    }
  };


  return (
    <div className="bg-gray-900/80 p-4 sm:p-6 rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/20 flex flex-col gap-4 animate-fade-in">
      <div>
        <label htmlFor="refinement-input" className="block text-sm font-medium text-gray-300 mb-2">
          Refine Prompt
        </label>
        <textarea
          id="refinement-input"
          rows={2}
          className="w-full bg-black border border-gray-700 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-200 placeholder-gray-600"
          placeholder="e.g., Make the tone more professional"
          value={refinementText}
          onChange={(e) => setRefinementText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>
      <button
        onClick={handleRefineClick}
        disabled={isLoading || !refinementText.trim()}
        className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-2.5 px-6 rounded-md hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refining...
          </>
        ) : (
          'Refine'
        )}
      </button>
    </div>
  );
};
