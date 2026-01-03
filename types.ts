
export interface AdBrief {
  brandName: string;
  productName: string;
  targetAudience: string;
  tone: string[]; // Changed to array for structured handling
  keyFeatures: string[]; // Changed to array for structured handling
  creativeDirection?: string; // New field for niche pivot/strategy
  voiceName?: string; // New field for selecting the AI narrator
  productImage?: string;
  logoImage?: string; // New field for Brand Logo
  productUrl?: string;
  moodBoard?: string;
  researchSources?: string[];
  visualStyle?: string; // For Food Socials Brand DNA
  emailTemplate?: string; // For email-specific template selection
  // Contact info for email campaigns (used in footer graphics)
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
}

export type ProductionType = 'video' | 'social' | 'food-social' | 'email';

export interface AdConcept {
  id: string;
  title: string;
  hook: string;
  summary: string;
  thumbnailUrl?: string;
  // Food Socials Specifics
  rationale?: string;
  visualPrompt?: string;
  copyAngle?: string;
  overlayCtas?: string[];
}

export interface Scene {
  sceneNumber: number;
  visualPrompt: string;
  audioScript: string; // Used for "Post Caption" in Social mode
  imageUrl?: string;
  videoUrl?: string;
  voiceoverUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingVoice?: boolean;
  isPolishingScript?: boolean; // New state for script refinement
  selectedCta?: string; // For Food Socials overlay text
}

export interface AdProject {
  id: string;
  brief: AdBrief;
  selectedConcept?: AdConcept;
  scenes: Scene[];
  status: 'briefing' | 'concepts' | 'storyboarding';
  projectType: ProductionType;
}

export enum AppStep {
  BRIEFING = 0,
  CONCEPTS = 1,
  STORYBOARDING = 2
}
