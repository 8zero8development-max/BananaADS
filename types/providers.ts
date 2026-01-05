import { AdBrief, AdConcept, Scene, BrandDna } from '../types';

export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export type TaskType = 
  | 'textGeneration'
  | 'imageGeneration'
  | 'speechGeneration'
  | 'videoGeneration'
  | 'emailGeneration'
  | 'brandResearch'
  | 'conceptGeneration'
  | 'scriptGeneration';

export type TierType = 'free' | 'paid';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  capabilities: TaskType[];
  costPer1kTokens?: number;
  maxTokens?: number;
  description?: string;
}

export interface ProviderConfig {
  provider: ProviderType;
  apiKey?: string;
  enabled: boolean;
}

export interface TaskModelSelection {
  taskType: TaskType;
  selectedModel: string;
  tier: TierType;
}

export interface ModelSelectionState {
  selections: Record<TaskType, string>;
  tier: TierType;
  providerConfigs: Record<ProviderType, ProviderConfig>;
}

export interface TextGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
  responseSchema?: object;
}

export interface ImageGenerationOptions {
  aspectRatio?: string;
  quality?: 'standard' | 'hd';
  style?: string;
  referenceImages?: Array<{ mimeType: string; data: string; label?: string }>;
}

export interface SpeechGenerationOptions {
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'opus';
}

export interface VideoGenerationOptions {
  duration?: number;
  aspectRatio?: string;
  initialImage?: string;
}

export interface AIProviderInterface {
  readonly providerType: ProviderType;
  
  setApiKey(apiKey: string): void;
  clearApiKey(): void;
  hasApiKey(): boolean;
  
  generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
  generateSpeech(text: string, options?: SpeechGenerationOptions): Promise<string>;
  generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<string>;
  
  supportsTask(task: TaskType): boolean;
}

export interface ProviderCapabilities {
  textGeneration: boolean;
  imageGeneration: boolean;
  speechGeneration: boolean;
  videoGeneration: boolean;
  webSearch: boolean;
  structuredOutput: boolean;
}

export interface ModelUsageRecord {
  id: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  provider: ProviderType;
  taskType: TaskType;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs: number;
  success: boolean;
  error?: string;
  estimatedCost?: number;
}

export interface ModelAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  totalEstimatedCost: number;
  averageResponseTime: number;
  usageByModel: Record<string, number>;
  usageByTask: Record<TaskType, number>;
  usageByProvider: Record<ProviderType, number>;
  recentUsage: ModelUsageRecord[];
}

export interface DynamicModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  inputCostPer1kTokens?: number;
  outputCostPer1kTokens?: number;
  capabilities?: string[];
  isAvailable: boolean;
}

export const MODEL_CONFIG: Record<TaskType, { free: string[]; paid: string[] }> = {
  textGeneration: {
    free: [
      'gemini/gemini-3-flash-preview',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'openrouter/meta-llama/llama-3-8b-instruct'
    ],
    paid: [
      'gemini/gemini-3-pro-preview',
      'openai/gpt-4o',
      'anthropic/claude-3-opus',
      'openrouter/anthropic/claude-3-opus'
    ]
  },
  imageGeneration: {
    free: [
      'gemini/gemini-2.5-flash-image'
    ],
    paid: [
      'openai/dall-e-3',
      'gemini/gemini-2.5-flash-image'
    ]
  },
  speechGeneration: {
    free: [
      'gemini/gemini-2.5-flash-preview-tts'
    ],
    paid: [
      'openai/tts-1-hd',
      'gemini/gemini-2.5-flash-preview-tts'
    ]
  },
  videoGeneration: {
    free: [],
    paid: [
      'gemini/veo-3.1-fast-generate-preview'
    ]
  },
  emailGeneration: {
    free: [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'gemini/gemini-2.5-flash'
    ],
    paid: [
      'openai/gpt-4o',
      'anthropic/claude-3-opus',
      'gemini/gemini-2.5-flash'
    ]
  },
  brandResearch: {
    free: [
      'gemini/gemini-3-flash-preview'
    ],
    paid: [
      'gemini/gemini-3-pro-preview',
      'openai/gpt-4o'
    ]
  },
  conceptGeneration: {
    free: [
      'gemini/gemini-3-flash-preview',
      'openai/gpt-3.5-turbo'
    ],
    paid: [
      'gemini/gemini-3-pro-preview',
      'openai/gpt-4o',
      'anthropic/claude-3-opus'
    ]
  },
  scriptGeneration: {
    free: [
      'gemini/gemini-3-flash-preview',
      'openai/gpt-3.5-turbo'
    ],
    paid: [
      'gemini/gemini-3-pro-preview',
      'openai/gpt-4o'
    ]
  }
};

