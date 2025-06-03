import React, { useState, useCallback } from 'react';

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage(''); // Clear previous messages
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setMessage('Uploading...');
    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await fetch('/api/document-upload', {
        method: 'POST',
        body: formData,
        // Headers like 'Content-Type': 'multipart/form-data' are usually set automatically by the browser for FormData.
        // Add CSRF tokens or other custom headers if your application requires them.
      });

      // Try to parse JSON regardless of response.ok to get error details from body
      const result = await response.json();

      if (!response.ok) {
        // Use error message from server response if available
        throw new Error(result.error || `Upload failed with status: ${response.status}`);
      }

      setMessage(result.message || 'File uploaded successfully!');
      setSelectedFile(null); // Clear selection after successful upload

      // Clear the file input visually (this is a common trick)
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error uploading file.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '500px', margin: '20px auto' }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Upload Document for Knowledge Base</h3>
      <input
        id="file-upload-input"
        type="file"
        onChange={handleFileChange}
        accept=".txt,.pdf,.md,.zip,.json,.csv,.docx,.pptx,.xlsx" // Added more common types
        style={{ marginBottom: '10px', display: 'block' }}
        disabled={isUploading}
      />
      {selectedFile && (
        <p style={{ fontSize: '0.9em', color: '#555', margin: '10px 0' }}>
          Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </p>
      )}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        style={{
          padding: '10px 15px',
          backgroundColor: isUploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (isUploading || !selectedFile) ? 'not-allowed' : 'pointer',
          opacity: (isUploading || !selectedFile) ? 0.6 : 1,
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && (
        <p style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: message.startsWith('Error') || message.startsWith('Upload failed') ? '#ffebee' : '#e8f5e9',
          color: message.startsWith('Error') || message.startsWith('Upload failed') ? '#c62828' : '#2e7d32',
          borderRadius: '4px',
          fontSize: '0.9em',
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
