import { BaseProvider, createNotSupportedError } from './BaseProvider';
import {
  ProviderType,
  ProviderCapabilities,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions
} from '../../types/providers';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAIImageResponse {
  data: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

export class OpenAIProvider extends BaseProvider {
  readonly providerType: ProviderType = 'openai';
  readonly capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: true,
    speechGeneration: true,
    videoGeneration: false,
    webSearch: false,
    structuredOutput: true
  };

  private readonly baseUrl = 'https://api.openai.com/v1';

  private getHeaders(): HeadersInit {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add your OpenAI API key in settings.');
    }
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
    return this.retry(async () => {
      const messages: OpenAIMessage[] = [];
      
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const body: Record<string, unknown> = {
        model: 'gpt-3.5-turbo',
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
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data: OpenAIChatResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    });
  }

  async generateTextWithModel(
    prompt: string,
    model: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    return this.retry(async () => {
      const messages: OpenAIMessage[] = [];
      
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const body: Record<string, unknown> = {
        model,
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
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data: OpenAIChatResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    });
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    return this.retry(async () => {
      const size = this.getImageSize(options?.aspectRatio);
      
      const body: Record<string, unknown> = {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: options?.quality || 'standard',
        response_format: 'b64_json'
      };

      if (options?.style) {
        body.style = options.style;
      }

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data: OpenAIImageResponse = await response.json();
      const imageData = data.data[0];
      
      if (imageData.b64_json) {
        return `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        const imageResponse = await fetch(imageData.url);
        const blob = await imageResponse.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      throw new Error('No image data in response');
    });
  }

  private getImageSize(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9':
        return '1792x1024';
      case '9:16':
        return '1024x1792';
      case '3:4':
        return '1024x1024';
      case '1:1':
      default:
        return '1024x1024';
    }
  }

  async generateSpeech(text: string, options?: SpeechGenerationOptions): Promise<string> {
    return this.retry(async () => {
      const body: Record<string, unknown> = {
        model: 'tts-1-hd',
        input: text,
        voice: this.mapVoice(options?.voice),
        response_format: options?.format || 'mp3',
        speed: options?.speed || 1.0
      };

      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
  }

  private mapVoice(voice?: string): string {
    const voiceMap: Record<string, string> = {
      'Kore': 'alloy',
      'Zephyr': 'echo',
      'Fenrir': 'onyx',
      'alloy': 'alloy',
      'echo': 'echo',
      'fable': 'fable',
      'onyx': 'onyx',
      'nova': 'nova',
      'shimmer': 'shimmer'
    };
    return voiceMap[voice || ''] || 'alloy';
  }

  async generateVideo(_prompt: string, _options?: VideoGenerationOptions): Promise<string> {
    throw createNotSupportedError(this.providerType, 'Video generation');
  }
}

export const openAIProvider = new OpenAIProvider();
