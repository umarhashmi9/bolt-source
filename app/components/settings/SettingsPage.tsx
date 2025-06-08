// This component will render the main settings page
import React, { useState } from 'react';
import AzureOpenAISettings from './AzureOpenAISettings';
import VertexAISettings from './VertexAISettings';
import GraniteSettings from './GraniteSettings'; // Import GraniteSettings

const SettingsPage: React.FC = () => {
  const [azureOpenAIApiKey, setAzureOpenAIApiKey] = useState('');
  const [azureOpenAIEndpoint, setAzureOpenAIEndpoint] = useState('');

  // State for Vertex AI Settings
  const [vertexAIServiceAccountJsonKey, setVertexAIServiceAccountJsonKey] = useState('');
  const [vertexAIProjectId, setVertexAIProjectId] = useState('');
  const [vertexAILocationId, setVertexAILocationId] = useState('');

  // State for Granite Settings
  const [graniteApiKey, setGraniteApiKey] = useState('');
  const [graniteEndpoint, setGraniteEndpoint] = useState('');

  // In a real application, these settings would likely be persisted (e.g., in localStorage or a backend).
  // For now, we'll just keep them in component state.

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Azure OpenAI Configuration</h2>
        <AzureOpenAISettings
          apiKey={azureOpenAIApiKey}
          onApiKeyChange={setAzureOpenAIApiKey}
          endpoint={azureOpenAIEndpoint}
          onEndpointChange={setAzureOpenAIEndpoint}
        />
        {/* Display current values for demonstration, remove in production if sensitive */}
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p className="text-sm">Current API Key (for demo): {azureOpenAIApiKey}</p>
          <p className="text-sm">Current Endpoint (for demo): {azureOpenAIEndpoint}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Google Vertex AI Configuration</h2>
        <VertexAISettings
          serviceAccountJsonKey={vertexAIServiceAccountJsonKey}
          onServiceAccountJsonKeyChange={setVertexAIServiceAccountJsonKey}
          projectId={vertexAIProjectId}
          onProjectIdChange={setVertexAIProjectId}
          locationId={vertexAILocationId}
          onLocationIdChange={setVertexAILocationId}
        />
        {/* Display current values for demonstration, remove in production if sensitive */}
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p className="text-sm">Current Project ID (for demo): {vertexAIProjectId}</p>
          <p className="text-sm">Current Location ID (for demo): {vertexAILocationId}</p>
          <p className="text-sm">Service Account Key (for demo): {vertexAIServiceAccountJsonKey ? 'Provided' : 'Not Provided'}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">IBM Granite Configuration</h2>
        <GraniteSettings
          apiKey={graniteApiKey}
          onApiKeyChange={setGraniteApiKey}
          endpoint={graniteEndpoint}
          onEndpointChange={setGraniteEndpoint}
        />
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p className="text-sm">Current API Key (for demo): {graniteApiKey}</p>
          <p className="text-sm">Current Endpoint (for demo): {graniteEndpoint}</p>
        </div>
      </section>

      {/* Other settings sections can be added here */}
    </div>
  );
};

export default SettingsPage;
