
export interface AdBrief {
  brandName: string;
  productName: string;
  targetAudience: string;
  tone: string;
  keyFeatures: string;
  creativeDirection?: string; // New field for niche pivot/strategy
  voiceName?: string; // New field for selecting the AI narrator
  productImage?: string;
  productUrl?: string;
  moodBoard?: string;
  researchSources?: string[];
}

export interface AdConcept {
  id: string;
  title: string;
  hook: string;
  summary: string;
  thumbnailUrl?: string;
}

export interface Scene {
  sceneNumber: number;
  visualPrompt: string;
  audioScript: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceoverUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingVoice?: boolean;
  isPolishingScript?: boolean; // New state for script refinement
}

export interface AdProject {
  id: string;
  brief: AdBrief;
  selectedConcept?: AdConcept;
  scenes: Scene[];
  status: 'briefing' | 'concepts' | 'storyboarding';
}

export enum AppStep {
  BRIEFING = 0,
  CONCEPTS = 1,
  STORYBOARDING = 2
}
