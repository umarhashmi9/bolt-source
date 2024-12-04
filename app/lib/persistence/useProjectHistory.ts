import { useState, useEffect, useCallback, useRef } from 'react';
import { atom } from 'nanostores';
import { toast } from 'react-toastify';
import {
  addOrUpdateFeature,
  addProject,
  createChatFromMessages,
  getAllProjects,
  getProjectById,
  openDatabase,
  setupProjectStore,
  updateProjectBranches,
} from './db';
import FS from '@isomorphic-git/lightning-fs';
import http from 'isomorphic-git/http/web';
import git from 'isomorphic-git';
import ignore from 'ignore';
import type { Message } from 'ai';
import type { Branch, Feature, NewFeature, Project } from '~/components/projects/types';

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;
export const db = persistenceEnabled ? await openDatabase() : undefined;
export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

const IGNORE_PATTERNS = [
  'node_modules/',
  '.git/',
  '.github/',
  '.vscode/',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  '.cache/',
  '.vscode/',
  '.idea/',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
];

const ig = ignore().add(IGNORE_PATTERNS);
const generateId = () => Math.random().toString(36).substring(2, 15);
const fs = new FS();
interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  content: string | undefined;
}

const getDirContent: (fs: FS, dir: string) => Promise<FileNode[]> = async (fs: FS, dir: string) => {
  let items = await fs.promises.readdir(dir);
  items = items.filter((filePath) => !ig.ignores(filePath));

  const dirContent: FileNode[] = await Promise.all(
    items.map(async (item) => {
      const path = dir.endsWith('/') ? `${dir}${item}` : `${dir}/${item}`;
      const stat = await fs.promises.stat(path);
      let content: string | undefined;
      const type: 'file' | 'folder' = stat.isDirectory() ? 'folder' : 'file';

      if (stat.isFile()) {
        content = `${await fs.promises.readFile(path, 'utf8')}`;
      }

      return {
        name: item,
        path: dir.endsWith('/') ? `${dir}${item}` : `${dir}/${item}`,
        type,
        content,
      };
    }),
  );
  const nestedContent = (
    await Promise.all(
      dirContent
        .filter((x) => x.type === 'folder')
        .map(async (subdir: FileNode) => {
          return await getDirContent(fs, `${subdir.path}`);
        }),
    )
  ).flat();

  return [...dirContent, ...nestedContent];
};

