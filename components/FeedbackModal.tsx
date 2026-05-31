import React, { useEffect } from 'react';
import { AnalysisFeedback } from '../types';

interface FeedbackModalProps {
  result: AnalysisFeedback;
  onClose: () => void;
}

const RatingBar: React.FC<{ score: number; label: string; feedback: string }> = ({ score, label, feedback }) => {
  const pct = score * 10;
  const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-white tabular-nums">{score}<span className="text-gray-600">/10</span></span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full rating-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{feedback}</p>
    </div>
  );
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ result, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="modal-in bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">Prompt Analysis</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <RatingBar score={result.clarity.score} label="Clarity" feedback={result.clarity.feedback} />
          <RatingBar score={result.specificity.score} label="Specificity" feedback={result.specificity.feedback} />
          <RatingBar score={result.constraints.score} label="Constraints" feedback={result.constraints.feedback} />
        </div>

        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Takeaway</p>
          <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
        </div>
      </div>
    </div>
  );
};
