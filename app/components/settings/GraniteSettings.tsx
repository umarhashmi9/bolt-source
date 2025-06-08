// This component will render settings for IBM Granite models
import React from 'react';

interface GraniteSettingsProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  endpoint: string; // e.g., Watsonx.ai API endpoint
  onEndpointChange: (endpoint: string) => void;
  // Potentially other fields like IBM Cloud region or Watsonx.ai project ID if needed
}

const GraniteSettings: React.FC<GraniteSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  endpoint,
  onEndpointChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="graniteApiKey" className="block text-sm font-medium text-gray-700">
          IBM Cloud API Key (for Watsonx.ai)
        </label>
        <input
          type="password"
          id="graniteApiKey"
          name="graniteApiKey"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Your IBM Cloud API Key"
        />
      </div>
      <div>
        <label htmlFor="graniteEndpoint" className="block text-sm font-medium text-gray-700">
          API Endpoint (e.g., Watsonx.ai region)
        </label>
        <input
          type="text"
          id="graniteEndpoint"
          name="graniteEndpoint"
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., https://us-south.ml.cloud.ibm.com"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Ensure you have a Watsonx.ai instance and the necessary permissions for your API key.
      </p>
    </div>
  );
};

export default GraniteSettings;
