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
import Cookies from 'js-cookie';


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

  const [isSyncing, setIsSyncing] = useState(false);

  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);

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

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      toast.error('Failed to update file content');
    });
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const handleSyncFiles = useCallback(async () => {
    setIsSyncing(true);

    try {
      const directoryHandle = await window.showDirectoryPicker();
      await workbenchStore.syncFiles(directoryHandle);
      toast.success('Files synced successfully');
    } catch (error) {
      console.error('Error syncing files:', error);
      toast.error('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  }, []);


  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalContent, setModalContent] = useState("");
  const modalUploadFiles = useCallback(async () => {
    const externalUrl = "https://templatecreative.com/";

    try {
      const response = await fetch(externalUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch external URL");
      }
      const body = await response.text();
      setModalContent(body);  
      setIsModalOpen(true); 
    } catch (error) {
      console.error("Failed to fetch external URL:", error);
    }
    
  }, []);

  
  
  const closeModal = () => {
    console.error("Failed to fetch external URL:");

     setIsModalOpen(false);
   };
 

   const handleCopyLink = (fileUrl: string) => {
    navigator.clipboard.writeText(fileUrl)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy the link: ', error);
      });
  };

  const deleteFiles = async (fileUrl: string) => {
    const formData = new FormData();
  
    const getFileNameFromUrl = (url: string): string => {
      const parts = url.split("/");
      return parts[parts.length - 1]; 
    };
  
    const getFolderFromUrl = (): string => {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const path = url.pathname.split("/").filter(Boolean);
      return path[path.length - 1] || "uploads";
    };
  
    const fileName = getFileNameFromUrl(fileUrl);
  
    formData.append("file", fileName);
    formData.append("folder", getFolderFromUrl());
  
    const externalUrl = "https://templatecreative.com/delete.php";
  
    try {
      const response = await fetch(externalUrl, {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
  
      if (response.ok) {
        console.log("File deleted successfully:", result);
  
        await fetchUploadedFiles();
      } else {
        console.error("File deletion failed:", result);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };
  


 const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

 interface ImageResponse {
  images: string[]; 
}

  useEffect(() => {
    if (isModalOpen) {


    const getFolderFromUrl = () => {
      const currentUrl = window.location.href;
    
      const parts = currentUrl.split("/");
    
      const folderId = parts[parts.length - 1];
    
      return folderId;
    };


    setUploadedFiles([]);
      fetch('https://templatecreative.com/list.php?folder='+getFolderFromUrl()) 
        .then((response) => response.json())
        .then((data) => {
          const imageData = data as ImageResponse;

          const imageUrls = Object.values(imageData.images);
          setUploadedFiles(imageUrls);
        })
        .catch((error) => console.error("Error fetching image list:", error));
    }
  }, [isModalOpen]);



  const uploadFile = async (file: File) => {
    const formData = new FormData();

    const getFolderFromUrl = () => {
      const currentUrl = window.location.href;
    
      const url = new URL(currentUrl);
    
      const path = url.pathname;
    
      const parts = path.split("/").filter(Boolean); 
    
      const folderId = parts[parts.length - 1];
    
      return folderId || "uploads";
    };
    

    formData.append("file", file);
    formData.append("folder", getFolderFromUrl()); 
    const externalUrl = "https://templatecreative.com/api.php";
  
    try {
      const response = await fetch(externalUrl, {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
  
      if (response.ok) {
        console.log("Upload success:", result);
  
        await fetchUploadedFiles();
      } else {
        console.error("Upload failed:", result);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };
  
  const fetchUploadedFiles = async () => {


    const getFolderFromUrl = () => {
      const currentUrl = window.location.href;
      const parts = currentUrl.split("/");
    
      const folderId = parts[parts.length - 1];
    
      return folderId;
    };

    setUploadedFiles([]);
    const listUrl = "https://templatecreative.com/list.php?folder="+getFolderFromUrl();
  
    
    try {
      const response = await fetch(listUrl);
      const data = await response.json();
  
      const imageData = data as ImageResponse;
      const imageUrls = Object.values(imageData.images);
  
      setUploadedFiles(imageUrls);
    } catch (error) {
      console.error("Error fetching image list:", error);
    }
  }

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
                   

                    <PanelHeaderButton className="mr-1 text-sm" onClick={modalUploadFiles}>
                    Upload Files
                    </PanelHeaderButton>

                    {isModalOpen && (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-[9999]"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div className="relative bg-gray-800 rounded-lg shadow-2xl w-4/5 max-w-3xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white">Upload Files</h3>
        <button
          className="text-white bg-red-600 p-2 rounded-full hover:bg-red-800 transition duration-300"
          onClick={() => setIsModalOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="p-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const form = e.target as HTMLFormElement;
            const file = form.elements.namedItem('file') as HTMLInputElement;
            const selectedFile = file?.files?.[0];

            if (selectedFile) {
              await uploadFile(selectedFile);
            }
          }}
        >
        
          <div className="mb-6">
            <label htmlFor="file" className="block text-gray-300 mb-2 font-medium">
              Select File
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept=".jpg,.png,.pdf"
              className="w-full p-3 bg-gray-900 text-gray-200 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
            >
              Upload
            </button>
          </div>
        </form>

        {uploadedFiles.length > 0 && (
  <div className="mt-8">
    <h4 className="text-lg text-gray-200 font-semibold mb-4">Uploaded Images</h4>
    <div className="grid grid-cols-3 gap-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      {uploadedFiles.map((fileUrl, index) => (
        <div
          key={index}
          className="relative w-full h-48 bg-gray-900 rounded-md shadow-md overflow-hidden group"
        >
          <img
            crossOrigin="anonymous"
            src={fileUrl}
            alt={`Uploaded Image ${index + 1}`}
            className="w-full h-full object-cover group-hover:opacity-75 transition duration-300"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-800 bg-opacity-75 text-center">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCopyLink(fileUrl)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={() => deleteFiles(fileUrl)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition duration-300 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      </div>
    </div>
  </div>
)}




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
                      onClick={() => {
                        const repoName = prompt(
                          'Please enter a name for your new GitHub repository:',
                          'bolt-generated-project',
                        );

                        if (!repoName) {
                          alert('Repository name is required. Push to GitHub cancelled.');
                          return;
                        }

                        const githubUsername = Cookies.get('githubUsername');
                        const githubToken = Cookies.get('githubToken');

                        if (!githubUsername || !githubToken) {
                          const usernameInput = prompt('Please enter your GitHub username:');
                          const tokenInput = prompt('Please enter your GitHub personal access token:');

                          if (!usernameInput || !tokenInput) {
                            alert('GitHub username and token are required. Push to GitHub cancelled.');
                            return;
                          }

                          workbenchStore.pushToGitHub(repoName, usernameInput, tokenInput);
                        } else {
                          workbenchStore.pushToGitHub(repoName, githubUsername, githubToken);
                        }
                      }}
                    >
                      <div className="i-ph:github-logo" />
                      Push ke Github
                    </PanelHeaderButton>
                  </div>
                )}

                 <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
          onClick={() => {
            const repoUrl = prompt('Enter the Git url');
            window.open(`https://app.netlify.com/start/deploy?repository=${encodeURIComponent(repoUrl)}`, '_blank');
          }}
        >
         Deploy
        </button>
                
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
