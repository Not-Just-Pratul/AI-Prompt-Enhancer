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

const Spinner: React.FC = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedPrompt, isLoading, error,
  onAnalyze, isAnalyzing, onSave, isSavedToLibrary,
}) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (generatedPrompt) setCopied(false); }, [generatedPrompt]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [generatedPrompt]);

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedHtml = useMemo(() => {
    if (!generatedPrompt) return '';
    return marked.parse(generatedPrompt, { async: false }) as string;
  }, [generatedPrompt]);

  const hasContent = !!generatedPrompt || isLoading;

  return (
    <div className="panel flex flex-col min-h-[320px] lg:min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Output</span>
        {generatedPrompt && !isLoading && (
          <div className="flex items-center gap-1 fade-up">
            <IconBtn onClick={onAnalyze} disabled={isAnalyzing} title="Analyze">
              {isAnalyzing ? <Spinner /> : <ChartPieIcon />}
            </IconBtn>
            <IconBtn onClick={onSave} title={isSavedToLibrary ? 'Saved' : 'Save to library'}>
              <BookmarkIcon isFilled={isSavedToLibrary} />
            </IconBtn>
            <IconBtn onClick={handleCopy} title="Copy">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </IconBtn>
          </div>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto rounded-lg bg-white/[0.02] border border-white/[0.05] p-4 sm:p-5">
        {error ? (
          <div className="text-red-400 bg-red-950/40 border border-red-900/50 p-3.5 rounded-lg text-sm fade-up">
            <p className="font-medium text-red-300 mb-1">Error</p>
            <p>{error}</p>
          </div>
        ) : hasContent ? (
          <div className="fade-up">
            <div
              className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:rounded-lg prose-code:text-rose-300 prose-code:before:content-[''] prose-code:after:content-[''] prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
            {isLoading && <span className="blinking-cursor" />}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Your enhanced prompt will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const IconBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);