export function useProjectHistory(id?: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project>();
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const fsRef = useRef<FS>(fs);

  useEffect(() => {
    if (!db) {
      if (persistenceEnabled) {
        toast.error('Database is unavailable');
      }

      return;
    }

    setupProjectStore(db).then(() => {
      getAllProjects(db).then((data) => {
        setProjects(data);
      });
    });
  }, [db]);

  useEffect(() => {
    if (!db) {
      return;
    }

    if (activeProject) {
      const fs = fsRef.current;
      fs.init(activeProject.gitUrl);
      refreshProject(activeProject.id);
    }
  }, [activeProject]);
  useEffect(() => {
    if (!id) {
      return;
    }

    if (!db) {
      return;
    }

    getProjectById(db, id).then((proj) => {
      setActiveProject(proj);
    });
  }, [id]);

  const refreshProject = useCallback(
    async (projectId: string) => {
      if (!db) {
        return;
      }

      setIsProjectsLoading(true);

      try {
        const fs = fsRef.current;
        fs.init(projectId);

        const project = await getProjectById(db, projectId);
        let initialized = false;

        try {
          await fs.promises.readdir('/.git');
          initialized = true;
        } catch (error) {
          console.warn(error);
        }

        if (!initialized) {
          await git.clone({
            fs,
            http,
            dir: '/',
            url: project.gitUrl,
            corsProxy: 'https://cors.isomorphic-git.org',
          });
        }

        await fs.promises.flush();

        const branches = await git.listBranches({ fs, dir: '/' });
        const projectBranches = await Promise.all(
          branches.map(async (branchRef) => {
            const sha = await git.resolveRef({ fs, dir: '/', ref: branchRef });
            const commit = await git.readCommit({ fs, dir: '/', oid: sha });
            const projectBranch: Branch = {
              author: commit.commit.author.name,
              commitHash: sha,
              name: branchRef,
              updated: new Date(commit.commit.committer.timestamp).toLocaleString(),
            };

            return projectBranch;
          }),
        );
        await updateProjectBranches(db, project.id, projectBranches);

        await getAllProjects(db).then((data) => {
          setProjects(data);
        });
      } catch (error) {
        setIsProjectsLoading(false);

        if (activeProject) {
          const fs = fsRef.current;
          fs.init(activeProject.gitUrl);
        }

        throw error;
      }
      setIsProjectsLoading(false);

      if (activeProject) {
        const fs = fsRef.current;
        fs.init(activeProject.gitUrl);
      }
    },
    [db],
  );

  const addNewProject = useCallback(
    async (project: Project) => {
      setProjects((p) => [...p, project]);

      if (db) {
        await addProject(db, project);
      }
    },
    [db],
  );

  const getArtifactFromBranch = async (fs: FS, newFeatureReq: NewFeature) => {
    await git.branch({
      fs,
      dir: '/',
      ref: newFeatureReq.branchRef,
      object: newFeatureReq.srcOid || newFeatureReq.branchFrom,
    });
    await git.checkout({ fs, dir: '/', ref: newFeatureReq.branchRef });

    const dirContent = await getDirContent(fs, '/');
    const files = dirContent.filter((x) => x.type == 'file');
    const message: Message = {
      role: 'assistant',
      content: `Checking out branch content into webcontainer
<boltArtifact id="imported-files" title="Checkout - ${newFeatureReq.branchRef}" type="bundled" >           
          ${files
            .filter((x) => x.content)
            .map((file) => {
              let newPath = file.path;

              if (newPath.startsWith('/')) {
                newPath = newPath.slice(1);
              }

              return `<boltAction type="file" filePath="${newPath}">
${file.content}
</boltAction>`;
            })
            .join('\n')}
 </boltArtifact>`,
      id: generateId(),
      createdAt: new Date(),
    };
    await git.checkout({ fs, dir: '/', ref: 'main' });

    return message;
  };
  const addFeature = useCallback(
    async (newFeatureReq: NewFeature) => {
      if (!id) {
        return;
      }

      if (!db) {
        return;
      }

      try {
        const fs = fsRef.current;
        const message = await getArtifactFromBranch(fs, newFeatureReq);
        await fs.promises.flush();

        const newId = await createChatFromMessages(db, newFeatureReq.name, [message]);
        const sha = await git.resolveRef({ fs, dir: '/', ref: newFeatureReq.branchRef });
        const feature: Feature = {
          id: newId,
          branchFrom: newFeatureReq.branchFrom,
          branchRef: newFeatureReq.branchRef,
          name: newFeatureReq.name,
          description: newFeatureReq.description,
          status: 'in-progress',
          head: sha,
        };
        setProjects((prjs) => {
          let proj = prjs.find((p) => p.id == id);

          if (!proj) {
            return prjs;
          }

          proj = {
            ...proj,
            features: [...(proj?.features || []).filter((f) => f.id !== feature.id), feature],
          };

          return [...prjs.filter((p) => p.id !== id)];
        });
        await addOrUpdateFeature(db, id, feature);
        window.location.href = `/chat/${newId}`;
        toast.success('Feature Branch Created');

        return;
      } catch (error: any) {
        toast.error(`Failed to create feature branch: ${error?.message}`);
      }
    },
    [db, id],
  );

  return {
    projects,
    addNewProject,
    addFeature,
    refreshProject,
    activeProject,
    isProjectsLoading,
  };
}
