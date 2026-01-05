import { BaseProvider, createNotSupportedError } from './BaseProvider';
import {
  ProviderType,
  ProviderCapabilities,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions,
  DynamicModelInfo,
  TaskType
} from '../../types/providers';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterProvider extends BaseProvider {
  readonly providerType: ProviderType = 'openrouter';
  readonly capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: false,
    speechGeneration: false,
    videoGeneration: false,
    webSearch: false,
    structuredOutput: true
  };

  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  private getHeaders(): HeadersInit {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please add your OpenRouter API key in settings.');
    }
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'BananaADS'
    };
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
    return this.generateTextWithModel(prompt, 'meta-llama/llama-3-8b-instruct', options);
  }

  async generateTextWithModel(
    prompt: string,
    model: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    return this.retry(async () => {
      const messages: OpenRouterMessage[] = [];
      
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const body: Record<string, unknown> = {
        model: this.normalizeModelId(model),
        messages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7
      };

      if (options?.responseFormat === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    });
  }

  private normalizeModelId(model: string): string {
    if (model.startsWith('openrouter/')) {
      return model.replace('openrouter/', '');
    }
    return model;
  }

  async generateStructuredOutput<T>(
    prompt: string,
    _schema: object,
    model: string = 'meta-llama/llama-3-8b-instruct'
  ): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: You must respond with valid JSON only. Do not include any text before or after the JSON object. Do not use markdown code blocks.`;

    const text = await this.generateTextWithModel(jsonPrompt, model, {
      responseFormat: 'json'
    });

    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse OpenRouter JSON response:', text);
      throw new Error('Failed to parse JSON response from OpenRouter');
    }
  }

  async generateImage(_prompt: string, _options?: ImageGenerationOptions): Promise<string> {
    throw createNotSupportedError(this.providerType, 'Image generation');
  }

  async generateSpeech(_text: string, _options?: SpeechGenerationOptions): Promise<string> {
    throw createNotSupportedError(this.providerType, 'Speech generation');
  }

  async generateVideo(_prompt: string, _options?: VideoGenerationOptions): Promise<string> {
    throw createNotSupportedError(this.providerType, 'Video generation');
  }

  async listModels(): Promise<DynamicModelInfo[]> {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        console.error('Failed to fetch OpenRouter models:', response.statusText);
        return [];
      }

      const data = await response.json();
      const models: DynamicModelInfo[] = [];

      for (const model of data.data || []) {
        const capabilities: TaskType[] = ['textGeneration'];
        const modelId = model.id;

        // Most OpenRouter models support text generation
        // Add more capabilities based on model name patterns
        if (modelId.includes('gpt-4') || modelId.includes('claude-3') || modelId.includes('opus') || modelId.includes('sonnet')) {
          capabilities.push('emailGeneration', 'brandResearch', 'conceptGeneration', 'scriptGeneration');
        } else if (modelId.includes('gpt-3') || modelId.includes('llama') || modelId.includes('mistral') || modelId.includes('haiku')) {
          capabilities.push('emailGeneration', 'conceptGeneration', 'scriptGeneration');
        }

        // Check for image generation models
        if (modelId.includes('dall-e') || modelId.includes('stable-diffusion') || modelId.includes('midjourney') || modelId.includes('flux')) {
          capabilities.push('imageGeneration');
        }

        models.push({
          id: `openrouter/${modelId}`,
          name: model.name || modelId,
          provider: 'openrouter',
          description: model.description || `${model.name} via OpenRouter`,
          contextWindow: model.context_length,
          maxOutputTokens: model.top_provider?.max_completion_tokens,
          inputCostPer1kTokens: model.pricing?.prompt ? parseFloat(model.pricing.prompt) * 1000 : undefined,
          outputCostPer1kTokens: model.pricing?.completion ? parseFloat(model.pricing.completion) * 1000 : undefined,
          capabilities,
          isAvailable: true
        });
      }

      return models;
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }
}

export const openRouterProvider = new OpenRouterProvider();
