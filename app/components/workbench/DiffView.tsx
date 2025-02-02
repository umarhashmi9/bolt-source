import { memo, useMemo, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FileMap } from '~/lib/stores/files';
import type { EditorDocument } from '~/components/editor/codemirror/CodeMirrorEditor';
import { diffLines, type Change } from 'diff';
import { getHighlighter } from 'shiki';
import Cookies from 'js-cookie';
import { classNames } from '~/utils/classNames';

interface CodeComparisonProps {
  beforeCode: string;
  afterCode: string;
  language: string;
  filename: string;
  lightTheme: string;
  darkTheme: string;
}

interface DiffBlock {
  lineNumber: number;
  content: string;
  type: 'added' | 'removed' | 'unchanged';
  correspondingLine?: number;
}

const CodeComparison = memo(({ beforeCode, afterCode, filename, language }: CodeComparisonProps) => {
  const [highlighter, setHighlighter] = useState<any>(null);
  const [expandedLeft, setExpandedLeft] = useState(false);
  const [expandedRight, setExpandedRight] = useState(false);
  
  const { beforeBlocks, afterBlocks, hasChanges } = useMemo(() => {
    const differences = diffLines(beforeCode, afterCode);
    const before: DiffBlock[] = [];
    const after: DiffBlock[] = [];
    let beforeLine = 1;
    let afterLine = 1;
    let hasModifications = false;

    differences.forEach((part: Change) => {
      const lines = part.value.split('\n').filter(line => line !== '');
      
      if (part.added) {
        lines.forEach(line => {
          after.push({
            lineNumber: afterLine++,
            content: line,
            type: 'added',
            correspondingLine: beforeLine - 1
          });
        });
      } else if (part.removed) {
        lines.forEach(line => {
          before.push({
            lineNumber: beforeLine++,
            content: line,
            type: 'removed',
            correspondingLine: afterLine - 1
          });
        });
      } else {
        lines.forEach(line => {
          const currentBefore = beforeLine++;
          const currentAfter = afterLine++;
          before.push({
            lineNumber: currentBefore,
            content: line,
            type: 'unchanged',
            correspondingLine: currentAfter
          });
          after.push({
            lineNumber: currentAfter,
            content: line,
            type: 'unchanged',
            correspondingLine: currentBefore
          });
        });
      }

      if (part.added || part.removed) {
        hasModifications = true;
      }
    });

    return { 
      beforeBlocks: before, 
      afterBlocks: after,
      hasChanges: hasModifications 
    };
  }, [beforeCode, afterCode]);

  useEffect(() => {
    getHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'json', 'html', 'css', 'jsx', 'tsx']
    }).then(setHighlighter);
  }, []);

  const renderDiffBlock = (block: DiffBlock) => {
    const bgColor = {
      added: 'bg-bolt-elements-background-depth-1 border-l-4 border-green-400 text-bolt-elements-textPrimary',
      removed: 'bg-bolt-elements-background-depth-1 border-l-4 border-red-400 text-bolt-elements-textPrimary',
      unchanged: 'text-bolt-elements-textPrimary'
    }[block.type];

    const highlightedCode = highlighter ? 
      highlighter.codeToHtml(block.content, { lang: language, theme: 'github-dark' }) : 
      block.content;

    return (
      <div key={block.lineNumber} className="flex group min-w-fit">
        <div className="w-12 shrink-0 pl-2 py-0.5 text-left font-mono text-bolt-elements-textTertiary border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
          {block.lineNumber}
        </div>
        <div className={`${bgColor} px-4 py-0.5 font-mono whitespace-pre flex-1 group-hover:bg-bolt-elements-background-depth-2`}>
          <span className="mr-2 text-bolt-elements-textTertiary">
            {block.type === 'added' && '+'}
            {block.type === 'removed' && '-'}
            {block.type === 'unchanged' && ' '}
          </span>
          <span 
            dangerouslySetInnerHTML={{ 
              __html: highlightedCode.replace(/<\/?pre[^>]*>/g, '').replace(/<\/?code[^>]*>/g, '') 
            }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full">
      <div className="relative w-full overflow-hidden rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
        <div className={classNames(
          "relative grid transition-all duration-200",
          expandedLeft ? "md:grid-cols-[1fr,0fr]" : 
          expandedRight ? "md:grid-cols-[0fr,1fr]" : 
          "md:grid-cols-2",
          "md:divide-x md:divide-bolt-elements-borderColor"
        )}>
          <div className={classNames(
            "flex flex-col min-w-0",
            expandedRight ? "md:hidden" : "md:block"
          )}>
            <div className="flex items-center bg-bolt-elements-background-depth-1 p-2 text-sm text-bolt-elements-textPrimary shrink-0">
              <div className="i-ph:file mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{filename}</span>
              <span className="ml-auto text-red-400 shrink-0">Original</span>
              <button 
                onClick={() => setExpandedLeft(!expandedLeft)}
                className={classNames(
                  "ml-2 p-1 rounded transition-colors shrink-0",
                  "bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2",
                  "text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                )}
              >
                <div className={classNames(
                  "w-4 h-4 transition-transform",
                  expandedLeft ? "i-ph:arrows-in" : "i-ph:arrows-out"
                )} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="overflow-x-auto">
                {beforeBlocks.map(renderDiffBlock)}
              </div>
            </div>
          </div>
          <div className={classNames(
            "flex flex-col min-w-0",
            expandedLeft ? "md:hidden" : "md:block"
          )}>
            <div className="flex items-center bg-bolt-elements-background-depth-1 p-2 text-sm text-bolt-elements-textPrimary shrink-0">
              <div className="i-ph:file mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{filename}</span>
              <span className="ml-auto text-green-400 shrink-0">
                {hasChanges ? 'Modified' : 'No Changes'}
              </span>
              <button 
                onClick={() => setExpandedRight(!expandedRight)}
                className={classNames(
                  "ml-2 p-1 rounded transition-colors shrink-0",
                  "bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2",
                  "text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                )}
              >
                <div className={classNames(
                  "w-4 h-4 transition-transform",
                  expandedRight ? "i-ph:arrows-in" : "i-ph:arrows-out"
                )} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="overflow-x-auto">
                {afterBlocks.map(renderDiffBlock)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const getLanguageFromExtension = (ext: string) => {
  const map: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'json': 'json',
    'html': 'html',
    'css': 'css'
  };
  return map[ext] || 'typescript';
};

interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
}

// Usar cookies em vez de localStorage
const saveFileHistory = (filePath: string, history: FileHistory) => {
  try {
    const key = `diff_history_${filePath.replace(/\//g, '_')}`;
    Cookies.set(key, JSON.stringify(history), { expires: 7 }); // Expira em 7 dias
  } catch (e) {
    console.error('Error saving diff history:', e);
  }
};

const loadFileHistory = (filePath: string): FileHistory | null => {
  try {
    const key = `diff_history_${filePath.replace(/\//g, '_')}`;
    const saved = Cookies.get(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Error loading diff history:', e);
    return null;
  }
};

export const DiffView = memo(() => {
  const files = useStore(workbenchStore.files) as FileMap;
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument) as EditorDocument;
  const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});

  // Carregar histórico ao montar o componente
  useEffect(() => {
    if (selectedFile) {
      const history = loadFileHistory(selectedFile);
      if (history) {
        setFileHistory(prev => ({ ...prev, [selectedFile]: history }));
      }
    }
  }, [selectedFile]);

  // Monitorar mudanças no documento atual
  useEffect(() => {
    if (selectedFile && currentDocument) {
      const file = files[selectedFile];
      if (!file || !('content' in file)) return;

      const originalContent = file.content;
      const currentContent = currentDocument.value;
      
      // Calcular diferenças
      const changes = diffLines(originalContent, currentContent);
      
      // Verificar se houve mudanças reais
      const hasRealChanges = changes.some(change => change.added || change.removed);
      
      if (hasRealChanges) {
        const newHistory: FileHistory = {
          originalContent,
          lastModified: Date.now(),
          changes
        };
        
        setFileHistory(prev => ({ ...prev, [selectedFile]: newHistory }));
        saveFileHistory(selectedFile, newHistory);
      }
    }
  }, [selectedFile, currentDocument?.value, files]);

  if (!selectedFile || !currentDocument) {
    return (
      <div className="flex w-full h-full justify-center items-center bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary">
        Select a file to view differences
      </div>
    );
  }

  const file = files[selectedFile];
  const originalContent = file && 'content' in file ? file.content : '';
  const currentContent = currentDocument.value;

  // Usar o histórico se disponível
  const history = fileHistory[selectedFile];
  const effectiveOriginalContent = history?.originalContent || originalContent;

  return (
    <div className="h-full overflow-auto p-4">
      <CodeComparison
        beforeCode={effectiveOriginalContent}
        afterCode={currentContent}
        language={getLanguageFromExtension(selectedFile.split('.').pop() || '')}
        filename={selectedFile}
        lightTheme="github-light"
        darkTheme="github-dark"
      />
    </div>
  );
}); 