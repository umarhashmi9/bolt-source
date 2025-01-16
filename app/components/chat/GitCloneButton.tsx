import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';

// Enhanced ignore patterns
const IGNORE_PATTERNS = [
  // Development
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',

  // Dependency files
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/composer.lock',
  '**/Gemfile.lock',

  // Logs and caches
  '**/*.log',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/.DS_Store',

  // Large binary files
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  '**/*.gif',
  '**/*.ico',
  '**/*.pdf',
  '**/*.zip',
  '**/*.tar.gz',

  // Environment and secrets
  '**/.env*',
  '**/*.pem',
  '**/id_rsa*',
];

const ig = ignore().add(IGNORE_PATTERNS);

interface CloneProgress {
  stage: 'preparing' | 'cloning' | 'processing' | 'importing';
  progress: number;
  details: string;
  branch?: string;
  filesProcessed?: number;
  totalFiles?: number;
  currentFile?: string;
  error?: string;
}

interface RepoInfo {
  owner: string;
  name: string;
  branch: string;
  isPrivate: boolean;
}

function parseGitUrl(url: string): RepoInfo | null {
  try {
    // Handle HTTPS URLs
    if (url.startsWith('https://')) {
      const match = url.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);

      if (match) {
        return {
          owner: match[1],
          name: match[2].replace('.git', ''),
          branch: match[3] || 'main',
          isPrivate: false,
        };
      }
    }

    // Handle SSH URLs
    if (url.startsWith('git@')) {
      const match = url.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);

      if (match) {
        return {
          owner: match[1],
          name: match[2].replace('.git', ''),
          branch: 'main',
          isPrivate: true,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function GitCloneButton({ importChat }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<CloneProgress | null>(null);
  const [memoryWarningShown, setMemoryWarningShown] = useState(false);

  const validateGitUrl = (url: string): boolean => {
    return parseGitUrl(url) !== null;
  };

  const updateProgress = (update: Partial<CloneProgress>) => {
    setProgress((prev) => (prev ? { ...prev, ...update } : null));
  };

  const processFiles = async (data: Record<string, any>, _workdir: string) => {
    const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
    const textDecoder = new TextDecoder('utf-8');
    const processedFiles = [];
    let filesProcessed = 0;
    const totalFiles = filePaths.length;

    // Show warning for large repositories
    if (totalFiles > 1000 && !memoryWarningShown) {
      const proceed = window.confirm(
        `This repository contains ${totalFiles} files. Processing large repositories may affect performance. Continue?`,
      );
      setMemoryWarningShown(true);

      if (!proceed) {
        throw new Error('Operation cancelled by user');
      }
    }

    // Process files in chunks to avoid memory issues
    const CHUNK_SIZE = 50;

    for (let i = 0; i < filePaths.length; i += CHUNK_SIZE) {
      const chunk = filePaths.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (filePath) => {
          try {
            const { data: content, encoding } = data[filePath];
            filesProcessed++;

            updateProgress({
              stage: 'processing',
              progress: 50 + (30 * filesProcessed) / totalFiles,
              details: `Processing files (${filesProcessed}/${totalFiles})...`,
              filesProcessed,
              totalFiles,
              currentFile: filePath,
            });

            // Skip binary files and files over 1MB
            if (content instanceof Uint8Array && content.length > 1024 * 1024) {
              logStore.logSystem('Skipping large file', { path: filePath, size: content.length });
              return null;
            }

            return {
              path: filePath,
              content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          } catch (error) {
            logStore.logError('Failed to process file', {
              path: filePath,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
          }
        }),
      );

      processedFiles.push(...chunkResults.filter((f): f is NonNullable<typeof f> => f !== null && Boolean(f.content)));

      // Allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return processedFiles;
  };

  const onClick = async (_e: any) => {
    if (!ready) {
      toast.error('Git is not ready. Please try again.');
      return;
    }

    const repoUrl = prompt('Enter the Git url');

    if (!repoUrl) {
      return;
    }

    if (!validateGitUrl(repoUrl)) {
      toast.error('Invalid GitHub repository URL. Please use HTTPS or SSH format.');
      return;
    }

    const repoInfo = parseGitUrl(repoUrl)!;
    const branch = prompt(`Enter branch name (default: ${repoInfo.branch})`) || repoInfo.branch;

    setLoading(true);
    setProgress({
      stage: 'preparing',
      progress: 0,
      details: 'Initializing clone operation...',
      branch,
    });

    try {
      logStore.logSystem('Starting repository clone', {
        url: repoUrl,
        branch,
        owner: repoInfo.owner,
        repo: repoInfo.name,
        isPrivate: repoInfo.isPrivate,
      });

      updateProgress({
        stage: 'cloning',
        progress: 20,
        details: `Cloning repository (${branch})...`,
      });

      const { workdir, data } = await gitClone(repoUrl);

      if (importChat) {
        const processedFiles = await processFiles(data, workdir);

        updateProgress({
          stage: 'importing',
          progress: 80,
          details: 'Analyzing project structure...',
        });

        // Detect project commands
        const commands = await detectProjectCommands(processedFiles);
        const commandsMessage = createCommandsMessage(commands);

        // Create files message with branch info
        const filesMessage: Message = {
          role: 'assistant',
          content: `Successfully cloned repository: ${repoUrl} (branch: ${branch}) into ${workdir}
<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
${processedFiles
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
          id: generateId(),
          createdAt: new Date(),
        };

        const messages = [filesMessage];

        if (commandsMessage) {
          messages.push(commandsMessage);
        }

        updateProgress({ progress: 90, details: 'Importing project...' });
        await importChat(`Git Project: ${repoInfo.name} (${branch})`, messages);

        logStore.logSystem('Repository clone completed', {
          url: repoUrl,
          branch,
          fileCount: processedFiles.length,
          hasCommands: Boolean(commandsMessage),
        });

        toast.success(`Repository cloned successfully from branch ${branch}!`);
      }
    } catch (error) {
      logStore.logError('Failed to clone repository', {
        url: repoUrl,
        branch,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Authentication failed')) {
        toast.error('Authentication failed. Please check your GitHub credentials in Settings.');
      } else if (errorMessage.includes('Operation cancelled')) {
        toast.info('Clone operation cancelled by user.');
      } else if (errorMessage.includes('not found')) {
        toast.error(`Branch '${branch}' not found in repository.`);
      } else {
        toast.error('Failed to clone repository. Please try again.');
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        title="Clone a Git Repository"
        className={`
          px-4 py-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2.5
          ${
            loading
              ? 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor cursor-wait'
              : 'bg-bolt-elements-prompt-background border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-borderColorHover'
          }
          ${!ready ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        disabled={loading || !ready}
      >
        {loading ? (
          <div className="i-ph:spinner-gap-bold animate-spin text-lg" />
        ) : (
          <span className="i-ph:git-branch-bold text-lg" />
        )}
        <span className="font-medium">Clone Repository</span>
      </button>

      {loading && progress && (
        <div className="fixed inset-0 bg-bolt-elements-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                {progress.stage === 'preparing' && <div className="i-ph:git-branch-bold text-xl" />}
                {progress.stage === 'cloning' && <div className="i-ph:git-fork-bold text-xl animate-pulse" />}
                {progress.stage === 'processing' && <div className="i-ph:file-text-bold text-xl" />}
                {progress.stage === 'importing' && <div className="i-ph:arrow-square-in-bold text-xl" />}
                <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                  {progress.stage === 'preparing' && 'Preparing Repository'}
                  {progress.stage === 'cloning' && 'Cloning Repository'}
                  {progress.stage === 'processing' && 'Processing Files'}
                  {progress.stage === 'importing' && 'Importing Project'}
                </h3>
              </div>

              {/* Progress Details */}
              <div className="space-y-3">
                <div className="text-sm text-bolt-elements-textSecondary">
                  {progress.details}
                  {progress.branch && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="i-ph:git-branch text-[1.1em]" />
                      <span>Branch: {progress.branch}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-bolt-elements-background-depth-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bolt-elements-accent transition-all duration-300 rounded-full"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>

                {/* File Progress */}
                {progress.currentFile && (
                  <div className="text-xs text-bolt-elements-textTertiary space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="i-ph:file-text text-[1.1em]" />
                      <span className="truncate">{progress.currentFile}</span>
                    </div>
                    {progress.filesProcessed !== undefined && progress.totalFiles !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="i-ph:files text-[1.1em]" />
                        <span>
                          {progress.filesProcessed} / {progress.totalFiles} files
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