export const PROVIDER_INFO: Record<ProviderType, { name: string; description: string; apiKeyPrefix?: string; apiKeyUrl: string }> = {
  gemini: {
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI with text, image, speech, and video generation',
    apiKeyPrefix: 'AIza',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey'
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models, DALL-E image generation, and TTS',
    apiKeyPrefix: 'sk-',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models for advanced text generation',
    apiKeyPrefix: 'sk-ant-',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys'
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access multiple AI models through a single API',
    apiKeyPrefix: 'sk-or-',
    apiKeyUrl: 'https://openrouter.ai/keys'
  }
};

export const MODEL_INFO_CATALOG: ModelInfo[] = [
  {
    id: 'gemini/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'gemini',
    capabilities: ['textGeneration', 'brandResearch', 'conceptGeneration', 'scriptGeneration'],
    description: 'Fast, efficient text generation with web search'
  },
  {
    id: 'gemini/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'gemini',
    capabilities: ['textGeneration', 'brandResearch', 'conceptGeneration', 'scriptGeneration'],
    description: 'Advanced reasoning and text generation'
  },
  {
    id: 'gemini/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    capabilities: ['textGeneration', 'emailGeneration'],
    description: 'Balanced performance for general tasks'
  },
  {
    id: 'gemini/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'gemini',
    capabilities: ['imageGeneration'],
    description: 'Image generation and editing'
  },
  {
    id: 'gemini/gemini-2.5-flash-preview-tts',
    name: 'Gemini TTS',
    provider: 'gemini',
    capabilities: ['speechGeneration'],
    description: 'Text-to-speech generation'
  },
  {
    id: 'gemini/veo-3.1-fast-generate-preview',
    name: 'Veo 3.1',
    provider: 'gemini',
    capabilities: ['videoGeneration'],
    description: 'Video generation (paid tier only)'
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    capabilities: ['textGeneration', 'emailGeneration', 'conceptGeneration', 'scriptGeneration'],
    costPer1kTokens: 0.0005,
    description: 'Fast and cost-effective text generation'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['textGeneration', 'emailGeneration', 'brandResearch', 'conceptGeneration', 'scriptGeneration'],
    costPer1kTokens: 0.005,
    description: 'Most capable OpenAI model'
  },
  {
    id: 'openai/dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: ['imageGeneration'],
    description: 'High-quality image generation'
  },
  {
    id: 'openai/tts-1-hd',
    name: 'TTS-1 HD',
    provider: 'openai',
    capabilities: ['speechGeneration'],
    description: 'High-definition text-to-speech'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    capabilities: ['textGeneration', 'emailGeneration'],
    costPer1kTokens: 0.00025,
    description: 'Fast and affordable Claude model'
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    capabilities: ['textGeneration', 'emailGeneration', 'conceptGeneration', 'scriptGeneration'],
    costPer1kTokens: 0.015,
    description: 'Most capable Claude model'
  },
  {
    id: 'openrouter/meta-llama/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    provider: 'openrouter',
    capabilities: ['textGeneration'],
    costPer1kTokens: 0.0001,
    description: 'Open-source model via OpenRouter'
  },
  {
    id: 'openrouter/anthropic/claude-3-opus',
    name: 'Claude 3 Opus (via OpenRouter)',
    provider: 'openrouter',
    capabilities: ['textGeneration', 'emailGeneration', 'conceptGeneration', 'scriptGeneration'],
    costPer1kTokens: 0.015,
    description: 'Claude 3 Opus accessed through OpenRouter'
  }
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_INFO_CATALOG.find(m => m.id === modelId);
}

export function getModelsForTask(task: TaskType, tier: TierType): ModelInfo[] {
  const modelIds = MODEL_CONFIG[task][tier];
  return modelIds
    .map(id => getModelInfo(id))
    .filter((m): m is ModelInfo => m !== undefined);
}

export function getProviderFromModelId(modelId: string): ProviderType {
  const parts = modelId.split('/');
  return parts[0] as ProviderType;
}

export function getDefaultModelSelections(tier: TierType): Record<TaskType, string> {
  const selections: Record<TaskType, string> = {} as Record<TaskType, string>;
  
  for (const task of Object.keys(MODEL_CONFIG) as TaskType[]) {
    const models = MODEL_CONFIG[task][tier];
    selections[task] = models[0] || MODEL_CONFIG[task].free[0] || '';
  }
  
  return selections;
}
