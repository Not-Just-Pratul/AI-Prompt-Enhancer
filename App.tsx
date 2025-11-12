import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile, PromptHistoryItem, AnalysisFeedback } from './types';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateAdvancedPrompt, generateLuckyPrompt, analyzePrompt } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ExamplePrompts } from './components/ExamplePrompts';
import { ExamplePrompt } from './data/examplePrompts';
import { RefinementPanel } from './components/RefinementPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { FeedbackModal } from './components/FeedbackModal';

type AppTab = 'create' | 'history';

const App: React.FC = () => {
  const [promptIdea, setPromptIdea] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [persona, setPersona] = useState<string>('default');
  const [promptMode, setPromptMode] = useState<string>('detailed');
  
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFeelingLuckyLoading, setIsFeelingLuckyLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isRefining, setIsRefining] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<AppTab>('create');
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [library, setLibrary] = useState<PromptHistoryItem[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisFeedback | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('promptHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedLibrary = localStorage.getItem('promptLibrary');
      if (storedLibrary) {
        setLibrary(JSON.parse(storedLibrary));
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  const saveHistory = (newHistory: PromptHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('promptHistory', JSON.stringify(newHistory));
  };

  const saveLibrary = (newLibrary: PromptHistoryItem[]) => {
    setLibrary(newLibrary);
    localStorage.setItem('promptLibrary', JSON.stringify(newLibrary));
  };

  const handleGenerate = useCallback(async (currentIdea: string, isRefinement: boolean = false) => {
    if (!currentIdea.trim()) {
      setError('Please enter a prompt idea.');
      return;
    }

    if (isRefinement) {
        setIsRefining(true);
    } else {
        setIsLoading(true);
    }
    setError(null);
    setGeneratedPrompt('');

    try {
      const stream = generateAdvancedPrompt(currentIdea, uploadedFiles, persona, promptMode);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setGeneratedPrompt(fullResponse);
      }
      
      // Add to history after successful generation
      const newHistoryItem: PromptHistoryItem = {
        id: crypto.randomUUID(),
        idea: currentIdea,
        prompt: fullResponse,
        persona,
        mode: promptMode,
        timestamp: Date.now(),
      };
      saveHistory([newHistoryItem, ...history]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate prompt. ${errorMessage}`);
      console.error(e);
    } finally {
      if (isRefinement) {
        setIsRefining(false);
      }
      else {
        setIsLoading(false);
      }
    }
  }, [uploadedFiles, persona, promptMode, history]);

  const handleInitialGenerate = () => handleGenerate(promptIdea);

  const handleRefine = (refinementText: string) => {
    const refinementIdea = `Here is the prompt to refine:\n---\n${generatedPrompt}\n---\nApply this instruction: "${refinementText}"`;
    handleGenerate(refinementIdea, true);
  };


  const handleSelectExample = (example: ExamplePrompt) => {
    setPromptIdea(example.text);
    setPersona(example.persona);
    setActiveTab('create');
    const inputElement = document.getElementById('prompt-idea');
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleFeelingLucky = async () => {
    setIsFeelingLuckyLoading(true);
    setError(null);
    try {
      const luckyPrompt = await generateLuckyPrompt();
      handleSelectExample(luckyPrompt);
    } catch(e) {
       const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsFeelingLuckyLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedPrompt) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    try {
        const result = await analyzePrompt(generatedPrompt);
        setAnalysisResult(result);
        setIsAnalysisModalOpen(true);
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Analysis failed. ${errorMessage}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSaveToLibrary = (item: PromptHistoryItem) => {
    if (!library.some(libItem => libItem.id === item.id)) {
        saveLibrary([item, ...library]);
    }
  };

  const handleRemoveFromLibrary = (itemId: string) => {
    saveLibrary(library.filter(item => item.id !== itemId));
  };
  
  const handleLoadFromHistory = (item: PromptHistoryItem) => {
    setPromptIdea(item.idea);
    setGeneratedPrompt(item.prompt);
    setPersona(item.persona);
    setPromptMode(item.mode);
    setUploadedFiles([]); // Files are not persisted, so we clear them
    setActiveTab('create');
  }

  const handleDeleteFromHistory = (itemId: string) => {
    saveHistory(history.filter(item => item.id !== itemId));
    // Also remove from library if it exists there
    handleRemoveFromLibrary(itemId);
  };


  return (
    <div className="flex flex-col min-h-screen bg-black text-gray-300">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 md:py-12 max-w-screen-xl">
        
        <div className="border-b border-gray-800 mb-6 sm:mb-8">
            <nav className="flex -mb-px space-x-6 sm:space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${activeTab === 'create' ? 'border-b-gray-200 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}
                >
                    Create Prompt
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${activeTab === 'history' ? 'border-b-gray-200 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}
                >
                    History & Library
                </button>
            </nav>
        </div>
        
        {activeTab === 'create' && (
            <>
                <ExamplePrompts onSelectExample={handleSelectExample} onFeelingLucky={handleFeelingLucky} isFeelingLuckyLoading={isFeelingLuckyLoading} />
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
                            onSave={() => {
                                const latestPrompt = history[0];
                                if(latestPrompt) handleSaveToLibrary(latestPrompt);
                            }}
                            isSavedToLibrary={history[0] && library.some(item => item.id === history[0].id)}
                        />
                         {generatedPrompt && !isLoading && !isRefining && (
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
                isSaved={(itemId) => library.some(item => item.id === itemId)}
            />
        )}

      </main>
      <Footer />
      {isAnalysisModalOpen && analysisResult && (
        <FeedbackModal 
            result={analysisResult} 
            onClose={() => setIsAnalysisModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
