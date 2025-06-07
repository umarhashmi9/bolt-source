// app/components/editor/codemirror/aiLintSource.ts
import { EditorView } from '@codemirror/view';
import { Diagnostic, setDiagnostics } from '@codemirror/lint';
import { EditorSelection, EditorState } from '@codemirror/state';
import { language as languageFacet } from '@codemirror/language';
import type { AISuggestion, AISuggestionParams } from '~/lib/ai-assistant/types';

// Helper to get the current language using CodeMirror's language facet
function getActualCurrentLanguage(state: EditorState): string {
  const langConfig = state.facet(languageFacet);
  if (Array.isArray(langConfig) && langConfig.length > 0) {
    // @ts-expect-error - name might not be on Language type directly for all lang packages
    return langConfig[0]?.name?.toLowerCase() || langConfig[0]?.constructor?.name?.toLowerCase() || 'plaintext';
  } else if (langConfig && typeof langConfig === 'object') {
    // @ts-expect-error - name might not be on Language type directly for all lang packages
    return (langConfig as any).name?.toLowerCase() || (langConfig as any).constructor?.name?.toLowerCase() || 'plaintext';
  }
  return 'plaintext'; // Default fallback
}

// This function will be called by a command to fetch and return diagnostics
export async function fetchAIRefactorSuggestions(view: EditorView): Promise<readonly Diagnostic[]> {
  const { state } = view;
  const diagnostics: Diagnostic[] = [];
  const currentLanguage = getActualCurrentLanguage(state);

  // For suggestions, we usually operate on the current selection, or the whole document if no selection
  let codeToAnalyze = '';
  let selectionRange: { from: number; to: number } | undefined = undefined;
  const mainSelection = state.selection.main;

  if (!mainSelection.empty) {
    codeToAnalyze = state.doc.sliceString(mainSelection.from, mainSelection.to);
    selectionRange = { from: mainSelection.from, to: mainSelection.to };
  } else {
    // If no selection, consider sending the whole document or a relevant block
    // For simplicity now, let's assume whole document if no selection,
    // or this could be a user option / smarter context gathering later.
    codeToAnalyze = state.doc.toString();
    selectionRange = { from: 0, to: state.doc.length };
  }

  if (!codeToAnalyze.trim()) {
    return []; // No code to analyze
  }

  const params: AISuggestionParams = {
    code: codeToAnalyze,
    selection: selectionRange, // Send the selection range if analysis is on selection
    language: currentLanguage,
    task: 'suggest_refactor',
    // fileName: could be passed
  };

  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('AI Refactor API error:', response.statusText);
      return [];
    }

    const result = await response.json();

    if (result.success && result.suggestions) {
      result.suggestions.forEach((s: AISuggestion) => {
        // Adjust 'from' and 'to' if the suggestion is relative to a snippet
        // For now, assume 's.from' and 's.to' are document-level if selectionRange was for the whole doc,
        // or relative to the start of the selection if a sub-part of selection is suggested.
        // This needs careful handling based on how AI returns ranges.
        // If AI returns ranges relative to the *snippet* sent, and we sent a selection,
        // then s.from and s.to need to be offset by selectionRange.from.
        let diagnosticFrom = s.from ?? mainSelection.from;
        let diagnosticTo = s.to ?? mainSelection.to;

        if (selectionRange && !mainSelection.empty && s.from != null && s.to != null) {
            diagnosticFrom = selectionRange.from + s.from;
            diagnosticTo = selectionRange.from + s.to;
        }


        diagnostics.push({
          from: diagnosticFrom,
          to: diagnosticTo,
          severity: 'hint', // 'info' or 'hint' for suggestions
          message: s.title || s.description || 'AI Suggestion',
          source: 'AI Assistant',
          actions: s.code // Only add action if there's code to apply
            ? [
                {
                  name: `Apply: ${s.title || 'Apply suggestion'}`,
                  apply: (v: EditorView, fromApply: number, toApply: number) => {
                    // The 'from' and 'to' for apply are the diagnostic's range
                    v.dispatch({
                      changes: { from: fromApply, to: toApply, insert: s.code },
                      selection: EditorSelection.cursor(fromApply + (s.code?.length || 0)),
                      scrollIntoView: true,
                    });
                  },
                },
              ]
            : [],
        });
      });
    }
  } catch (error) {
    console.error('Error fetching AI refactor suggestions:', error);
  }
  return diagnostics;
}

