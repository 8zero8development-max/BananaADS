
import React, { useState, useCallback, useEffect } from 'react';
import { AdBrief, AdConcept, Scene, AppStep, AdProject } from './types';
import { GeminiService } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './utils/audioUtils';

// --- Custom Components ---

type BananaRole = 'default' | 'research' | 'artist' | 'director' | 'cameraman' | 'voice' | 'writer';

// Banana Pro: The specialized agent character component
const BananaPro: React.FC<{ 
  role?: BananaRole; 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  text?: string;
  className?: string;
}> = ({ role = 'default', size = 'md', text, className = '' }) => {
  
  const sizeConfig = {
    sm: { text: 'text-2xl', sub: 'text-[0.6rem]', emojiSize: 'text-lg' },
    md: { text: 'text-4xl', sub: 'text-[0.7rem]', emojiSize: 'text-2xl' },
    lg: { text: 'text-6xl', sub: 'text-xs', emojiSize: 'text-4xl' },
    xl: { text: 'text-8xl', sub: 'text-sm', emojiSize: 'text-5xl' }
  };

  // Configuration for each banana persona
  const personas: Record<BananaRole, { 
    banana: string; 
    accessory: string; 
    animation: string; 
    color: string;
    accessoryPos: string;
  }> = {
    default: { banana: '🍌', accessory: '', animation: 'animate-banana-wiggle', color: 'text-yellow-400', accessoryPos: '' },
    research: { banana: '🍌', accessory: '🧐', animation: 'animate-banana-scan', color: 'text-blue-400', accessoryPos: 'absolute -bottom-1 -right-2' },
    artist: { banana: '🍌', accessory: '🎨', animation: 'animate-banana-bounce', color: 'text-pink-400', accessoryPos: 'absolute -top-1 -right-2' },
    director: { banana: '🍌', accessory: '🎬', animation: 'animate-banana-wiggle', color: 'text-purple-400', accessoryPos: 'absolute bottom-0 -left-2 rotate-[-20deg]' },
    cameraman: { banana: '🍌', accessory: '📹', animation: 'animate-banana-pulse', color: 'text-red-500', accessoryPos: 'absolute top-1/2 -right-3 -translate-y-1/2' },
    voice: { banana: '🍌', accessory: '🎙️', animation: 'animate-banana-vibrate', color: 'text-green-400', accessoryPos: 'absolute bottom-0 -right-2' },
    writer: { banana: '🍌', accessory: '✍️', animation: 'animate-banana-write', color: 'text-orange-400', accessoryPos: 'absolute bottom-0 -right-1' },
  };

  const p = personas[role];
  const s = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${p.animation} inline-block`}>
        <span className={`${s.text} filter drop-shadow-lg`}>{p.banana}</span>
        {p.accessory && (
          <span className={`${s.emojiSize} ${p.accessoryPos} filter drop-shadow-md`}>{p.accessory}</span>
        )}
      </div>
      {text && (
        <p className={`${p.color} font-bold ${s.sub} uppercase tracking-widest animate-pulse text-center whitespace-nowrap`}>
          {text}
        </p>
      )}
    </div>
  );
};

const StepIndicator: React.FC<{ currentStep: AppStep }> = ({ currentStep }) => {
  const steps = ["Brand Brief", "Creative Concepts", "Production"];
  return (
    <div className="flex items-center space-x-6 mb-12">
      {steps.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-center group">
            <div 
              className={`relative flex items-center justify-center transition-all duration-500 ${
                currentStep >= idx ? 'scale-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'opacity-30 grayscale'
              }`}
            >
              <div className="text-4xl select-none">🍌</div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-black ${currentStep >= idx ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>
                {idx + 1}
              </div>
            </div>
            <span className={`ml-3 text-sm font-bold uppercase tracking-wider ${currentStep >= idx ? 'text-banana' : 'text-white/40'}`}>{label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden mx-2">
               <div 
                 className={`absolute top-0 left-0 h-full gradient-accent transition-all duration-700 ease-out`} 
                 style={{ width: currentStep > idx ? '100%' : '0%' }}
               />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ApiKeyConfig: React.FC<{ onConfigured: () => void }> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (GeminiService.hasApiKey()) {
      onConfigured();
    }
  }, [onConfigured]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini API keys start with "AIza"');
      return;
    }

    setValidating(true);
    setError('');
    
    try {
      GeminiService.setApiKey(apiKey.trim());
      onConfigured();
    } catch (e) {
      setError('Failed to save API key. Please try again.');
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-lg w-full glass p-10 rounded-3xl border border-yellow-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30 text-3xl">🍌</div>
        <h2 className="text-3xl font-serif mb-2">Enter Your API Key</h2>
        <p className="text-white/50 text-sm mb-6">Your key is stored securely in your browser only</p>
        
        <div className="bg-black/50 rounded-xl p-5 mb-6 text-left border border-yellow-500/20">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">How to get your FREE API key</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">1</span>
              <p className="text-xs text-white/70">
                Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline font-medium">Google AI Studio</a> and sign in with your Google account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">2</span>
              <p className="text-xs text-white/70">Click "Create API Key" and select or create a project</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-bold">3</span>
              <p className="text-xs text-white/70">Copy your API key and paste it below</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 flex items-center gap-2">
              <span>✓</span>
              <span>The <strong>free tier</strong> includes generous limits for all AI features!</span>
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setError(''); }}
            placeholder="AIzaSy..."
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-white/30 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
          >
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button 
          onClick={handleSaveKey}
          disabled={validating || !apiKey.trim()}
          className="w-full gradient-accent py-4 rounded-xl font-bold text-black shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4"
        >
          {validating ? 'Saving...' : 'Save & Continue'}
        </button>

        <div className="text-xs text-white/30 space-y-1">
          <p>🔒 Your API key is stored locally in your browser</p>
          <p>🚫 We never send your key to our servers</p>
        </div>
      </div>
    </div>
  );
};

interface AppProps {
  onBackToLanding?: () => void;
}

const App: React.FC<AppProps> = ({ onBackToLanding }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.BRIEFING);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [generatingMoodBoard, setGeneratingMoodBoard] = useState(false);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New state for toggling production mode
  const [productionType, setProductionType] = useState<'video' | 'social' | 'food-social'>('video');

  // Edit instruction state
  const [editInstruction, setEditInstruction] = useState<string>("");

  const [brief, setBrief] = useState<AdBrief>({
    brandName: '',
    productName: '',
    targetAudience: '',
    tone: ['Premium', 'Cinematic', 'Inspiring'],
    keyFeatures: [],
    creativeDirection: '',
    voiceName: 'Kore' // Default voice
  });
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [project, setProject] = useState<AdProject | null>(null);

  const generateConceptsLogic = async () => {
    setLoading(true);
    try {
      let generatedConcepts;
      
      if (productionType === 'food-social') {
        // For Food Socials, we first need to extract the "visualStyle" Brand DNA
        // based on the assets uploaded
        const dna = await GeminiService.researchBrandDna(brief);
        setBrief(prev => ({ ...prev, visualStyle: dna.visualStyle }));
        
        // Then generate concepts using this DNA
        generatedConcepts = await GeminiService.generateFoodSocialConcepts({ ...brief, visualStyle: dna.visualStyle });
      } else {
        generatedConcepts = await GeminiService.generateConcepts(brief);
      }
      
      setConcepts(generatedConcepts);
      setStep(AppStep.CONCEPTS);
      
      // Generate Previews
      setGeneratingPreviews(true);
      generatedConcepts.forEach(async (concept) => {
        try {
          // Pass the real product image to ensure "no fluff" results
          const url = await GeminiService.generateConceptPreview(concept, brief.productImage);
          setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, thumbnailUrl: url } : c));
        } catch (e) {
          console.error("Failed to generate preview for concept", concept.id);
        }
      });
      setGeneratingPreviews(false);
    } catch (error) {
      console.error("Error generating concepts:", error);
      alert("Failed to generate concepts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateConceptsLogic();
  };

  const handleResearchBrand = async () => {
    // Basic validation
    if (productionType === 'food-social') {
        if (!brief.keyFeatures.length && !brief.productUrl) {
            alert("For Food Socials, please provide a Description (in Key Selling Points) or a Product URL.");
            return;
        }
    } else {
        if (!brief.brandName || !brief.productName) {
            alert("Please enter a Brand Name and Product Name first.");
            return;
        }
    }
    
    setResearching(true);
    try {
      let researchData;
      if (productionType === 'food-social') {
          // Use autoFillFoodBrief which works better with just URL/Desc
          const desc = brief.keyFeatures.join(', ');
          researchData = await GeminiService.autoFillFoodBrief(desc, brief.productUrl || '');
          setBrief(prev => ({
            ...prev,
            brandName: researchData.brandName || prev.brandName,
            productName: researchData.productName || prev.productName,
            targetAudience: researchData.targetAudience || prev.targetAudience,
            tone: researchData.tone || prev.tone,
            keyFeatures: researchData.keyFeatures || prev.keyFeatures,
            logoImage: researchData.logoImage || prev.logoImage,
          }));
      } else {
          researchData = await GeminiService.researchBrand(brief.brandName, brief.productName);
          setBrief(prev => ({
            ...prev,
            targetAudience: researchData.targetAudience || prev.targetAudience,
            tone: researchData.tone || prev.tone,
            keyFeatures: researchData.keyFeatures || prev.keyFeatures,
            logoImage: researchData.logoImage || prev.logoImage, // Use found logo if available
            researchSources: researchData.researchSources
          }));
      }
    } catch (error: any) {
      console.error("Research failed", error);
      alert(`Research failed: ${error.message || "Unknown error"}`);
    } finally {
      setResearching(false);
    }
  };

  const handleGenerateMoodBoard = async () => {
    setGeneratingMoodBoard(true);
    try {
      // Pass both product image and logo image to mood board generator
      const image = await GeminiService.generateMoodBoard(brief, brief.productImage, brief.logoImage);
      setBrief(prev => ({ ...prev, moodBoard: image }));
    } catch (error) {
      console.error("Mood board generation failed", error);
    } finally {
      setGeneratingMoodBoard(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrief(prev => ({ ...prev, productImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrief(prev => ({ ...prev, logoImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startAutoGeneration = async (currentProject: AdProject) => {
     for (let i = 0; i < currentProject.scenes.length; i++) {
        await generateSceneImage(i, currentProject);
     }
  };

  const handleSelectConcept = async (concept: AdConcept) => {
    setLoading(true);
    try {
      let script: Scene[] = [];
      
      if (productionType === 'video') {
         script = await GeminiService.generateScript(brief, concept);
      } else if (productionType === 'social') {
         script = await GeminiService.generateSocialCampaign(brief, concept);
      } else if (productionType === 'food-social') {
         // Food Socials creates 3 scenes, one for each CTA option
         const ctas = concept.overlayCtas || ['Check it out', 'Order Now', 'Try Today'];
         script = ctas.slice(0, 3).map((cta, idx) => ({
             sceneNumber: idx + 1,
             visualPrompt: concept.visualPrompt || "",
             audioScript: "", // Will be generated later
             selectedCta: cta
         }));
      }

      const newProject: AdProject = {
        id: Math.random().toString(36).substr(2, 9),
        brief,
        selectedConcept: concept,
        scenes: script,
        status: 'storyboarding',
        projectType: productionType
      };
      setProject(newProject);
      setStep(AppStep.STORYBOARDING);
      
      // Auto-generate captions for all food social scenes
      if (productionType === 'food-social') {
           for (let i = 0; i < script.length; i++) {
               const caption = await GeminiService.generateFoodSocialPost(brief, concept, script[i]);
               newProject.scenes[i].audioScript = caption;
           }
           setProject({...newProject}); // Update state
      }

      setTimeout(() => startAutoGeneration(newProject), 100);
      
    } catch (error) {
      console.error("Error generating script:", error);
      alert("Failed to generate script. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateSceneImage = async (idx: number, projectRef?: AdProject) => {
    const currentProject = projectRef || project;
    if (!currentProject) return;
    
    setProject(prev => {
      if(!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
      return { ...prev, scenes: newScenes };
    });

    try {
      const scene = currentProject.scenes[idx];
      let imageUrl;

      if (currentProject.projectType === 'food-social' && currentProject.selectedConcept) {
         imageUrl = await GeminiService.generateFoodHeroImage(
             currentProject.brief, 
             currentProject.selectedConcept, 
             scene.selectedCta || ""
         );
      } else {
         const previousSceneImage = idx > 0 ? currentProject.scenes[idx - 1].imageUrl : undefined;
         const aspectRatio = currentProject.projectType === 'video' ? '16:9' : '3:4';
         
         imageUrl = await GeminiService.generateStoryboardImage(
            scene.visualPrompt,
            currentProject.brief.productImage,
            previousSceneImage,
            aspectRatio
         );
      }
      
      setProject(prev => {
        if(!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], imageUrl, isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
      
    } catch (error) {
      console.error("Error generating image:", error);
      setProject(prev => {
        if(!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
    }
  };

  const handleEditImage = async (idx: number) => {
      if (!project || !project.scenes[idx].imageUrl || !editInstruction) return;
      
      setProject(prev => {
        if(!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
        return { ...prev, scenes: newScenes };
      });

      try {
          const newUrl = await GeminiService.editHeroImage(project.scenes[idx].imageUrl!, editInstruction);
          setProject(prev => {
            if(!prev) return null;
            const newScenes = [...prev.scenes];
            newScenes[idx] = { ...newScenes[idx], imageUrl: newUrl, isGeneratingImage: false };
            return { ...prev, scenes: newScenes };
          });
          setEditInstruction(""); // Clear input
      } catch (e) {
          console.error("Edit failed", e);
          setProject(prev => {
            if(!prev) return null;
            const newScenes = [...prev.scenes];
            newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false };
            return { ...prev, scenes: newScenes };
          });
      }
  };
  
  const handleCtaChange = async (idx: number, newCta: string) => {
     if (!project) return;
     // Update selected CTA
     setProject(prev => {
         if(!prev) return null;
         const s = [...prev.scenes];
         s[idx].selectedCta = newCta;
         return { ...prev, scenes: s };
     });
     
     // Regenerate Image with new CTA
     await generateSceneImage(idx);
     
     // Also regenerate caption to reflect new CTA context
     if (project.projectType === 'food-social' && project.selectedConcept) {
         setProject(prev => { if(!prev) return null; const s = [...prev.scenes]; s[idx].isPolishingScript = true; return {...prev, scenes: s} });
         try {
             const caption = await GeminiService.generateFoodSocialPost(project.brief, project.selectedConcept, { ...project.scenes[idx], selectedCta: newCta });
             setProject(prev => { if(!prev) return null; const s = [...prev.scenes]; s[idx].audioScript = caption; s[idx].isPolishingScript = false; return {...prev, scenes: s} });
         } catch(e) { console.error(e); }
     }
  };

  const generateSceneVideo = async (idx: number) => {
    if (!project) return;
    setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isGeneratingVideo = true;
        return { ...prev, scenes };
    });

    try {
      const videoUrl = await GeminiService.generateCinematicVideo(
        project.scenes[idx].visualPrompt,
        project.scenes[idx].imageUrl
      );
      setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx] = { ...scenes[idx], videoUrl, isGeneratingVideo: false };
        return { ...prev, scenes };
      });
    } catch (error) {
      if ((error as any).message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      } else if ((error as any).message?.includes("timed out")) {
        // Handle timeout gracefully
        console.error("Video generation timed out");
      } else if ((error as any).status === 429) {
        // Handle rate limiting
        console.error("Rate limit exceeded, please try again later");
      }
      console.error("Error generating video:", error);
      setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isGeneratingVideo = false;
        return { ...prev, scenes };
      });
    }
  };

  const playVoiceover = async (idx: number) => {
    if (!project) return;
    const scene = project.scenes[idx];
    setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isGeneratingVoice = true;
        return { ...prev, scenes };
    });

    try {
      const base64Audio = await GeminiService.generateVoiceover(scene.audioScript, project.brief.voiceName);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (error) {
      console.error("Error generating voiceover:", error);
    } finally {
        setProject(prev => {
            if(!prev) return null;
            const scenes = [...prev.scenes];
            scenes[idx].isGeneratingVoice = false;
            return { ...prev, scenes };
        });
    }
  };

  const handlePolishScript = async (idx: number) => {
    if (!project) return;
    const scene = project.scenes[idx];
    
    setProject(prev => {
      if(!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isPolishingScript = true;
      return { ...prev, scenes };
    });

    try {
      const polished = await GeminiService.polishSceneScript(scene.audioScript, project.brief.tone);
      setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].audioScript = polished;
        scenes[idx].isPolishingScript = false;
        return { ...prev, scenes };
      });
    } catch (e) {
      console.error("Failed to polish script", e);
      setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isPolishingScript = false;
        return { ...prev, scenes };
      });
    }
  };

  const handleCopyPrompt = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (!project) return;
    const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${project.brief.brandName} - Creative Dossier</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0a0a0a; color: #f0f0f0; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
                header { margin-bottom: 60px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 40px; }
                h1 { font-size: 3em; margin: 0; background: linear-gradient(135deg, #facc15, #ea580c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                h2 { color: #888; border-left: 4px solid #facc15; padding-left: 15px; margin-top: 60px; }
                .meta { color: #666; font-size: 0.9em; margin-top: 10px; }
                .moodboard-container { margin: 40px 0; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
                .scene-card { background: #1a1a1a; border-radius: 12px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .scene-image { width: 100%; display: block; }
                .scene-content { padding: 30px; }
                .scene-number { color: #facc15; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8em; }
                .visual-prompt { font-style: italic; color: #aaa; margin: 15px 0; border-left: 2px solid #333; padding-left: 15px; }
                .audio-script { font-size: 1.2em; font-weight: 500; color: #fff; margin-top: 20px; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <header>
                <h1>${project.brief.brandName}</h1>
                <div class="meta">
                    Campaign Concept: <strong>${project.selectedConcept?.title}</strong><br>
                    Tone: ${project.brief.tone.join(', ')} &bull; Audience: ${project.brief.targetAudience}
                </div>
            </header>
            ${project.brief.moodBoard ? `<section><h2>Visual Identity</h2><div class="moodboard-container"><img src="${project.brief.moodBoard}" alt="Mood Board" /></div></section>` : ''}
            <section>
                <h2>Cinematic Storyboard</h2>
                ${project.scenes.map(scene => `<div class="scene-card">${scene.imageUrl ? `<img src="${scene.imageUrl}" class="scene-image" alt="Scene ${scene.sceneNumber}" />` : '<div style="padding:40px; text-align:center; color:#444;">[Image Not Generated]</div>'}<div class="scene-content"><div class="scene-number">Scene ${scene.sceneNumber}</div><div class="visual-prompt">"${scene.visualPrompt}"</div><div class="audio-script">"${scene.audioScript}"</div></div></div>`).join('')}
            </section>
            <footer style="text-align:center; color:#444; margin-top:100px; font-size:0.8em;">Generated by Banana Ads AI Agent</footer>
        </body>
        </html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.brief.brandName.replace(/\s+/g, '_')}_Campaign_Dossier.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReconfigureKey = async () => {
    GeminiService.clearApiKey();
    setIsConfigured(false);
  };

  if (!isConfigured) {
      return <ApiKeyConfig onConfigured={() => setIsConfigured(true)} />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-yellow-500/10 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBackToLanding && (
            <button onClick={onBackToLanding} className="text-white/40 hover:text-white transition">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🍌</span>
            <span className="font-bold text-xl tracking-tight"><span className="text-banana">BANANA</span><span className="text-white">ADS</span></span>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium text-white/60">
          <button onClick={handleReconfigureKey} className="hover:text-banana transition flex items-center gap-2">
            <i className="fa-solid fa-key"></i> <span className="hidden sm:inline">API Key</span>
          </button>
          <a href="#" className="hover:text-banana transition">Projects</a>
          <button 
            onClick={handleExport}
            disabled={!project}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export Ad
          </button>
        </div>
      </nav>

      <main className="pt-32 px-8 max-w-7xl mx-auto">
        <StepIndicator currentStep={step} />

        {/* Step 1: Briefing */}
        {step === AppStep.BRIEFING && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h1 className="text-5xl font-serif mb-4 gradient-text">Tell us about your brand.</h1>
              <p className="text-white/50 text-lg mb-6">
                Our AI {productionType === 'video' ? 'cinematography' : 'creative'} agent will analyze your brief to craft a 
                {productionType === 'video' ? ' cinematic experience' : ' high-impact campaign'}.
              </p>
              
              {/* Mode Selection Tab */}
              <div className="flex bg-white/5 rounded-full p-1.5 border border-yellow-500/30 w-fit mb-8">
                  <button 
                     onClick={() => setProductionType('video')}
                     className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                        productionType === 'video' 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                     }`}
                  >
                     <i className="fa-solid fa-film"></i> Cinematic Video
                  </button>
                  <button 
                     onClick={() => setProductionType('social')}
                     className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                        productionType === 'social' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                     }`}
                  >
                     <i className="fa-brands fa-instagram"></i> Social Posters
                  </button>
                  <button 
                     onClick={() => setProductionType('food-social')}
                     className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                        productionType === 'food-social' 
                        ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                     }`}
                  >
                     <i className="fa-solid fa-burger"></i> Food Socials
                  </button>
               </div>
              
              <form onSubmit={handleStartBriefing} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Name</label>
                    <input 
                      required={productionType !== 'food-social'} // Less strict for food socials auto-fill
                      value={brief.brandName}
                      onChange={(e) => setBrief({...brief, brandName: e.target.value})}
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g. Lumina Watches"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product</label>
                    <input 
                      required={productionType !== 'food-social'}
                      value={brief.productName}
                      onChange={(e) => setBrief({...brief, productName: e.target.value})}
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g. Stellar Series"
                    />
                  </div>
                </div>

                {/* Research Button */}
                <div className="flex justify-end -mt-2">
                  <button 
                    type="button"
                    onClick={handleResearchBrand}
                    disabled={researching}
                    className={`text-xs flex items-center gap-2 font-bold px-4 py-2 rounded-full border transition ${
                      ((brief.brandName && brief.productName) || (productionType === 'food-social' && (brief.productUrl || brief.keyFeatures.length)))
                        ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' 
                        : 'text-white/20 bg-white/5 border-white/10 hover:text-white/40'
                    }`}
                  >
                    {researching ? (
                      <BananaPro role="research" size="sm" />
                    ) : (
                      <><i className="fa-brands fa-google"></i> {productionType === 'food-social' ? "Infer Brand DNA from URL" : "Auto-fill Brief with AI Research"}</>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product URL <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional info source)</span></label>
                  <input 
                    value={brief.productUrl || ''}
                    onChange={(e) => setBrief({...brief, productUrl: e.target.value})}
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="https://yourbrand.com/product"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Target Audience</label>
                  <input 
                    required={productionType !== 'food-social'}
                    value={brief.targetAudience}
                    onChange={(e) => setBrief({...brief, targetAudience: e.target.value})}
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="e.g. Modern minimalist professionals aged 25-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Tone</label>
                    <input 
                        value={brief.tone.join(', ')}
                        onChange={(e) => setBrief({...brief, tone: e.target.value.split(',').map(t => t.trim())})}
                        className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                        placeholder="Premium, Cinematic..."
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Narrator Voice</label>
                    <div className="relative">
                      <select 
                        value={brief.voiceName}
                        onChange={(e) => setBrief({...brief, voiceName: e.target.value})}
                        className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition appearance-none cursor-pointer"
                      >
                        <option value="Kore">Kore - Balanced Female</option>
                        <option value="Zephyr">Zephyr - Soft & Calm</option>
                        <option value="Fenrir">Fenrir - Deep & Authoritative</option>
                        <option value="Puck">Puck - Energetic Male</option>
                        <option value="Charon">Charon - Deep Male</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                {productionType !== 'food-social' && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Creative Direction <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional Niche Pivot)</span></label>
                    <input 
                      value={brief.creativeDirection || ''}
                      onChange={(e) => setBrief({...brief, creativeDirection: e.target.value})}
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g. Pivot to high-end audiophiles, strictly professional use"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Key Selling Points / Description</label>
                  <textarea 
                    required={productionType !== 'food-social'}
                    value={brief.keyFeatures.join('\n')}
                    onChange={(e) => setBrief({...brief, keyFeatures: e.target.value.split('\n').filter(t => t.trim())})}
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-yellow-500 transition resize-none"
                    placeholder={productionType === 'food-social' ? "Describe the food, ingredients, and vibe (or paste URL above to auto-fill)..." : "What makes this product special? (Enter each point on a new line)"}
                  />
                  {brief.researchSources && brief.researchSources.length > 0 && (
                     <div className="text-[10px] text-white/30 mt-1">
                        <span className="font-bold">Sources:</span> {brief.researchSources.map((s,i) => (
                           <a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-yellow-400 mr-2 truncate max-w-[200px] inline-block align-bottom">{new URL(s).hostname}</a>
                        ))}
                     </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs uppercase tracking-widest text-white/40 font-bold flex justify-between">
                         <span>Product Reference</span>
                         <span className="text-yellow-400 font-normal normal-case">Required</span>
                       </label>
                       
                       <div className="border border-dashed border-yellow-500/30 rounded-xl p-4 hover:bg-white/5 transition relative group flex items-center justify-center h-24">
                          {brief.productImage ? (
                             <div className="relative h-full w-full flex items-center justify-center">
                               <img src={brief.productImage} className="h-full object-contain rounded-lg" alt="Product Reference" />
                               <button 
                                 type="button"
                                 onClick={() => setBrief({...brief, productImage: undefined})}
                                 className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                               >
                                 <i className="fa-solid fa-times"></i>
                               </button>
                             </div>
                          ) : (
                             <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                <span className="font-medium text-white/60 text-sm group-hover:text-white transition"><i className="fa-solid fa-upload mr-2"></i> Product</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleImageUpload} 
                                  className="hidden"
                                />
                             </label>
                          )}
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-xs uppercase tracking-widest text-white/40 font-bold flex justify-between">
                         <span>Brand Logo</span>
                         <span className="text-white/20 font-normal normal-case">Optional Override</span>
                       </label>
                       
                       <div className="border border-dashed border-yellow-500/30 rounded-xl p-4 hover:bg-white/5 transition relative group flex items-center justify-center h-24">
                          {brief.logoImage ? (
                             <div className="relative h-full w-full flex items-center justify-center">
                               <img src={brief.logoImage} className="h-full object-contain rounded-lg" alt="Brand Logo" />
                               <button 
                                 type="button"
                                 onClick={() => setBrief({...brief, logoImage: undefined})}
                                 className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                               >
                                 <i className="fa-solid fa-times"></i>
                               </button>
                             </div>
                          ) : (
                             <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                <span className="font-medium text-white/60 text-sm group-hover:text-white transition"><i className="fa-solid fa-upload mr-2"></i> Logo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleLogoUpload} 
                                  className="hidden"
                                />
                             </label>
                          )}
                       </div>
                    </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full gradient-accent text-black font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <BananaPro role="director" size="sm" /> : <i className="fa-solid fa-sparkles"></i>}
                  <span>{loading ? "Analyzing Brand DNA..." : "Generate Creative Concepts"}</span>
                </button>
              </form>
            </div>

            {/* Right Side: Mood Board */}
            <div className="lg:pl-8 lg:border-l border-white/5 flex flex-col">
               <h2 className="text-2xl font-serif mb-6 text-white/80">Visual Identity</h2>
               {brief.brandName ? (
                 <div className="flex-grow flex flex-col">
                    <div className="bg-white/5 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest">Mood Board</h3>
                           {!brief.moodBoard && (
                             <button 
                              onClick={handleGenerateMoodBoard}
                              disabled={generatingMoodBoard || brief.tone.length === 0}
                              className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                             >
                               {generatingMoodBoard ? <BananaPro role="artist" size="sm" /> : "Generate"}
                             </button>
                           )}
                        </div>
                        {brief.moodBoard ? (
                          <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-yellow-500/30">
                              <img src={brief.moodBoard} className="w-full h-auto object-cover" alt="Brand Mood Board" />
                              <button
                                onClick={() => handleDownload(brief.moodBoard!, 'NanoAds-MoodBoard.png')}
                                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition opacity-0 group-hover:opacity-100 border border-white/10"
                                title="Download Mood Board"
                              >
                                <i className="fa-solid fa-download"></i>
                              </button>
                          </div>
                        ) : (
                          <div className="h-64 border-2 border-dashed border-yellow-500/30 rounded-xl flex items-center justify-center text-white/20">
                             <div className="text-center">
                               <i className="fa-solid fa-palette text-3xl mb-2"></i>
                               <p className="text-sm">Upload a product image & generate<br/>to see the cohesive mood board collage.</p>
                             </div>
                          </div>
                        )}
                    </div>
                    <div className="flex-grow glass rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full"></div>
                       <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest mb-4 relative z-10">Brand DNA</h3>
                       <div className="space-y-4 relative z-10">
                          <div>
                            <span className="text-white/40 text-xs block mb-1">Tone</span>
                            <div className="flex flex-wrap gap-2">
                               {brief.tone.length > 0 ? brief.tone.map((t, i) => (
                                 <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">{t.trim()}</span>
                               )) : <span className="text-white/20 text-sm italic">Define tone...</span>}
                            </div>
                          </div>
                          <div>
                            <span className="text-white/40 text-xs block mb-1">Audience</span>
                            <p className="text-sm text-white/80">{brief.targetAudience || <span className="text-white/20 italic">Define audience...</span>}</p>
                          </div>
                          {brief.visualStyle && (
                              <div>
                                <span className="text-white/40 text-xs block mb-1">Inferred Visual Style</span>
                                <p className="text-sm text-white/80 border-l-2 border-yellow-500 pl-2">{brief.visualStyle}</p>
                              </div>
                          )}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex-grow flex items-center justify-center opacity-30">
                    <div className="text-center">
                       <i className="fa-solid fa-layer-group text-4xl mb-4"></i>
                       <p>Start your brief to see<br/>visual identity suggestions</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Step 2: Concepts */}
        {step === AppStep.CONCEPTS && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-12">
               <div>
                  <h1 className="text-5xl font-serif mb-4 gradient-text text-center lg:text-left">Select your vision.</h1>
                  <p className="text-white/50 text-lg text-center lg:text-left">Three unique creative directions based on your brief.</p>
               </div>
               
               <button 
                  onClick={generateConceptsLogic}
                  disabled={loading}
                  className="px-6 py-3 rounded-full border border-yellow-500/30 hover:bg-white/10 transition flex items-center gap-2 text-sm font-bold"
               >
                  <i className="fa-solid fa-rotate"></i> Regenerate Concepts
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {concepts.map((concept) => (
                 <div 
                   key={concept.id}
                   className="glass p-8 rounded-3xl group hover:border-yellow-500/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
                   onClick={() => handleSelectConcept(concept)}
                 >
                   <div className="h-48 w-full bg-white/5 rounded-2xl mb-6 overflow-hidden relative">
                      {concept.thumbnailUrl ? (
                        <img src={concept.thumbnailUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={concept.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           {generatingPreviews ? (
                              <BananaPro role="artist" size="sm" text="Sketching..." />
                           ) : (
                              <i className="fa-solid fa-lightbulb text-white/10 text-4xl group-hover:text-white/20 transition"></i>
                           )}
                        </div>
                      )}
                   </div>
                   <h3 className="text-2xl font-bold mb-3">{concept.title}</h3>
                   <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">{concept.hook}</div>
                   <p className="text-white/50 leading-relaxed flex-grow">{concept.summary}</p>
                   {concept.overlayCtas && (
                       <div className="mt-4 pt-4 border-t border-white/5">
                           <span className="text-[10px] uppercase text-white/30 block mb-1">Proposed Headlines</span>
                           <div className="flex flex-wrap gap-1">
                               {concept.overlayCtas.slice(0, 2).map((cta, i) => (
                                   <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded">{cta}</span>
                               ))}
                           </div>
                       </div>
                   )}
                   <button className="mt-8 border border-yellow-500/30 group-hover:bg-white group-hover:text-black font-bold py-3 rounded-xl transition-all">
                     Choose Direction
                   </button>
                 </div>
               ))}
             </div>
             {loading && (
               <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
                 <BananaPro role="director" size="lg" />
                 <p className="text-xl font-bold mt-4">Directing the scene...</p>
                 <p className="text-white/50">Generating cinematic storyboard & scripts</p>
               </div>
             )}
          </div>
        )}

        {/* Step 3: Production */}
        {step === AppStep.STORYBOARDING && project && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-serif gradient-text">{project.selectedConcept?.title}</h1>
                    <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Selected</span>
                </div>
                {project.projectType === 'food-social' && project.scenes[0].selectedCta && (
                    <p className="text-white/50">Using headline: <span className="text-white font-bold">"{project.scenes[0].selectedCta}"</span></p>
                )}
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setStep(AppStep.CONCEPTS)}
                  className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
                >
                  Change Concept
                </button>
              </div>
            </div>

            {project.projectType === 'food-social' ? (
                // --- SPECIALIZED FOOD SOCIAL LAYOUT ---
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: HERO IMAGE & EDITING */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                            <i className="fa-regular fa-image text-lg"></i> Facebook Hero
                        </div>

                        {/* Image Container */}
                        <div className="relative group rounded-xl overflow-hidden border border-yellow-500/20 bg-black">
                             {project.scenes[0].imageUrl ? (
                                <img src={project.scenes[0].imageUrl} className="w-full h-auto object-cover" alt="Hero Ad" />
                             ) : (
                                <div className="aspect-video w-full flex flex-col items-center justify-center text-white/30">
                                   {project.scenes[0].isGeneratingImage ? <BananaPro role="artist" text="Rendering..." /> : <i className="fa-solid fa-image text-4xl"></i>}
                                </div>
                             )}
                             {/* Floating Generate/Regenerate Button */}
                             {!project.scenes[0].isGeneratingImage && (
                                 <button 
                                    onClick={() => generateSceneImage(0)}
                                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 transition"
                                 >
                                    <i className="fa-solid fa-rotate-right mr-1"></i> Regenerate
                                 </button>
                             )}
                        </div>

                        {/* Edit Bar */}
                        <div className="flex gap-0">
                            <div className="relative flex-grow">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
                                <input 
                                    type="text"
                                    value={editInstruction}
                                    onChange={(e) => setEditInstruction(e.target.value)}
                                    placeholder="Eg. Add more smoke, change background to blue..."
                                    className="w-full bg-white/5 border border-yellow-500/30 rounded-l-xl pl-9 pr-4 py-3 text-sm focus:border-yellow-500 outline-none transition"
                                />
                            </div>
                            <button 
                                onClick={() => handleEditImage(0)}
                                disabled={!editInstruction || !project.scenes[0].imageUrl || project.scenes[0].isGeneratingImage}
                                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-y border-r border-yellow-500/30 px-6 py-3 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Edit
                            </button>
                        </div>
                        
                        {/* Prompt Box */}
                        <div className="bg-white/5 rounded-xl p-0 border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest"><i className="fa-solid fa-terminal mr-1"></i> Image Prompt</span>
                                <button 
                                    onClick={() => handleCopyPrompt(project.scenes[0].visualPrompt, 'main-prompt')}
                                    className="text-[10px] text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-1 transition"
                                >
                                    {copiedId === 'main-prompt' ? <><i className="fa-solid fa-check"></i> Copied</> : <><i className="fa-regular fa-copy"></i> Copy Prompt</>}
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                                    {project.scenes[0].visualPrompt}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FACEBOOK POST MOCK */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                            <i className="fa-brands fa-facebook text-lg"></i> Facebook Post Preview
                        </div>

                        {/* Facebook Post Mock */}
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
                            {/* Post Header */}
                            <div className="flex items-start justify-between px-4 pt-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black flex items-center justify-center font-bold text-sm">
                                        {brief.brandName ? brief.brandName.charAt(0).toUpperCase() : 'B'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate text-sm font-semibold text-white">{brief.brandName || 'Brand Name'}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                                                <i className="fa-solid fa-circle-check text-[8px]"></i> Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                                            <span>Just now</span>
                                            <span>·</span>
                                            <span className="text-white/40">Sponsored</span>
                                            <span>·</span>
                                            <i className="fa-solid fa-earth-americas text-[11px]"></i>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-9 h-9 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition flex items-center justify-center">
                                    <i className="fa-solid fa-ellipsis"></i>
                                </button>
                            </div>

                            {/* Post Body / Caption */}
                            <div className="px-4 py-3">
                                {project.scenes[0].isPolishingScript ? (
                                    <div className="flex items-center justify-center py-8 opacity-60">
                                        <BananaPro role="writer" text="Writing copy..." />
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/90 max-h-[200px] overflow-auto pr-1">
                                        {project.scenes[0].audioScript || "Generating caption..."}
                                    </div>
                                )}
                            </div>

                            {/* Post Media */}
                            {project.scenes[0].imageUrl && (
                                <div className="border-y border-white/10 bg-black">
                                    <img src={project.scenes[0].imageUrl} className="w-full object-cover max-h-[300px]" alt="Post media" />
                                </div>
                            )}

                            {/* Reactions Summary */}
                            <div className="px-4 py-2 text-xs text-white/50 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1">
                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] border border-black/50">
                                            <i className="fa-solid fa-thumbs-up"></i>
                                        </span>
                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] border border-black/50">
                                            <i className="fa-solid fa-heart"></i>
                                        </span>
                                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-black flex items-center justify-center text-[10px] border border-black/50">
                                            <i className="fa-solid fa-face-laugh-squint"></i>
                                        </span>
                                    </div>
                                    <span>1.2K</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span>84 comments</span>
                                    <span>12 shares</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3">
                                <button className="py-3 flex items-center justify-center gap-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                                    <i className="fa-regular fa-thumbs-up"></i>
                                    <span>Like</span>
                                </button>
                                <button className="py-3 flex items-center justify-center gap-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                                    <i className="fa-regular fa-comment"></i>
                                    <span>Comment</span>
                                </button>
                                <button className="py-3 flex items-center justify-center gap-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                                    <i className="fa-solid fa-share"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>

                         <div className="flex justify-end pt-4">
                            <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/60 hover:text-white">
                                <i className="fa-solid fa-gear"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // --- STANDARD SCENE LIST LAYOUT (Video & Regular Social) ---
                <div className="space-y-12">
                {project.scenes.map((scene, idx) => (
                    <div key={idx} className={`glass rounded-[40px] overflow-hidden flex flex-col md:flex-row min-h-[400px]`}>
                    
                    {/* Visual Preview Area */}
                    <div className={`${project.projectType === 'social' ? 'md:w-5/12' : 'md:w-3/5'} bg-black relative group flex items-center justify-center bg-zinc-900/50`}>
                        <div className={`relative ${project.projectType === 'social' ? 'aspect-[3/4] h-[500px]' : 'aspect-video w-full'}`}>
                            {scene.videoUrl ? (
                            <video 
                                src={scene.videoUrl} 
                                controls 
                                className="w-full h-full object-cover"
                            />
                            ) : scene.imageUrl ? (
                            <img 
                                src={scene.imageUrl} 
                                className="w-full h-full object-cover" 
                                alt={`Scene ${scene.sceneNumber}`}
                            />
                            ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-12 text-center bg-black">
                                {scene.isGeneratingImage ? (
                                    <>
                                    <BananaPro role="artist" size="md" />
                                    <p className="text-sm font-bold tracking-widest uppercase">Auto-Rendering...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                        <i className={`fa-solid ${project.projectType === 'social' ? 'fa-image' : 'fa-camera-movie'} text-white/20 text-3xl`}></i>
                                        </div>
                                        <div>
                                        <p className="font-bold text-lg text-white/40">Visualization Required</p>
                                        <p className="text-sm text-white/20">Scene {scene.sceneNumber} visualization not generated</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            )}
                            
                            {(scene.imageUrl || scene.videoUrl) && (
                                <button
                                onClick={() => handleDownload(scene.videoUrl || scene.imageUrl!, `NanoAds-Scene-${scene.sceneNumber}${scene.videoUrl ? '.mp4' : '.png'}`)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition z-20 opacity-0 group-hover:opacity-100 border border-white/10"
                                title="Download Asset"
                                >
                                <i className="fa-solid fa-download"></i>
                                </button>
                            )}
                        </div>
                        
                        <div className="absolute bottom-6 left-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                            onClick={() => generateSceneImage(idx)}
                            disabled={scene.isGeneratingImage}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                        >
                            {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                            <span>{scene.imageUrl ? "Regenerate Image" : "Generate Image"}</span>
                        </button>
                        
                        {/* Video Button only for Video Projects */}
                        {project.projectType === 'video' && (
                            <button 
                                onClick={() => generateSceneVideo(idx)}
                                disabled={scene.isGeneratingVideo || !scene.imageUrl}
                                className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {scene.isGeneratingVideo ? <BananaPro role="cameraman" size="sm" /> : <i className="fa-solid fa-play"></i>}
                                <span>Animate Cinematic Video</span>
                            </button>
                        )}
                        </div>
                        {(scene.isGeneratingVideo) && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <BananaPro role="cameraman" size="md" />
                            <p className="text-sm font-bold tracking-widest uppercase mt-4">Rendering Cinematic Motion...</p>
                        </div>
                        )}
                    </div>
                    
                    {/* Content / Script Area */}
                    <div className={`${project.projectType === 'social' ? 'md:w-7/12' : 'md:w-2/5'} p-10 flex flex-col border-l border-white/5`}>
                        <div className="flex items-center justify-between mb-8">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                            {project.projectType === 'social' ? `Post #${scene.sceneNumber}` : `Scene ${scene.sceneNumber}`}
                        </span>
                        
                        {/* Only show Veo tag / Voice button for Video projects */}
                        {project.projectType === 'video' ? (
                            <>
                                <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded">Veo Optimized (8s)</span>
                                <button 
                                    onClick={() => playVoiceover(idx)}
                                    disabled={scene.isGeneratingVoice}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-400 transition"
                                >
                                    {scene.isGeneratingVoice ? <BananaPro role="voice" size="sm" /> : <i className="fa-solid fa-volume-high"></i>}
                                </button>
                            </>
                        ) : (
                            <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">Instagram / FB Format</span>
                        )}
                        </div>
                        
                        <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                                {project.projectType === 'social' ? 'Graphic Design Prompt' : 'Cinematography Prompt'}
                            </label>
                            <button 
                                onClick={() => handleCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                                className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                            >
                                {copiedId === `${idx}-vis` ? (
                                    <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                                ) : (
                                    <><i className="fa-regular fa-copy"></i> Copy</>
                                )}
                            </button>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed italic border-l-2 border-yellow-500/30 pl-4">"{scene.visualPrompt}"</p>
                        </div>

                        {/* Nano Banana Image Prompt Section */}
                        <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Nano Banana Prompt <span className="text-[9px] font-normal normal-case text-white/20">(Image Gen)</span></label>
                            <button 
                                onClick={() => handleCopyPrompt(
                                `Generate a high-end cinematic advertising shot. Description: ${scene.visualPrompt}. 8k, professional lighting, photorealistic.`, 
                                `${idx}-nano`
                                )}
                                className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                            >
                                {copiedId === `${idx}-nano` ? (
                                    <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                                ) : (
                                    <><i className="fa-regular fa-copy"></i> Copy</>
                                )}
                            </button>
                        </div>
                        <div className="bg-black/40 rounded p-3 border border-yellow-500/20 relative group">
                            <p className="text-white/60 text-xs font-mono break-words leading-tight">
                            <span className="text-yellow-500/50">generate_img(</span>
                            "Generate a high-end cinematic advertising shot. Description: <span className="text-white">{scene.visualPrompt}</span>. 8k, professional lighting, photorealistic."
                            <span className="text-yellow-500/50">)</span>
                            </p>
                        </div>
                        </div>

                        <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                                {project.projectType === 'social' ? 'Post Caption' : 'Audio Script'}
                            </label>
                            <button 
                                onClick={() => handlePolishScript(idx)}
                                disabled={scene.isPolishingScript}
                                className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                            >
                                {scene.isPolishingScript ? <BananaPro role="writer" size="sm" /> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                <span>Polish Copy</span>
                            </button>
                        </div>
                        <p className="text-xl font-medium leading-snug whitespace-pre-wrap">{scene.audioScript}</p>
                        </div>
                        <div className="mt-auto pt-10 flex items-center space-x-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px]"><i className="fa-solid fa-robot"></i></div>
                            <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[10px] text-black"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                        </div>
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">AI Assisted Production</span>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 py-12 text-center text-white/20 text-sm">
        <p>© 2025 Banana Ads AI Cinematography Agent. Built with Gemini 3.</p>
      </footer>
    </div>
  );
};

export default App;
