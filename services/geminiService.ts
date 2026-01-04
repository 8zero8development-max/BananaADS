
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AdBrief, AdConcept, Scene, BrandDna } from "../types";

const API_KEY_STORAGE_KEY = 'banana_ads_gemini_api_key';

// ============================================================================
// PROMPT VERSIONING
// ============================================================================
const PROMPT_VERSIONS = {
  BRAND_RESEARCH: '1.0',
  BRAND_DNA: '2.0',
  CONCEPTS: '2.1',
  FOOD_SOCIAL_CONCEPTS: '2.0',
  SCRIPT: '1.3',
  STORYBOARD_IMAGE: '3.0',
  FOOD_HERO_IMAGE: '2.0'
};

// ============================================================================
// STANDARDIZED PROMPT TEMPLATE
// ============================================================================
const PROMPT_TEMPLATE = {
  build: (params: {
    role: string;
    context: string;
    task: string;
    constraints: string[];
    outputFormat: string;
    errorHandling?: string[];
    examples?: string;
  }) => {
    let prompt = `ROLE: ${params.role}

CONTEXT: ${params.context}

TASK: ${params.task}

CONSTRAINTS:
${params.constraints.map(c => `- ${c}`).join('\n')}

OUTPUT_FORMAT: ${params.outputFormat}`;

    if (params.errorHandling && params.errorHandling.length > 0) {
      prompt += `

ERROR_HANDLING:
${params.errorHandling.map(e => `- ${e}`).join('\n')}`;
    }

    if (params.examples) {
      prompt += `

EXAMPLES:
${params.examples}`;
    }

    return prompt;
  }
};

// ============================================================================
// REUSABLE PROMPT COMPONENTS
// ============================================================================
const buildBrandContext = (brief: AdBrief): string => {
  return `Brand: ${brief.brandName}
Product: ${brief.productName}
Target Audience: ${brief.targetAudience}
Tone: ${brief.tone.join(', ')}
Key Features: ${brief.keyFeatures.join(', ')}${brief.creativeDirection ? `\nCreative Direction: ${brief.creativeDirection}` : ''}`;
};

const buildBrandDnaContext = (dna: BrandDna): string => {
  return `
BRAND DNA PROFILE:
Visual Style: ${dna.visualStyle}
Color Palette: ${dna.colorPalette?.join(', ') || 'Not specified'}
Typography: ${dna.typography || 'Not specified'}
Composition: ${dna.composition || 'Not specified'}
Mood: ${dna.mood || 'Not specified'}
Target Psychographics: ${dna.targetPsychographics?.join(', ') || 'Not specified'}
Brand Archetype: ${dna.brandArchetype || 'Not specified'}

BRAND DNA GUIDELINES:
- All visual outputs MUST reflect the ${dna.visualStyle} style
- Use the color palette: ${dna.colorPalette?.join(', ') || 'brand-appropriate colors'}
- Typography should be ${dna.typography || 'consistent with brand'}
- Composition should follow ${dna.composition || 'brand-preferred layouts'}
- Maintain ${dna.mood || 'appropriate'} emotional tone
`;
};

const VISUAL_STYLE_GUIDE = `Style Requirements:
- 8k resolution
- Professional lighting
- Photorealistic quality
- Cinematic composition
- High-end commercial aesthetic`;

const ERROR_HANDLING_INSTRUCTIONS = {
  general: [
    'If insufficient information is provided, respond with "ERROR: Need more details about {specific_field}"',
    'If the request is ambiguous, make reasonable assumptions and note them in the response'
  ],
  imageGeneration: [
    'If image generation fails, respond with "ERROR: Cannot generate image - {reason}"',
    'If reference images are unclear, proceed with best interpretation'
  ],
  jsonOutput: [
    'Always return valid JSON matching the specified schema',
    'If unable to generate all required fields, include empty strings rather than omitting fields'
  ]
};

// ============================================================================
// FEW-SHOT EXAMPLES
// ============================================================================
const CONCEPT_EXAMPLES = `Example Output:
{
  "id": "concept_1",
  "title": "Minimalist Luxury",
  "hook": "Less is More",
  "summary": "Clean, sophisticated approach emphasizing product elegance through negative space and premium materials",
  "visualPrompt": "Minimalist product photography with soft directional lighting, marble surface, subtle shadows",
  "thumbnailUrl": ""
}

{
  "id": "concept_2", 
  "title": "Urban Energy",
  "hook": "Move Different",
  "summary": "Dynamic street-style aesthetic capturing modern urban lifestyle and movement",
  "visualPrompt": "Product in motion blur urban setting, neon reflections, cinematic color grading",
  "thumbnailUrl": ""
}`;

export class GeminiService {
  private static encodeKey(key: string): string {
    const encoded = btoa(key);
    return encoded.split('').reverse().join('');
  }

  private static decodeKey(encoded: string): string {
    const reversed = encoded.split('').reverse().join('');
    return atob(reversed);
  }

  private static getStoredApiKey(): string | null {
    try {
      const encoded = sessionStorage.getItem(API_KEY_STORAGE_KEY);
      if (!encoded) return null;
      return this.decodeKey(encoded);
    } catch {
      return null;
    }
  }

  static setApiKey(apiKey: string): void {
    try {
      const encoded = this.encodeKey(apiKey);
      sessionStorage.setItem(API_KEY_STORAGE_KEY, encoded);
    } catch (e) {
      console.error('Failed to store API key');
    }
  }

  static clearApiKey(): void {
    try {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear API key');
    }
  }

  static hasApiKey(): boolean {
    return !!this.getStoredApiKey();
  }

