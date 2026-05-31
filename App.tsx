import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadedFile, PromptHistoryItem, AnalysisFeedback } from './types';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateAdvancedPrompt, generateLuckyPrompt, analyzePrompt } from './services/openRouterService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ExamplePrompts } from './components/ExamplePrompts';
import { ExamplePrompt } from './data/examplePrompts';
import { RefinementPanel } from './components/RefinementPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { FeedbackModal } from './components/FeedbackModal';

type AppTab = 'create' | 'history';

const HISTORY_KEY = 'promptHistory';
const LIBRARY_KEY = 'promptLibrary';

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

const App: React.FC = () => {
  const [promptIdea, setPromptIdea] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [persona, setPersona] = useState('default');
  const [promptMode, setPromptMode] = useState('detailed');

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFeelingLuckyLoading, setIsFeelingLuckyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const [activeTab, setActiveTab] = useState<AppTab>('create');
  const [history, setHistory] = useState<PromptHistoryItem[]>(() => loadFromStorage(HISTORY_KEY));
  const [library, setLibrary] = useState<PromptHistoryItem[]>(() => loadFromStorage(LIBRARY_KEY));

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisFeedback | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  const saveHistory = useCallback((next: PromptHistoryItem[]) => {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }, []);

  const handleGenerate = useCallback(async (currentIdea: string, isRefinement = false) => {
    if (!currentIdea.trim()) { setError('Please enter a prompt idea.'); return; }

    isRefinement ? setIsRefining(true) : setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');

    try {
      const stream = generateAdvancedPrompt(currentIdea, uploadedFiles, persona, promptMode);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setGeneratedPrompt(fullResponse);
      }

      const newItem: PromptHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        idea: currentIdea,
        prompt: fullResponse,
        persona,
        mode: promptMode,
        timestamp: Date.now(),
      };
      saveHistory([newItem, ...historyRef.current]);
    } catch (e) {
      setError(`Failed to generate prompt. ${e instanceof Error ? e.message : 'An unknown error occurred.'}`);
    } finally {
      isRefinement ? setIsRefining(false) : setIsLoading(false);
    }
  }, [uploadedFiles, persona, promptMode, saveHistory]);

  const handleInitialGenerate = useCallback(() => handleGenerate(promptIdea), [handleGenerate, promptIdea]);

  const handleRefine = useCallback((refinementText: string) => {
    handleGenerate(
      `Here is the prompt to refine:\n---\n${generatedPrompt}\n---\nApply this instruction: "${refinementText}"`,
      true,
    );
  }, [handleGenerate, generatedPrompt]);

  const handleSelectExample = useCallback((example: ExamplePrompt) => {
    setPromptIdea(example.text);
    setPersona(example.persona);
    setActiveTab('create');
    document.getElementById('prompt-idea')?.focus();
  }, []);

  const handleFeelingLucky = useCallback(async () => {
    setIsFeelingLuckyLoading(true);
    setError(null);
    try {
      const lucky = await generateLuckyPrompt();
      handleSelectExample(lucky);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsFeelingLuckyLoading(false);
    }
  }, [handleSelectExample]);

  const handleAnalyze = useCallback(async () => {
    if (!generatedPrompt) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzePrompt(generatedPrompt);
      setAnalysisResult(result);
      setIsAnalysisModalOpen(true);
    } catch (e) {
      setError(`Analysis failed. ${e instanceof Error ? e.message : 'An unknown error occurred.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [generatedPrompt]);

  const handleSaveToLibrary = useCallback((item: PromptHistoryItem) => {
    setLibrary((prev: PromptHistoryItem[]) => {
      if (prev.some((l: PromptHistoryItem) => l.id === item.id)) return prev;
      const next = [item, ...prev];
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveFromLibrary = useCallback((itemId: string) => {
    setLibrary((prev: PromptHistoryItem[]) => {
      const next = prev.filter((i: PromptHistoryItem) => i.id !== itemId);
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLoadFromHistory = useCallback((item: PromptHistoryItem) => {
    setPromptIdea(item.idea);
    setGeneratedPrompt(item.prompt);
    setPersona(item.persona);
    setPromptMode(item.mode);
    setUploadedFiles([]);
    setActiveTab('create');
  }, []);

  const handleDeleteFromHistory = useCallback((itemId: string) => {
    saveHistory(historyRef.current.filter((i: PromptHistoryItem) => i.id !== itemId));
    handleRemoveFromLibrary(itemId);
  }, [saveHistory, handleRemoveFromLibrary]);

  const handleSaveLatest = useCallback(() => {
    const latest = historyRef.current[0];
    if (latest) handleSaveToLibrary(latest);
  }, [handleSaveToLibrary]);

  const isLatestSaved = history[0] ? library.some((i: PromptHistoryItem) => i.id === history[0].id) : false;
  const isSaved = useCallback((id: string) => library.some((i: PromptHistoryItem) => i.id === id), [library]);
  const closeModal = useCallback(() => setIsAnalysisModalOpen(false), []);

  return (
    <div className="flex flex-col min-h-screen bg-[#080808] text-gray-300">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 md:py-12 max-w-screen-xl">

        <div className="flex items-center gap-1 mb-8 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg w-fit">
          {(['create', 'history'] as AppTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'create' ? 'Create' : 'History & Library'}
            </button>
          ))}
        </div>

        {activeTab === 'create' && (
          <>
            <ExamplePrompts
              onSelectExample={handleSelectExample}
              onFeelingLucky={handleFeelingLucky}
              isFeelingLuckyLoading={isFeelingLuckyLoading}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <InputPanel
                promptIdea={promptIdea}
                setPromptIdea={setPromptIdea}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                persona={persona}
                setPersona={setPersona}
                promptMode={promptMode}
                setPromptMode={setPromptMode}
                onGenerate={handleInitialGenerate}
                isLoading={isLoading}
              />
              <div className="flex flex-col gap-8 lg:gap-12">
                <OutputPanel
                  generatedPrompt={generatedPrompt}
                  isLoading={isLoading}
                  error={error}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  onSave={handleSaveLatest}
                  isSavedToLibrary={isLatestSaved}
                />
                {generatedPrompt && !isLoading && (
                  <RefinementPanel onRefine={handleRefine} isLoading={isRefining} />
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            library={library}
            onLoad={handleLoadFromHistory}
            onDelete={handleDeleteFromHistory}
            onSave={handleSaveToLibrary}
            onUnsave={handleRemoveFromLibrary}
            isSaved={isSaved}
          />
        )}
      </main>
      <Footer />
      {isAnalysisModalOpen && analysisResult && (
        <FeedbackModal result={analysisResult} onClose={closeModal} />
      )}
    </div>
  );
};

export default App;
