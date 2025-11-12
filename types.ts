export interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64 encoded string
  preview?: string; // Short preview of text content
}

export interface PromptMode {
  key: string;
  name: string;
  description: string;
  instruction: string;
}

export interface PromptHistoryItem {
  id: string;
  idea: string;
  prompt: string;
  persona: string;
  mode: string;
  timestamp: number;
}

export interface AnalysisFeedback {
  clarity: {
    score: number;
    feedback: string;
  },
  specificity: {
    score: number;
    feedback: string;
  },
  constraints: {
    score: number;
    feedback: string;
  },
  summary: string;
}