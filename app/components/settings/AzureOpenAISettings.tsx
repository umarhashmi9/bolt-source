// This component will render settings for Azure OpenAI
import React, { useState } from 'react';

interface AzureOpenAISettingsProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  endpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

const AzureOpenAISettings: React.FC<AzureOpenAISettingsProps> = ({
  apiKey,
  onApiKeyChange,
  endpoint,
  onEndpointChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="azureOpenAIApiKey" className="block text-sm font-medium text-gray-700">
          Azure OpenAI API Key
        </label>
        <input
          type="password"
          id="azureOpenAIApiKey"
          name="azureOpenAIApiKey"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="azureOpenAIEndpoint" className="block text-sm font-medium text-gray-700">
          Azure OpenAI Endpoint
        </label>
        <input
          type="text"
          id="azureOpenAIEndpoint"
          name="azureOpenAIEndpoint"
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

export default AzureOpenAISettings;
