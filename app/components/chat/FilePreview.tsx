import React from 'react';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[]; // This is used to find previews for image files
  onRemove: (fileToRemove: File) => void; // Changed to pass the File object
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  // Helper to find image data URL for a file. This is inefficient and fragile.
  // Ideally, uploadedFiles would store objects like { file: File, previewUrl?: string }
  const findPreviewUrl = (file: File, index: number) => {
    if (file.type.startsWith('image/')) {
      // This assumes imageDataList is somewhat in sync or that the Nth image file
      // corresponds to the Nth entry in imageDataList if only images were in it.
      // This is a major simplification. A more robust solution would involve
      // BaseChat.tsx managing a list of {file: File, previewUrl?: string} objects.
      // For now, we try to find a match by some heuristic or direct index if possible.
      // This will likely take the first available image preview if multiple images exist.
      // A better way is to find the image preview that corresponds to 'file'.
      // Let's assume for now that 'imageDataList' might be out of sync or only contain
      // previews for a subset of files. The `index` here is the index in the `files` array.
      // A simple (but potentially flawed) approach: if the file is an image,
      // try to find its corresponding preview in imageDataList.
      // This could be done by BaseChat preparing a map or by FilePreview searching.
      // Given the current props, direct reliable mapping is hard.
      // We'll use imageDataList[index] for simplicity, assuming some order correspondence
      // for images that *do* have previews. This is a known limitation.
      // A more direct approach: iterate through files and if it's an image, try to find its corresponding data in imageDataList
      // This is still problematic. Let's assume for now that BaseChat will filter imageDataList
      // when a file is removed.
      // For display, we'll find the first image in files and use the first imageDataList item,
      // then second image with second item, etc. This is what the original code implicitly did.
      let imagePreviewIndex = -1;
      for(let i = 0; i <= index; i++) {
        if(files[i].type.startsWith('image/')) {
          imagePreviewIndex++;
        }
      }
      if (imagePreviewIndex < imageDataList.length) {
        return imageDataList[imagePreviewIndex];
      }
      return undefined; // No preview found for this image file
    }
    return undefined;
  };

  return (
    <div className="flex flex-row overflow-x-auto mx-2 -mt-1 p-2 bg-bolt-elements-background-depth-3 border border-b-none border-bolt-elements-borderColor rounded-lg rounded-b-none">
      {files.map((file, index) => {
        const previewUrl = findPreviewUrl(file, index);
        const isImage = file.type.startsWith('image/');

        return (
          <div key={file.name + '-' + file.lastModified + '-' + file.size} className="mr-2 relative flex flex-col items-center justify-center p-1 border border-bolt-elements-borderColor/50 rounded-md">
            {isImage && previewUrl ? (
              <img src={previewUrl} alt={file.name} className="max-h-20 max-w-xs object-contain rounded-md" />
            ) : (
              <div className="w-16 h-20 flex flex-col items-center justify-center bg-bolt-elements-background-depth-1 rounded-md">
                {/* Generic file icon - replace with actual icon component if available */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bolt-elements-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-bolt-elements-textTertiary mt-1 truncate max-w-[5rem]">{file.name}</span>
              </div>
            )}
            <button
              onClick={() => onRemove(file)} // Pass the actual File object
              className="absolute -top-2 -right-2 z-10 bg-red-600 text-white rounded-full w-5 h-5 shadow-md hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <div className="i-ph:x w-3 h-3" /> {/* Assuming i-ph:x is available */}
            </button>
            {!isImage && (
              <div className="mt-1 w-full text-center">
                <span className="truncate text-xs text-bolt-elements-textSecondary">{file.name}</span>
              </div>
            )}
            {isImage && previewUrl && (
               <div className="absolute bottom-0 w-full h-5 flex items-center justify-center px-1 rounded-b-md text-bolt-elements-textTertiary font-thin text-xs bg-bolt-elements-background-depth-2/80 backdrop-blur-sm">
                <span className="truncate">{file.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FilePreview;
