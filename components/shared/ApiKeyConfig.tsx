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
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-lg w-full glass p-6 rounded-2xl border border-yellow-500/30 relative overflow-hidden max-h-[90vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-yellow-500/30 text-xl">🍌</div>
          <div className="text-left">
            <h2 className="text-xl font-serif">Enter Your API Key</h2>
            <p className="text-white/50 text-xs">Stored securely in your browser</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Select AI Provider</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(provider => (
                <button
                  key={provider}
                  onClick={() => { setSelectedProvider(provider); setApiKey(''); setError(''); }}
                  className={`p-2 rounded-lg text-left transition ${
                    selectedProvider === provider
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-black/30 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-medium text-white">{PROVIDER_INFO[provider].name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/50 rounded-lg p-3 text-left border border-yellow-500/20">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Get your {PROVIDER_INFO[selectedProvider].name} API key</p>
            <p className="text-xs text-white/70">
              Visit <a href={PROVIDER_INFO[selectedProvider].apiKeyUrl} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline font-medium">{PROVIDER_INFO[selectedProvider].name}</a>, sign in, and create an API key.
            </p>
            {selectedProvider === 'gemini' && (
              <p className="text-xs text-green-400 mt-2">✓ Free tier includes generous limits!</p>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(''); }}
              placeholder={PROVIDER_INFO[selectedProvider].apiKeyPrefix ? `${PROVIDER_INFO[selectedProvider].apiKeyPrefix}...` : 'Enter API key...'}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 pr-10 text-white placeholder-white/30 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition text-sm"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-white/10">
          <button 
            onClick={handleSaveKey}
            disabled={validating || !apiKey.trim()}
            className="w-full gradient-accent py-3 rounded-lg font-bold text-black shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {validating ? 'Saving...' : 'Save & Continue'}
          </button>
          <p className="text-[10px] text-white/30 mt-2">🔒 Stored locally, never sent to our servers</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyConfig;
