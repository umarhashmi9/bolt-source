// This component will render settings for Google Vertex AI
import React, { useState } from 'react';

interface VertexAISettingsProps {
  serviceAccountJsonKey: string; // Store as string, parse when used
  onServiceAccountJsonKeyChange: (keyJson: string) => void;
  projectId: string;
  onProjectIdChange: (id: string) => void;
  locationId: string; // e.g., us-central1
  onLocationIdChange: (id: string) => void;
}

const VertexAISettings: React.FC<VertexAISettingsProps> = ({
  serviceAccountJsonKey,
  onServiceAccountJsonKeyChange,
  projectId,
  onProjectIdChange,
  locationId,
  onLocationIdChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="vertexAIProjectId" className="block text-sm font-medium text-gray-700">
          Google Cloud Project ID
        </label>
        <input
          type="text"
          id="vertexAIProjectId"
          name="vertexAIProjectId"
          value={projectId}
          onChange={(e) => onProjectIdChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="your-gcp-project-id"
        />
      </div>
      <div>
        <label htmlFor="vertexAILocationId" className="block text-sm font-medium text-gray-700">
          Location ID (e.g., us-central1)
        </label>
        <input
          type="text"
          id="vertexAILocationId"
          name="vertexAILocationId"
          value={locationId}
          onChange={(e) => onLocationIdChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="us-central1"
        />
      </div>
      <div>
        <label htmlFor="vertexAIServiceAccountKey" className="block text-sm font-medium text-gray-700">
          Service Account Key (JSON)
        </label>
        <textarea
          id="vertexAIServiceAccountKey"
          name="vertexAIServiceAccountKey"
          rows={6}
          value={serviceAccountJsonKey}
          onChange={(e) => onServiceAccountJsonKeyChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder='{ "type": "service_account", "project_id": "...", ... }'
        />
        <p className="mt-1 text-xs text-gray-500">
          Pasting your Service Account Key is required for authentication. Ensure this is handled securely.
        </p>
      </div>
    </div>
  );
};

export default VertexAISettings;
