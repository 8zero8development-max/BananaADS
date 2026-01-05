import React from 'react';
import { ProviderType } from '../../types/providers';

interface ModelStatusIndicatorProps {
  isActive: boolean;
  modelName?: string;
  provider?: ProviderType;
  operation?: string;
  className?: string;
}

const PROVIDER_COLORS: Record<ProviderType, string> = {
  gemini: 'bg-blue-500',
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  openrouter: 'bg-purple-500'
};

const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({
  isActive,
  modelName,
  provider,
  operation,
  className = ''
}) => {
  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/10 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full ${provider ? PROVIDER_COLORS[provider] : 'bg-yellow-400'} animate-pulse`} />
        <div className={`absolute w-2 h-2 rounded-full ${provider ? PROVIDER_COLORS[provider] : 'bg-yellow-400'} animate-ping opacity-75`} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-white/90">
          {modelName || 'AI Model'}
        </span>
        {operation && (
          <span className="text-[10px] text-white/50">{operation}</span>
        )}
      </div>
    </div>
  );
};

export default ModelStatusIndicator;
