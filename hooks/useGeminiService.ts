import { useState, useCallback } from 'react';
import { GeminiService } from '../services/geminiService';
import { AdBrief, AdConcept, Scene } from '../types';

interface UseGeminiServiceReturn {
  loading: boolean;
  error: string | null;
  researchBrand: (brandName: string, productName: string) => Promise<Partial<AdBrief>>;
  autoFillFoodBrief: (description: string, websiteUrl: string) => Promise<Partial<AdBrief>>;
  researchBrandDna: (brief: AdBrief) => Promise<Partial<AdBrief>>;
  generateMoodBoard: (brief: AdBrief, referenceImage?: string, logoImage?: string) => Promise<string>;
  generateConcepts: (brief: AdBrief) => Promise<AdConcept[]>;
  generateFoodSocialConcepts: (brief: AdBrief) => Promise<AdConcept[]>;
  generateScript: (brief: AdBrief, concept: AdConcept) => Promise<Scene[]>;
  generateSocialCampaign: (brief: AdBrief, concept: AdConcept) => Promise<Scene[]>;
  generateFoodSocialPost: (brief: AdBrief, concept: AdConcept, scene: Scene) => Promise<string>;
  polishSceneScript: (script: string, tone: string[]) => Promise<string>;
  generateStoryboardImage: (
    visualPrompt: string,
    productImage?: string,
    styleReferenceImage?: string,
    aspectRatio?: string
  ) => Promise<string>;
  generateFoodHeroImage: (brief: AdBrief, concept: AdConcept, ctaText: string) => Promise<string>;
  editHeroImage: (currentImageBase64: string, editInstruction: string) => Promise<string>;
  generateVoiceover: (text: string, voiceName?: string) => Promise<string>;
  generateCinematicVideo: (prompt: string, initialImage?: string) => Promise<string>;
}

export function useGeminiService(): UseGeminiServiceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    errorMessage: string = 'API call failed'
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const researchBrand = useCallback((brandName: string, productName: string) =>
    wrapApiCall(
      () => GeminiService.researchBrand(brandName, productName),
      'Failed to research brand'
    ), [wrapApiCall]);

  const autoFillFoodBrief = useCallback((description: string, websiteUrl: string) =>
    wrapApiCall(
      () => GeminiService.autoFillFoodBrief(description, websiteUrl),
      'Failed to auto-fill food brief'
    ), [wrapApiCall]);

  const researchBrandDna = useCallback((brief: AdBrief) =>
    wrapApiCall(
      () => GeminiService.researchBrandDna(brief),
      'Failed to research brand DNA'
    ), [wrapApiCall]);

  const generateMoodBoard = useCallback((brief: AdBrief, referenceImage?: string, logoImage?: string) =>
    wrapApiCall(
      () => GeminiService.generateMoodBoard(brief, referenceImage, logoImage),
      'Failed to generate mood board'
    ), [wrapApiCall]);

  const generateConcepts = useCallback((brief: AdBrief) =>
    wrapApiCall(
      () => GeminiService.generateConcepts(brief),
      'Failed to generate concepts'
    ), [wrapApiCall]);

  const generateFoodSocialConcepts = useCallback((brief: AdBrief) =>
    wrapApiCall(
      () => GeminiService.generateFoodSocialConcepts(brief),
      'Failed to generate food social concepts'
    ), [wrapApiCall]);

  const generateScript = useCallback((brief: AdBrief, concept: AdConcept) =>
    wrapApiCall(
      () => GeminiService.generateScript(brief, concept),
      'Failed to generate script'
    ), [wrapApiCall]);

  const generateSocialCampaign = useCallback((brief: AdBrief, concept: AdConcept) =>
    wrapApiCall(
      () => GeminiService.generateSocialCampaign(brief, concept),
      'Failed to generate social campaign'
    ), [wrapApiCall]);

  const generateFoodSocialPost = useCallback((brief: AdBrief, concept: AdConcept, scene: Scene) =>
    wrapApiCall(
      () => GeminiService.generateFoodSocialPost(brief, concept, scene),
      'Failed to generate food social post'
    ), [wrapApiCall]);

  const polishSceneScript = useCallback((script: string, tone: string[]) =>
    wrapApiCall(
      () => GeminiService.polishSceneScript(script, tone),
      'Failed to polish script'
    ), [wrapApiCall]);

  const generateStoryboardImage = useCallback((
    visualPrompt: string,
    productImage?: string,
    styleReferenceImage?: string,
    aspectRatio?: string
  ) =>
    wrapApiCall(
      () => GeminiService.generateStoryboardImage(visualPrompt, productImage, styleReferenceImage, aspectRatio),
      'Failed to generate storyboard image'
    ), [wrapApiCall]);

  const generateFoodHeroImage = useCallback((brief: AdBrief, concept: AdConcept, ctaText: string) =>
    wrapApiCall(
      () => GeminiService.generateFoodHeroImage(brief, concept, ctaText),
      'Failed to generate food hero image'
    ), [wrapApiCall]);

  const editHeroImage = useCallback((currentImageBase64: string, editInstruction: string) =>
    wrapApiCall(
      () => GeminiService.editHeroImage(currentImageBase64, editInstruction),
      'Failed to edit hero image'
    ), [wrapApiCall]);

  const generateVoiceover = useCallback((text: string, voiceName?: string) =>
    wrapApiCall(
      () => GeminiService.generateVoiceover(text, voiceName),
      'Failed to generate voiceover'
    ), [wrapApiCall]);

  const generateCinematicVideo = useCallback((prompt: string, initialImage?: string) =>
    wrapApiCall(
      () => GeminiService.generateCinematicVideo(prompt, initialImage),
      'Failed to generate cinematic video'
    ), [wrapApiCall]);

  return {
    loading,
    error,
    researchBrand,
    autoFillFoodBrief,
    researchBrandDna,
    generateMoodBoard,
    generateConcepts,
    generateFoodSocialConcepts,
    generateScript,
    generateSocialCampaign,
    generateFoodSocialPost,
    polishSceneScript,
    generateStoryboardImage,
    generateFoodHeroImage,
    editHeroImage,
    generateVoiceover,
    generateCinematicVideo,
  };
}