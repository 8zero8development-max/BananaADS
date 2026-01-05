import {
  ProviderType,
  TaskType,
  TierType,
  ModelSelectionState,
  ProviderConfig,
  MODEL_CONFIG,
  getProviderFromModelId,
  getDefaultModelSelections,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions
} from '../../types/providers';
import { BaseProvider } from './BaseProvider';
import { GeminiProvider, geminiProvider } from './GeminiProvider';
import { OpenAIProvider, openAIProvider } from './OpenAIProvider';
import { AnthropicProvider, anthropicProvider } from './AnthropicProvider';
import { OpenRouterProvider, openRouterProvider } from './OpenRouterProvider';

const STORAGE_KEY = 'banana_ads_model_selections';

type AnyProvider = GeminiProvider | OpenAIProvider | AnthropicProvider | OpenRouterProvider;

class ProviderManager {
  private providers: Record<ProviderType, AnyProvider> = {
    gemini: geminiProvider,
    openai: openAIProvider,
    anthropic: anthropicProvider,
    openrouter: openRouterProvider
  };

  private state: ModelSelectionState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ModelSelectionState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load model selections:', e);
    }

    return this.getDefaultState();
  }

  private getDefaultState(): ModelSelectionState {
    return {
      selections: getDefaultModelSelections('free'),
      tier: 'free',
      providerConfigs: {
        gemini: { provider: 'gemini', enabled: true },
        openai: { provider: 'openai', enabled: false },
        anthropic: { provider: 'anthropic', enabled: false },
        openrouter: { provider: 'openrouter', enabled: false }
      }
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save model selections:', e);
    }
  }

  getState(): ModelSelectionState {
    return { ...this.state };
  }

  setTier(tier: TierType): void {
    this.state.tier = tier;
    this.state.selections = getDefaultModelSelections(tier);
    this.saveState();
  }

  getTier(): TierType {
    return this.state.tier;
  }

  setModelForTask(task: TaskType, modelId: string): void {
    this.state.selections[task] = modelId;
    this.saveState();
  }

  getModelForTask(task: TaskType): string {
    return this.state.selections[task] || MODEL_CONFIG[task][this.state.tier][0] || '';
  }

  setProviderConfig(provider: ProviderType, config: Partial<ProviderConfig>): void {
    this.state.providerConfigs[provider] = {
      ...this.state.providerConfigs[provider],
      ...config
    };
    this.saveState();
  }

  getProviderConfig(provider: ProviderType): ProviderConfig {
    return this.state.providerConfigs[provider];
  }

  isProviderEnabled(provider: ProviderType): boolean {
    return this.state.providerConfigs[provider]?.enabled ?? false;
  }

  getProvider(provider: ProviderType): AnyProvider {
    return this.providers[provider];
  }

  getProviderForModel(modelId: string): AnyProvider {
    const providerType = getProviderFromModelId(modelId);
    return this.providers[providerType];
  }

  hasApiKeyForProvider(provider: ProviderType): boolean {
    return this.providers[provider].hasApiKey();
  }

  setApiKeyForProvider(provider: ProviderType, apiKey: string): void {
    this.providers[provider].setApiKey(apiKey);
    this.setProviderConfig(provider, { enabled: true });
  }

  clearApiKeyForProvider(provider: ProviderType): void {
    this.providers[provider].clearApiKey();
    this.setProviderConfig(provider, { enabled: false });
  }

  getAvailableModelsForTask(task: TaskType): string[] {
    const tier = this.state.tier;
    const models = MODEL_CONFIG[task][tier];
    
    return models.filter(modelId => {
      const provider = getProviderFromModelId(modelId);
      return this.hasApiKeyForProvider(provider);
    });
  }

  async generateText(
    task: TaskType,
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    const modelId = this.getModelForTask(task);
    const provider = this.getProviderForModel(modelId);
    
    if (!provider.hasApiKey()) {
      throw new Error(`API key not configured for ${getProviderFromModelId(modelId)}`);
    }

    try {
      return await provider.generateText(prompt, options);
    } catch (error) {
      const fallbackResult = await this.tryFallback(task, 'text', prompt, options);
      if (fallbackResult !== null) {
        return fallbackResult;
      }
      throw error;
    }
  }

  async generateImage(
    task: TaskType,
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<string> {
    const modelId = this.getModelForTask(task);
    const provider = this.getProviderForModel(modelId);
    
    if (!provider.hasApiKey()) {
      throw new Error(`API key not configured for ${getProviderFromModelId(modelId)}`);
    }

    if (!provider.supportsTask('imageGeneration')) {
      const fallbackResult = await this.tryFallback(task, 'image', prompt, options);
      if (fallbackResult !== null) {
        return fallbackResult;
      }
      throw new Error(`Image generation not supported by ${getProviderFromModelId(modelId)}`);
    }

    try {
      return await provider.generateImage(prompt, options);
    } catch (error) {
      const fallbackResult = await this.tryFallback(task, 'image', prompt, options);
      if (fallbackResult !== null) {
        return fallbackResult;
      }
      throw error;
    }
  }

  async generateSpeech(
    task: TaskType,
    text: string,
    options?: SpeechGenerationOptions
  ): Promise<string> {
    const modelId = this.getModelForTask(task);
    const provider = this.getProviderForModel(modelId);
    
    if (!provider.hasApiKey()) {
      throw new Error(`API key not configured for ${getProviderFromModelId(modelId)}`);
    }

    if (!provider.supportsTask('speechGeneration')) {
      const fallbackResult = await this.tryFallbackSpeech(task, text, options);
      if (fallbackResult !== null) {
        return fallbackResult;
      }
      throw new Error(`Speech generation not supported by ${getProviderFromModelId(modelId)}`);
    }

    try {
      return await provider.generateSpeech(text, options);
    } catch (error) {
      const fallbackResult = await this.tryFallbackSpeech(task, text, options);
      if (fallbackResult !== null) {
        return fallbackResult;
      }
      throw error;
    }
  }

  async generateVideo(
    task: TaskType,
    prompt: string,
    options?: VideoGenerationOptions
  ): Promise<string> {
    const modelId = this.getModelForTask(task);
    const provider = this.getProviderForModel(modelId);
    
    if (!provider.hasApiKey()) {
      throw new Error(`API key not configured for ${getProviderFromModelId(modelId)}`);
    }

    if (!provider.supportsTask('videoGeneration')) {
      throw new Error(`Video generation not supported by ${getProviderFromModelId(modelId)}`);
    }

    return await provider.generateVideo(prompt, options);
  }

  private async tryFallback(
    task: TaskType,
    type: 'text' | 'image',
    prompt: string,
    options?: TextGenerationOptions | ImageGenerationOptions
  ): Promise<string | null> {
    const tier = this.state.tier;
    const models = MODEL_CONFIG[task][tier];
    const currentModel = this.getModelForTask(task);
    
    for (const modelId of models) {
      if (modelId === currentModel) continue;
      
      const provider = this.getProviderForModel(modelId);
      if (!provider.hasApiKey()) continue;
      
      const taskType = type === 'text' ? 'textGeneration' : 'imageGeneration';
      if (!provider.supportsTask(taskType)) continue;
      
      try {
        console.log(`Falling back to ${modelId} for ${task}`);
        if (type === 'text') {
          return await provider.generateText(prompt, options as TextGenerationOptions);
        } else {
          return await provider.generateImage(prompt, options as ImageGenerationOptions);
        }
      } catch (e) {
        console.warn(`Fallback to ${modelId} failed:`, e);
        continue;
      }
    }
    
    if (tier === 'free') {
      const paidModels = MODEL_CONFIG[task]['paid'];
      for (const modelId of paidModels) {
        const provider = this.getProviderForModel(modelId);
        if (!provider.hasApiKey()) continue;
        
        const taskType = type === 'text' ? 'textGeneration' : 'imageGeneration';
        if (!provider.supportsTask(taskType)) continue;
        
        try {
          console.log(`Falling back to paid model ${modelId} for ${task}`);
          if (type === 'text') {
            return await provider.generateText(prompt, options as TextGenerationOptions);
          } else {
            return await provider.generateImage(prompt, options as ImageGenerationOptions);
          }
        } catch (e) {
          console.warn(`Fallback to paid model ${modelId} failed:`, e);
          continue;
        }
      }
    }
    
    return null;
  }

  private async tryFallbackSpeech(
    task: TaskType,
    text: string,
    options?: SpeechGenerationOptions
  ): Promise<string | null> {
    const tier = this.state.tier;
    const models = MODEL_CONFIG[task][tier];
    const currentModel = this.getModelForTask(task);
    
    for (const modelId of models) {
      if (modelId === currentModel) continue;
      
      const provider = this.getProviderForModel(modelId);
      if (!provider.hasApiKey()) continue;
      if (!provider.supportsTask('speechGeneration')) continue;
      
      try {
        console.log(`Falling back to ${modelId} for speech generation`);
        return await provider.generateSpeech(text, options);
      } catch (e) {
        console.warn(`Fallback to ${modelId} failed:`, e);
        continue;
      }
    }
    
    return null;
  }

  resetToDefaults(): void {
    this.state = this.getDefaultState();
    this.saveState();
  }

  getGeminiProvider(): GeminiProvider {
    return this.providers.gemini as GeminiProvider;
  }

  getOpenAIProvider(): OpenAIProvider {
    return this.providers.openai as OpenAIProvider;
  }

  getAnthropicProvider(): AnthropicProvider {
    return this.providers.anthropic as AnthropicProvider;
  }

  getOpenRouterProvider(): OpenRouterProvider {
    return this.providers.openrouter as OpenRouterProvider;
  }
}

export const providerManager = new ProviderManager();
export { ProviderManager };
