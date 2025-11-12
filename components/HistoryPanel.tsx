import React, { useState } from 'react';
import { marked } from 'marked';
import { PromptHistoryItem } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { StarIcon } from './icons/StarIcon';

interface HistoryPanelProps {
  history: PromptHistoryItem[];
  library: PromptHistoryItem[];
  onLoad: (item: PromptHistoryItem) => void;
  onDelete: (itemId: string) => void;
  onSave: (item: PromptHistoryItem) => void;
  onUnsave: (itemId: string) => void;
  isSaved: (itemId: string) => boolean;
}

type HistoryTab = 'history' | 'library';

const PromptCard: React.FC<{
    item: PromptHistoryItem;
    onLoad: (item: PromptHistoryItem) => void;
    onDelete: (itemId: string) => void;
    onSave: (item: PromptHistoryItem) => void;
    onUnsave: (itemId: string) => void;
    isSaved: boolean;
}> = ({ item, onLoad, onDelete, onSave, onUnsave, isSaved }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const promptHtml = marked.parse(item.prompt, { async: false }) as string;
    const timeAgo = new Date(item.timestamp).toLocaleString();

    return (
        <div className="bg-gray-900/80 rounded-2xl border border-gray-800/80 p-4 sm:p-6 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-2 italic">Idea: "{item.idea.length > 100 ? item.idea.substring(0, 100) + '...' : item.idea}"</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{timeAgo}</span>
                        <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">{item.mode}</span>
                        <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">{item.persona}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => (isSaved ? onUnsave(item.id) : onSave(item))}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition"
                        title={isSaved ? "Remove from library" : "Save to library"}
                    >
                        <BookmarkIcon isFilled={isSaved} />
                    </button>
                    <button
                        onClick={() => handleCopy(item.prompt)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition"
                        title="Copy prompt"
                    >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                     <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-400 transition"
                        title="Delete prompt"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <div className="bg-black/50 rounded-lg p-4 max-h-60 overflow-y-auto mb-4 prose prose-invert prose-sm max-w-none">
                 <div dangerouslySetInnerHTML={{ __html: promptHtml }} />
            </div>
            <button
                onClick={() => onLoad(item)}
                className="mt-auto w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition"
            >
                Load in Creator
            </button>
        </div>
    );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('history');
  
  const displayedItems = activeTab === 'history' ? props.history : props.library;

  const renderEmptyState = () => {
    if (activeTab === 'history') {
        return (
            <div className="text-center text-gray-600 flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                <ClockIcon />
                <p className="mt-4 text-lg font-semibold text-gray-500">No History Yet</p>
                <p className="text-gray-600">Prompts you generate will appear here automatically.</p>
            </div>
        );
    }
     if (activeTab === 'library') {
        return (
            <div className="text-center text-gray-600 flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                <StarIcon />
                <p className="mt-4 text-lg font-semibold text-gray-500">Your Library is Empty</p>
                <p className="text-gray-600">Save your favorite prompts from your history to find them here later.</p>
            </div>
        );
    }
    return null;
  }

  return (
    <div>
        <div className="flex items-center gap-2 mb-6">
            <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'history' ? 'bg-gray-700 text-white' : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'}`}
            >
                History ({props.history.length})
            </button>
            <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'library' ? 'bg-gray-700 text-white' : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'}`}
            >
                Library ({props.library.length})
            </button>
        </div>

        {displayedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedItems.map(item => (
                    <PromptCard 
                        key={item.id}
                        item={item}
                        onLoad={props.onLoad}
                        onDelete={props.onDelete}
                        onSave={props.onSave}
                        onUnsave={props.onUnsave}
                        isSaved={props.isSaved(item.id)}
                    />
                ))}
            </div>
        ) : (
            renderEmptyState()
        )}
    </div>
  );
};
