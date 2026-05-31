import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { PromptHistoryItem } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';

interface HistoryPanelProps {
  history: PromptHistoryItem[];
  library: PromptHistoryItem[];
  onLoad: (item: PromptHistoryItem) => void;
  onDelete: (itemId: string) => void;
  onSave: (item: PromptHistoryItem) => void;
  onUnsave: (itemId: string) => void;
  isSaved: (itemId: string) => boolean;
}

type Tab = 'history' | 'library';

const PromptCard: React.FC<{
  item: PromptHistoryItem;
  onLoad: (item: PromptHistoryItem) => void;
  onDelete: (id: string) => void;
  onSave: (item: PromptHistoryItem) => void;
  onUnsave: (id: string) => void;
  isSaved: boolean;
}> = ({ item, onLoad, onDelete, onSave, onUnsave, isSaved }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const html = useMemo(() => marked.parse(item.prompt, { async: false }) as string, [item.prompt]);
  const time = useMemo(() => new Date(item.timestamp).toLocaleString(), [item.timestamp]);
  const idea = item.idea.length > 90 ? item.idea.slice(0, 90) + '…' : item.idea;

  return (
    <div className="panel flex flex-col gap-3 fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-grow min-w-0">
          <p className="text-xs text-gray-400 italic truncate">"{idea}"</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[11px] text-gray-600">{time}</span>
            <span className="tag">{item.mode}</span>
            <span className="tag">{item.persona}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <IconBtn onClick={() => isSaved ? onUnsave(item.id) : onSave(item)} title={isSaved ? 'Remove from library' : 'Save'}>
            <BookmarkIcon isFilled={isSaved} />
          </IconBtn>
          <IconBtn onClick={copy} title="Copy">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconBtn>
          <IconBtn onClick={() => onDelete(item.id)} title="Delete" danger>
            <TrashIcon />
          </IconBtn>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3.5 max-h-48 overflow-y-auto prose prose-invert prose-xs max-w-none prose-p:text-gray-400 prose-headings:text-gray-300">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <button
        onClick={() => onLoad(item)}
        className="w-full text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] py-2 rounded-lg transition-colors"
      >
        Load in editor
      </button>
    </div>
  );
};

const IconBtn: React.FC<{ onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode }> = ({ onClick, title, danger, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-colors ${danger ? 'text-gray-600 hover:text-red-400 hover:bg-red-950/30' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.06]'}`}
  >
    {children}
  </button>
);

const EmptyState: React.FC<{ tab: Tab }> = ({ tab }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/[0.06] rounded-2xl">
    <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
      {tab === 'history' ? (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      )}
    </div>
    <p className="text-sm text-gray-500">{tab === 'history' ? 'No history yet' : 'Library is empty'}</p>
    <p className="text-xs text-gray-600 mt-1">{tab === 'history' ? 'Generated prompts appear here.' : 'Save prompts from history.'}</p>
  </div>
);

export const HistoryPanel: React.FC<HistoryPanelProps> = (props) => {
  const [tab, setTab] = useState<Tab>('history');
  const items = tab === 'history' ? props.history : props.library;

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg w-fit">
        {(['history', 'library'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
              tab === t ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t} ({(t === 'history' ? props.history : props.library).length})
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
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
        <EmptyState tab={tab} />
      )}
    </div>
  );
};
