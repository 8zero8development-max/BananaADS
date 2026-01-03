import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

interface ApiKeyConfigProps {
  onConfigured: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (GeminiService.hasApiKey()) {
      onConfigured();
    }
  }, [onConfigured]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini API keys start with "AIza"');
      return;
    }

    setValidating(true);
    setError('');

    try {
      GeminiService.setApiKey(apiKey.trim());
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
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          🍌
        </div>
        <h2 className="text-3xl font-serif mb-2">Enter Your API Key</h2>
        <p className="text-white/50 text-sm mb-6">
          Your key is stored securely in your browser only
        </p>

        <div className="bg-black/50 rounded-xl p-5 mb-6 text-left border border-yellow-500/20">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
            How to get your FREE API key
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">
                1
              </span>
              <p className="text-xs text-white/70">
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-yellow-400 hover:underline font-medium"
                >
                  Google AI Studio
                </a>{' '}
                and sign in with your Google account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">
                2
              </span>
              <p className="text-xs text-white/70">
                Click "Create API Key" and select or create a project
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">
                3
              </span>
              <p className="text-xs text-white/70">
                Copy your API key and paste it below
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 flex items-center gap-2">
              <span>✓</span>
              <span>The <strong>free tier</strong> includes generous limits for all AI features!</span>
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError('');
            }}
            placeholder="AIzaSy..."
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