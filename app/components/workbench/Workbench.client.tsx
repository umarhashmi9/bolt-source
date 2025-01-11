import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import useViewport from '~/lib/hooks';
import Tooltip from '~/components/ui/Tooltip';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
}

const viewTransition = { ease: cubicEasingFn };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(({ chatStarted, isStreaming }: WorkspaceProps) => {
  renderLogger.trace('Workbench');

  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);
  const syncSettings = useStore(workbenchStore.syncSettings);
  const syncFolder = useStore(workbenchStore.syncFolder);
  const [isSyncing, setIsSyncing] = useState(false);
  const currentSession = useStore(workbenchStore.currentSession);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncStats, setSyncStats] = useState<{ files: number; size: string } | null>(null);

  const isSmallViewport = useViewport(1024);

  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };

  useEffect(() => {
    if (hasPreview) {
      setSelectedView('preview');
    }
  }, [hasPreview]);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const handleSync = async () => {
    if (!syncFolder) {
      toast.error('Please select a sync folder first');
      return;
    }

    try {
      setIsSyncing(true);
      await workbenchStore.syncFiles();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const onFileSave = useCallback(async () => {
    try {
      await workbenchStore.saveCurrentDocument();

      if (syncSettings.syncOnSave && syncFolder) {
        await handleSync();
      }
    } catch (error) {
      toast.error('Failed to update file content');
      console.error('Save error:', error);
    }
  }, [syncSettings.syncOnSave, syncFolder]);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  useEffect(() => {
    if (!currentSession?.lastSync) {
      return undefined;
    }

    const updateLastSyncTime = () => {
      const now = Date.now();
      const diff = now - currentSession.lastSync;

      if (diff < 60000) {
        setLastSyncTime('just now');
      } else if (diff < 3600000) {
        setLastSyncTime(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setLastSyncTime(`${Math.floor(diff / 3600000)}h ago`);
      }
    };

    updateLastSyncTime();

    const interval = setInterval(updateLastSyncTime, 60000);

    return () => clearInterval(interval);
  }, [currentSession?.lastSync]);

  const handleSelectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await workbenchStore.setSyncFolder(handle);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Failed to select sync folder:', error);
    }
  };

  useEffect(() => {
    if (!currentSession?.statistics?.length) {
      return;
    }

    const lastStats = currentSession.statistics[currentSession.statistics.length - 1];

    if (lastStats) {
      setSyncStats({
        files: lastStats.totalFiles,
        size: formatBytes(lastStats.totalSize),
      });
    }
  }, [currentSession?.statistics]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    chatStarted && (
      <motion.div
        initial="closed"
        animate={showWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-workbench"
      >
        <div
          className={classNames(
            'fixed top-[calc(var(--header-height)+1.5rem)] bottom-6 w-[var(--workbench-inner-width)] mr-4 z-0 transition-[left,width] duration-200 bolt-ease-cubic-bezier',
            {
              'w-full': isSmallViewport,
              'left-0': showWorkbench && isSmallViewport,
              'left-[var(--workbench-left)]': showWorkbench,
              'left-[100%]': !showWorkbench,
            },
          )}
        >
          <div className="absolute inset-0 px-2 lg:px-6">
            <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm rounded-lg overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                <div className="ml-auto" />
                {selectedView === 'code' && (
                  <div className="flex overflow-y-auto">
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.downloadZip();
                      }}
                    >
                      <div className="i-ph:code" />
                      Download Code
                    </PanelHeaderButton>
                    <div className="flex items-center gap-2 border-l border-bolt-elements-borderColor pl-2">
                      {syncFolder ? (
                        <div className="flex items-center gap-2">
                          <Tooltip
                            content={
                              <div className="space-y-1 p-1">
                                <div className="font-medium">Sync Folder:</div>
                                <div className="text-sm text-gray-400">{syncFolder.name}</div>
                                {syncStats && (
                                  <>
                                    <div className="font-medium mt-2">Last Sync:</div>
                                    <div className="text-sm text-gray-400">
                                      {syncStats.files} files ({syncStats.size})
                                    </div>
                                  </>
                                )}
                              </div>
                            }
                          >
                            <div className="flex items-center text-sm text-gray-400">
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}
                              />
                              <span className="truncate max-w-[150px]">
                                {isSyncing ? 'Syncing...' : `Synced ${lastSyncTime || 'never'}`}
                              </span>
                            </div>
                          </Tooltip>

                          <PanelHeaderButton
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className={`i-ph:arrows-clockwise ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                          </PanelHeaderButton>

                          <PanelHeaderButton onClick={handleSelectFolder} className="flex items-center gap-2 text-sm">
                            <div className="i-ph:folder-simple" />
                            Change Folder
                          </PanelHeaderButton>

                          <PanelHeaderButton
                            onClick={() => {
                              workbenchStore.saveSyncSettings({
                                ...syncSettings,
                                syncOnSave: !syncSettings.syncOnSave,
                              });
                            }}
                            className={`flex items-center gap-2 text-sm ${syncSettings.syncOnSave ? 'text-green-400' : ''}`}
                          >
                            <div className={syncSettings.syncOnSave ? 'i-ph:check-square' : 'i-ph:square'} />
                            Auto-sync
                          </PanelHeaderButton>
                        </div>
                      ) : (
                        <Tooltip content="Select a folder to enable file synchronization">
                          <PanelHeaderButton
                            onClick={handleSelectFolder}
                            className="flex items-center gap-2 text-gray-400 hover:text-white"
                          >
                            <div className="i-ph:folder-simple-plus" />
                            Set Sync Folder
                          </PanelHeaderButton>
                        </Tooltip>
                      )}
                    </div>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                      }}
                    >
                      <div className="i-ph:terminal" />
                      Toggle Terminal
                    </PanelHeaderButton>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={async () => {
                        try {
                          const repoName = prompt(
                            'Please enter a name for your new GitHub repository:',
                            'bolt-generated-project',
                          );

                          if (!repoName) {
                            toast.error('Repository name is required');
                            return;
                          }

                          const githubToken = prompt('Please enter your GitHub personal access token:');

                          if (!githubToken) {
                            toast.error('GitHub token is required');
                            return;
                          }

                          toast.info('Pushing to GitHub...');
                          await workbenchStore.pushToGitHub(repoName, githubToken);
                        } catch (error) {
                          console.error('Failed to push to GitHub:', error);
                          toast.error('Failed to push to GitHub. Please check your token and try again.');
                        }
                      }}
                    >
                      <div className="i-ph:github-logo" />
                      Push to GitHub
                    </PanelHeaderButton>
                  </div>
                )}
                <IconButton
                  icon="i-ph:x-circle"
                  className="-mr-1"
                  size="xl"
                  onClick={() => {
                    workbenchStore.showWorkbench.set(false);
                  }}
                />
              </div>
              <div className="relative flex-1 overflow-hidden">
                <View
                  initial={{ x: selectedView === 'code' ? 0 : '-100%' }}
                  animate={{ x: selectedView === 'code' ? 0 : '-100%' }}
                >
                  <EditorPanel
                    editorDocument={currentDocument}
                    isStreaming={isStreaming}
                    selectedFile={selectedFile}
                    files={files}
                    unsavedFiles={unsavedFiles}
                    onFileSelect={onFileSelect}
                    onEditorScroll={onEditorScroll}
                    onEditorChange={onEditorChange}
                    onFileSave={onFileSave}
                    onFileReset={onFileReset}
                  />
                </View>
                <View
                  initial={{ x: selectedView === 'preview' ? 0 : '100%' }}
                  animate={{ x: selectedView === 'preview' ? 0 : '100%' }}
                >
                  <Preview />
                </View>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  );
});

interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
