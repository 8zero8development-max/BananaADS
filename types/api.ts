// API Response Types
export interface GeminiError {
  code: number;
  message: string;
  status?: string;
}

export interface GeminiResponse<T = any> {
  text?: string;
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    groundingMetadata?: {
      groundingChunks: Array<{
        web?: {
          uri: string;
        };
      }>;
    };
  }>;
}

export interface ImageGenerationResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

export interface VideoOperation {
  name: string;
  done: boolean;
  response?: {
    generatedVideos: Array<{
      video: {
        uri: string;
      };
    }>;
  };
}

// API Request Types
export interface GenerateContentRequest {
  model: string;
  contents: any;
  config?: {
    tools?: Array<{ googleSearch: {} }>;
    responseMimeType?: string;
    responseSchema?: any;
    imageConfig?: {
      aspectRatio?: string;
    };
    speechConfig?: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: string;
        };
      };
    };
    responseModalities?: string[];
  };
}

export interface GenerateVideosRequest {
  model: string;
  prompt: string;
  image?: {
    imageBytes: string;
    mimeType: string;
  };
  config?: {
    numberOfVideos: number;
    resolution: string;
    aspectRatio: string;
  };
}

// Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}