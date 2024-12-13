import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function GitCloneButton({ importChat }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const onClick = async (_e: any) => {
    console.log('Git clone button clicked');

    if (!ready) {
      console.log('Git not ready');
      return;
    }

    const repoUrl = prompt('Enter the Git url');
    console.log('Got repo URL:', repoUrl);

    if (repoUrl) {
      console.log('Cloning repo...');

      const { workdir, data } = await gitClone(repoUrl);
      console.log('Cloned repo to:', workdir);

      if (importChat) {
        const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
        console.log('Filtered file paths:', filePaths);

        const textDecoder = new TextDecoder('utf-8');

        // Convert files to common format for command detection
        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);
        console.log('Converted file contents:', fileContents.length, 'files');

        // Detect and create commands message
        console.log('Detecting project commands...');

        const commands = await detectProjectCommands(fileContents);
        console.log('Detected commands:', commands);

        const commandsMessage = createCommandsMessage(commands);
        console.log('Created commands message:', commandsMessage);

        // Create files message
        const filesMessage: Message = {
          role: 'assistant' as const,
          content: `Cloning the repo ${repoUrl} into ${workdir}
<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
${fileContents
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
        console.log('Created files message');

        const messages = [filesMessage];

        if (commandsMessage) {
          messages.push(commandsMessage);
          console.log('Added commands message');
        }

        console.log('Importing chat...');
        await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages);
        console.log('Chat imported');
      }
    }
  };

  return (
    <button
      onClick={onClick}
      title="Clone a Git Repo"
      className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
    >
      <span className="i-ph:git-branch" />
      Clone a Git Repo
    </button>
  );
}
