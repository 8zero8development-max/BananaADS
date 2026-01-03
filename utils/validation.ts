import { z } from 'zod';
import { AdBrief } from '../types';

export const adBriefSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  productName: z.string().min(1, 'Product name is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  tone: z.array(z.string()).min(1, 'At least one tone is required'),
  keyFeatures: z.array(z.string()).min(1, 'At least one key feature is required'),
  creativeDirection: z.string().optional(),
  voiceName: z.string().optional(),
  productImage: z.string().optional(),
  logoImage: z.string().optional(),
  productUrl: z.string().optional(),
  moodBoard: z.string().optional(),
  researchSources: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
});

export const foodSocialBriefSchema = z.object({
  brandName: z.string().optional(),
  productName: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.array(z.string()).optional(),
  keyFeatures: z.array(z.string()).optional(),
  creativeDirection: z.string().optional(),
  voiceName: z.string().optional(),
  productImage: z.string().optional(),
  logoImage: z.string().optional(),
  productUrl: z.string().optional(),
  moodBoard: z.string().optional(),
  researchSources: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
}).refine(
  (data) => (data.keyFeatures && data.keyFeatures.length > 0) || data.productUrl,
  {
    message: 'For Food Socials, please provide a Description (in Key Selling Points) or a Product URL.',
  }
);

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export function validateBrief(
  brief: AdBrief, 
  productionType: 'video' | 'social' | 'food-social' | 'email'
): ValidationResult {
  const errors: string[] = [];

  if (productionType === 'food-social') {
    const result = foodSocialBriefSchema.safeParse(brief);
    if (!result.success) {
      result.error.issues.forEach(err => {
        errors.push(err.message);
      });
    }
    
    if (!brief.keyFeatures?.length && !brief.productUrl) {
      errors.push('For Food Socials, please provide a Description (in Key Selling Points) or a Product URL.');
    }
  } else {
    if (!brief.brandName?.trim()) {
      errors.push('Brand name is required');
    }
    if (!brief.productName?.trim()) {
      errors.push('Product name is required');
    }
    if (!brief.targetAudience?.trim()) {
      errors.push('Target audience is required');
    }
    if (!brief.tone?.length || brief.tone.every(t => !t.trim())) {
      errors.push('At least one tone is required');
    }
    if (!brief.keyFeatures?.length || brief.keyFeatures.every(f => !f.trim())) {
      errors.push('At least one key feature is required');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

export function validateResearchInput(
  brief: AdBrief,
  productionType: 'video' | 'social' | 'food-social' | 'email'
): ValidationResult {
  const errors: string[] = [];

  if (productionType === 'food-social') {
    if (!brief.keyFeatures?.length && !brief.productUrl) {
      errors.push('For Food Socials, please provide a Description (in Key Selling Points) or a Product URL.');
    }
  } else {
    if (!brief.brandName?.trim()) {
      errors.push('Please enter a Brand Name first.');
    }
    if (!brief.productName?.trim()) {
      errors.push('Please enter a Product Name first.');
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}
