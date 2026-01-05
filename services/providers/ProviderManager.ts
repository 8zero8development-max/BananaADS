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
import { AdBrief, AdConcept, Scene, BrandDna } from '../../types';
import { BaseProvider } from './BaseProvider';
import { GeminiProvider, geminiProvider } from './GeminiProvider';
import { OpenAIProvider, openAIProvider } from './OpenAIProvider';
import { AnthropicProvider, anthropicProvider } from './AnthropicProvider';
import { OpenRouterProvider, openRouterProvider } from './OpenRouterProvider';
import { modelAnalyticsService } from './ModelAnalyticsService';
import { GeminiService } from '../geminiService';

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

  private stripProviderPrefix(modelId: string): string {
    const parts = modelId.split('/');
    if (parts.length >= 2) {
      const provider = parts[0];
      if (provider === 'openrouter') {
        return parts.slice(1).join('/');
      }
      return parts.slice(1).join('/');
    }
    return modelId;
  }

  private async withAnalytics<T>(
    modelId: string,
    taskType: TaskType,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracker = modelAnalyticsService.startOperation(modelId, taskType, operation);
    try {
      const result = await fn();
      tracker.complete(true);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      tracker.complete(false, errorMessage);
      throw error;
    }
  }

  async generateText(
    task: TaskType,
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    const modelId = this.getModelForTask(task);
    const provider = this.getProviderForModel(modelId);
    const strippedModelId = this.stripProviderPrefix(modelId);
    
    if (!provider.hasApiKey()) {
      throw new Error(`API key not configured for ${getProviderFromModelId(modelId)}`);
    }

    return this.withAnalytics(modelId, task, `Text generation: ${task}`, async () => {
      try {
        if ('generateTextWithModel' in provider) {
          return await (provider as OpenAIProvider | AnthropicProvider | OpenRouterProvider | GeminiProvider).generateTextWithModel(prompt, strippedModelId, options);
        }
        return await provider.generateText(prompt, options);
      } catch (error) {
        const fallbackResult = await this.tryFallback(task, 'text', prompt, options);
        if (fallbackResult !== null) {
          return fallbackResult;
        }
        throw error;
      }
    });
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

    return this.withAnalytics(modelId, task, `Image generation: ${task}`, async () => {
      try {
        return await provider.generateImage(prompt, options);
      } catch (error) {
        const fallbackResult = await this.tryFallback(task, 'image', prompt, options);
        if (fallbackResult !== null) {
          return fallbackResult;
        }
        throw error;
      }
    });
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

    return this.withAnalytics(modelId, task, `Speech generation: ${task}`, async () => {
      try {
        return await provider.generateSpeech(text, options);
      } catch (error) {
        const fallbackResult = await this.tryFallbackSpeech(task, text, options);
        if (fallbackResult !== null) {
          return fallbackResult;
        }
        throw error;
      }
    });
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

    return this.withAnalytics(modelId, task, `Video generation: ${task}`, async () => {
      return await provider.generateVideo(prompt, options);
    });
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

  // ============================================================================
  // SPECIALIZED METHODS - Route through selected provider based on user config
  // These methods encapsulate the prompt logic and route through the appropriate
  // provider based on user selection in the Models dashboard.
  // ============================================================================

  async researchBrand(brandName: string, productName: string): Promise<Partial<AdBrief>> {
    const modelId = this.getModelForTask('brandResearch');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'brandResearch', `Researching brand: ${brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.researchBrand(brandName, productName);
      }
      
      const prompt = `You are a Brand Research Analyst and Marketing Strategist.
      
Research the brand "${brandName}" and their product "${productName}" to create an advertising brief.

Analyze the brand's current marketing, target audience, brand voice, and key selling propositions.

Provide accurate, research-backed information. Target audience should be specific and actionable.
Tone should include 3-5 descriptive adjectives. Key features should highlight unique selling points.

Return a JSON object with fields:
- targetAudience (string): Specific description of target audience
- tone (array of 3-5 strings): Descriptive adjectives for brand voice
- keyFeatures (array of strings): Unique selling points
- logoImage (string): URL to brand logo if found, or empty string`;

      const response = await this.generateText('brandResearch', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return { targetAudience: '', tone: [], keyFeatures: [] };
      }
    });
  }

  async researchBrandDna(brief: AdBrief): Promise<BrandDna> {
    const modelId = this.getModelForTask('brandResearch');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'brandResearch', `Analyzing brand DNA: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.researchBrandDna(brief);
      }
      
      const prompt = `You are a Brand Strategist and Visual Identity Expert.

Analyze the brand "${brief.brandName}" and product "${brief.productName}" to extract a comprehensive Brand DNA profile.

Brand Context:
- Description/Features: "${brief.keyFeatures.join(', ')}"
- Target Audience: "${brief.targetAudience}"
- Desired Tone: "${brief.tone.join(', ')}"
${brief.creativeDirection ? `- Creative Direction: "${brief.creativeDirection}"` : ''}

Extract a comprehensive Brand DNA profile identifying the brand's visual identity, emotional resonance, and strategic positioning.

Return a JSON object with fields:
- visualStyle (string): Description of colors, shapes, textures, and overall visual aesthetic
- colorPalette (array of strings): 3-5 specific colors as hex codes
- typography (string): Font style characteristics
- composition (string): Layout preferences and visual hierarchy
- mood (string): Emotional tone and atmosphere
- targetPsychographics (array of strings): 3-5 lifestyle/value descriptors
- brandArchetype (string): One of 12 Jungian archetypes`;

      const response = await this.generateText('brandResearch', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          visualStyle: '',
          colorPalette: [],
          typography: '',
          composition: '',
          mood: '',
          targetPsychographics: [],
          brandArchetype: ''
        };
      }
    });
  }

  async autoFillFoodBrief(description: string, websiteUrl: string): Promise<Partial<AdBrief>> {
    const modelId = this.getModelForTask('brandResearch');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'brandResearch', 'Auto-filling food brief', async () => {
      if (providerType === 'gemini') {
        return GeminiService.autoFillFoodBrief(description, websiteUrl);
      }
      
      const prompt = `Based on the brand description and URL provided, research the brand to infer details.
      
Description: "${description}"
URL: "${websiteUrl}"

Task:
1. Infer a likely "Brand Name" and "Product Name"
2. Return short, punchy summaries for Audience, Tone, and Key Features

Return a JSON object with fields:
- brandName (string)
- productName (string)
- targetAudience (string)
- tone (array of strings)
- keyFeatures (array of strings)
- logoImage (string): URL if found`;

      const response = await this.generateText('brandResearch', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return {};
      }
    });
  }

  async generateConcepts(brief: AdBrief): Promise<AdConcept[]> {
    const modelId = this.getModelForTask('conceptGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'conceptGeneration', `Generating concepts: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateConcepts(brief);
      }
      
      const prompt = `You are a Creative Director and Advertising Strategist.

Create cinematic advertisement concepts for a brand campaign.

Brand Context:
- Brand: ${brief.brandName}
- Product: ${brief.productName}
- Target Audience: ${brief.targetAudience}
- Tone: ${brief.tone.join(', ')}
- Key Features: ${brief.keyFeatures.join(', ')}
${brief.creativeDirection ? `- Creative Direction: ${brief.creativeDirection}` : ''}

Generate 3 distinct, compelling cinematic advertisement concepts that capture the brand essence and resonate with the target audience.

Each concept must have:
- id: Following pattern concept_1, concept_2, concept_3
- title: Memorable and evocative (2-4 words)
- hook: Punchy tagline (3-7 words)
- summary: Creative rationale (1-2 sentences)

Return a JSON array of 3 concept objects.`;

      const response = await this.generateText('conceptGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateFoodSocialConcepts(brief: AdBrief): Promise<AdConcept[]> {
    const modelId = this.getModelForTask('conceptGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'conceptGeneration', `Generating food social concepts: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateFoodSocialConcepts(brief);
      }
      
      const prompt = `You are a World-class Art Director & Graphic Designer specializing in food advertising.

Design professional Advertising Posters for "${brief.brandName}" featuring "${brief.productName}".

Brand DNA:
- Tone: ${brief.tone.join(', ')}
- Visual Style: ${brief.brandDna?.visualStyle || brief.visualStyle || 'High-end appetizing'}
- Keywords: ${brief.keyFeatures.join(', ')}

Generate 3 DISTINCT Art Direction concepts for Social Media Ads focusing on LAYOUT, TYPOGRAPHY, and COMPOSITION.

Each concept must have:
- id: Following pattern concept_1, concept_2, concept_3
- title: Short internal name (2-4 words)
- hook: Punchy tagline (3-7 words)
- summary: Rationale explaining why this concept works
- visualPrompt: Detailed prompt for Professional Advertising Poster
- copyAngle: Instructions for copywriter
- overlayCtas: Array of exactly 3 distinct headline options (2-5 words each)

Return a JSON array of 3 concept objects.`;

      const response = await this.generateText('conceptGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateEmailCampaign(brief: AdBrief): Promise<AdConcept[]> {
    const modelId = this.getModelForTask('emailGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'emailGeneration', `Generating email campaign: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateEmailCampaign(brief);
      }
      
      const prompt = `You are a world-class Email Marketing Designer.

Create engaging marketing emails for "${brief.brandName}" featuring "${brief.productName}".

Brand DNA:
- Tone: ${brief.tone.join(', ')}
- Visual Style: ${brief.visualStyle || 'Professional and engaging'}
- Keywords: ${brief.keyFeatures.join(', ')}
- Target Audience: ${brief.targetAudience}
${brief.creativeDirection ? `- Creative Direction: "${brief.creativeDirection}"` : ''}

Generate 3 DISTINCT email campaign concepts focusing on subject lines, visual layout, and call-to-action placement.

Each concept must have:
- id: Unique identifier
- title: Campaign name
- hook: Compelling subject line
- summary: Campaign strategy rationale
- visualPrompt: Detailed email template description
- subjectLines: Array of 3 subject line options
- ctaText: Primary call-to-action text
- layoutStyle: Email layout approach

Return a JSON array of 3 concept objects.`;

      const response = await this.generateText('emailGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateScript(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const modelId = this.getModelForTask('scriptGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'scriptGeneration', `Generating script: ${concept.title}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateScript(brief, concept);
      }
      
      const prompt = `You are a Cinematic Scriptwriter and Video Production Director.

Write a detailed cinematic script for an advertisement concept.

Concept Details:
- Title: ${concept.title}
- Hook: ${concept.hook}
- Summary: ${concept.summary}

Brand Context:
- Brand: ${brief.brandName}
- Product: ${brief.productName}
- Target Audience: ${brief.targetAudience}
- Tone: ${brief.tone.join(', ')}

Write a 5-scene cinematic script optimized for Image-to-Video generation. Each scene must describe a single, continuous motion lasting 5-8 seconds.

Each scene must have:
- sceneNumber: Sequential number (1-5)
- visualPrompt: Single continuous motion prompt for 5-8s video generation
- audioScript: Voiceover script line for this scene

Return a JSON array of 5 scene objects.`;

      const response = await this.generateText('scriptGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateSocialCampaign(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const modelId = this.getModelForTask('conceptGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'conceptGeneration', `Generating social campaign: ${concept.title}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateSocialCampaign(brief, concept);
      }
      
      const prompt = `Act as a Senior Graphic Designer & Ad Strategist. Create 3 High-Impact Social Media Posters for this concept.

Brand: ${brief.brandName}
Product: ${brief.productName}
Concept: ${concept.title} - ${concept.summary}
Tone: ${brief.tone.join(', ')}

Create 3 unique advertising poster designs.

DESIGN RULES:
1. 'visualPrompt': Describe a "Graphic Advertising Composition" with Bold Typography, Color Blocking, etc.
2. 'audioScript': This will be the POST CAPTION. Write a snappy hook + benefit + CTA. Include hashtags.

Return a JSON array of scenes (mapping sceneNumber to postNumber).`;

      const response = await this.generateText('conceptGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateEmailContent(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const modelId = this.getModelForTask('emailGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'emailGeneration', `Generating email content: ${concept.title}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateEmailContent(brief, concept);
      }
      
      const prompt = `You are an Email Marketing Specialist.

Create email content for "${brief.brandName}" featuring "${brief.productName}".

Concept: ${concept.title}
Layout Style: ${(concept as any).layoutStyle || 'Professional'}

Generate 4 email sections:
1. Hero section with main headline
2. Body section with product benefits
3. Infographic/feature highlight section
4. Footer with CTA

Each section must have:
- sceneNumber: Sequential number (1-4)
- visualPrompt: Description of the visual layout
- audioScript: The actual text content for this section

Return a JSON array of 4 section objects.`;

      const response = await this.generateText('emailGeneration', prompt, {
        responseFormat: 'json'
      });
      
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    });
  }

  async generateFoodSocialPost(brief: AdBrief, concept: AdConcept, scene: Scene): Promise<string> {
    const modelId = this.getModelForTask('textGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'textGeneration', `Generating food social post: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateFoodSocialPost(brief, concept, scene);
      }
      
      const prompt = `Write a Facebook/Instagram post for "${brief.brandName}" promoting the "${brief.productName}".

Concept Strategy: "${concept.title}"
Copy Instructions: "${(concept as any).copyAngle || ''}"
Selected CTA in image: "${scene.selectedCta || 'Check it out'}"

Brand DNA:
- Tone: ${brief.tone.join(', ')}
- Keywords: ${brief.keyFeatures.join(', ')}
- Website: ${brief.productUrl || 'N/A'}

Format:
- Headline (Catchy)
- Body (Engaging, ~2 paragraphs)
- Call to Action (Link to website if available)
- Hashtags`;

      return this.generateText('textGeneration', prompt);
    });
  }

  async polishSceneScript(script: string, tone: string[]): Promise<string> {
    const modelId = this.getModelForTask('textGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'textGeneration', 'Polishing scene script', async () => {
      if (providerType === 'gemini') {
        return GeminiService.polishSceneScript(script, tone);
      }
      
      const prompt = `Rewrite the following advertisement script line to be more ${tone.join(', ')}, punchy, and professional for a commercial voiceover. Keep it concise.

Original Script: "${script}"`;

      return this.generateText('textGeneration', prompt);
    });
  }

  async generateConceptPreview(concept: AdConcept, productImage?: string): Promise<string> {
    const modelId = this.getModelForTask('imageGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'imageGeneration', `Generating concept preview: ${concept.title}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateConceptPreview(concept, productImage);
      }
      
      const prompt = `Create a cinematic concept art visual for an advertisement.
Title: ${concept.title}.
Summary: ${concept.summary}.

Directives:
- REALISM: The product must be placed realistically in the scene defined by the summary.
- NO FLUFF: No abstract backgrounds or generic graphics.
- FOCUS: High-end product photography style.`;

      return this.generateImage('imageGeneration', prompt, {
        aspectRatio: '16:9'
      });
    });
  }

  async generateMoodBoard(brief: AdBrief, referenceImage?: string, logoImage?: string): Promise<string> {
    const modelId = this.getModelForTask('imageGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'imageGeneration', `Generating mood board: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateMoodBoard(brief, referenceImage, logoImage);
      }
      
      const prompt = `Create a professional single-page fashion/brand mood board collage for the brand "${brief.brandName}" and product "${brief.productName}".

Composition Requirements:
- Create a cohesive graphic design layout on a textured background.
- FEATURE 1: A prominent color palette strip with 5 distinct color swatches.
- FEATURE 2: High-end lifestyle imagery representing the audience: ${brief.targetAudience}.
- FEATURE 3: Visual textures that match the tone: ${brief.tone.join(', ')}.
- FEATURE 4: Large, stylish typography displaying the brand name "${brief.brandName}".
- FEATURE 5: The product itself, integrated artistically into the collage.

Style: Organized, aesthetic, cinematic lighting, graphic design portfolio quality. 16:9 aspect ratio.`;

      return this.generateImage('imageGeneration', prompt, {
        aspectRatio: '16:9'
      });
    });
  }

  async generateStoryboardImage(
    visualPrompt: string,
    productImage?: string,
    styleReferenceImage?: string,
    aspectRatio: string = '16:9',
    logoImage?: string,
    brandDna?: BrandDna
  ): Promise<string> {
    const modelId = this.getModelForTask('imageGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'imageGeneration', 'Generating storyboard image', async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateStoryboardImage(visualPrompt, productImage, styleReferenceImage, aspectRatio, logoImage, undefined, brandDna);
      }
      
      let prompt = `You are a Commercial Photography Director and Visual Artist.

Create a photorealistic commercial image based on the following description: ${visualPrompt}

Requirements:
- 8k resolution
- Professional lighting
- Photorealistic quality
- Cinematic composition
- High-end commercial aesthetic`;

      if (brandDna) {
        prompt += `
- Follow brand visual style: ${brandDna.visualStyle}`;
        if (brandDna.colorPalette?.length) {
          prompt += `
- Use brand color palette: ${brandDna.colorPalette.join(', ')}`;
        }
      }

      return this.generateImage('imageGeneration', prompt, {
        aspectRatio
      });
    });
  }

  async generateFoodHeroImage(brief: AdBrief, concept: AdConcept, ctaText: string): Promise<string> {
    const modelId = this.getModelForTask('imageGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'imageGeneration', `Generating food hero image: ${brief.brandName}`, async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateFoodHeroImage(brief, concept, ctaText);
      }
      
      const prompt = `You are a Food Photography Director and Advertising Graphic Designer.

Create a professional advertising poster for food/beverage brand.

Brand Identity:
- Brand Name: ${brief.brandName}
- Product: ${brief.productName}
- Visual Style: ${brief.brandDna?.visualStyle || brief.visualStyle || 'High-end appetizing'}

Art Direction:
- Concept: ${concept.title}
- Visual Prompt: ${(concept as any).visualPrompt || ''}

Design a professional, high-quality advertising poster with the headline "${ctaText}" rendered directly into the image.

Requirements:
- TEXT: Render headline "${ctaText}" with bold, professional typography
- Text must be legible and seamlessly integrated
- FOOD: Product must look appetizing and premium
- Composition must be balanced and visually appealing`;

      return this.generateImage('imageGeneration', prompt, {
        aspectRatio: '16:9'
      });
    });
  }

  async editHeroImage(currentImageBase64: string, editInstruction: string): Promise<string> {
    const modelId = this.getModelForTask('imageGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'imageGeneration', 'Editing hero image', async () => {
      if (providerType === 'gemini') {
        return GeminiService.editHeroImage(currentImageBase64, editInstruction);
      }
      
      const prompt = `Edit this image. Instruction: ${editInstruction}. Maintain the high-quality professional advertising aesthetic, the layout, and the aspect ratio.`;

      return this.generateImage('imageGeneration', prompt, {
        aspectRatio: '16:9'
      });
    });
  }

  async generateVoiceover(text: string, voiceName: string = 'Kore'): Promise<string> {
    const modelId = this.getModelForTask('speechGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'speechGeneration', 'Generating voiceover', async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateVoiceover(text, voiceName);
      }
      
      return this.generateSpeech('speechGeneration', text, {
        voice: voiceName
      });
    });
  }

  async generateCinematicVideo(prompt: string, initialImage?: string): Promise<string> {
    const modelId = this.getModelForTask('videoGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'videoGeneration', 'Generating cinematic video', async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateCinematicVideo(prompt, initialImage);
      }
      
      return this.generateVideo('videoGeneration', prompt, {
        initialImage,
        aspectRatio: '16:9'
      });
    });
  }

  async generateSocialVideo(
    prompt: string,
    motionPrompt: string,
    initialImage?: string,
    aspectRatio: string = '16:9'
  ): Promise<string> {
    const modelId = this.getModelForTask('videoGeneration');
    const providerType = getProviderFromModelId(modelId);
    
    return this.withAnalytics(modelId, 'videoGeneration', 'Generating social video', async () => {
      if (providerType === 'gemini') {
        return GeminiService.generateSocialVideo(prompt, motionPrompt, initialImage, aspectRatio);
      }
      
      const fullPrompt = `${prompt}. Motion: ${motionPrompt}`;
      return this.generateVideo('videoGeneration', fullPrompt, {
        initialImage,
        aspectRatio
      });
    });
  }

  // API Key management methods that delegate to GeminiService for backward compatibility
  hasApiKey(): boolean {
    return GeminiService.hasApiKey();
  }

  setApiKey(apiKey: string): void {
    GeminiService.setApiKey(apiKey);
    this.setApiKeyForProvider('gemini', apiKey);
  }

  clearApiKey(): void {
    GeminiService.clearApiKey();
    this.clearApiKeyForProvider('gemini');
  }
}

export const providerManager = new ProviderManager();
export { ProviderManager };
