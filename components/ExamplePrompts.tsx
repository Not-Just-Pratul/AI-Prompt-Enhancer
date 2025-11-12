import React from 'react';
import { allExamplePrompts, ExamplePrompt } from '../data/examplePrompts';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { WandIcon } from './icons/WandIcon';

interface ExamplePromptsProps {
  onSelectExample: (prompt: ExamplePrompt) => void;
  onFeelingLucky: () => void;
  isFeelingLuckyLoading: boolean;
}

const PromptCard: React.FC<{prompt: ExamplePrompt, onSelect: (prompt: ExamplePrompt) => void}> = ({ prompt, onSelect }) => (
    <button
      onClick={() => onSelect(prompt)}
      className="text-left p-4 bg-black/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200 flex flex-col flex-shrink-0 w-64 md:w-72 h-36 mx-2"
    >
      <p className="text-gray-300 text-sm whitespace-normal">{prompt.text}</p>
    </button>
);


export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectExample, onFeelingLucky, isFeelingLuckyLoading }) => {
  const duplicatedPrompts = [...allExamplePrompts, ...allExamplePrompts];

  return (
    <div className="mb-8 lg:mb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
            <div className="text-gray-400">
              <LightbulbIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">Not sure where to start? Try an example.</h2>
        </div>
        <button
            onClick={onFeelingLucky}
            disabled={isFeelingLuckyLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
            {isFeelingLuckyLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
            ) : (
                <>
                    <WandIcon />
                    I'm Feeling Lucky
                </>
            )}
        </button>
      </div>
      
      <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800/80">
        <div className="marquee-container">
            <div className="marquee-content">
                {duplicatedPrompts.map((prompt, index) => (
                    <PromptCard key={index} prompt={prompt} onSelect={onSelectExample} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};