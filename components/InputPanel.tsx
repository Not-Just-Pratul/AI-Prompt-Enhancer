import React, { useState, useRef, useEffect } from 'react';
import { UploadedFile } from '../types';
import { FileUpload } from './FileUpload';
import { SparklesIcon } from './icons/SparklesIcon';
import { PERSONAS } from '../data/personas';
import { PROMPT_MODES } from '../data/promptModes';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

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

export const InputPanel: React.FC<InputPanelProps> = ({
  promptIdea,
  setPromptIdea,
  uploadedFiles,
  setUploadedFiles,
  persona,
  setPersona,
  promptMode,
  setPromptMode,
  onGenerate,
  isLoading,
}) => {
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPersona = PERSONAS.find(p => p.key === persona) || PERSONAS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPersonaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="bg-gray-900/80 p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/20 flex flex-col gap-6 md:gap-8 h-full">
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          1. Prompt Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROMPT_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setPromptMode(mode.key)}
              className={`text-sm py-2 px-1 rounded-md transition-colors text-center ${
                promptMode === mode.key
                  ? 'bg-gray-700 text-white font-semibold'
                  : 'bg-black/50 text-gray-400 hover:bg-gray-800'
              }`}
              title={mode.description}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="prompt-idea" className="block text-sm font-medium text-gray-300 mb-2">
          2. Describe your idea
        </label>
        <textarea
          id="prompt-idea"
          rows={5}
          className="w-full bg-black border border-gray-700 rounded-md p-4 text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-200 placeholder-gray-600"
          placeholder="e.g., A marketing campaign for a new sci-fi movie..."
          value={promptIdea}
          onChange={(e) => setPromptIdea(e.target.value)}
          maxLength={MAX_PROMPT_LENGTH}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {promptIdea.length} / {MAX_PROMPT_LENGTH}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          3. Choose a Persona (optional)
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsPersonaDropdownOpen(!isPersonaDropdownOpen)}
            className="w-full bg-black border border-gray-700 rounded-md p-3 text-gray-200 flex items-center justify-between text-left focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition duration-200"
            aria-haspopup="listbox"
            aria-expanded={isPersonaDropdownOpen}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex-shrink-0 text-gray-300">
                <selectedPersona.IconComponent />
              </div>
              <span className="font-semibold">{selectedPersona.name}</span>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isPersonaDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPersonaDropdownOpen && (
            <div className="absolute z-20 top-full mt-2 w-full bg-gray-950 border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox">
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPersona(p.key);
                    setIsPersonaDropdownOpen(false);
                  }}
                  className={`flex items-start gap-3 text-left p-3 rounded-md transition-colors w-full ${
                    persona === p.key ? 'bg-gray-700' : 'hover:bg-gray-800'
                  }`}
                  role="option"
                  aria-selected={persona === p.key}
                >
                  <div className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1">
                    <p.IconComponent />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          4. Add context (optional)
        </label>
        <FileUpload files={uploadedFiles} setFiles={setUploadedFiles} />
      </div>

      <div className="mt-auto">
        <button
          onClick={onGenerate}
          disabled={isLoading || !promptIdea}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 px-6 rounded-md hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 disabled:bg-gray-700 disabled:text-gray-400"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon />
              Enhance Prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
};
