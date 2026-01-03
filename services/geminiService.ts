
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AdBrief, AdConcept, Scene } from "../types";

const API_KEY_STORAGE_KEY = 'banana_ads_gemini_api_key';

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

  static async researchBrand(brandName: string, productName: string): Promise<Partial<AdBrief>> {
    const ai = this.getClient();
    const prompt = `Research the brand "${brandName}" and their product "${productName}". 
    Analyze their current marketing, target audience, brand voice, and key selling propositions.
    
    If possible, find a URL for their official logo (search for 'logo' or 'icon').

    Return a JSON object with suggested fields for an ad brief: 
    - 'targetAudience'
    - 'tone' (List of 3-5 adjectives)
    - 'keyFeatures' (List of key selling points)
    - 'logoImage' (URL string if found, otherwise empty string)`;

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

  // Brand DNA Research logic for Food Socials
  static async researchBrandDna(brief: AdBrief): Promise<Partial<AdBrief>> {
      const ai = this.getClient();
      
      let prompt = `Analyze the provided brand assets to extract a structured Brand DNA profile.
      
      Inputs:
      - Description/Features: "${brief.keyFeatures.join(', ')}"
      - Website: "${brief.productUrl}"
      - Target Audience: "${brief.targetAudience}"
      - Desired Tone: "${brief.tone.join(', ')}"
      ${brief.creativeDirection ? `- Creative Direction: "${brief.creativeDirection}"` : ""}
      ${brief.productName ? `- Product Name: "${brief.productName}"` : ""}
      ${brief.logoImage ? "- A logo image is attached." : ""}
      ${brief.productImage ? "- A sample product/food photo is attached." : ""}
    
      Task:
      1. Analyze the visual style (colors, fonts, lighting, plating, vibe) from the logo, sample product photo, and the Creative Direction input.
      2. Extract a 'visualStyle' string description.
      `;
    
      const parts: any[] = [{ text: prompt }];
      
      if (brief.logoImage && brief.logoImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.logoImage);
        parts.push({ inlineData: { mimeType, data } });
      }
    
      if (brief.productImage && brief.productImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.productImage);
        parts.push({ inlineData: { mimeType, data } });
      }
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualStyle: { type: Type.STRING, description: "Description of colors, shapes, and visual identity inferred from logo/desc/photo/direction" },
            },
            required: ["visualStyle"]
          }
        }
      });
    
      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      const data = JSON.parse(text);
      return { visualStyle: data.visualStyle };
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

  static async generateConcepts(brief: AdBrief): Promise<AdConcept[]> {
    const ai = this.getClient();
    // Prompt structure allows overriding standard brand DNA with specific creative direction
    const prompt = `Create 3 distinct cinematic advertisement concepts for this brand.
    
    CORE BRAND INFO:
    Brand: ${brief.brandName}
    Product: ${brief.productName}
    Standard Audience: ${brief.targetAudience}
    Standard Tone: ${brief.tone.join(', ')}
    Key Selling Points: ${brief.keyFeatures.join(', ')}

    ${brief.creativeDirection ? `
    IMPORTANT - CAMPAIGN STRATEGY PIVOT:
    The user has specified a specific Creative Direction for this campaign that might differ from the standard brand DNA.
    Creative Direction / Niche Twist: "${brief.creativeDirection}"
    
    Please ensure the concepts align strictly with this Creative Direction, even if it contradicts the standard audience.` : ''}

    Output 3 unique concepts (JSON).`;

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
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              hook: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["id", "title", "hook", "summary"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }

  // Specialized Concept Generation for Food Socials
  static async generateFoodSocialConcepts(brief: AdBrief): Promise<AdConcept[]> {
      const ai = this.getClient();
      
      const prompt = `You are a world-class Art Director & Graphic Designer. 
      
      Context:
      We need to design a professional Advertising Poster for "${brief.brandName}" featuring "${brief.productName}".
      
      Brand DNA:
      - Tone: ${brief.tone.join(', ')}
      - Visual Style: ${brief.visualStyle || 'High-end appetizing'}
      - Keywords: ${brief.keyFeatures.join(', ')}
    
      Task:
      Generate 3 DISTINCT Art Direction concepts for a Social Media Ad.
      Focus on LAYOUT, TYPOGRAPHY, and COMPOSITION.
      Think: Magazine Ads, Billboards, Pop-Art, Modern Minimalist, 90s Retro.
    
      For each concept, provide:
      1. Title: A short internal name for the concept.
      2. Hook: A short tagline/hook.
      3. Summary: Rationale why this works.
      4. visualPrompt: A highly detailed prompt describing a "Professional Advertising Poster". Include details about typography style, background graphics, color palette.
      5. copyAngle: Instructions for the copywriter.
      6. overlayCtas: Provide 3 distinct, punchy headline options (2-5 words) that could be rendered on the image.
      `;
    
      const parts: any[] = [{ text: prompt }];

      if (brief.productImage && brief.productImage.startsWith('data:')) {
        const { mimeType, data } = await this.resolveImage(brief.productImage);
        parts.push({ inlineData: { mimeType, data } });
        parts.push({ text: "Use this product image as a key reference for the visual style." });
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
                copyAngle: { type: Type.STRING },
                overlayCtas: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["id", "title", "hook", "summary", "visualPrompt", "copyAngle", "overlayCtas"]
            }
          }
        }
      });
    
      return JSON.parse(response.text || "[]");
  }

  static async generateScript(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const ai = this.getClient();
    const prompt = `Write a detailed cinematic script for this advertisement concept:
    Title: ${concept.title}
    Hook: ${concept.hook}
    Summary: ${concept.summary}
    Brand Context: ${brief.brandName} - ${brief.productName}
    ${brief.creativeDirection ? `Creative Direction Context: ${brief.creativeDirection}` : ''}
    
    The script should have 5 scenes. 
    
    VEO OPTIMIZATION RULES (CRITICAL):
    1. 'visualPrompt': Must be optimized for "Image-to-Video" generation with a strict 5-8 second duration limit.
    2. MOTION FOCUS: Do not describe a complex sequence of events. Describe a SINGLE, continuous motion.
       - Good: "Slow pan right across the product", "Water droplets splash in slow motion", "Camera pushes in on the dial".
       - Bad: "The man walks in, sits down, and drinks coffee" (Too complex for 5s).
    3. NO FLUFF: The visual prompt must align perfectly with a static image of the product. Focus on lighting changes, camera movement, or particle effects.
    
    Output a JSON array of scenes.`;

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
              visualPrompt: { type: Type.STRING, description: "A prompt describing a single 5-8s motion, e.g., 'Slow camera push in'" },
              audioScript: { type: Type.STRING },
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

  static async generateStoryboardImage(visualPrompt: string, productImage?: string, styleReferenceImage?: string, aspectRatio: string = "16:9"): Promise<string> {
    const ai = this.getClient();
    const parts: any[] = [];

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

    // 3. Main Prompt
    parts.push({ text: `Generate a high-end commercial visual. Description: ${visualPrompt}. 8k, professional lighting, photorealistic.` });

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
  static async generateFoodHeroImage(brief: AdBrief, concept: AdConcept, ctaText: string): Promise<string> {
      const ai = this.getClient();
      
      const prompt = `Design a professional, high-quality advertising poster.
      
      Subject: ${brief.productName}
      Style/Concept: ${concept.title}
      Art Direction: ${concept.visualPrompt}
      
      CRITICAL LAYOUT INSTRUCTIONS:
      1. TEXT: Render the headline "${ctaText}" directly into the image. Use bold, professional typography that matches the art direction. Ensure the text is legible and integrated into the design.
      2. BRANDING: Incorporate the brand logo naturally if provided.
      3. FOOD: The food should look appetizing and premium.
      
      Brand Identity:
      - Name: ${brief.brandName}
      - Vibe: ${brief.visualStyle}
      
      Output: A seamless, finished advertisement graphic.
      `;
    
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
  }

  static async editHeroImage(currentImageBase64: string, editInstruction: string): Promise<string> {
      const ai = this.getClient();
      const { mimeType, data } = await this.resolveImage(currentImageBase64);
    
      const prompt = `Edit this image. Instruction: ${editInstruction}. Maintain the high-quality professional advertising aesthetic, the layout, and the aspect ratio.`;
    
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

    // Client-side download (Note: Server-side proxy is recommended for production to hide keys and handle CORS)
    const apiKey = process.env.API_KEY;
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  }
}
