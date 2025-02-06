import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FileMap } from '~/lib/stores/files';
import type { EditorDocument } from '~/components/editor/codemirror/CodeMirrorEditor';
import { diffLines, type Change } from 'diff';
import { getHighlighter } from 'shiki';
import '~/styles/diff-view.css';

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

interface FullscreenButtonProps {
  onClick: () => void;
  isFullscreen: boolean;
}

const FullscreenButton = memo(({ onClick, isFullscreen }: FullscreenButtonProps) => (
  <button
    onClick={onClick}
    className="ml-4 p-1 rounded hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
  >
    <div className={isFullscreen ? "i-ph:corners-in" : "i-ph:corners-out"} />
  </button>
));

const FullscreenOverlay = memo(({ isFullscreen, children }: { isFullscreen: boolean; children: React.ReactNode }) => {
  if (!isFullscreen) return <>{children}</>;
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-6">
      <div className="w-full h-full max-w-[90vw] max-h-[90vh] bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor shadow-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
});

const InlineDiffComparison = memo(({ beforeCode, afterCode, filename, language, lightTheme, darkTheme }: CodeComparisonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlighter, setHighlighter] = useState<any>(null);
  
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const { unifiedBlocks, hasChanges } = useMemo(() => {
    const normalizeText = (text: string) => text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');

    const normalizedBefore = normalizeText(beforeCode);
    const normalizedAfter = normalizeText(afterCode);
    
    const differences = diffLines(normalizedBefore, normalizedAfter, {
      ignoreWhitespace: false,
      newlineIsToken: true
    });

    const blocks: DiffBlock[] = [];
    let lineNumber = 1;
    let hasModifications = false;

    differences.forEach((part: Change) => {
      const lines = part.value.split('\n').filter(line => line !== '');
      
      if (part.added || part.removed) {
        hasModifications = true;
      }

      lines.forEach(line => {
        blocks.push({
          lineNumber: lineNumber++,
          content: line,
          type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged'
        });
      });
    });

    return { 
      unifiedBlocks: blocks,
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
      added: 'bg-green-500/20 border-l-4 border-green-500',
      removed: 'bg-red-500/20 border-l-4 border-red-500',
      unchanged: ''
    }[block.type];

    const highlightedCode = highlighter ? 
      highlighter.codeToHtml(block.content, { lang: language, theme: 'github-dark' }) : 
      block.content;

    return (
      <div key={block.lineNumber} className="flex group min-w-fit">
        <div className="w-12 shrink-0 pl-2 py-0.5 text-left font-mono text-bolt-elements-textTertiary border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
          {block.lineNumber}
        </div>
        <div className={`${bgColor} px-4 py-0.5 font-mono whitespace-pre flex-1 group-hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary`}>
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
    <FullscreenOverlay isFullscreen={isFullscreen}>
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col">
          <div className="flex items-center bg-bolt-elements-background-depth-1 p-2 text-sm text-bolt-elements-textPrimary shrink-0">
            <div className="i-ph:file mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{filename}</span>
            <span className="ml-auto shrink-0 flex items-center">
              {hasChanges ? (
                <span className="text-yellow-400">Modified</span>
              ) : (
                <span className="text-green-400">No Changes</span>
              )}
              <FullscreenButton onClick={toggleFullscreen} isFullscreen={isFullscreen} />
            </span>
          </div>
          <div className="flex-1 overflow-auto diff-panel-content">
            <div className="overflow-x-auto">
              {unifiedBlocks.map(renderDiffBlock)}
            </div>
          </div>
        </div>
      </div>
    </FullscreenOverlay>
  );
});

const SideBySideComparison = memo(({
  beforeCode,
  afterCode,
  language,
  filename,
  lightTheme,
  darkTheme,
}: CodeComparisonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlighter, setHighlighter] = useState<any>(null);
  
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const { beforeLines, afterLines, hasChanges, lineChanges } = useMemo(() => {
    const normalizeText = (text: string) => text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd());

    const beforeLines = normalizeText(beforeCode);
    const afterLines = normalizeText(afterCode);
    
    const differences = diffLines(beforeLines.join('\n'), afterLines.join('\n'), {
      ignoreWhitespace: false,
      newlineIsToken: true
    });

    let hasModifications = false;
    const lineChanges = {
      before: new Set<number>(),
      after: new Set<number>()
    };

    let beforeLineNum = 0;
    let afterLineNum = 0;

    differences.forEach((part: Change) => {
      const lines = part.value.split('\n').filter(line => line !== '');

      if (part.added || part.removed) {
        hasModifications = true;
        if (part.removed) {
          lines.forEach(() => {
            lineChanges.before.add(beforeLineNum);
            beforeLineNum++;
          });
        } else if (part.added) {
          lines.forEach(() => {
            lineChanges.after.add(afterLineNum);
            afterLineNum++;
          });
        }
      } else {
        lines.forEach(() => {
          beforeLineNum++;
          afterLineNum++;
        });
      }
    });

    return { 
      beforeLines,
      afterLines,
      hasChanges: hasModifications,
      lineChanges
    };
  }, [beforeCode, afterCode]);

  useEffect(() => {
    getHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'json', 'html', 'css', 'jsx', 'tsx']
    }).then(setHighlighter);
  }, []);

  const renderCode = (code: string) => {
    if (!highlighter) return code;
    const highlightedCode = highlighter.codeToHtml(code, { 
      lang: language, 
      theme: 'github-dark' 
    });
    return highlightedCode.replace(/<\/?pre[^>]*>/g, '').replace(/<\/?code[^>]*>/g, '');
  };

  return (
    <FullscreenOverlay isFullscreen={isFullscreen}>
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center bg-bolt-elements-background-depth-1 p-2 text-sm text-bolt-elements-textPrimary shrink-0">
          <div className="i-ph:file mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{filename}</span>
          <span className="ml-auto shrink-0 flex items-center">
            {hasChanges ? (
              <span className="text-yellow-400">Modified</span>
            ) : (
              <span className="text-green-400">No Changes</span>
            )}
            <FullscreenButton onClick={toggleFullscreen} isFullscreen={isFullscreen} />
          </span>
        </div>
        <div className="flex-1 overflow-auto diff-panel-content">
          <div className="grid md:grid-cols-2 divide-x divide-bolt-elements-borderColor relative h-full">
            <div className="overflow-auto">
              <div className="sticky top-0 z-10 bg-bolt-elements-background-depth-1 p-2 text-xs font-bold text-bolt-elements-textTertiary border-b border-bolt-elements-borderColor">
                Original
              </div>
              <div className="overflow-x-auto">
                {beforeLines.map((line, index) => (
                  <div key={`before-${index}`} className="flex group min-w-fit">
                    <div className="w-12 shrink-0 pl-2 py-0.5 text-left font-mono text-bolt-elements-textTertiary border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                      {index + 1}
                    </div>
                    <div className={`px-4 py-0.5 font-mono whitespace-pre flex-1 group-hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary ${
                      lineChanges.before.has(index) ? 'bg-red-500/20 border-l-4 border-red-500' : ''
                    }`}>
                      <span className="mr-2 text-bolt-elements-textTertiary">
                        {lineChanges.before.has(index) ? '-' : ' '}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: renderCode(line) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-bolt-elements-background-depth-2 text-xs text-bolt-elements-textTertiary border border-bolt-elements-borderColor z-10">
              VS
            </div>
            <div className="overflow-auto">
              <div className="sticky top-0 z-10 bg-bolt-elements-background-depth-1 p-2 text-xs font-bold text-bolt-elements-textTertiary border-b border-bolt-elements-borderColor">
                Modified
              </div>
              <div className="overflow-x-auto">
                {afterLines.map((line, index) => (
                  <div key={`after-${index}`} className="flex group min-w-fit">
                    <div className="w-12 shrink-0 pl-2 py-0.5 text-left font-mono text-bolt-elements-textTertiary border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                      {index + 1}
                    </div>
                    <div className={`px-4 py-0.5 font-mono whitespace-pre flex-1 group-hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary ${
                      lineChanges.after.has(index) ? 'bg-green-500/20 border-l-4 border-green-500' : ''
                    }`}>
                      <span className="mr-2 text-bolt-elements-textTertiary">
                        {lineChanges.after.has(index) ? '+' : ' '}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: renderCode(line) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullscreenOverlay>
  );
});

interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  saveCount: number;
  versions: {
    timestamp: number;
    content: string;
  }[];
}

const saveFileHistory = (filePath: string, history: FileHistory) => {
  try {
    const key = `diff_history_${filePath.replace(/\//g, '_')}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving diff history:', e);
  }
};

const loadFileHistory = (filePath: string): FileHistory | null => {
  try {
    const key = `diff_history_${filePath.replace(/\//g, '_')}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Error loading diff history:', e);
    return null;
  }
};

interface DiffViewProps {
  fileHistory: Record<string, FileHistory>;
  setFileHistory: React.Dispatch<React.SetStateAction<Record<string, FileHistory>>>;
  diffViewMode: 'inline' | 'side';
}

export const DiffView = memo(({ fileHistory, setFileHistory, diffViewMode }: DiffViewProps) => {
  const files = useStore(workbenchStore.files) as FileMap;
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument) as EditorDocument;
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);

  useEffect(() => {
    if (selectedFile) {
      const history = loadFileHistory(selectedFile);
      if (history) {
        setFileHistory(prev => ({ ...prev, [selectedFile]: history }));
      }
    }
  }, [selectedFile, setFileHistory]);

  useEffect(() => {
    if (selectedFile && currentDocument) {
      const file = files[selectedFile];
      if (!file || !('content' in file)) return;

      const isUnsaved = unsavedFiles.has(selectedFile);
      if (!isUnsaved) {
        const existingHistory = fileHistory[selectedFile];
        const currentContent = currentDocument.value;
        
        const newHistory: FileHistory = {
          originalContent: existingHistory?.originalContent || file.content,
          lastModified: Date.now(),
          changes: existingHistory?.changes || [],
          saveCount: existingHistory ? existingHistory.saveCount + 1 : 1,
          versions: [
            ...(existingHistory?.versions || []),
            {
              timestamp: Date.now(),
              content: currentContent
            }
          ]
        };
        
        setFileHistory(prev => ({ ...prev, [selectedFile]: newHistory }));
        saveFileHistory(selectedFile, newHistory);
      }
    }
  }, [selectedFile, unsavedFiles, currentDocument?.value, files, setFileHistory]);

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

  const history = fileHistory[selectedFile];
  const effectiveOriginalContent = history?.originalContent || originalContent;
  const language = getLanguageFromExtension(selectedFile.split('.').pop() || '');

  return (
    <div className="h-full overflow-hidden">
      {diffViewMode === 'inline' ? (
        <InlineDiffComparison
          beforeCode={effectiveOriginalContent}
          afterCode={currentContent}
          language={language}
          filename={selectedFile}
          lightTheme="github-light"
          darkTheme="github-dark"
        />
      ) : (
        <SideBySideComparison
          beforeCode={effectiveOriginalContent}
          afterCode={currentContent}
          language={language}
          filename={selectedFile}
          lightTheme="github-light"
          darkTheme="github-dark"
        />
      )}
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
    'css': 'css',
    'py': 'python',
    'java': 'java',
    'rb': 'ruby',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'swift': 'swift',
    'md': 'markdown',
    'sh': 'bash'
  };
  return map[ext] || 'typescript';
}; 