import React, { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';

interface OutputPanelProps {
  generatedPrompt: string;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onSave: () => void;
  isSavedToLibrary: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedPrompt,
  isLoading,
  error,
  onAnalyze,
  isAnalyzing,
  onSave,
  isSavedToLibrary,
}) => {
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedPrompt) {
      setCopied(false);
    }
  }, [generatedPrompt]);
  
  useEffect(() => {
    const element = scrollContainerRef.current;
    if (element) {
        const isScrolledToBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 20;
        if (isScrolledToBottom) {
            element.scrollTop = element.scrollHeight - element.clientHeight;
        }
    }
  }, [generatedPrompt]);

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parsedHtml = useMemo(() => {
    if (!generatedPrompt) return '';
    return marked.parse(generatedPrompt, { async: false }) as string;
  }, [generatedPrompt]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-red-400 bg-red-900/20 border border-red-800/50 p-4 rounded-md">
          <p className="font-semibold text-red-300">An error occurred:</p>
          <p>{error}</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <>
          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none prose-pre:bg-gray-900/70 prose-pre:p-4 prose-pre:rounded-lg prose-code:text-rose-300 prose-code:before:content-[''] prose-code:after:content-['']"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
          <span className="blinking-cursor" />
        </>
      );
    }

    if (generatedPrompt) {
      return (
        <div
          className="prose prose-invert prose-sm sm:prose-base max-w-none prose-pre:bg-gray-900/70 prose-pre:p-4 prose-pre:rounded-lg prose-code:text-rose-300 prose-code:before:content-[''] prose-code:after:content-['']"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      );
    }

    return (
      <div className="text-center text-gray-600 flex flex-col items-center justify-center h-full p-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mb-4 sm:mb-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-base sm:text-lg font-semibold text-gray-500">Your enhanced prompt will appear here.</p>
        <p className="text-sm sm:text-base text-gray-600">Describe your idea, add context, and click "Enhance Prompt" to start.</p>
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/20 relative min-h-[300px] sm:min-h-[400px] lg:min-h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Generated Prompt</h2>
        {generatedPrompt && !isLoading && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 p-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Analyze prompt"
            >
              {isAnalyzing ? (
                 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <ChartPieIcon />}
            </button>
             <button
              onClick={onSave}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 p-2 rounded-lg transition"
              aria-label="Save to library"
              title={isSavedToLibrary ? 'Saved in library' : 'Save to library'}
            >
              <BookmarkIcon isFilled={isSavedToLibrary} />
            </button>
            <button
              onClick={handleCopy}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 p-2 rounded-lg transition"
              aria-label="Copy prompt"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        )}
      </div>
      <div ref={scrollContainerRef} className="bg-black/50 rounded-lg p-4 sm:p-6 flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
