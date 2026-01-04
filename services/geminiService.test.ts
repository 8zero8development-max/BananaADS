import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from './geminiService';
import { GoogleGenAI } from '@google/genai';

// Create spies that we can control
const mockGenerateContent = vi.fn();
const mockGenerateVideos = vi.fn();
const mockGetVideosOperation = vi.fn();

// Mock @google/genai
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
        models = {
            generateContent: mockGenerateContent,
            generateVideos: mockGenerateVideos,
        };
        operations = {
            getVideosOperation: mockGetVideosOperation,
        };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      NUMBER: 'NUMBER',
    },
    Modality: {
      AUDIO: 'AUDIO',
    },
  };
});

describe('GeminiService', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-api-key';

    // Reset spies
    mockGenerateContent.mockReset();
    mockGenerateVideos.mockReset();
    mockGetVideosOperation.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('researchBrand should return parsed JSON data', async () => {
    const mockResponse = {
      text: JSON.stringify({
        targetAudience: 'Tech enthusiasts',
        tone: ['Modern', 'Sleek'],
        keyFeatures: ['Feature 1', 'Feature 2'],
        logoImage: 'http://example.com/logo.png',
      }),
      candidates: [{
        groundingMetadata: {
          groundingChunks: [{ web: { uri: 'http://source.com' } }]
        }
      }]
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await GeminiService.researchBrand('Test Brand', 'Test Product');

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-3-flash-preview',
      contents: expect.stringContaining('Test Brand'),
    }));

    expect(result).toEqual({
      targetAudience: 'Tech enthusiasts',
      tone: ['Modern', 'Sleek'],
      keyFeatures: ['Feature 1', 'Feature 2'],
      logoImage: 'http://example.com/logo.png',
      researchSources: ['http://source.com']
    });
  });

  it('generateConcepts should return an array of concepts', async () => {
    const mockConcepts = [
      { id: '1', title: 'Concept 1', hook: 'Hook 1', summary: 'Summary 1' },
      { id: '2', title: 'Concept 2', hook: 'Hook 2', summary: 'Summary 2' },
    ];

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockConcepts)
    });

    const brief = {
      brandName: 'Brand',
      productName: 'Product',
      targetAudience: 'Everyone',
      tone: ['Happy'],
      keyFeatures: ['Good quality'],
    };

    const result = await GeminiService.generateConcepts(brief as any);

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-3-flash-preview',
    }));

    expect(result).toEqual(mockConcepts);
  });

  it('generateScript should return a list of scenes', async () => {
    const mockScenes = [
      { sceneNumber: 1, visualPrompt: 'Scene 1 visual', audioScript: 'Scene 1 audio' },
      { sceneNumber: 2, visualPrompt: 'Scene 2 visual', audioScript: 'Scene 2 audio' },
    ];

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockScenes)
    });

    const brief = {
      brandName: 'Brand',
      productName: 'Product',
    };
    const concept = {
      title: 'Concept',
      hook: 'Hook',
      summary: 'Summary',
    };

    const result = await GeminiService.generateScript(brief as any, concept as any);

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-3-flash-preview',
    }));

    expect(result).toEqual(mockScenes);
  });

  it('should throw error if API_KEY is missing', async () => {
    delete process.env.API_KEY;

    await expect(GeminiService.researchBrand('Brand', 'Product')).rejects.toThrow('API_KEY is missing');
  });
});
