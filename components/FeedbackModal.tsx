import React from 'react';
import { AnalysisFeedback } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface FeedbackModalProps {
  result: AnalysisFeedback;
  onClose: () => void;
}

const RatingBar: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    const percentage = score * 10;
    let colorClass = 'bg-red-500';
    if (score >= 8) colorClass = 'bg-green-500';
    else if (score >= 5) colorClass = 'bg-yellow-500';

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <span className="text-sm font-bold text-white">{score}/10</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ result, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 relative text-white modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Prompt Analysis</h2>

        <div className="space-y-6">
          <div>
            <RatingBar score={result.clarity.score} label="Clarity" />
            <p className="text-sm text-gray-400 mt-2 italic">"{result.clarity.feedback}"</p>
          </div>
          <div>
            <RatingBar score={result.specificity.score} label="Specificity" />
            <p className="text-sm text-gray-400 mt-2 italic">"{result.specificity.feedback}"</p>
          </div>
          <div>
            <RatingBar score={result.constraints.score} label="Constraints" />
            <p className="text-sm text-gray-400 mt-2 italic">"{result.constraints.feedback}"</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">Key Takeaway</h3>
            <p className="text-center text-lg text-gray-200">
                {result.summary}
            </p>
        </div>
      </div>
    </div>
  );
};
