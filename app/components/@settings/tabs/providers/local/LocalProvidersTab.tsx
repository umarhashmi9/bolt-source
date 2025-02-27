import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { motion, AnimatePresence } from 'framer-motion';
import { BsRobot } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import { TbBrandOpenai } from 'react-icons/tb';
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/Progress';
import OllamaModelInstaller from './OllamaModelInstaller';
import { classNames } from '~/utils/classNames';
import { FaServer } from 'react-icons/fa';

// Add type for provider names to ensure type safety
type ProviderName = 'Ollama' | 'LMStudio' | 'OpenAILike';

// Update the PROVIDER_ICONS type to use the ProviderName type
const PROVIDER_ICONS: Record<ProviderName, IconType> = {
  Ollama: BsRobot,
  LMStudio: BsRobot,
  OpenAILike: TbBrandOpenai,
};

// Update PROVIDER_DESCRIPTIONS to use the same type
const PROVIDER_DESCRIPTIONS: Record<ProviderName, string> = {
  Ollama: 'Run open-source models locally on your machine',
  LMStudio: 'Local model inference with LM Studio',
  OpenAILike: 'Connect to OpenAI-compatible API endpoints',
};

// Add a constant for the Ollama API base URL
const OLLAMA_API_URL = 'http://127.0.0.1:11434';

interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at: string;
  details?: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
  status?: 'idle' | 'updating' | 'updated' | 'error' | 'checking';
  error?: string;
  newDigest?: string;
  progress?: {
    current: number;
    total: number;
    status: string;
  };
}

interface OllamaPullResponse {
  status: string;
  completed?: number;
  total?: number;
  digest?: string;
}

const isOllamaPullResponse = (data: unknown): data is OllamaPullResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    typeof (data as OllamaPullResponse).status === 'string'
  );
};

