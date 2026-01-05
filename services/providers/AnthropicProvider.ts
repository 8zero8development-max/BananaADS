import { BaseProvider, createNotSupportedError } from './BaseProvider';
import {
  ProviderType,
  ProviderCapabilities,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions
} from '../../types/providers';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  stop_reason: string;
}

export class AnthropicProvider extends BaseProvider {
  readonly providerType: ProviderType = 'anthropic';
  readonly capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: false,
    speechGeneration: false,
    videoGeneration: false,
    webSearch: false,
    structuredOutput: true
  };

  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly apiVersion = '2023-06-01';

  private getHeaders(): HeadersInit {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please add your Anthropic API key in settings.');
    }
    return {
      'x-api-key': apiKey,
      'anthropic-version': this.apiVersion,
      'Content-Type': 'application/json'
    };
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
    return this.retry(async () => {
      const messages: AnthropicMessage[] = [
        { role: 'user', content: prompt }
      ];

      const body: Record<string, unknown> = {
        model: 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 4096,
        messages
      };

      if (options?.systemPrompt) {
        body.system = options.systemPrompt;
      }

      if (options?.temperature !== undefined) {
        body.temperature = options.temperature;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data: AnthropicResponse = await response.json();
      const textContent = data.content.find(c => c.type === 'text');
      return textContent?.text || '';
    });
  }

  async generateTextWithModel(
    prompt: string,
    model: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    return this.retry(async () => {
      const messages: AnthropicMessage[] = [
        { role: 'user', content: prompt }
      ];

      const modelMap: Record<string, string> = {
        'claude-3-haiku': 'claude-3-haiku-20240307',
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022'
      };

      const body: Record<string, unknown> = {
        model: modelMap[model] || model,
        max_tokens: options?.maxTokens || 4096,
        messages
      };

      if (options?.systemPrompt) {
        body.system = options.systemPrompt;
      }

      if (options?.temperature !== undefined) {
        body.temperature = options.temperature;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data: AnthropicResponse = await response.json();
      const textContent = data.content.find(c => c.type === 'text');
      return textContent?.text || '';
    });
  }

  async generateStructuredOutput<T>(
    prompt: string,
    _schema: object,
    model: string = 'claude-3-haiku'
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
      console.error('Failed to parse Anthropic JSON response:', text);
      throw new Error('Failed to parse JSON response from Anthropic');
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
}

export const anthropicProvider = new AnthropicProvider();
