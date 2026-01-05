import { BaseProvider, createNotSupportedError } from './BaseProvider';
import {
  ProviderType,
  ProviderCapabilities,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions
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

  async listAvailableModels(): Promise<Array<{ id: string; name: string; pricing: { prompt: number; completion: number } }>> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((model: { id: string; name: string; pricing: { prompt: string; completion: string } }) => ({
      id: model.id,
      name: model.name,
      pricing: {
        prompt: parseFloat(model.pricing.prompt),
        completion: parseFloat(model.pricing.completion)
      }
    }));
  }
}

export const openRouterProvider = new OpenRouterProvider();