export default function LocalProvidersTab() {
  const { providers, updateProviderSettings } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [categoryEnabled, setCategoryEnabled] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  // Effect to filter and sort providers
  useEffect(() => {
    const newFilteredProviders = Object.entries(providers || {})
      .filter(([key]) => [...LOCAL_PROVIDERS, 'OpenAILike'].includes(key))
      .map(([key, value]) => {
        const provider = value as IProviderConfig;
        const envKey = providerBaseUrlEnvKeys[key]?.baseUrlKey;
        const envUrl = envKey ? (import.meta.env[envKey] as string | undefined) : undefined;

        // Set base URL if provided by environment
        if (envUrl && !provider.settings.baseUrl) {
          updateProviderSettings(key, {
            ...provider.settings,
            baseUrl: envUrl,
          });
        }

        return {
          name: key,
          settings: {
            ...provider.settings,
            baseUrl: provider.settings.baseUrl || envUrl,
          },
          staticModels: provider.staticModels || [],
          getDynamicModels: provider.getDynamicModels,
          getApiKeyLink: provider.getApiKeyLink,
          labelForGetApiKey: provider.labelForGetApiKey,
          icon: provider.icon,
        } as IProviderConfig;
      });

    // Custom sort function to ensure LMStudio appears before OpenAILike
    const sorted = newFilteredProviders.sort((a, b) => {
      if (a.name === 'LMStudio') {
        return -1;
      }

      if (b.name === 'LMStudio') {
        return 1;
      }

      if (a.name === 'OpenAILike') {
        return 1;
      }

      if (b.name === 'OpenAILike') {
        return -1;
      }

      return a.name.localeCompare(b.name);
    });
    setFilteredProviders(sorted);
  }, [providers, updateProviderSettings]);

  // Add effect to update category toggle state based on provider states
  useEffect(() => {
    const newCategoryState = filteredProviders.every((p) => p.settings.enabled);
    setCategoryEnabled(newCategoryState);
  }, [filteredProviders]);

  // Fetch Ollama models when enabled
  useEffect(() => {
    const ollamaProvider = filteredProviders.find((p) => p.name === 'Ollama');

    if (ollamaProvider?.settings.enabled) {
      fetchOllamaModels();
    }
  }, [filteredProviders]);

  const fetchOllamaModels = async () => {
    try {
      setIsLoadingModels(true);

      const response = await fetch('http://127.0.0.1:11434/api/tags');
      const data = (await response.json()) as { models: OllamaModel[] };

      setOllamaModels(
        data.models.map((model) => ({
          ...model,
          status: 'idle' as const,
        })),
      );
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const updateOllamaModel = async (modelName: string): Promise<boolean> => {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${modelName}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response reader available');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          const rawData = JSON.parse(line);

          if (!isOllamaPullResponse(rawData)) {
            console.error('Invalid response format:', rawData);
            continue;
          }

          setOllamaModels((current) =>
            current.map((m) =>
              m.name === modelName
                ? {
                    ...m,
                    progress: {
                      current: rawData.completed || 0,
                      total: rawData.total || 0,
                      status: rawData.status,
                    },
                    newDigest: rawData.digest,
                  }
                : m,
            ),
          );
        }
      }

      const updatedResponse = await fetch('http://127.0.0.1:11434/api/tags');
      const updatedData = (await updatedResponse.json()) as { models: OllamaModel[] };
      const updatedModel = updatedData.models.find((m) => m.name === modelName);

      return updatedModel !== undefined;
    } catch (error) {
      console.error(`Error updating ${modelName}:`, error);
      return false;
    }
  };

  const handleToggleCategory = useCallback(
    async (enabled: boolean) => {
      filteredProviders.forEach((provider) => {
        updateProviderSettings(provider.name, { ...provider.settings, enabled });
      });
      toast(enabled ? 'All local providers enabled' : 'All local providers disabled');
    },
    [filteredProviders, updateProviderSettings],
  );

  const handleToggleProvider = (provider: IProviderConfig, enabled: boolean) => {
    updateProviderSettings(provider.name, {
      ...provider.settings,
      enabled,
    });

    if (enabled) {
      logStore.logProvider(`Provider ${provider.name} enabled`, { provider: provider.name });
      toast(`${provider.name} enabled`);
    } else {
      logStore.logProvider(`Provider ${provider.name} disabled`, { provider: provider.name });
      toast(`${provider.name} disabled`);
    }
  };

  const handleUpdateBaseUrl = (provider: IProviderConfig, newBaseUrl: string) => {
    updateProviderSettings(provider.name, {
      ...provider.settings,
      baseUrl: newBaseUrl,
    });
    toast(`${provider.name} base URL updated`);
    setEditingProvider(null);
  };

  const handleUpdateOllamaModel = async (modelName: string) => {
    const updateSuccess = await updateOllamaModel(modelName);

    if (updateSuccess) {
      toast(`Updated ${modelName}`);
    } else {
      toast(`Failed to update ${modelName}`);
    }
  };

  const handleDeleteOllamaModel = async (modelName: string) => {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${modelName}`);
      }

      setOllamaModels((current) => current.filter((m) => m.name !== modelName));
      toast(`Deleted ${modelName}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Error deleting ${modelName}:`, errorMessage);
      toast(`Failed to delete ${modelName}`);
    }
  };

  // Update model details display
  const ModelDetails = ({ model }: { model: OllamaModel }) => (
    <div className="model-details">
      <div className="model-detail">
        <div className="i-ph:code detail-icon" />
        <span>{model.digest.substring(0, 7)}</span>
      </div>
      {model.details && (
        <>
          <div className="model-detail">
            <div className="i-ph:database detail-icon" />
            <span>{model.details.parameter_size}</span>
          </div>
          <div className="model-detail">
            <div className="i-ph:cube detail-icon" />
            <span>{model.details.quantization_level}</span>
          </div>
        </>
      )}
    </div>
  );

  // Update model actions to not use Tooltip
  const ModelActions = ({
    model,
    onUpdate,
    onDelete,
  }: {
    model: OllamaModel;
    onUpdate: () => void;
    onDelete: () => void;
  }) => (
    <div className="model-actions">
      <motion.button
        onClick={onUpdate}
        disabled={model.status === 'updating'}
        className={`action-button update ${model.status === 'updating' ? 'disabled' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Update model"
      >
        {model.status === 'updating' ? (
          <div className="update-text">
            <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            <span className="text-sm">Updating...</span>
          </div>
        ) : (
          <div className="i-ph:arrows-clockwise text-lg" />
        )}
      </motion.button>
      <motion.button
        onClick={onDelete}
        disabled={model.status === 'updating'}
        className={`action-button delete ${model.status === 'updating' ? 'disabled' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Delete model"
      >
        <div className="i-ph:trash text-lg" />
      </motion.button>
    </div>
  );

  return (
    <div className="local-providers" role="region" aria-label="Local Providers Configuration">
      <motion.div
        className="providers-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <FaServer />
            </div>
            <div className="header-text">
              <h3 className="header-title">
                Local Providers
                <span className="provider-badge local">Local</span>
              </h3>
              <p className="header-description">Configure and manage local LLM providers</p>
            </div>
          </div>
          <div className="toggle-all">
            <span className="toggle-label">Enable All</span>
            <Switch
              checked={categoryEnabled}
              onCheckedChange={filteredProviders.length > 0 ? handleToggleCategory : undefined}
            />
          </div>
        </div>

        {/* Ollama Section */}
        {filteredProviders
          .filter((provider) => provider.name === 'Ollama')
          .map((provider) => (
            <motion.div
              key={provider.name}
              className="provider-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Provider Header */}
              <div className="provider-header">
                <div className="provider-info">
                  <div
                    className={classNames('provider-icon', {
                      enabled: !!provider.settings.enabled,
                    })}
                  >
                    {React.createElement(PROVIDER_ICONS[provider.name as ProviderName] || BsRobot, {
                      className: 'w-7 h-7',
                      'aria-label': `${provider.name} icon`,
                    })}
                  </div>
                  <div className="provider-text">
                    <div className="provider-name">
                      <h3>{provider.name}</h3>
                      <span className="provider-badge local">Local</span>
                    </div>
                    <p className="provider-description">{PROVIDER_DESCRIPTIONS[provider.name as ProviderName]}</p>
                  </div>
                </div>
                <Switch
                  checked={provider.settings.enabled}
                  onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                  aria-label={`Toggle ${provider.name} provider`}
                />
              </div>

              {/* URL Configuration Section */}
              <AnimatePresence>
                {provider.settings.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="url-config"
                  >
                    <label className="url-label">API Endpoint</label>
                    {editingProvider === provider.name ? (
                      <input
                        type="text"
                        defaultValue={provider.settings.baseUrl || OLLAMA_API_URL}
                        placeholder="Enter Ollama base URL"
                        className="url-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateBaseUrl(provider, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingProvider(null);
                          }
                        }}
                        onBlur={(e) => handleUpdateBaseUrl(provider, e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => setEditingProvider(provider.name)} className="url-display">
                        <div className="url-content">
                          <div className="i-ph:link url-icon" />
                          <span>{provider.settings.baseUrl || OLLAMA_API_URL}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ollama Models Section */}
              {provider.settings.enabled && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="models-section">
                  <div className="models-header">
                    <div className="models-title">
                      <div className="i-ph:cube-duotone models-icon" />
                      <h4>Installed Models</h4>
                    </div>
                    {isLoadingModels ? (
                      <div className="flex items-center gap-2">
                        <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                        <span className="models-count">Loading models...</span>
                      </div>
                    ) : (
                      <span className="models-count">{ollamaModels.length} models available</span>
                    )}
                  </div>

                  <div>
                    {isLoadingModels ? (
                      <div className="models-loading">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="model-placeholder" />
                        ))}
                      </div>
                    ) : ollamaModels.length === 0 ? (
                      <div className="models-empty">
                        <div className="i-ph:cube-transparent empty-icon" />
                        <p className="empty-message">No models installed yet</p>
                        <p className="empty-help">
                          Browse models at{' '}
                          <a
                            href="https://ollama.com/library"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="library-link"
                          >
                            ollama.com/library
                            <div className="i-ph:arrow-square-out text-xs" />
                          </a>{' '}
                          and copy model names to install
                        </p>
                      </div>
                    ) : (
                      ollamaModels.map((model) => (
                        <motion.div key={model.name} className="model-item" whileHover={{ scale: 1.01 }}>
                          <div className="model-item-header">
                            <div className="model-info">
                              <div className="model-info-name">
                                <h5>{model.name}</h5>
                                {model.status && model.status !== 'idle' && (
                                  <span className={classNames('model-status-badge', model.status)}>
                                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                                  </span>
                                )}
                              </div>
                              <ModelDetails model={model} />
                            </div>
                            <ModelActions
                              model={model}
                              onUpdate={() => handleUpdateOllamaModel(model.name)}
                              onDelete={() => {
                                if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
                                  handleDeleteOllamaModel(model.name);
                                }
                              }}
                            />
                          </div>
                          {model.progress && (
                            <div className="model-progress">
                              <div className="progress-info">
                                <span className="progress-status">{model.progress.status}</span>
                                <span className="progress-percentage">
                                  {Math.round((model.progress.current / model.progress.total) * 100)}%
                                </span>
                              </div>
                              <Progress value={Math.round((model.progress.current / model.progress.total) * 100)} />
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Model Installation Section */}
                  <OllamaModelInstaller onModelInstalled={fetchOllamaModels} />
                </motion.div>
              )}
            </motion.div>
          ))}

        {/* Other Providers Section */}
        <div className="other-providers">
          <h3 className="section-title">Other Local Providers</h3>
          <div className="providers-grid">
            {filteredProviders
              .filter((provider) => provider.name !== 'Ollama')
              .map((provider, index) => (
                <motion.div
                  key={provider.name}
                  className="provider-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Provider Header */}
                  <div className="provider-header">
                    <div className="provider-info">
                      <div
                        className={classNames('provider-icon', {
                          enabled: !!provider.settings.enabled,
                        })}
                      >
                        {React.createElement(PROVIDER_ICONS[provider.name as ProviderName] || BsRobot, {
                          className: 'w-7 h-7',
                          'aria-label': `${provider.name} icon`,
                        })}
                      </div>
                      <div className="provider-text">
                        <div className="provider-name">
                          <h3>{provider.name}</h3>
                          <div className="flex gap-1">
                            <span className="provider-badge local">Local</span>
                            {URL_CONFIGURABLE_PROVIDERS.includes(provider.name) && (
                              <span className="provider-badge configurable">Configurable</span>
                            )}
                          </div>
                        </div>
                        <p className="provider-description">{PROVIDER_DESCRIPTIONS[provider.name as ProviderName]}</p>
                      </div>
                    </div>
                    <Switch
                      checked={provider.settings.enabled}
                      onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                      aria-label={`Toggle ${provider.name} provider`}
                    />
                  </div>

                  {/* URL Configuration Section */}
                  <AnimatePresence>
                    {provider.settings.enabled && URL_CONFIGURABLE_PROVIDERS.includes(provider.name) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="url-config"
                      >
                        <label className="url-label">API Endpoint</label>
                        {editingProvider === provider.name ? (
                          <input
                            type="text"
                            defaultValue={provider.settings.baseUrl}
                            placeholder={`Enter ${provider.name} base URL`}
                            className="url-input"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateBaseUrl(provider, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingProvider(null);
                              }
                            }}
                            onBlur={(e) => handleUpdateBaseUrl(provider, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <div onClick={() => setEditingProvider(provider.name)} className="url-display">
                            <div className="url-content">
                              <div className="i-ph:link url-icon" />
                              <span>{provider.settings.baseUrl || 'Click to set base URL'}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
