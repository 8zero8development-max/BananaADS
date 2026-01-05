import {
  ProviderType,
  TaskType,
  AIProviderInterface,
  TextGenerationOptions,
  ImageGenerationOptions,
  SpeechGenerationOptions,
  VideoGenerationOptions,
  ProviderCapabilities
} from '../../types/providers';

const API_KEY_STORAGE_PREFIX = 'banana_ads_api_key_';

export abstract class BaseProvider implements AIProviderInterface {
  abstract readonly providerType: ProviderType;
  abstract readonly capabilities: ProviderCapabilities;

  protected encodeKey(key: string): string {
    const encoded = btoa(key);
    return encoded.split('').reverse().join('');
  }

  protected decodeKey(encoded: string): string {
    const reversed = encoded.split('').reverse().join('');
    return atob(reversed);
  }

  protected getStorageKey(): string {
    return `${API_KEY_STORAGE_PREFIX}${this.providerType}`;
  }

  protected getStoredApiKey(): string | null {
    try {
      const encoded = sessionStorage.getItem(this.getStorageKey());
      if (!encoded) return null;
      return this.decodeKey(encoded);
    } catch {
      return null;
    }
  }

  setApiKey(apiKey: string): void {
    try {
      const encoded = this.encodeKey(apiKey);
      sessionStorage.setItem(this.getStorageKey(), encoded);
    } catch (e) {
      console.error(`Failed to store API key for ${this.providerType}`);
    }
  }

  clearApiKey(): void {
    try {
      sessionStorage.removeItem(this.getStorageKey());
    } catch (e) {
      console.error(`Failed to clear API key for ${this.providerType}`);
    }
  }

  hasApiKey(): boolean {
    return !!this.getStoredApiKey();
  }

  protected async retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number }; message?: string };
      const status = err?.status || err?.response?.status;
      const message = err?.message || '';
      
      if (retries > 0 && (
        status === 429 ||
        status === 503 ||
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('UNAVAILABLE') ||
        message.includes('rate_limit') ||
        message.includes('Rate limit')
      )) {
        console.warn(`Rate limit hit for ${this.providerType}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  supportsTask(task: TaskType): boolean {
    switch (task) {
      case 'textGeneration':
      case 'emailGeneration':
      case 'brandResearch':
      case 'conceptGeneration':
      case 'scriptGeneration':
        return this.capabilities.textGeneration;
      case 'imageGeneration':
        return this.capabilities.imageGeneration;
      case 'speechGeneration':
        return this.capabilities.speechGeneration;
      case 'videoGeneration':
        return this.capabilities.videoGeneration;
      default:
        return false;
    }
  }

  abstract generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
  abstract generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
  abstract generateSpeech(text: string, options?: SpeechGenerationOptions): Promise<string>;
  abstract generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<string>;

  protected async convertSvgToPng(base64Svg: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => reject(e);
      img.src = base64Svg;
    });
  }

  protected async resolveImage(base64String: string): Promise<{ mimeType: string; data: string }> {
    let finalString = base64String;

    if (finalString.includes('image/svg+xml')) {
      try {
        finalString = await this.convertSvgToPng(finalString);
      } catch (e) {
        console.error('Failed to convert SVG to PNG', e);
      }
    }

    const match = finalString.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
      return {
        mimeType: match[1],
        data: match[2]
      };
    }

    return {
      mimeType: 'image/jpeg',
      data: finalString
    };
  }

  protected parseImageDataUrl(imageDataUrl: string): { mimeType: string; data: string } {
    const match = imageDataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
    return { mimeType: 'image/jpeg', data: imageDataUrl };
  }
}

export function createNotSupportedError(provider: ProviderType, task: string): Error {
  return new Error(`${task} is not supported by ${provider} provider`);
}
