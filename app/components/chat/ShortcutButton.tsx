import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';

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
  title?:string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function ShortcutButton({ importChat, title }: GitCloneButtonProps) {

  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);

  const onClick = async (_e: any) => {
    if (!ready) {
      return;
    }

   // const repoUrl = prompt('Enter the Git url');

   //toast(title);
    var repoUrl  = "";
    if (title?.toLowerCase().includes("rental")) {
    repoUrl  = "https://github.com/masmul/template-rental-1.git";
    toast(`AI sedang membuatkan ${title}, tunggu bentar yaaa.`);
   }
   else if (title?.toLowerCase().includes("undangan")) {
    repoUrl  = "https://github.com/masmul/template-undangan-1.git";
    toast(`AI sedang membuatkan ${title}, tunggu bentar yaaa.`);
   }
   else if (title?.toLowerCase().includes("company profile")) {
    repoUrl  = "https://github.com/masmul/template-company-profile-1.git";
    toast(`AI sedang membuatkan ${title}, tunggu bentar yaaa.`);
   }
    else if (title?.toLowerCase().includes("cv online")) {
    repoUrl  = "https://github.com/masmul/template-cv-1.git";
    toast(`AI sedang membuatkan ${title}, tunggu bentar yaaa.`);
   }
  else if (title?.toLowerCase().includes("website personal")) {
    repoUrl  = "https://github.com/easetemplates/about-me-personal-portfolio-website-template.git";
    toast(`AI sedang membuatkan ${title}, tunggu bentar yaaa.`);
   }
 

   

    if (repoUrl) {
      setLoading(true);

      try {
        const { workdir, data } = await gitClone(repoUrl);

        if (importChat) {
          const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
          console.log(filePaths);

          const textDecoder = new TextDecoder('utf-8');

          const fileContents = filePaths
            .map((filePath) => {
              const { data: content, encoding } = data[filePath];
              return {
                path: filePath,
                content:
                  encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
              };
            })
            .filter((f) => f.content);

          const commands = await detectProjectCommands(fileContents);
          const commandsMessage = createCommandsMessage(commands);

          const filesMessage: Message = {
            role: 'assistant',
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

          const messages = [filesMessage];

          if (commandsMessage) {
            messages.push(commandsMessage);
          }

          await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages);
        }
      } catch (error) {
        console.error('Error during import:', error);
        toast.error('Failed to import repository');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        title="Buat website rental cepat"
        className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
      >
        {title}
      </button>
      {loading && <LoadingOverlay message="Tunggu sampai AI selesai membuatkan kode kamu" />}
    </>
  );
}