export const triggerAIRefactorCommand = (view: EditorView): boolean => {
  const loadingDiagnostic: Diagnostic = {
    from: view.state.selection.main.from,
    to: view.state.selection.main.to,
    severity: 'info',
    message: 'AI Assistant: Analyzing for refactorings...',
    source: 'AI Assistant',
  };
  view.dispatch(setDiagnostics(view.state, [loadingDiagnostic]));

  fetchAIRefactorSuggestions(view)
    .then(diagnostics => {
      // Dispatch a transaction to update the diagnostics in the lint state field
      // Ensure the lint extension is configured to pick these up.
      // The setDiagnostics effect comes from @codemirror/lint
      view.dispatch(setDiagnostics(view.state, diagnostics));
      if (diagnostics.length > 0) {
        // Optionally, open the lint panel if you have one and it's not open
        // openLintPanel(view); // This command would need to be imported or available
        console.log('AI Refactor suggestions loaded.');
      } else {
        console.log('No AI Refactor suggestions found.');
        // Clear previous AI suggestions if any
        view.dispatch(setDiagnostics(view.state, []));
      }
    })
    .catch(error => {
      console.error("Error triggering AI Refactor:", error);
      // Clear diagnostics on error too
      view.dispatch(setDiagnostics(view.state, []));
    });
  return true; // Command successfully initiated
};

export async function fetchAIBugFixSuggestions(view: EditorView): Promise<readonly Diagnostic[]> {
  const { state } = view;
  const diagnostics: Diagnostic[] = [];
  const currentLanguage = getActualCurrentLanguage(state); // Use updated function

  let codeToAnalyze = '';
  let selectionRange: { from: number; to: number } | undefined = undefined;
  const mainSelection = state.selection.main;

  if (!mainSelection.empty) {
    codeToAnalyze = state.doc.sliceString(mainSelection.from, mainSelection.to);
    selectionRange = { from: mainSelection.from, to: mainSelection.to };
  } else {
    codeToAnalyze = state.doc.toString();
    selectionRange = { from: 0, to: state.doc.length };
  }

  if (!codeToAnalyze.trim()) {
    return [];
  }

  const params: AISuggestionParams = {
    code: codeToAnalyze,
    selection: selectionRange,
    language: currentLanguage,
    task: 'fix_bug',
    // fileName: could be passed
  };

  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('AI Bug Fix API error:', response.statusText);
      return [];
    }

    const result = await response.json();

    if (result.success && result.suggestions) {
      result.suggestions.forEach((s: AISuggestion) => {
        let diagnosticFrom = s.from ?? mainSelection.from;
        let diagnosticTo = s.to ?? mainSelection.to;

        if (selectionRange && !mainSelection.empty && s.from != null && s.to != null) {
            diagnosticFrom = selectionRange.from + s.from;
            diagnosticTo = selectionRange.from + s.to;
        }

        diagnostics.push({
          from: diagnosticFrom,
          to: diagnosticTo,
          severity: 'warning', // Severity for bug fixes
          message: s.title || s.description || 'AI Bug Fix Suggestion',
          source: 'AI Assistant (Bug Fix)',
          actions: s.code
            ? [
                {
                  name: `Apply Fix: ${s.title || 'Accept fix'}`,
                  apply: (v: EditorView, fromApply: number, toApply: number) => {
                    v.dispatch({
                      changes: { from: fromApply, to: toApply, insert: s.code },
                      selection: EditorSelection.cursor(fromApply + (s.code?.length || 0)),
                      scrollIntoView: true,
                    });
                  },
                },
              ]
            : [],
        });
      });
    }
  } catch (error) {
    console.error('Error fetching AI bug fix suggestions:', error);
  }
  return diagnostics;
}

export const triggerAIBugFixCommand = (view: EditorView): boolean => {
  const loadingDiagnostic: Diagnostic = {
    from: view.state.selection.main.from,
    to: view.state.selection.main.to,
    severity: 'info',
    message: 'AI Assistant: Scanning for bugs...',
    source: 'AI Assistant',
  };
  view.dispatch(setDiagnostics(view.state, [loadingDiagnostic]));

  fetchAIBugFixSuggestions(view)
    .then(diagnostics => {
      view.dispatch(setDiagnostics(view.state, diagnostics));
      if (diagnostics.length > 0) {
        console.log('AI Bug Fix suggestions loaded.');
      } else {
        console.log('No AI Bug Fix suggestions found.');
        // Optionally clear previous AI bug fix diagnostics if desired
        // view.dispatch(setDiagnostics(view.state, [])); // Or filter to keep other types
      }
    })
    .catch(error => {
      console.error("Error triggering AI Bug Fix:", error);
      view.dispatch(setDiagnostics(view.state, [])); // Clear on error
    });
  return true;
};
