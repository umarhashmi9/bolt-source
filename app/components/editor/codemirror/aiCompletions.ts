// app/components/editor/codemirror/aiCompletions.ts
import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import { language as languageFacet } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import type { AISuggestion, AISuggestionParams } from '~/lib/ai-assistant/types';

// Helper to get the current language using CodeMirror's language facet
function getActualCurrentLanguage(state: EditorState): string {
  const langConfig = state.facet(languageFacet);
  // The language facet might hold the Language instance directly, or an array of them.
  // If it's an array, it's typically the first one that's active.
  // The exact way to get the name might vary slightly based on CodeMirror version or specific language package structure.
  if (Array.isArray(langConfig) && langConfig.length > 0) {
    // @ts-expect-error - name might not be on Language type directly for all lang packages
    return langConfig[0]?.name?.toLowerCase() || langConfig[0]?.constructor?.name?.toLowerCase() || 'plaintext';
  } else if (langConfig && typeof langConfig === 'object') {
    // @ts-expect-error - name might not be on Language type directly for all lang packages
    return (langConfig as any).name?.toLowerCase() || (langConfig as any).constructor?.name?.toLowerCase() || 'plaintext';
  }
  return 'plaintext'; // Default fallback
}

export const aiCompletionSource = async (context: CompletionContext): Promise<CompletionResult | null> => {
  // Determine the token or text before the cursor to decide if we should complete
  // Example: complete if explicit, or if there's some text typed
  const word = context.matchBefore(/\w*/); // Matches a word before the cursor

  // Only trigger completions if explicitly requested, or if there's a word being typed,
  // or if it's after a character that might solicit a completion (like '.')
  // This logic can be refined.
  const shouldTrigger = context.explicit || (word && word.from !== word.to) || context.state.doc.sliceString(context.pos - 1, context.pos) === '.';

  if (!shouldTrigger) {
    return null;
  }

  const from = word ? word.from : context.pos;
  const codeBeforeCursor = context.state.doc.sliceString(0, context.pos);
  const currentLanguage = getActualCurrentLanguage(context.state);

  const params: AISuggestionParams = {
    code: codeBeforeCursor, // Send code up to cursor
    cursorPosition: context.pos,
    language: currentLanguage,
    task: 'complete',
    // fileName: could be passed if available globally or via context
  };

  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('AI Completion API error:', response.statusText);
      return null;
    }

    const result = await response.json();

    if (result.success && result.suggestions && result.suggestions.length > 0) {
      const completions: Completion[] = result.suggestions.map((s: AISuggestion) => ({
        label: s.code || '',
        apply: s.code, // Can be a function for more complex application logic
        type: s.type === 'completion' ? 'ai_completion' : s.type, // Custom type for styling
        detail: s.title,
        info: s.description, // `info` can render a DOM node or return a promise
        boost: -1, // AI suggestions might be boosted or de-prioritized as needed
      }));

      return {
        from: from, // Start of the text to be replaced by the completion
        options: completions,
        // validFor: /^\w*$/, // Example: allow further typing if it's still a word
      };
    }
  } catch (error) {
    console.error('Error fetching AI completions:', error);
    return null;
  }

  return null;
};
