import { GoogleGenAI, Type, Modality } from '@google/genai';
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

export class GeminiProvider extends BaseProvider {
  readonly providerType: ProviderType = 'gemini';
  readonly capabilities: ProviderCapabilities = {
    textGeneration: true,
    imageGeneration: true,
    speechGeneration: true,
    videoGeneration: true,
    webSearch: true,
    structuredOutput: true
  };

  private getClient(): GoogleGenAI {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please add your Gemini API key in settings.');
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateText(prompt: string, options?: TextGenerationOptions): Promise<string> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const config: Record<string, unknown> = {};
      
      if (options?.responseFormat === 'json') {
        config.responseMimeType = 'application/json';
        if (options.responseSchema) {
          config.responseSchema = options.responseSchema;
        }
      }

      if (options?.maxTokens) {
        config.maxOutputTokens = options.maxTokens;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined
      });

      return response.text || '';
    });
  }

  async generateTextWithSearch(prompt: string, options?: TextGenerationOptions): Promise<{ text: string; sources: string[] }> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const config: Record<string, unknown> = {
        tools: [{ googleSearch: {} }]
      };
      
      if (options?.responseFormat === 'json') {
        config.responseMimeType = 'application/json';
        if (options.responseSchema) {
          config.responseSchema = options.responseSchema;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config
      });

      const sources: string[] = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: { web?: { uri?: string } }) => {
          if (chunk.web?.uri) {
            sources.push(chunk.web.uri);
          }
        });
      }

      return { text: response.text || '', sources };
    });
  }

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (options?.referenceImages) {
        for (const ref of options.referenceImages) {
          parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
          if (ref.label) {
            parts.push({ text: ref.label });
          }
        }
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: options?.aspectRatio || '16:9'
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error('No image data found in response');
    });
  }

  async generateSpeech(text: string, options?: SpeechGenerationOptions): Promise<string> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: options?.voice || 'Kore'
              }
            }
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      
      throw new Error('No audio data found in response');
    });
  }

  async generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<string> {
    const ai = this.getClient();
    
    const config: Record<string, unknown> = {
      aspectRatio: options?.aspectRatio || '16:9'
    };

    const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    if (options?.initialImage) {
      const { mimeType, data } = await this.resolveImage(options.initialImage);
      contents.push({ inlineData: { mimeType, data } });
    }
    
    contents.push({ text: prompt });

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: options?.initialImage ? {
        imageBytes: (await this.resolveImage(options.initialImage)).data,
        mimeType: (await this.resolveImage(options.initialImage)).mimeType
      } : undefined,
      config
    });

    const startTime = Date.now();
    const timeout = 5 * 60 * 1000;

    while (!operation.done) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Video generation timed out after 5 minutes');
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      await operation.poll();
    }

    const video = operation.response?.generatedVideos?.[0];
    if (video?.video?.uri) {
      const videoResponse = await fetch(video.video.uri);
      const blob = await videoResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    throw new Error('No video data found in response');
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: object,
    model: string = 'gemini-3-flash-preview'
  ): Promise<T> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      return JSON.parse(response.text || '{}');
    });
  }

  async generateWithImages(
    prompt: string,
    images: Array<{ data: string; label?: string }>,
    options?: { model?: string; responseFormat?: 'text' | 'json'; responseSchema?: object }
  ): Promise<string> {
    const ai = this.getClient();
    
    return this.retry(async () => {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      for (const img of images) {
        const resolved = await this.resolveImage(img.data);
        parts.push({ inlineData: resolved });
        if (img.label) {
          parts.push({ text: img.label });
        }
      }

      parts.push({ text: prompt });

      const config: Record<string, unknown> = {};
      if (options?.responseFormat === 'json') {
        config.responseMimeType = 'application/json';
        if (options.responseSchema) {
          config.responseSchema = options.responseSchema;
        }
      }

      const response = await ai.models.generateContent({
        model: options?.model || 'gemini-2.5-flash',
        contents: { parts },
        config: Object.keys(config).length > 0 ? config : undefined
      });

      return response.text || '';
    });
  }

  async listModels(): Promise<DynamicModelInfo[]> {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        console.error('Failed to fetch Gemini models:', response.statusText);
        return [];
      }

      const data = await response.json();
      const models: DynamicModelInfo[] = [];

      for (const model of data.models || []) {
        const capabilities: TaskType[] = [];
        const methods = model.supportedGenerationMethods || [];

        if (methods.includes('generateContent')) {
          capabilities.push('textGeneration', 'emailGeneration', 'brandResearch', 'conceptGeneration', 'scriptGeneration');
        }
        if (methods.includes('generateImages') || model.name?.includes('image')) {
          capabilities.push('imageGeneration');
        }
        if (methods.includes('generateAudio') || model.name?.includes('tts')) {
          capabilities.push('speechGeneration');
        }
        if (methods.includes('generateVideos') || model.name?.includes('veo')) {
          capabilities.push('videoGeneration');
        }

        const modelId = model.name?.replace('models/', '') || model.name;
        
        models.push({
          id: `gemini/${modelId}`,
          name: model.displayName || modelId,
          provider: 'gemini',
          description: model.description,
          contextWindow: model.inputTokenLimit,
          maxOutputTokens: model.outputTokenLimit,
          capabilities,
          isAvailable: true
        });
      }

      return models;
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      return [];
    }
  }
}

export const geminiProvider = new GeminiProvider();
