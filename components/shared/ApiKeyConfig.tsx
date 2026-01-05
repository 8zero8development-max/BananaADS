import React, { useState, useEffect } from 'react';
import { GeminiService } from '../../services/geminiService';
import { providerManager } from '../../services/providers';
import { ProviderType, PROVIDER_INFO } from '../../types/providers';

interface ApiKeyConfigProps {
  onConfigured: () => void;
  onOpenModelDashboard?: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onConfigured, onOpenModelDashboard }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('gemini');

  useEffect(() => {
    if (GeminiService.hasApiKey() || providerManager.hasApiKeyForProvider('gemini')) {
      onConfigured();
    }
  }, [onConfigured]);

  const validateApiKey = (key: string, provider: ProviderType): boolean => {
    const prefix = PROVIDER_INFO[provider].apiKeyPrefix;
    if (prefix && !key.startsWith(prefix)) {
      setError(`Invalid API key format. ${PROVIDER_INFO[provider].name} API keys start with "${prefix}"`);
      return false;
    }
    return true;
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    
    if (!validateApiKey(apiKey.trim(), selectedProvider)) {
      return;
    }

    setValidating(true);
    setError('');
    
    try {
      if (selectedProvider === 'gemini') {
        GeminiService.setApiKey(apiKey.trim());
      }
      providerManager.setApiKeyForProvider(selectedProvider, apiKey.trim());
      onConfigured();
    } catch (e) {
      setError('Failed to save API key. Please try again.');
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-lg w-full glass p-10 rounded-3xl border border-yellow-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30 text-3xl">🍌</div>
        <h2 className="text-3xl font-serif mb-2">Enter Your API Key</h2>
        <p className="text-white/50 text-sm mb-6">Your key is stored securely in your browser only</p>
        
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Select AI Provider</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(provider => (
              <button
                key={provider}
                onClick={() => { setSelectedProvider(provider); setApiKey(''); setError(''); }}
                className={`p-3 rounded-xl text-left transition ${
                  selectedProvider === provider
                    ? 'bg-yellow-500/20 border border-yellow-500/30'
                    : 'bg-black/30 border border-white/10 hover:border-white/20'
                }`}
              >
                <p className="text-sm font-medium text-white">{PROVIDER_INFO[provider].name}</p>
                <p className="text-[10px] text-white/40 mt-1 line-clamp-1">{PROVIDER_INFO[provider].description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/50 rounded-xl p-5 mb-6 text-left border border-yellow-500/20">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">How to get your {PROVIDER_INFO[selectedProvider].name} API key</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">1</span>
              <p className="text-xs text-white/70">
                Visit <a href={PROVIDER_INFO[selectedProvider].apiKeyUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline font-medium">{PROVIDER_INFO[selectedProvider].name}</a> and sign in
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">2</span>
              <p className="text-xs text-white/70">Create or copy your API key</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">3</span>
              <p className="text-xs text-white/70">Paste it below to get started</p>
            </div>
          </div>
          {selectedProvider === 'gemini' && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-400 flex items-center gap-2">
                <span>✓</span>
                <span>The <strong>free tier</strong> includes generous limits for all AI features!</span>
              </p>
            </div>
          )}
        </div>

        <div className="relative mb-4">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setError(''); }}
            placeholder={PROVIDER_INFO[selectedProvider].apiKeyPrefix ? `${PROVIDER_INFO[selectedProvider].apiKeyPrefix}...` : 'Enter API key...'}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-white/30 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
          >
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button 
          onClick={handleSaveKey}
          disabled={validating || !apiKey.trim()}
          className="w-full gradient-accent py-4 rounded-xl font-bold text-black shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4"
        >
          {validating ? 'Saving...' : 'Save & Continue'}
        </button>

        <div className="text-xs text-white/30 space-y-1">
          <p>🔒 Your API key is stored locally in your browser</p>
          <p>🚫 We never send your key to our servers</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyConfig;