  private static getClient() {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please add your Gemini API key in settings.");
    }
    return new GoogleGenAI({ apiKey });
  }

  // Generic Retry Wrapper for Free Tier Robustness
  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message = error?.message || '';
      // Check for 429, 503, or specific error codes/messages indicating resource exhaustion or unavailability
      if (retries > 0 && (
          status === 429 || 
          status === 503 || 
          message.includes('429') || 
          message.includes('RESOURCE_EXHAUSTED') ||
          message.includes('UNAVAILABLE')
      )) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2); // Exponential backoff
      }
      throw error;
    }
  }

  // --- Helpers for Food Socials ---

  private static convertSvgToPng(base64Svg: string): Promise<string> {
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

  private static async resolveImage(base64String: string): Promise<{ mimeType: string, data: string }> {
      let finalString = base64String;
      
      // Check for SVG mime type in header
      if (finalString.includes('image/svg+xml')) {
          try {
              finalString = await this.convertSvgToPng(finalString);
          } catch (e) {
              console.error("Failed to convert SVG to PNG", e);
              // Fallback to try and use it anyway if conversion fails (unlikely to work with GenAI but worth a shot)
          }
      }

      const match = finalString.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
          return {
              mimeType: match[1],
              data: match[2]
          };
      }
      
      // Fallback for raw base64, assume jpeg
      return {
          mimeType: 'image/jpeg',
          data: finalString
      };
  }

  // --- Existing Methods ---

  static async researchBrand(brandName: string, productName: string, version: string = PROMPT_VERSIONS.BRAND_RESEARCH): Promise<Partial<AdBrief>> {
    const ai = this.getClient();
    const prompt = PROMPT_TEMPLATE.build({
      role: 'Brand Research Analyst and Marketing Strategist',
      context: `Researching brand "${brandName}" and their product "${productName}" to create an advertising brief.`,
      task: `Analyze the brand's current marketing, target audience, brand voice, and key selling propositions. Search for their official logo URL.`,
      constraints: [
        'Provide accurate, research-backed information',
        'Target audience should be specific and actionable',
        'Tone should include 3-5 descriptive adjectives',
        'Key features should highlight unique selling points',
        'Logo URL should be direct link to image file (PNG/JPG preferred)'
      ],
      outputFormat: `JSON object with fields: targetAudience (string), tone (array of 3-5 strings), keyFeatures (array of strings), logoImage (URL string or empty)`,
      errorHandling: [
        ...ERROR_HANDLING_INSTRUCTIONS.general,
        ...ERROR_HANDLING_INSTRUCTIONS.jsonOutput,
        'If brand is not found, respond with "ERROR: Brand not found - {brandName}"',
        'If logo cannot be found, return empty string for logoImage field'
      ]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetAudience: { type: Type.STRING },
            tone: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            logoImage: { type: Type.STRING, description: "URL to the brand logo if found on the web" },
          },
          required: ["targetAudience", "tone", "keyFeatures"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Extract grounding sources
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    return { ...data, researchSources: sources };
  }
  
  // Refactored to use manual parsing as requested for better Search tool compatibility
  static async autoFillFoodBrief(description: string, websiteUrl: string): Promise<Partial<AdBrief>> {
      const ai = this.getClient();
      const prompt = `Based on the brand description and URL provided, research the brand to infer details and find their official logo.
      
      Description: "${description}"
      URL: "${websiteUrl}"
      
      Task:
      1. Infer a likely "Brand Name" and "Product Name" (if not obvious, create a catchy placeholder).
      2. Return short, punchy summaries for Audience, Tone, and Key Features.
      3. Search for a direct URL to the brand's logo (preferably PNG/JPG).
    
      IMPORTANT: Return the result strictly as a raw JSON object. Do not include markdown formatting (like \`\`\`json).
      
      Expected JSON Structure:
      {
        "brandName": "string",
        "productName": "string",
        "targetAudience": "string",
        "tone": ["string"],
        "keyFeatures": ["string"],
        "logoImage": "string (url)"
      }
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          tools: [{ googleSearch: {} }]
          // Removed responseSchema here to allow flexible search result processing
        }
      });
    
      let text = response.text;
      if (!text) throw new Error("No response from Gemini");

      // Clean up potential markdown formatting from the model
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const data = JSON.parse(text);
        return {
             brandName: data.brandName,
             productName: data.productName,
             targetAudience: data.targetAudience,
             tone: Array.isArray(data.tone) ? data.tone : [data.tone],
             keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : [data.keyFeatures],
             logoImage: data.logoImage
        };
      } catch (e) {
        console.error("Failed to parse JSON from autoFillFoodBrief:", text);
        // Fallback or re-throw
        throw new Error("AI returned invalid JSON format. Please try again.");
      }
  }

  // Website Analysis - Extract colors and typography from a website URL
  private static async analyzeWebsite(url: string): Promise<{ colors: string[]; fonts: string[]; typography: string; typographyStyle: string } | null> {
    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        console.warn(`Website analysis failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return {
        colors: data.colors || [],
        fonts: data.fonts || [],
        typography: data.typography || '',
        typographyStyle: data.typographyStyle || 'sans-serif',
      };
    } catch (error) {
      console.warn('Website analysis error:', error);
      return null;
    }
  }

  // Brand DNA Research - Enhanced to extract comprehensive structured brand profile
  static async researchBrandDna(brief: AdBrief, version: string = PROMPT_VERSIONS.BRAND_DNA): Promise<BrandDna> {
      const ai = this.getClient();
      
      // Analyze website for colors and typography if URL is provided
      let websiteAnalysis: { colors: string[]; fonts: string[]; typography: string; typographyStyle: string } | null = null;
      if (brief.productUrl) {
        websiteAnalysis = await this.analyzeWebsite(brief.productUrl);
      }

      // Build website analysis context for the prompt
      const websiteContext = websiteAnalysis ? `
WEBSITE ANALYSIS RESULTS:
- Extracted Colors: ${websiteAnalysis.colors.slice(0, 10).join(', ') || 'None found'}
- Extracted Fonts: ${websiteAnalysis.fonts.join(', ') || 'None found'}
- Typography Style: ${websiteAnalysis.typography || 'Not determined'}
IMPORTANT: Incorporate these website colors and typography into the Brand DNA profile. The typography field should reflect the website's font choices.` : '';

      const prompt = PROMPT_TEMPLATE.build({
        role: 'Brand Strategist and Visual Identity Expert',
        context: `Analyzing brand assets to extract a comprehensive Brand DNA profile.

Inputs:
- Brand Name: "${brief.brandName}"
- Product Name: "${brief.productName}"
- Description/Features: "${brief.keyFeatures.join(', ')}"
- Website: "${brief.productUrl || 'Not provided'}"
- Target Audience: "${brief.targetAudience}"
- Desired Tone: "${brief.tone.join(', ')}"
${brief.creativeDirection ? `- Creative Direction: "${brief.creativeDirection}"` : ""}
${brief.logoImage ? "- Brand logo image is attached for visual analysis." : ""}
${brief.productImage ? "- Product/food photo is attached for visual analysis." : ""}${websiteContext}`,
        task: `Extract a comprehensive Brand DNA profile by analyzing all provided inputs and images. Identify the brand's visual identity, emotional resonance, and strategic positioning.${websiteAnalysis ? ' Pay special attention to the website analysis results for accurate typography and color information.' : ''}`,
        constraints: [
          'Visual style must describe colors, shapes, textures, and overall aesthetic',
          'Color palette must include 3-5 specific colors (hex codes or descriptive names)',
          websiteAnalysis ? `Typography MUST incorporate the website fonts: ${websiteAnalysis.typography}` : 'Typography must describe font style characteristics (serif/sans-serif, weight, personality)',
          'Composition must describe layout preferences and visual hierarchy',
          'Mood must capture the emotional tone and atmosphere',
          'Target psychographics must include 3-5 lifestyle/value descriptors',
          'Brand archetype must be one of the 12 Jungian archetypes (e.g., Hero, Creator, Caregiver, Explorer)'
        ],
        outputFormat: 'JSON object with fields: visualStyle, colorPalette (array), typography, composition, mood, targetPsychographics (array), brandArchetype',
        errorHandling: [
          ...ERROR_HANDLING_INSTRUCTIONS.general,
          ...ERROR_HANDLING_INSTRUCTIONS.jsonOutput,
          'If images are not provided, infer visual style from text descriptions',
          'If brand archetype is unclear, select the most likely based on tone and audience'
        ]
      });
    
      const parts: any[] = [{ text: prompt }];
      
      if (brief.logoImage && brief.logoImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.logoImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "REFERENCE IMAGE (LOGO): Analyze this brand logo for colors, typography style, and visual identity cues." });
      }
    
      if (brief.productImage && brief.productImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.productImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "REFERENCE IMAGE (PRODUCT): Analyze this product image for visual style, lighting, composition, and mood." });
      }
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualStyle: { type: Type.STRING, description: "Description of colors, shapes, textures, and overall visual aesthetic" },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 specific colors (hex codes or descriptive names)" },
              typography: { type: Type.STRING, description: "Font style characteristics (serif/sans-serif, weight, personality)" },
              composition: { type: Type.STRING, description: "Layout preferences and visual hierarchy approach" },
              mood: { type: Type.STRING, description: "Emotional tone and atmosphere of the brand" },
              targetPsychographics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 lifestyle/value descriptors of target audience" },
              brandArchetype: { type: Type.STRING, description: "One of 12 Jungian archetypes (Hero, Creator, Caregiver, Explorer, etc.)" }
            },
            required: ["visualStyle", "colorPalette", "typography", "composition", "mood", "targetPsychographics", "brandArchetype"]
          }
        }
      });
    
      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      const data = JSON.parse(text);
      
      // Use website analysis as fallback if Gemini returns empty
      const typographyValue = (data.typography?.trim() || '') || 
        (websiteAnalysis?.typography?.trim() || '') || 
        (websiteAnalysis?.typographyStyle || '');

      // Use website-extracted colors as fallback if Gemini returns empty palette
      const aiColors = Array.isArray(data.colorPalette) ? data.colorPalette.filter((c: string) => c?.trim()) : [];
      const websiteColors = websiteAnalysis?.colors || [];
      const colorPaletteValue = aiColors.length > 0 ? aiColors : websiteColors.slice(0, 5);

      return {
        visualStyle: data.visualStyle || '',
        colorPalette: colorPaletteValue,
        typography: typographyValue,
        composition: data.composition || '',
        mood: data.mood || '',
        targetPsychographics: data.targetPsychographics || [],
        brandArchetype: data.brandArchetype || ''
      };
  }

  static async generateMoodBoard(brief: AdBrief, referenceImage?: string, logoImage?: string): Promise<string> {
    const ai = this.getClient();
    
    // Prompt for a single collage image
    const prompt = `Create a professional single-page fashion/brand mood board collage for the brand "${brief.brandName}" and product "${brief.productName}".
    
    Composition Requirements:
    - Create a cohesive graphic design layout on a textured background (paper or digital noise).
    - FEATURE 1: A prominent color palette strip with 5 distinct color swatches extracted from the brand vibe.
    - FEATURE 2: High-end lifestyle imagery representing the audience: ${brief.targetAudience}.
    - FEATURE 3: Visual textures (e.g. concrete, silk, film grain) that match the tone: ${brief.tone.join(', ')}.
    - FEATURE 4: Large, stylish typography displaying the brand name "${brief.brandName}".
    - FEATURE 5: The product itself, integrated artistically into the collage.
    ${logoImage ? '- FEATURE 6: Include the provided Brand Logo in the corner or as a design element.' : ''}
    
    Style: Organized, aesthetic, "Urban Pulse" vibe, cinematic lighting, graphic design portfolio quality. 16:9 aspect ratio.`;

    const parts: any[] = [];

    // 1. Add Product Image
    if (referenceImage) {
      parts.push({
        inlineData: { 
            mimeType: referenceImage.split(';')[0].split(':')[1], 
            data: referenceImage.split(',')[1] 
        }
      });
      parts.push({ text: "Use this product image as the key reference in the collage." });
    }

    // 2. Add Logo Image
    if (logoImage && logoImage.startsWith('data:')) {
       parts.push({
        inlineData: { 
            mimeType: logoImage.split(';')[0].split(':')[1], 
            data: logoImage.split(',')[1] 
        }
      });
      parts.push({ text: "Use this image as the Brand Logo in the collage." });
    }

    parts.push({ text: prompt });

    return this.retry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw new Error("Failed to generate mood board image");
    });
  }

  static async generateConceptPreview(concept: AdConcept, productImage?: string): Promise<string> {
    const ai = this.getClient();
    const parts: any[] = [];
    
    // 1. Add Product Reference
    if (productImage) {
      parts.push({
        inlineData: {
          mimeType: productImage.split(';')[0].split(':')[1],
          data: productImage.split(',')[1]
        }
      });
      parts.push({ text: "REFERENCE PRODUCT: The image must feature this exact product. It is the hero of the shot." });
    }

    // 2. Add Prompt
    parts.push({ text: `Create a cinematic concept art visual for an advertisement.
    Title: ${concept.title}.
    Summary: ${concept.summary}.
    
    Directives:
    - REALISM: The product must be placed realistically in the scene defined by the summary.
    - NO FLUFF: No abstract backgrounds or generic graphics.
    - FOCUS: High-end product photography style.` });

    return this.retry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: { parts },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                },
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data found");
    });
  }

  static async generateConcepts(brief: AdBrief, version: string = PROMPT_VERSIONS.CONCEPTS): Promise<AdConcept[]> {
    const ai = this.getClient();
    const brandContext = buildBrandContext(brief);
    const brandDnaContext = brief.brandDna ? buildBrandDnaContext(brief.brandDna) : '';
    
    const prompt = PROMPT_TEMPLATE.build({
      role: 'Creative Director and Advertising Strategist',
      context: `Creating cinematic advertisement concepts for a brand campaign.

${brandContext}${brandDnaContext}${brief.creativeDirection ? `

CAMPAIGN STRATEGY PIVOT:
The user has specified a specific Creative Direction that may differ from standard brand DNA.
Creative Direction: "${brief.creativeDirection}"
Ensure concepts align strictly with this direction, even if it contradicts the standard audience.` : ''}`,
      task: 'Generate 3 distinct, compelling cinematic advertisement concepts that capture the brand essence and resonate with the target audience.',
      constraints: [
        'Each concept must have a unique creative angle',
        'Titles should be memorable and evocative (2-4 words)',
        'Hooks should be punchy taglines (3-7 words)',
        'Summaries should explain the creative rationale (1-2 sentences)',
        'Concepts should be feasible for video production',
        'IDs must follow pattern: concept_1, concept_2, concept_3'
      ],
      outputFormat: 'JSON array of 3 concept objects with fields: id, title, hook, summary',
      errorHandling: [
        ...ERROR_HANDLING_INSTRUCTIONS.general,
        ...ERROR_HANDLING_INSTRUCTIONS.jsonOutput
      ],
      examples: CONCEPT_EXAMPLES
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique identifier following pattern concept_N" },
              title: { type: Type.STRING, description: "Memorable concept title (2-4 words)" },
              hook: { type: Type.STRING, description: "Punchy tagline (3-7 words)" },
              summary: { type: Type.STRING, description: "Creative rationale (1-2 sentences)" },
            },
            required: ["id", "title", "hook", "summary"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }

  // Specialized Concept Generation for Food Socials
  static async generateFoodSocialConcepts(brief: AdBrief, version: string = PROMPT_VERSIONS.FOOD_SOCIAL_CONCEPTS): Promise<AdConcept[]> {
      const ai = this.getClient();
      const brandDnaContext = brief.brandDna ? buildBrandDnaContext(brief.brandDna) : '';
      
      const prompt = PROMPT_TEMPLATE.build({
        role: 'World-class Art Director & Graphic Designer specializing in food advertising',
        context: `Designing professional Advertising Posters for "${brief.brandName}" featuring "${brief.productName}".

Brand DNA:
- Tone: ${brief.tone.join(', ')}
- Visual Style: ${brief.brandDna?.visualStyle || brief.visualStyle || 'High-end appetizing'}
- Keywords: ${brief.keyFeatures.join(', ')}
${brief.logoImage ? '- Brand logo is attached for reference - incorporate it into the designs.' : ''}
${brief.productImage ? '- Product image is attached for reference.' : ''}
${brandDnaContext}`,
        task: 'Generate 3 DISTINCT Art Direction concepts for Social Media Ads focusing on LAYOUT, TYPOGRAPHY, and COMPOSITION. Think: Magazine Ads, Billboards, Pop-Art, Modern Minimalist, 90s Retro.',
        constraints: [
          'Each concept MUST incorporate the brand logo for brand consistency',
          'IDs must follow pattern: concept_1, concept_2, concept_3',
          'Titles should be short internal names (2-4 words)',
          'Hooks should be punchy taglines (3-7 words)',
          'visualPrompt must describe a "Professional Advertising Poster" with typography style, background graphics, color palette, and logo placement',
          'copyAngle should provide clear instructions for copywriters',
          'overlayCtas must contain exactly 3 distinct, punchy headline options (2-5 words each)'
        ],
        outputFormat: 'JSON array of 3 concept objects with fields: id, title, hook, summary, visualPrompt, copyAngle, overlayCtas',
        errorHandling: [
          ...ERROR_HANDLING_INSTRUCTIONS.general,
          ...ERROR_HANDLING_INSTRUCTIONS.jsonOutput,
          'If product image is unclear, describe a generic appetizing food presentation',
          'If logo is not provided, suggest placeholder positioning for brand mark'
        ]
      });
    
      const parts: any[] = [{ text: prompt }];

      if (brief.productImage && brief.productImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.productImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "REFERENCE IMAGE (PRODUCT): Use this product image as the hero subject in the poster designs." });
      }

      if (brief.logoImage && brief.logoImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.logoImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "REFERENCE IMAGE (LOGO): This is the brand logo. It MUST be incorporated into each poster design for brand consistency." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Unique identifier following pattern concept_N" },
                title: { type: Type.STRING, description: "Short internal concept name (2-4 words)" },
                hook: { type: Type.STRING, description: "Punchy tagline (3-7 words)" },
                summary: { type: Type.STRING, description: "Rationale explaining why this concept works" },
                visualPrompt: { type: Type.STRING, description: "Detailed prompt for Professional Advertising Poster including typography, background, color palette, logo placement" },
                copyAngle: { type: Type.STRING, description: "Instructions for copywriter on tone and messaging approach" },
                overlayCtas: { type: Type.ARRAY, items: { type: Type.STRING, description: "Punchy headline option (2-5 words)" }, description: "Exactly 3 distinct headline options" },
              },
              required: ["id", "title", "hook", "summary", "visualPrompt", "copyAngle", "overlayCtas"]
            }
          }
        }
      });
    
      return JSON.parse(response.text || "[]");
  }

  static async generateEmailCampaign(brief: AdBrief): Promise<AdConcept[]> {
    const ai = this.getClient();
    
    const prompt = `You are a world-class Email Marketing Designer.
    
    Context: Create engaging marketing emails for "${brief.brandName}" featuring "${brief.productName}".
    
    Brand DNA:
    - Tone: ${brief.tone.join(', ')}
    - Visual Style: ${brief.visualStyle || 'Professional and engaging'}
    - Keywords: ${brief.keyFeatures.join(', ')}
    - Target Audience: ${brief.targetAudience}
    ${brief.creativeDirection ? `- Creative Direction: "${brief.creativeDirection}"` : ''}
    ${brief.logoImage ? '- Brand logo is attached for reference.' : ''}
    ${brief.productImage ? '- Product image is attached for reference.' : ''}
    
    Task: Generate 3 DISTINCT email campaign concepts focusing on:
    1. Subject lines and preview text
    2. Visual layout and composition
    3. Call-to-action placement
    4. Brand consistency - ensure the brand logo is prominently featured in the header
    
    For each concept, provide:
    - id: A unique identifier
    - title: Campaign name
    - hook: A compelling subject line
    - summary: Campaign strategy rationale
    - visualPrompt: Detailed email template description (header with brand logo, hero image featuring the product, body layout, footer with logo)
    - subjectLines: 3 compelling subject line options
    - ctaText: Primary call-to-action text
    - layoutStyle: Email layout approach (newsletter, promotional, announcement, etc.)
    `;
  
    const parts: any[] = [{ text: prompt }];

    if (brief.productImage && brief.productImage.startsWith('data:')) {
      const { mimeType, data } = await this.resolveImage(brief.productImage);
      parts.push({ inlineData: { mimeType, data } });
      parts.push({ text: "REFERENCE IMAGE (PRODUCT): Use this product image as the hero product in the email designs." });
    }

    if (brief.logoImage && brief.logoImage.startsWith('data:')) {
      const { mimeType, data } = await this.resolveImage(brief.logoImage);
      parts.push({ inlineData: { mimeType, data } });
      parts.push({ text: "REFERENCE IMAGE (LOGO): This is the brand logo. It MUST appear in the email header and optionally in the footer for brand consistency." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              hook: { type: Type.STRING },
              summary: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              copyAngle: { type: Type.STRING, description: "Email copy strategy" },
              overlayCtas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Subject line options" },
            },
            required: ["id", "title", "hook", "summary", "visualPrompt", "copyAngle", "overlayCtas"]
          }
        }
      }
    });
  
    return JSON.parse(response.text || "[]");
  }

  static async generateEmailContent(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const ai = this.getClient();
    
    const contactInfo = {
      phone: brief.contactPhone || '',
      email: brief.contactEmail || '',
      address: brief.contactAddress || '',
      website: brief.productUrl || ''
    };
    
    const prompt = `Create email content sections for this email campaign concept:
    
    Campaign: ${concept.title}
    Subject Line: ${concept.hook}
    Strategy: ${concept.summary}
    Brand: ${brief.brandName} - ${brief.productName}
    Target Audience: ${brief.targetAudience}
    Tone: ${brief.tone.join(', ')}
    ${brief.creativeDirection ? `Creative Direction: ${brief.creativeDirection}` : ''}
    
    IMPORTANT CONTACT INFORMATION (use ONLY these details, do NOT invent fake contact info):
    ${contactInfo.phone ? `- Phone: ${contactInfo.phone}` : '- Phone: (not provided - omit from design)'}
    ${contactInfo.email ? `- Email: ${contactInfo.email}` : '- Email: (not provided - omit from design)'}
    ${contactInfo.address ? `- Address: ${contactInfo.address}` : '- Address: (not provided - omit from design)'}
    ${contactInfo.website ? `- Website: ${contactInfo.website}` : '- Website: (not provided - omit from design)'}
    
    Generate 4 email sections:
    1. Hero Section - Main visual with compelling headline and key message
    2. Body Section - Product details, benefits, and features
    3. Infographic Section - Visual data/stats/benefits infographic showcasing brand value proposition
    4. Footer Section - Professional branded footer with ONLY the provided contact information above (do NOT fabricate any contact details)
    
    For each section provide:
    - sceneNumber: Section number (1-4)
    - visualPrompt: Detailed description for generating the section's visual. For the Footer section, include ONLY the contact details provided above - never invent phone numbers, addresses, or emails.
    - audioScript: The actual email copy/text content for this section
    
    Output a JSON array of 4 sections.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.NUMBER },
              visualPrompt: { type: Type.STRING, description: "Visual description for the email section" },
              audioScript: { type: Type.STRING, description: "Email copy/text content for this section" },
            },
            required: ["sceneNumber", "visualPrompt", "audioScript"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }

  static async generateEmailHTML(brief: AdBrief, concept: AdConcept, scenes: Scene[]): Promise<string> {
    const ai = this.getClient();
    
    const sectionLabels = ['Hero', 'Body', 'Infographic', 'Footer'];
    const sectionsData = scenes.map((scene, idx) => ({
      section: sectionLabels[idx] || `Section ${idx + 1}`,
      content: scene.audioScript,
      hasImage: !!scene.imageUrl
    }));

    const productUrl = brief.productUrl || '#';

    const prompt = `You are an expert HTML email developer. Create a complete, production-ready HTML email template.

    Brand Information:
    - Brand Name: ${brief.brandName}
    - Product: ${brief.productName}
    - Target Audience: ${brief.targetAudience}
    - Tone: ${brief.tone.join(', ')}
    - Visual Style: ${brief.visualStyle || 'Professional and modern'}
    - Product URL: ${productUrl}
    
    Campaign Details:
    - Campaign Title: ${concept.title}
    - Subject Line: ${concept.hook}
    - Strategy: ${concept.summary}
    
    Email Sections Content:
    ${sectionsData.map(s => `${s.section}: ${s.content}`).join('\n    ')}
    
    Requirements:
    1. Create a COMPLETE HTML email with inline CSS (email clients don't support external stylesheets)
    2. Use a responsive design that works on mobile and desktop
    3. Include proper email DOCTYPE and meta tags
    4. Use table-based layout for maximum email client compatibility
    5. HEADER: Use the logo placeholder src="{{LOGO}}" centered at the top, wrapped in a clickable link to {{PRODUCT_URL}}
    6. HERO SECTION: Include placeholder image src="{{IMAGE_HERO}}" for the main hero visual
    7. BODY SECTION: Include placeholder image src="{{IMAGE_BODY}}" for product details
    8. INFOGRAPHIC SECTION: Include placeholder image src="{{IMAGE_INFOGRAPHIC}}" for the infographic visual
    9. FOOTER: Include placeholder image src="{{IMAGE_FOOTER}}" as the footer graphic, wrapped in a clickable link to {{PRODUCT_URL}}
    10. Style the email to match the brand tone (colors, fonts, spacing)
    11. Include a prominent CTA button styled to match the brand
    12. Use web-safe fonts with fallbacks
    
    Color Scheme Guidelines based on tone:
    - If tone includes "Premium/Luxury": Use dark backgrounds (#1a1a1a), gold accents (#d4af37)
    - If tone includes "Fresh/Modern": Use white backgrounds, bright accent colors
    - If tone includes "Professional": Use navy (#1e3a5f), white, subtle grays
    - If tone includes "Energetic": Use bold colors, high contrast
    - Default: Use brand-appropriate professional colors
    
    Output ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>.
    Do not include any explanation or markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let html = response.text || "";
    
    // Clean up any markdown code blocks if present
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Replace image placeholders with actual images if available
    // scenes[0] = Hero, scenes[1] = Body, scenes[2] = Infographic, scenes[3] = Footer
    if (scenes[0]?.imageUrl) {
      html = html.replace(/\{\{IMAGE_HERO\}\}/g, scenes[0].imageUrl);
    }
    if (scenes[1]?.imageUrl) {
      html = html.replace(/\{\{IMAGE_BODY\}\}/g, scenes[1].imageUrl);
    }
    if (scenes[2]?.imageUrl) {
      html = html.replace(/\{\{IMAGE_INFOGRAPHIC\}\}/g, scenes[2].imageUrl);
    }
    if (scenes[3]?.imageUrl) {
      html = html.replace(/\{\{IMAGE_FOOTER\}\}/g, scenes[3].imageUrl);
    }
    if (brief.logoImage) {
      html = html.replace(/\{\{LOGO\}\}/g, brief.logoImage);
    }
    // Replace product URL placeholder
    html = html.replace(/\{\{PRODUCT_URL\}\}/g, productUrl);
    
    return html;
  }

  private static stripBase64FromHtml(html: string): { strippedHtml: string; placeholders: Map<string, string> } {
    const placeholders = new Map<string, string>();
    let counter = 0;
    
    const strippedHtml = html.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, (match) => {
      const placeholder = `{{BASE64_IMAGE_${counter++}}}`;
      placeholders.set(placeholder, match);
      return placeholder;
    });
    
    return { strippedHtml, placeholders };
  }

  private static restoreBase64ToHtml(html: string, placeholders: Map<string, string>): string {
    let result = html;
    for (const [placeholder, original] of placeholders) {
      result = result.replace(placeholder, original);
    }
    return result;
  }

  static async editEmailHTML(currentHTML: string, editInstruction: string, brief: AdBrief): Promise<string> {
    const ai = this.getClient();
    
    const { strippedHtml, placeholders } = this.stripBase64FromHtml(currentHTML);
    
    const prompt = `You are an expert HTML email developer. Edit the following HTML email template based on the user's instruction.

    Current HTML:
    ${strippedHtml}
    
    User's Edit Instruction: "${editInstruction}"
    
    Brand Context:
    - Brand Name: ${brief.brandName}
    - Tone: ${brief.tone.join(', ')}
    
    Requirements:
    1. Make ONLY the changes requested by the user
    2. Maintain email client compatibility (inline CSS, table layout)
    3. Keep the overall structure intact unless specifically asked to change it
    4. Preserve all image placeholders (like {{BASE64_IMAGE_0}}, {{BASE64_IMAGE_1}}, etc.) exactly as they appear
    5. Preserve all other image URLs
    
    Output ONLY the complete modified HTML code, starting with <!DOCTYPE html> and ending with </html>.
    Do not include any explanation or markdown code blocks.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let html = response.text || "";
      html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      
      html = this.restoreBase64ToHtml(html, placeholders);
      
      return html;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('token count exceeds') || errorMessage.includes('INVALID_ARGUMENT')) {
        throw new Error('The email content is too large to edit. Please try a simpler edit or reduce the email size.');
      }
      
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        throw new Error('API rate limit reached. Please wait a moment and try again.');
      }
      
      throw error;
    }
  }

  static async generateScript(brief: AdBrief, concept: AdConcept, version: string = PROMPT_VERSIONS.SCRIPT): Promise<Scene[]> {
    const ai = this.getClient();
    const brandContext = buildBrandContext(brief);
    const brandDnaContext = brief.brandDna ? buildBrandDnaContext(brief.brandDna) : '';
    
    const prompt = PROMPT_TEMPLATE.build({
      role: 'Cinematic Scriptwriter and Video Production Director',
      context: `Writing a detailed cinematic script for an advertisement concept.

Concept Details:
- Title: ${concept.title}
- Hook: ${concept.hook}
- Summary: ${concept.summary}

${brandContext}${brandDnaContext}`,
      task: 'Write a 5-scene cinematic script optimized for Image-to-Video generation. Each scene must describe a single, continuous motion lasting 5-8 seconds.',
      constraints: [
        'Script must have exactly 5 scenes',
        'Each visualPrompt must describe a SINGLE continuous motion (5-8 seconds)',
        'Good examples: "Slow pan right across the product", "Water droplets splash in slow motion", "Camera pushes in on the dial"',
        'Bad examples: "The man walks in, sits down, and drinks coffee" (too complex for 5s)',
        'Visual prompts must align with static product images - focus on lighting changes, camera movement, or particle effects',
        'Audio scripts should be concise voiceover lines matching the visual',
        'Scene numbers must be sequential: 1, 2, 3, 4, 5'
      ],
      outputFormat: 'JSON array of 5 scene objects with fields: sceneNumber (number), visualPrompt (string), audioScript (string)',
      errorHandling: [
        ...ERROR_HANDLING_INSTRUCTIONS.general,
        ...ERROR_HANDLING_INSTRUCTIONS.jsonOutput,
        'If concept is unclear, create generic cinematic scenes that showcase the product',
        'If brand context is missing, focus on universal product appeal'
      ]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.NUMBER, description: "Sequential scene number (1-5)" },
              visualPrompt: { type: Type.STRING, description: "Single continuous motion prompt for 5-8s video generation" },
              audioScript: { type: Type.STRING, description: "Voiceover script line for this scene" },
            },
            required: ["sceneNumber", "visualPrompt", "audioScript"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }

  static async generateSocialCampaign(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const ai = this.getClient();
    const prompt = `Act as a Senior Graphic Designer & Ad Strategist. Create 3 High-Impact Social Media Posters for this concept.
    
    Brand: ${brief.brandName}
    Product: ${brief.productName}
    Concept: ${concept.title} - ${concept.summary}
    Tone: ${brief.tone.join(', ')}

    Create 3 unique advertising poster designs.
    
    DESIGN RULES:
    1. 'visualPrompt': Describe a "Graphic Advertising Composition". 
       - DO NOT ask for simple photography. 
       - Ask for "Bold Typography integration", "Color Blocking", "Surrealist Product Placement", "Collage elements", or "Magazine Editorial Layouts".
       - Example: "Graphic design poster, product floating in center with bold yellow sans-serif typography overlay reading 'FASTER', diagonal geometric shadows, high contrast."
    2. 'audioScript': This will be the POST CAPTION. Write a snappy hook + benefit + CTA. Include hashtags.
    
    Output JSON array of scenes (mapping sceneNumber to postNumber).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.NUMBER },
              visualPrompt: { type: Type.STRING },
              audioScript: { type: Type.STRING, description: "The Facebook/Instagram caption" },
            },
            required: ["sceneNumber", "visualPrompt", "audioScript"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }
  
  // Specialized method for generating the caption for Food Socials
  static async generateFoodSocialPost(brief: AdBrief, concept: AdConcept, scene: Scene): Promise<string> {
      const ai = this.getClient();
      const prompt = `Write a Facebook/Instagram post for "${brief.brandName}" promoting the "${brief.productName}".
      
      Concept Strategy: "${concept.title}"
      Copy Instructions: "${concept.copyAngle}"
      Selected CTA in image: "${scene.selectedCta || 'Check it out'}"
      
      Brand DNA:
      - Tone: ${brief.tone.join(', ')}
      - Keywords: ${brief.keyFeatures.join(', ')}
      - Website: ${brief.productUrl || 'N/A'}
    
      Format:
      - Headline (Catchy)
      - Body (Engaging, ~2 paragraphs)
      - Call to Action (Link to website if available)
      - Hashtags
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] }
      });
    
      return response.text?.trim() || "Could not generate caption.";
  }

  // New method to polish/rewrite script
  static async polishSceneScript(script: string, tone: string[]): Promise<string> {
    const ai = this.getClient();
    const prompt = `Rewrite the following advertisement script line to be more ${tone.join(', ')}, punchy, and professional for a commercial voiceover. Keep it concise.
    
    Original Script: "${script}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || script;
  }

  static async generateStoryboardImage(visualPrompt: string, productImage?: string, styleReferenceImage?: string, aspectRatio: string = "16:9", logoImage?: string, version: string = PROMPT_VERSIONS.STORYBOARD_IMAGE, brandDna?: BrandDna): Promise<string> {
    const ai = this.getClient();
    const parts: any[] = [];
    const brandDnaContext = brandDna ? buildBrandDnaContext(brandDna) : '';

    // 1. Add Product Reference if available
    if (productImage) {
      parts.push({
        inlineData: {
          mimeType: productImage.split(';')[0].split(':')[1],
          data: productImage.split(',')[1]
        }
      });
      parts.push({ text: "REFERENCE IMAGE 1 (PRODUCT): This is the product that MUST appear in the scene." });
    }

    // 2. Add Style/Continuity Reference if available
    if (styleReferenceImage) {
      parts.push({
        inlineData: {
          mimeType: styleReferenceImage.split(';')[0].split(':')[1],
          data: styleReferenceImage.split(',')[1]
        }
      });
      parts.push({ text: "REFERENCE IMAGE 2 (STYLE/CONTINUITY): Maintain the visual style, lighting, color grading, and character consistency of this previous scene." });
    }

    // 3. Add Logo Reference if available
    if (logoImage && logoImage.startsWith('data:')) {
      parts.push({
        inlineData: {
          mimeType: logoImage.split(';')[0].split(':')[1],
          data: logoImage.split(',')[1]
        }
      });
      parts.push({ text: "REFERENCE IMAGE 3 (LOGO): This is the brand logo. Incorporate it naturally into the scene where appropriate (e.g., header, corner, or as part of the product branding)." });
    }

    // 4. Main Prompt using standardized template
    const logoInstruction = logoImage ? " Include the brand logo naturally in the composition." : "";
    const mainPrompt = PROMPT_TEMPLATE.build({
      role: 'Commercial Photography Director and Visual Artist',
      context: `Generating a high-end commercial storyboard visual for an advertisement scene.${brandDnaContext}`,
      task: `Create a photorealistic commercial image based on the following description: ${visualPrompt}`,
      constraints: [
        'Product from reference image MUST appear prominently in the scene',
        'Maintain visual consistency with style reference if provided',
        logoImage ? 'Incorporate brand logo naturally in the composition' : 'No logo required',
        brandDna ? `Follow brand visual style: ${brandDna.visualStyle}` : '',
        brandDna?.colorPalette?.length ? `Use brand color palette: ${brandDna.colorPalette.join(', ')}` : '',
        brandDna?.typography ? `Use typography style: ${brandDna.typography} for any text elements` : '',
        ...VISUAL_STYLE_GUIDE.split('\n').map(line => line.trim()).filter(line => line.startsWith('-')).map(line => line.substring(2))
      ].filter(c => c !== ''),
      outputFormat: 'High-resolution photorealistic image',
      errorHandling: ERROR_HANDLING_INSTRUCTIONS.imageGeneration
    });
    parts.push({ text: mainPrompt });

    // WRAP IN RETRY LOGIC for free tier
    return this.retry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio, // Dynamic aspect ratio
            },
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw new Error("No image data found in response");
    });
  }

  // Specialized Image Gen for Food Socials with Text Overlay logic support (via prompt)
  static async generateFoodHeroImage(brief: AdBrief, concept: AdConcept, ctaText: string, version: string = PROMPT_VERSIONS.FOOD_HERO_IMAGE): Promise<string> {
      const ai = this.getClient();
      const brandDnaContext = brief.brandDna ? buildBrandDnaContext(brief.brandDna) : '';
      
      const prompt = PROMPT_TEMPLATE.build({
        role: 'Food Photography Director and Advertising Graphic Designer',
        context: `Creating a professional advertising poster for food/beverage brand.

Brand Identity:
- Brand Name: ${brief.brandName}
- Product: ${brief.productName}
- Visual Style: ${brief.brandDna?.visualStyle || brief.visualStyle || 'High-end appetizing'}
${brandDnaContext}
Art Direction:
- Concept: ${concept.title}
- Visual Prompt: ${concept.visualPrompt}`,
        task: `Design a professional, high-quality advertising poster with the headline "${ctaText}" rendered directly into the image.`,
        constraints: [
          `TEXT: Render headline "${ctaText}" with bold, professional typography matching the art direction`,
          'Text must be legible and seamlessly integrated into the design',
          'BRANDING: Incorporate brand logo naturally if provided',
          'FOOD: Product must look appetizing and premium',
          'Composition must be balanced and visually appealing',
          brief.brandDna?.colorPalette?.length ? `Use brand color palette: ${brief.brandDna.colorPalette.join(', ')}` : '',
          brief.brandDna?.typography ? `Typography style: ${brief.brandDna.typography}` : '',
          ...VISUAL_STYLE_GUIDE.split('\n').map(line => line.trim()).filter(line => line.startsWith('-')).map(line => line.substring(2))
        ].filter(c => c !== ''),
        outputFormat: 'Seamless, finished advertisement graphic in 16:9 aspect ratio',
        errorHandling: [
          ...ERROR_HANDLING_INSTRUCTIONS.imageGeneration,
          'If text rendering fails, create image without text and note in response',
          'If food image is unclear, create appetizing generic food presentation'
        ]
      });
    
      const parts: any[] = [{ text: prompt }];
    
      // 1. Pass source food image
      if (brief.productImage && brief.productImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.productImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: `REFERENCE IMAGE 1 (Product): Use this as the main subject.` });
      }
    
      // 2. Pass logo as reference
      if (brief.logoImage && brief.logoImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.logoImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "REFERENCE IMAGE 2 (Logo): Place this logo in the design or redraw it to match the style." });
      }
    
      // Wrap in retry logic for rate limit handling
      return this.retry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });
      
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      
        throw new Error("No image generated.");
      });
  }

  static async editHeroImage(currentImageBase64: string, editInstruction: string): Promise<string> {
      const ai = this.getClient();
      const { mimeType, data } = await this.resolveImage(currentImageBase64);
    
      const prompt = `Edit this image. Instruction: ${editInstruction}. Maintain the high-quality professional advertising aesthetic, the layout, and the aspect ratio.`;
    
      // Wrap in retry logic for rate limit handling
      return this.retry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType, data } },
              { text: prompt }
            ]
          },
          config: {
              imageConfig: {
                  aspectRatio: "16:9"
              }
          }
        });
      
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      
        throw new Error("No image generated.");
      });
  }

  static async generateVoiceover(text: string, voiceName: string = 'Kore'): Promise<string> {
    const ai = this.getClient();
    // Wrap in retry logic
    return this.retry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
              },
            },
          },
        });

        const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Data) throw new Error("No audio generated");
        return base64Data;
    });
  }

  static async generateCinematicVideo(prompt: string, initialImage?: string): Promise<string> {
    const ai = this.getClient();
    
    // Explicitly optimize prompt for Image-to-Video
    const veoPrompt = `Cinematic commercial shot. ${prompt}. High consistency with input image. Photorealistic 8k.`;
    
    // Determine mimeType if image exists, default to 'image/png' if unclear but safer to parse
    const mimeType = initialImage ? initialImage.split(';')[0].split(':')[1] : undefined;

    // Wrap initial generation request in retry
    let operation = await this.retry(async () => {
        return await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: veoPrompt,
            image: initialImage && mimeType ? {
                imageBytes: initialImage.split(',')[1],
                mimeType: mimeType
            } : undefined,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });
    });

    // Polling with Timeout and Retry
    const startTime = Date.now();
    const TIMEOUT_MS = 300000; // 5 minutes timeout

    while (!operation.done) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error("Video generation timed out after 5 minutes");
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Wrap polling in retry to handle transient API errors during check
      operation = await this.retry(async () => await ai.operations.getVideosOperation({ operation: operation }));
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    // Client-side download using the stored API key from sessionStorage
    // Note: Server-side proxy is recommended for production to hide keys and handle CORS
    const apiKey = this.getStoredApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please add your Gemini API key in settings.");
    }
    
    // Append API key to download URL (the URI may already have query params)
    const separator = downloadLink.includes('?') ? '&' : '?';
    const videoResponse = await fetch(`${downloadLink}${separator}key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  }
}
