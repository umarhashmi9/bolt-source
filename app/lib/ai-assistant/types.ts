// app/lib/ai-assistant/types.ts
export interface AISuggestionParams {
  code: string;
  cursorPosition?: number;
  selection?: { from: number; to: number };
  language: string; // e.g., 'javascript', 'python', 'typescript'
  task: 'complete' | 'suggest_refactor' | 'fix_bug' | 'explain_code';
  // Consider adding filename if available, can be useful context for LLM
  fileName?: string;
}

export interface AISuggestion {
  id: string; // Unique ID for the suggestion
  type: 'completion' | 'refactor' | 'fix' | 'explanation';
  title?: string;
  description?: string;
  code?: string; // The suggested code or completion
  // For fixes/refactors, a diff might be useful in the future
  // diff?: string;
  from?: number; // Start of range to replace (if applicable)
  to?: number; // End of range to replace (if applicable)
}

export interface AISuggestionResponse {
  success: boolean;
  suggestions?: AISuggestion[];
  error?: string;
}
