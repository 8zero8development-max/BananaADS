
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AdBrief, AdConcept, Scene } from "../types";

export class GeminiService {
  private static getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY is missing. Please add it to your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
  }

  // Generic Retry Wrapper for Free Tier Robustness
  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // Check for 429 (Too Many Requests) or 503 (Service Unavailable)
      if (retries > 0 && (error.status === 429 || error.status === 503 || error.message?.includes('429'))) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2); // Exponential backoff
      }
      throw error;
    }
  }

  static async researchBrand(brandName: string, productName: string): Promise<Partial<AdBrief>> {
    const ai = this.getClient();
    const prompt = `Research the brand "${brandName}" and their product "${productName}". 
    Analyze their current marketing, target audience, brand voice, and key selling propositions.
    Return a JSON object with suggested fields for an ad brief: 'targetAudience', 'tone' (3-5 adjectives), and 'keyFeatures' (a concise list).`;

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
            tone: { type: Type.STRING },
            keyFeatures: { type: Type.STRING },
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

  static async generateMoodBoard(brief: AdBrief, referenceImage?: string): Promise<string> {
    const ai = this.getClient();
    
    // Prompt for a single collage image
    const prompt = `Create a professional single-page fashion/brand mood board collage for the brand "${brief.brandName}" and product "${brief.productName}".
    
    Composition Requirements:
    - Create a cohesive graphic design layout on a textured background (paper or digital noise).
    - FEATURE 1: A prominent color palette strip with 5 distinct color swatches extracted from the brand vibe.
    - FEATURE 2: High-end lifestyle imagery representing the audience: ${brief.targetAudience}.
    - FEATURE 3: Visual textures (e.g. concrete, silk, film grain) that match the tone: ${brief.tone}.
    - FEATURE 4: Large, stylish typography displaying the brand name "${brief.brandName}".
    - FEATURE 5: The product itself, integrated artistically into the collage.
    
    Style: Organized, aesthetic, "Urban Pulse" vibe, cinematic lighting, graphic design portfolio quality. 16:9 aspect ratio.`;

    let contents;
    
    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      contents = {
        parts: [
          {
            inlineData: { mimeType, data: base64Data }
          },
          { text: `Use this product image as the key reference in the collage. ${prompt}` }
        ]
      };
    } else {
      contents = { parts: [{ text: prompt }] };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
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
  }

  static async generateConceptPreview(concept: AdConcept): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `Cinematic concept art key visual for an advertisement. Title: ${concept.title}. Scene description: ${concept.summary}. High quality, atmospheric, 4k.` }],
      },
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
  }

  static async generateConcepts(brief: AdBrief): Promise<AdConcept[]> {
    const ai = this.getClient();
    // Prompt structure allows overriding standard brand DNA with specific creative direction
    const prompt = `Create 3 distinct cinematic advertisement concepts for this brand.
    
    CORE BRAND INFO:
    Brand: ${brief.brandName}
    Product: ${brief.productName}
    Standard Audience: ${brief.targetAudience}
    Standard Tone: ${brief.tone}
    Key Selling Points: ${brief.keyFeatures}

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

  static async generateScript(brief: AdBrief, concept: AdConcept): Promise<Scene[]> {
    const ai = this.getClient();
    const prompt = `Write a detailed cinematic script for this advertisement concept:
    Title: ${concept.title}
    Hook: ${concept.hook}
    Summary: ${concept.summary}
    Brand Context: ${brief.brandName} - ${brief.productName}
    ${brief.creativeDirection ? `Creative Direction Context: ${brief.creativeDirection}` : ''}
    
    The script should have 5 high-impact scenes. For each scene provide a highly detailed visual prompt for an image/video generator and the spoken audio script (voiceover).`;

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
              audioScript: { type: Type.STRING },
            },
            required: ["sceneNumber", "visualPrompt", "audioScript"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  }

  // New method to polish/rewrite script
  static async polishSceneScript(script: string, tone: string): Promise<string> {
    const ai = this.getClient();
    const prompt = `Rewrite the following advertisement script line to be more ${tone}, punchy, and professional for a commercial voiceover. Keep it concise.
    
    Original Script: "${script}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || script;
  }

  static async generateStoryboardImage(visualPrompt: string, productImage?: string, styleReferenceImage?: string): Promise<string> {
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
    parts.push({ text: `Generate a high-end cinematic advertising shot. Description: ${visualPrompt}. 8k, professional lighting, photorealistic.` });

    // WRAP IN RETRY LOGIC for free tier
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
        throw new Error("No image data found in response");
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
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic commercial clip: ${prompt}`,
      image: initialImage ? {
        imageBytes: initialImage.split(',')[1],
        mimeType: 'image/png'
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const apiKey = process.env.API_KEY;
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  }
}
