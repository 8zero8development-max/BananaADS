import React, { useState, useEffect } from 'react';
import { providerManager, geminiProvider } from '../../services/providers';
import {
  ProviderType,
  TaskType,
  TierType,
  MODEL_CONFIG,
  PROVIDER_INFO,
  MODEL_INFO_CATALOG,
  getModelInfo,
  getModelsForTask,
  DynamicModelInfo,
  ModelInfo
} from '../../types/providers';

interface ModelSelectionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TASK_LABELS: Record<TaskType, string> = {
  textGeneration: 'Text Generation',
  imageGeneration: 'Image Generation',
  speechGeneration: 'Speech/Voiceover',
  videoGeneration: 'Video Generation',
  emailGeneration: 'Email Generation',
  brandResearch: 'Brand Research',
  conceptGeneration: 'Concept Generation',
  scriptGeneration: 'Script Generation'
};

const TASK_DESCRIPTIONS: Record<TaskType, string> = {
  textGeneration: 'General text generation for various tasks',
  imageGeneration: 'Generate images for storyboards and mood boards',
  speechGeneration: 'Generate voiceovers for video ads',
  videoGeneration: 'Generate cinematic video clips',
  emailGeneration: 'Generate email campaign content',
  brandResearch: 'Research brand information with web search',
  conceptGeneration: 'Generate creative ad concepts',
  scriptGeneration: 'Generate video scripts and scenes'
};

