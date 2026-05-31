import React, { useState, useRef, useEffect } from 'react';
import { UploadedFile } from '../types';
import { FileUpload } from './FileUpload';
import { PERSONAS } from '../data/personas';
import { PROMPT_MODES } from '../data/promptModes';

interface InputPanelProps {
  promptIdea: string;
  setPromptIdea: (value: string) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  persona: string;
  setPersona: (value: string) => void;
  promptMode: string;
  setPromptMode: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const MAX_PROMPT_LENGTH = 4000;

const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const InputPanel: React.FC<InputPanelProps> = ({
  promptIdea, setPromptIdea,
  uploadedFiles, setUploadedFiles,
  persona, setPersona,
  promptMode, setPromptMode,
  onGenerate, isLoading,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedPersona = PERSONAS.find(p => p.key === persona) || PERSONAS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="panel flex flex-col gap-6">

      {/* Mode */}
      <section>
        <Label>Mode</Label>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          {PROMPT_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setPromptMode(mode.key)}
              title={mode.description}
              className={`text-xs py-1.5 rounded-md font-medium transition-all duration-150 ${
                promptMode === mode.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </section>

      {/* Idea */}
      <section>
        <Label htmlFor="prompt-idea">Your idea</Label>
        <textarea
          id="prompt-idea"
          rows={5}
          className="input-field resize-none"
          placeholder="e.g., A marketing campaign for a new sci-fi movie..."
          value={promptIdea}
          onChange={e => setPromptIdea(e.target.value)}
          maxLength={MAX_PROMPT_LENGTH}
        />
        <div className="text-right text-[11px] text-gray-600 mt-1">
          {promptIdea.length}/{MAX_PROMPT_LENGTH}
        </div>
      </section>

      {/* Persona */}
      <section>
        <Label>Persona <span className="text-gray-600 font-normal">(optional)</span></Label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            className="input-field w-full flex items-center justify-between text-left"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 text-gray-400 flex-shrink-0"><selectedPersona.IconComponent /></span>
              <span className="text-sm text-gray-200">{selectedPersona.name}</span>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="slide-down absolute z-20 top-full mt-1.5 w-full bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl max-h-72 overflow-y-auto p-1.5 grid grid-cols-2 gap-1" role="listbox">
              {PERSONAS.map(p => (
                <button
                  key={p.key}
                  onClick={() => { setPersona(p.key); setDropdownOpen(false); }}
                  className={`flex items-start gap-2.5 text-left p-2.5 rounded-lg transition-colors w-full ${
                    persona === p.key ? 'bg-white/10 text-white' : 'hover:bg-white/[0.05] text-gray-300'
                  }`}
                  role="option"
                  aria-selected={persona === p.key}
                >
                  <span className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"><p.IconComponent /></span>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{p.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Files */}
      <section>
        <Label>Context <span className="text-gray-600 font-normal">(optional)</span></Label>
        <FileUpload files={uploadedFiles} setFiles={setUploadedFiles} />
      </section>

      {/* Generate */}
      <div className="mt-auto pt-2">
        <button
          onClick={onGenerate}
          disabled={isLoading || !promptIdea.trim()}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-2.5 px-5 rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white"
        >
          {isLoading ? (
            <><Spinner /> Generating…</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Enhance Prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
    {children}
  </label>
);
