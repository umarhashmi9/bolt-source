import { atom, map, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import { ActionRunner } from '~/lib/runtime/action-runner';
import type { ActionCallbackData, ArtifactCallbackData } from '~/lib/runtime/message-parser';
import { webcontainer } from '~/lib/webcontainer';
import type { ITerminal } from '~/types/terminal';
import { unreachable } from '~/utils/unreachable';
import { EditorStore } from './editor';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import * as nodePath from 'node:path';
import { extractRelativePath } from '~/utils/diff';
import { description } from '~/lib/persistence';
import Cookies from 'js-cookie';
import { createSampler } from '~/utils/sampler';
import type { ActionAlert } from '~/types/actions';
import type { SyncSettings, SyncSession, SyncStatistics, SyncHistoryEntry } from '~/types/sync';
import ignore from 'ignore';
import { toast } from 'react-toastify';

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;
}

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;

type Artifacts = MapStore<Record<string, ArtifactState>>;

export type WorkbenchViewType = 'code' | 'preview';

export class WorkbenchStore {
  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);

  #reloadedMessages = new Set<string>();

  artifacts: Artifacts = import.meta.hot?.data.artifacts ?? map({});

  showWorkbench: WritableAtom<boolean> = import.meta.hot?.data.showWorkbench ?? atom(false);
  currentView: WritableAtom<WorkbenchViewType> = import.meta.hot?.data.currentView ?? atom('code');
  unsavedFiles: WritableAtom<Set<string>> = import.meta.hot?.data.unsavedFiles ?? atom(new Set<string>());
  actionAlert: WritableAtom<ActionAlert | undefined> =
    import.meta.hot?.data.unsavedFiles ?? atom<ActionAlert | undefined>(undefined);
  modifiedFiles = new Set<string>();
  artifactIdList: string[] = [];
  #globalExecutionQueue = Promise.resolve();
  syncFolder: WritableAtom<FileSystemDirectoryHandle | null> = import.meta.hot?.data.syncFolder ?? atom(null);
  syncSettings: WritableAtom<SyncSettings> =
    import.meta.hot?.data.syncSettings ??
    atom({
      autoSync: false,
      syncOnSave: false,
      excludePatterns: ['node_modules/**', '*.log', '.DS_Store'],
      syncMode: 'ask',
    });
  currentSession: WritableAtom<SyncSession | null> = import.meta.hot?.data.currentSession ?? atom(null);

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.artifacts = this.artifacts;
      import.meta.hot.data.unsavedFiles = this.unsavedFiles;
      import.meta.hot.data.showWorkbench = this.showWorkbench;
      import.meta.hot.data.currentView = this.currentView;
      import.meta.hot.data.actionAlert = this.actionAlert;
      import.meta.hot.data.syncSettings = this.syncSettings;
      import.meta.hot.data.syncFolder = this.syncFolder;
      import.meta.hot.data.currentSession = this.currentSession;
    }

    // Load saved sync settings
    this.loadSyncSettings();

    // Subscribe to sync settings changes to persist them
    this.syncSettings.subscribe((settings) => {
      localStorage.setItem('syncSettings', JSON.stringify(settings));
    });

    // Set up auto-sync interval
    setInterval(() => {
      const settings = this.syncSettings.get();
      const session = this.currentSession.get();
      const folder = this.syncFolder.get();

      if (settings.autoSync && folder && session) {
        const now = Date.now();
        const timeSinceLastSync = now - session.lastSync;
        const intervalMs = settings.autoSyncInterval * 60 * 1000;

        if (timeSinceLastSync >= intervalMs) {
          this.syncFiles().catch(console.error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  addToExecutionQueue(callback: () => Promise<void>) {
    this.#globalExecutionQueue = this.#globalExecutionQueue.then(() => callback());
  }

  get previews() {
    return this.#previewsStore.previews;
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.#getArtifact(this.artifactIdList[0]);
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }
  get boltTerminal() {
    return this.#terminalStore.boltTerminal;
  }
  get alert() {
    return this.actionAlert;
  }
  clearAlert() {
    this.actionAlert.set(undefined);
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }
  attachBoltTerminal(terminal: ITerminal) {
    this.#terminalStore.attachBoltTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);

    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      // we find the first file and select it
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;

    this.#editorStore.updateScrollPosition(filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    await this.#filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);

    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  resetCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    const { filePath } = currentDocument;
    const file = this.#filesStore.getFile(filePath);

    if (!file) {
      return;
    }

    this.setCurrentDocumentContent(file.content);
  }

  async saveAllFiles() {
    for (const filePath of this.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  abortAllActions() {
    // TODO: what do we wanna do and how do we wanna recover from this?
  }

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  addArtifact({ messageId, title, id, type }: ArtifactCallbackData) {
    const artifact = this.#getArtifact(messageId);

    if (artifact) {
      return;
    }

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      runner: new ActionRunner(
        webcontainer,
        () => this.boltTerminal,
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.actionAlert.set(alert);
        },
      ),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }
  addAction(data: ActionCallbackData) {
    // this._addAction(data);

    this.addToExecutionQueue(() => this._addAction(data));
  }
  async _addAction(data: ActionCallbackData) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    return artifact.runner.addAction(data);
  }

  runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    if (isStreaming) {
      this.actionStreamSampler(data, isStreaming);
    } else {
      this.addToExecutionQueue(() => this._runAction(data, isStreaming));
    }
  }
  async _runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { messageId } = data;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];

    if (!action || action.executed) {
      return;
    }

    if (data.action.type === 'file') {
      const wc = await webcontainer;
      const fullPath = nodePath.join(wc.workdir, data.action.filePath);

      if (this.selectedFile.value !== fullPath) {
        this.setSelectedFile(fullPath);
      }

      if (this.currentView.value !== 'code') {
        this.currentView.set('code');
      }

      const doc = this.#editorStore.documents.get()[fullPath];

      if (!doc) {
        await artifact.runner.runAction(data, isStreaming);
      }

      this.#editorStore.updateFile(fullPath, data.action.content);

      if (!isStreaming) {
        await artifact.runner.runAction(data);
        this.resetAllFileModifications();
      }
    } else {
      await artifact.runner.runAction(data);
    }
  }

  actionStreamSampler = createSampler(async (data: ActionCallbackData, isStreaming: boolean = false) => {
    return await this._runAction(data, isStreaming);
  }, 100); // TODO: remove this magic number to have it configurable

  #getArtifact(id: string) {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }

  async downloadZip() {
    const zip = new JSZip();
    const files = this.files.get();

    // Get the project name from the description input, or use a default name
    const projectName = (description.value ?? 'project').toLocaleLowerCase().split(' ').join('_');

    // Generate a simple 6-character hash based on the current timestamp
    const timestampHash = Date.now().toString(36).slice(-6);
    const uniqueProjectName = `${projectName}_${timestampHash}`;

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);

        // split the path into segments
        const pathSegments = relativePath.split('/');

        // if there's more than one segment, we need to create folders
        if (pathSegments.length > 1) {
          let currentFolder = zip;

          for (let i = 0; i < pathSegments.length - 1; i++) {
            currentFolder = currentFolder.folder(pathSegments[i])!;
          }
          currentFolder.file(pathSegments[pathSegments.length - 1], dirent.content);
        } else {
          // if there's only one segment, it's a file in the root
          zip.file(relativePath, dirent.content);
        }
      }
    }

    // Generate the zip file and save it
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${uniqueProjectName}.zip`);
  }

  async syncFiles() {
    const folder = this.syncFolder.get();

    if (!folder) {
      throw new Error('No sync folder selected');
    }

    const settings = this.syncSettings.get();
    const ig = ignore().add(settings.excludePatterns);
    const session = this.currentSession.get();

    if (!session) {
      throw new Error('No active session');
    }

    const startTime = Date.now();
    let totalSize = 0;

    try {
      const files = this.files.get();
      const syncedFiles = [];
      const conflictedFiles = [];

      // Get or create project folder
      const projectName = (description.value ?? 'project').toLowerCase().split(' ').join('_');
      let projectFolder: FileSystemDirectoryHandle;

      // Check if we have an existing folder for this project
      const projectInfo = settings.projectFolders[projectName];

      if (projectInfo) {
        try {
          projectFolder = await folder.getDirectoryHandle(projectInfo.folderName);
          console.log(`Using existing project folder: ${projectInfo.folderName}`);
        } catch {
          // If folder doesn't exist, create a new one
          const timestampHash = Date.now().toString(36).slice(-6);
          const folderName = `${projectName}_${timestampHash}`;
          projectFolder = await folder.getDirectoryHandle(folderName, { create: true });

          // Update project info
          settings.projectFolders[projectName] = {
            projectName,
            folderName,
            lastSync: Date.now(),
          };
          await this.saveSyncSettings(settings);
          console.log(`Created new project folder: ${folderName}`);
        }
      } else {
        // First time syncing this project
        const timestampHash = Date.now().toString(36).slice(-6);
        const folderName = `${projectName}_${timestampHash}`;
        projectFolder = await folder.getDirectoryHandle(folderName, { create: true });

        // Save project info
        settings.projectFolders[projectName] = {
          projectName,
          folderName,
          lastSync: Date.now(),
        };
        await this.saveSyncSettings(settings);
        console.log(`Created new project folder: ${folderName}`);
      }

      // Update session with current project folder
      session.projectFolder = projectFolder.name;
      this.currentSession.set(session);

      // Show progress toast
      const progressToastId = toast.loading('Starting sync...', { autoClose: false });
      let processedFiles = 0;
      const totalFiles = Object.entries(files).filter(
        ([_, dirent]) => dirent?.type === 'file' && !dirent.isBinary,
      ).length;

      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file' && !dirent.isBinary) {
          processedFiles++;
          toast.update(progressToastId, {
            render: `Syncing files... ${processedFiles}/${totalFiles}`,
          });

          const relativePath = extractRelativePath(filePath);
          totalSize += new Blob([dirent.content]).size;

          // Skip files that match exclude patterns
          if (ig.ignores(relativePath)) {
            console.log(`Skipping excluded file: ${relativePath}`);
            continue;
          }

          const pathSegments = relativePath.split('/');
          let currentHandle = projectFolder;

          // Create directories if they don't exist
          for (let i = 0; i < pathSegments.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], { create: true });
          }

          const fileName = pathSegments[pathSegments.length - 1];
          let shouldWrite = true;

          // Handle existing files based on sync mode
          if (settings.syncMode !== 'overwrite') {
            try {
              const existingFile = await currentHandle.getFileHandle(fileName);
              const existingContent = await existingFile.getFile().then((file) => file.text());

              if (existingContent !== dirent.content) {
                if (settings.syncMode === 'ask') {
                  const userChoice = confirm(
                    `File "${relativePath}" already exists and has different content.\n\n` +
                      'Do you want to overwrite it?\n\n' +
                      'Click OK to overwrite, Cancel to skip.',
                  );

                  if (!userChoice) {
                    shouldWrite = false;
                    conflictedFiles.push(relativePath);
                    console.log(`User chose to skip file: ${relativePath}`);
                  } else {
                    console.log(`User chose to overwrite file: ${relativePath}`);
                  }
                } else if (settings.syncMode === 'skip') {
                  shouldWrite = false;
                  console.log(`Skipping existing file: ${relativePath}`);
                }
              }
            } catch {
              // File doesn't exist, we can create it
              console.log(`Creating new file: ${relativePath}`);
              shouldWrite = true;
            }
          } else {
            console.log(`Overwriting file: ${relativePath}`);
          }

          if (shouldWrite) {
            const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(dirent.content);
            await writable.close();
            syncedFiles.push(relativePath);
            session.files.add(relativePath);
          }
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Create statistics entry
      const statistics: SyncStatistics = {
        totalFiles: syncedFiles.length,
        totalSize,
        duration,
        timestamp: endTime,
      };

      // Create history entry
      const historyEntry: SyncHistoryEntry = {
        id: crypto.randomUUID(),
        projectName,
        timestamp: endTime,
        statistics,
        files: syncedFiles,
        status: conflictedFiles.length > 0 ? 'partial' : 'success',
      };

      // Update session
      session.lastSync = endTime;
      session.statistics = [...(session.statistics || []), statistics];
      session.history = [...(session.history || []), historyEntry];
      this.currentSession.set(session);

      // Save sync history to localStorage
      const syncHistory = JSON.parse(localStorage.getItem('syncHistory') || '[]');
      syncHistory.push(historyEntry);
      localStorage.setItem('syncHistory', JSON.stringify(syncHistory.slice(-100))); // Keep last 100 entries

      // Close progress toast
      toast.dismiss(progressToastId);

      // Provide summary feedback
      if (syncedFiles.length > 0) {
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        const durationSec = (duration / 1000).toFixed(1);
        toast.success(
          `Successfully synced ${syncedFiles.length} file${syncedFiles.length !== 1 ? 's' : ''} ` +
            `(${sizeMB} MB) to ${projectName} in ${durationSec}s`,
        );
      }

      if (conflictedFiles.length > 0) {
        toast.info(`Skipped ${conflictedFiles.length} file${conflictedFiles.length !== 1 ? 's' : ''} due to conflicts`);
      }

      if (syncedFiles.length === 0 && conflictedFiles.length === 0) {
        toast.info('No files needed syncing');
      }

      return {
        synced: syncedFiles,
        conflicts: conflictedFiles,
        projectFolder: projectName,
        statistics,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      toast.dismiss();
      throw error;
    }
  }

  async pushToGitHub(repoName: string, githubUsername?: string, ghToken?: string) {
    try {
      // Use cookies if username and token are not provided
      const githubToken = ghToken || Cookies.get('githubToken');
      const owner = githubUsername || Cookies.get('githubUsername');

      if (!githubToken || !owner) {
        throw new Error('GitHub token or username is not set in cookies or provided.');
      }

      // Initialize Octokit with the auth token
      const octokit = new Octokit({ auth: githubToken });

      // Check if the repository already exists before creating it
      let repo: RestEndpointMethodTypes['repos']['get']['response']['data'];

      try {
        const resp = await octokit.repos.get({ owner, repo: repoName });
        repo = resp.data;
      } catch (error) {
        if (error instanceof Error && 'status' in error && error.status === 404) {
          // Repository doesn't exist, so create a new one
          const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: false,
            auto_init: true,
          });
          repo = newRepo;
        } else {
          console.log('cannot create repo!');
          throw error; // Some other error occurred
        }
      }

      // Get all files
      const files = this.files.get();

      if (!files || Object.keys(files).length === 0) {
        throw new Error('No files found to push');
      }

      // Create blobs for each file
      const blobs = await Promise.all(
        Object.entries(files).map(async ([filePath, dirent]) => {
          if (dirent?.type === 'file' && dirent.content) {
            const { data: blob } = await octokit.git.createBlob({
              owner: repo.owner.login,
              repo: repo.name,
              content: Buffer.from(dirent.content).toString('base64'),
              encoding: 'base64',
            });
            return { path: extractRelativePath(filePath), sha: blob.sha };
          }

          return null;
        }),
      );

      const validBlobs = blobs.filter(Boolean); // Filter out any undefined blobs

      if (validBlobs.length === 0) {
        throw new Error('No valid files to push');
      }

      // Get the latest commit SHA (assuming main branch, update dynamically if needed)
      const { data: ref } = await octokit.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`, // Handle dynamic branch
      });
      const latestCommitSha = ref.object.sha;

      // Create a new tree
      const { data: newTree } = await octokit.git.createTree({
        owner: repo.owner.login,
        repo: repo.name,
        base_tree: latestCommitSha,
        tree: validBlobs.map((blob) => ({
          path: blob!.path,
          mode: '100644',
          type: 'blob',
          sha: blob!.sha,
        })),
      });

      // Create a new commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: repo.owner.login,
        repo: repo.name,
        message: 'Initial commit from your app',
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await octokit.git.updateRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`, // Handle dynamic branch
        sha: newCommit.sha,
      });

      alert(`Repository created and code pushed: ${repo.html_url}`);
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      throw error; // Rethrow the error for further handling
    }
  }

  async setSyncFolder(handle: FileSystemDirectoryHandle | null) {
    this.syncFolder.set(handle);

    if (handle) {
      try {
        const testDirName = '.bolt_test_' + Date.now();

        // Verify we have write permission by attempting to create a test directory
        await handle.getDirectoryHandle(testDirName, { create: true });

        // Clean up test directory
        await handle.removeEntry(testDirName);
        console.log('Sync folder write permission verified');
      } catch (error) {
        console.error('Failed to verify sync folder permissions:', error);
        toast.error('Unable to write to selected folder. Please choose a different folder.');
        this.syncFolder.set(null);
      }
    }
  }

  async initializeSession() {
    const session: SyncSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      lastSync: Date.now(),
      files: new Set(),
      history: [],
      statistics: [],
    };

    // Try to restore project folder from settings
    const settings = this.syncSettings.get();
    const projectName = (description.value ?? 'project').toLowerCase().split(' ').join('_');
    const projectInfo = settings.projectFolders[projectName];

    if (projectInfo) {
      session.projectFolder = projectInfo.folderName;
    }

    this.currentSession.set(session);

    if (settings.autoSync && this.syncFolder.get()) {
      await this.syncFiles();
    }
  }

  async loadSyncSettings() {
    try {
      const savedSettings = localStorage.getItem('syncSettings');

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        this.syncSettings.set({
          ...this.syncSettings.get(),
          ...settings,

          // Ensure new fields have default values
          autoSyncInterval: settings.autoSyncInterval ?? 5, // Default to 5 minutes
          projectFolders: settings.projectFolders ?? {},
        });
      } else {
        // Initialize with default values
        this.syncSettings.set({
          ...this.syncSettings.get(),
          autoSyncInterval: 5,
          projectFolders: {},
        });
      }
    } catch (error) {
      console.error('Failed to load sync settings:', error);
    }
  }

  async saveSyncSettings(settings: SyncSettings) {
    try {
      this.syncSettings.set(settings);

      // The subscription in constructor will handle saving to localStorage
    } catch (error) {
      console.error('Failed to save sync settings:', error);
      throw error;
    }
  }
}

export const workbenchStore = new WorkbenchStore();
