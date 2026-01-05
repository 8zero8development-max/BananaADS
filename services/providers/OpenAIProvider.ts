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
        console.error('Failed to fetch OpenAI models:', response.statusText);
        return [];
      }

      const data = await response.json();
      const models: DynamicModelInfo[] = [];

      for (const model of data.data || []) {
        const capabilities: TaskType[] = [];
        const modelId = model.id;

        // Categorize models by their capabilities
        if (modelId.includes('gpt') || modelId.includes('o1') || modelId.includes('o3')) {
          capabilities.push('textGeneration', 'emailGeneration', 'conceptGeneration', 'scriptGeneration');
          if (modelId.includes('gpt-4') || modelId.includes('o1') || modelId.includes('o3')) {
            capabilities.push('brandResearch');
          }
        }
        if (modelId.includes('dall-e')) {
          capabilities.push('imageGeneration');
        }
        if (modelId.includes('tts')) {
          capabilities.push('speechGeneration');
        }
        if (modelId.includes('whisper')) {
          // Whisper is for transcription, not generation
          continue;
        }
        if (modelId.includes('embedding')) {
          // Skip embedding models
          continue;
        }

        // Skip models without relevant capabilities
        if (capabilities.length === 0) {
          continue;
        }

        models.push({
          id: `openai/${modelId}`,
          name: this.formatModelName(modelId),
          provider: 'openai',
          description: model.description || this.getModelDescription(modelId),
          contextWindow: model.context_window,
          maxOutputTokens: model.max_output_tokens,
          capabilities,
          isAvailable: true
        });
      }

      return models;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [];
    }
  }

  private formatModelName(modelId: string): string {
    const nameMap: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'dall-e-3': 'DALL-E 3',
      'dall-e-2': 'DALL-E 2',
      'tts-1': 'TTS-1',
      'tts-1-hd': 'TTS-1 HD',
      'o1-preview': 'o1 Preview',
      'o1-mini': 'o1 Mini',
      'o3-mini': 'o3 Mini'
    };
    return nameMap[modelId] || modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private getModelDescription(modelId: string): string {
    const descMap: Record<string, string> = {
      'gpt-4o': 'Most capable GPT-4 model with vision',
      'gpt-4o-mini': 'Smaller, faster GPT-4o variant',
      'gpt-4-turbo': 'GPT-4 Turbo with improved performance',
      'gpt-4': 'Advanced reasoning and text generation',
      'gpt-3.5-turbo': 'Fast and cost-effective text generation',
      'dall-e-3': 'High-quality image generation',
      'dall-e-2': 'Image generation and editing',
      'tts-1': 'Text-to-speech generation',
      'tts-1-hd': 'High-definition text-to-speech',
      'o1-preview': 'Advanced reasoning model',
      'o1-mini': 'Smaller reasoning model',
      'o3-mini': 'Latest reasoning model'
    };
    return descMap[modelId] || '';
  }
}

export const openAIProvider = new OpenAIProvider();