const ModelSelectionDashboard: React.FC<ModelSelectionDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'providers'>('models');
  const [tier, setTier] = useState<TierType>(providerManager.getTier());
  const [selections, setSelections] = useState<Record<TaskType, string>>({} as Record<TaskType, string>);
  const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
    gemini: '',
    openai: '',
    anthropic: '',
    openrouter: ''
  });
  const [showKeys, setShowKeys] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    openai: false,
    anthropic: false,
    openrouter: false
  });
  const [savingProvider, setSavingProvider] = useState<ProviderType | null>(null);
  const [dynamicModels, setDynamicModels] = useState<DynamicModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const state = providerManager.getState();
    setTier(state.tier);
    setSelections(state.selections);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && providerManager.hasApiKeyForProvider('gemini')) {
      setLoadingModels(true);
      geminiProvider.listModels()
        .then(models => {
          setDynamicModels(models);
        })
        .catch(err => {
          console.error('Failed to load dynamic models:', err);
        })
        .finally(() => {
          setLoadingModels(false);
        });
    }
  }, [isOpen]);

  const handleTierChange = (newTier: TierType) => {
    setTier(newTier);
    providerManager.setTier(newTier);
    setSelections(providerManager.getState().selections);
  };

  const handleModelChange = (task: TaskType, modelId: string) => {
    setSelections(prev => ({ ...prev, [task]: modelId }));
    providerManager.setModelForTask(task, modelId);
  };

  const handleSaveApiKey = async (provider: ProviderType) => {
    const key = apiKeys[provider];
    if (!key.trim()) return;

    setSavingProvider(provider);
    try {
      providerManager.setApiKeyForProvider(provider, key.trim());
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
    } finally {
      setSavingProvider(null);
    }
  };

  const handleClearApiKey = (provider: ProviderType) => {
    providerManager.clearApiKeyForProvider(provider);
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
  };

  const getAvailableModels = (task: TaskType): ModelInfo[] => {
    // If we have dynamically loaded models, use those filtered by task capability
    if (dynamicModels.length > 0) {
      const filteredDynamic = dynamicModels
        .filter(model => model.capabilities?.includes(task))
        .map(model => ({
          id: model.id,
          name: model.name,
          provider: model.provider,
          capabilities: model.capabilities || [],
          description: model.description,
          maxTokens: model.maxOutputTokens
        }));
      
      if (filteredDynamic.length > 0) {
        return filteredDynamic;
      }
    }

    // Fall back to static model config, filtered by providers with API keys
    const models = getModelsForTask(task, tier);
    return models.filter(model => {
      const provider = model.provider;
      return providerManager.hasApiKeyForProvider(provider);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden glass rounded-3xl border border-yellow-500/30 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif">Model Selection Dashboard</h2>
            <p className="text-white/50 text-sm mt-1">Configure AI providers and select models for each task</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition ${
              activeTab === 'models'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Model Selection
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition ${
              activeTab === 'providers'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            API Keys
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/10">
                <span className="text-sm text-white/70">Tier:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTierChange('free')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      tier === 'free'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Free Tier
                  </button>
                  <button
                    onClick={() => handleTierChange('paid')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      tier === 'paid'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Paid Tier
                  </button>
                </div>
                <span className="text-xs text-white/40 ml-auto">
                  {tier === 'free' ? 'Cost-effective models' : 'Premium models for best quality'}
                </span>
              </div>

              <div className="grid gap-4">
                {(Object.keys(TASK_LABELS) as TaskType[]).map(task => {
                  const models = getAvailableModels(task);
                  const selectedModel = selections[task] || '';
                  const selectedModelInfo = getModelInfo(selectedModel);

                  return (
                    <div
                      key={task}
                      className="p-4 bg-black/30 rounded-xl border border-white/10 hover:border-white/20 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{TASK_LABELS[task]}</h3>
                          <p className="text-xs text-white/40 mt-1">{TASK_DESCRIPTIONS[task]}</p>
                        </div>
                        <select
                          value={selectedModel}
                          onChange={(e) => handleModelChange(task, e.target.value)}
                          className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none min-w-[200px]"
                        >
                          {models.length === 0 ? (
                            <option value="">No models available</option>
                          ) : (
                            models.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      {selectedModelInfo && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs">
                          <span className="px-2 py-1 bg-white/5 rounded text-white/50">
                            {PROVIDER_INFO[selectedModelInfo.provider].name}
                          </span>
                          {selectedModelInfo.costPer1kTokens && (
                            <span className="text-white/40">
                              ${selectedModelInfo.costPer1kTokens.toFixed(4)}/1K tokens
                            </span>
                          )}
                          {selectedModelInfo.description && (
                            <span className="text-white/40 flex-1 truncate">
                              {selectedModelInfo.description}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(provider => {
                const info = PROVIDER_INFO[provider];
                const hasKey = providerManager.hasApiKeyForProvider(provider);

                return (
                  <div
                    key={provider}
                    className="p-5 bg-black/30 rounded-xl border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-white flex items-center gap-2">
                          {info.name}
                          {hasKey && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Connected
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-white/40 mt-1">{info.description}</p>
                      </div>
                      <a
                        href={info.apiKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-yellow-400 hover:underline"
                      >
                        Get API Key
                      </a>
                    </div>

                    {hasKey ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white/50 text-sm font-mono">
                          ••••••••••••••••
                        </div>
                        <button
                          onClick={() => handleClearApiKey(provider)}
                          className="px-4 py-3 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type={showKeys[provider] ? 'text' : 'password'}
                            value={apiKeys[provider]}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                            placeholder={`Enter ${info.name} API key...`}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-yellow-500/50 focus:outline-none text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                          >
                            {showKeys[provider] ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveApiKey(provider)}
                          disabled={!apiKeys[provider].trim() || savingProvider === provider}
                          className="px-4 py-3 gradient-accent text-black rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingProvider === provider ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    )}

                    {info.apiKeyPrefix && !hasKey && (
                      <p className="text-xs text-white/30 mt-2">
                        API keys start with "{info.apiKeyPrefix}"
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-sm font-medium text-blue-400 mb-2">About API Keys</h4>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• API keys are stored securely in your browser only</li>
                  <li>• Keys are never sent to our servers</li>
                  <li>• You can use multiple providers simultaneously</li>
                  <li>• The system will automatically fall back to available providers if one fails</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={() => {
              providerManager.resetToDefaults();
              setSelections(providerManager.getState().selections);
              setTier(providerManager.getTier());
            }}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 gradient-accent text-black rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectionDashboard;
