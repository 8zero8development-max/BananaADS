
import React, { useState, useCallback, useEffect } from 'react';
import { AdBrief, AdConcept, Scene, AppStep, AdProject } from './types';
import { GeminiService } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './utils/audioUtils';

// Helper Components
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
  const [isAiStudio, setIsAiStudio] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      // 1. Check for Environment Variable (Standard Deployment)
      if (process.env.API_KEY) {
        onConfigured();
        return;
      }

      // 2. Check for AI Studio Context (Playground)
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        setIsAiStudio(true);
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (hasKey) {
          onConfigured();
          return;
        }
      }
      
      setChecking(false);
    };
    check();
  }, [onConfigured]);

  const handleSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      // Assume success and proceed per specific platform instructions
      onConfigured();
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-banana text-2xl"></i></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-md w-full glass p-10 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10">
          <span className="text-3xl">🍌</span>
        </div>
        
        <h2 className="text-3xl font-serif mb-4">Configuration Required</h2>
        
        {isAiStudio ? (
          <>
            <p className="text-white/60 mb-8 leading-relaxed">
              To use the Veo video generation models, you must select a paid API key from your Google Cloud project.
            </p>
            <button 
              onClick={handleSelectKey} 
              className="w-full gradient-accent py-4 rounded-xl font-bold text-black shadow-lg hover:scale-[1.02] transition mb-6"
            >
              Select API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-white/40 hover:text-white underline">
              Billing Information
            </a>
          </>
        ) : (
          <>
            <p className="text-white/60 mb-6 leading-relaxed">
               All features (Scripting, Storyboards, Voice) work on the <strong>Free Tier</strong>. <br/>
               Only Video Generation requires a paid key.
            </p>
            <div className="bg-black/50 rounded-xl p-5 mb-8 text-left border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Deployment Instructions</p>
              <div className="space-y-3">
                 <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                    <p className="text-xs text-white/60">Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-yellow-400 hover:underline">Google AI Studio</a></p>
                 </div>
                 <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                    <div className="min-w-0">
                      <p className="text-xs text-white/60 mb-1">Set environment variable:</p>
                      <code className="block bg-white/5 p-2 rounded text-green-400 text-[10px] font-mono break-all border border-white/5">
                        API_KEY="AIzaSy..."
                      </code>
                    </div>
                 </div>
              </div>
            </div>
            
            <button onClick={() => window.location.reload()} className="text-sm text-white/40 hover:text-white flex items-center justify-center gap-2 mx-auto transition">
              <i className="fa-solid fa-rotate-right"></i> Reload Application
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.BRIEFING);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [generatingMoodBoard, setGeneratingMoodBoard] = useState(false);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  
  const [brief, setBrief] = useState<AdBrief>({
    brandName: '',
    productName: '',
    targetAudience: '',
    tone: 'Premium, Cinematic, Inspiring',
    keyFeatures: '',
    creativeDirection: '',
    voiceName: 'Kore' // Default voice
  });
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [project, setProject] = useState<AdProject | null>(null);

  const generateConceptsLogic = async () => {
    setLoading(true);
    try {
      const generatedConcepts = await GeminiService.generateConcepts(brief);
      setConcepts(generatedConcepts);
      setStep(AppStep.CONCEPTS);
      
      setGeneratingPreviews(true);
      generatedConcepts.forEach(async (concept) => {
        try {
          const url = await GeminiService.generateConceptPreview(concept);
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
    if (!brief.brandName || !brief.productName) {
      alert("Please enter a Brand Name and Product Name first.");
      return;
    }
    setResearching(true);
    try {
      const researchData = await GeminiService.researchBrand(brief.brandName, brief.productName);
      setBrief(prev => ({
        ...prev,
        targetAudience: researchData.targetAudience || prev.targetAudience,
        tone: researchData.tone || prev.tone,
        keyFeatures: researchData.keyFeatures || prev.keyFeatures,
        researchSources: researchData.researchSources
      }));
    } catch (error) {
      console.error("Research failed", error);
    } finally {
      setResearching(false);
    }
  };

  const handleGenerateMoodBoard = async () => {
    setGeneratingMoodBoard(true);
    try {
      const image = await GeminiService.generateMoodBoard(brief, brief.productImage);
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

  const startAutoGeneration = async (currentProject: AdProject) => {
     for (let i = 0; i < currentProject.scenes.length; i++) {
        await generateSceneImage(i, currentProject);
     }
  };

  const handleSelectConcept = async (concept: AdConcept) => {
    setLoading(true);
    try {
      const script = await GeminiService.generateScript(brief, concept);
      const newProject: AdProject = {
        id: Math.random().toString(36).substr(2, 9),
        brief,
        selectedConcept: concept,
        scenes: script,
        status: 'storyboarding'
      };
      setProject(newProject);
      setStep(AppStep.STORYBOARDING);
      
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
      const previousSceneImage = idx > 0 ? currentProject.scenes[idx - 1].imageUrl : undefined;
      const imageUrl = await GeminiService.generateStoryboardImage(
        currentProject.scenes[idx].visualPrompt,
        currentProject.brief.productImage,
        previousSceneImage
      );
      
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

  const handleCopyPrompt = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptIndex(idx);
      setTimeout(() => setCopiedPromptIndex(null), 2000);
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
                    Tone: ${project.brief.tone} &bull; Audience: ${project.brief.targetAudience}
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
    // If we are in AI Studio, open the key selector again
    if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
    } else {
        // If local, show the config screen again
        setIsConfigured(false);
    }
  };

  if (!isConfigured) {
      return <ApiKeyConfig onConfigured={() => setIsConfigured(true)} />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center text-black">
            <i className="fa-solid fa-play text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">BANANA<span className="text-white/50">ADS</span></span>
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
              <p className="text-white/50 text-lg mb-8">Our AI cinematography agent will analyze your brief to craft a cinematic experience.</p>
              
              <form onSubmit={handleStartBriefing} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Name</label>
                    <input 
                      required
                      value={brief.brandName}
                      onChange={(e) => setBrief({...brief, brandName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g. Lumina Watches"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product</label>
                    <input 
                      required
                      value={brief.productName}
                      onChange={(e) => setBrief({...brief, productName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
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
                      (brief.brandName && brief.productName) 
                        ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' 
                        : 'text-white/20 bg-white/5 border-white/10 hover:text-white/40'
                    }`}
                  >
                    {researching ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Researching Brand DNA...</>
                    ) : (
                      <><i className="fa-brands fa-google"></i> Auto-fill Brief with AI Research</>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product URL <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional info source)</span></label>
                  <input 
                    value={brief.productUrl || ''}
                    onChange={(e) => setBrief({...brief, productUrl: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="https://yourbrand.com/product"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Target Audience</label>
                  <input 
                    required
                    value={brief.targetAudience}
                    onChange={(e) => setBrief({...brief, targetAudience: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="e.g. Modern minimalist professionals aged 25-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Tone</label>
                    <input 
                        value={brief.tone}
                        onChange={(e) => setBrief({...brief, tone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                        placeholder="Premium, Cinematic..."
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Narrator Voice</label>
                    <div className="relative">
                      <select 
                        value={brief.voiceName}
                        onChange={(e) => setBrief({...brief, voiceName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition appearance-none cursor-pointer"
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

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Creative Direction <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional Niche Pivot)</span></label>
                  <input 
                    value={brief.creativeDirection || ''}
                    onChange={(e) => setBrief({...brief, creativeDirection: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="e.g. Pivot to high-end audiophiles, strictly professional use"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Key Selling Points</label>
                  <textarea 
                    required
                    value={brief.keyFeatures}
                    onChange={(e) => setBrief({...brief, keyFeatures: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-yellow-500 transition resize-none"
                    placeholder="What makes this product special?"
                  />
                  {brief.researchSources && brief.researchSources.length > 0 && (
                     <div className="text-[10px] text-white/30 mt-1">
                        <span className="font-bold">Sources:</span> {brief.researchSources.map((s,i) => (
                           <a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-yellow-400 mr-2 truncate max-w-[200px] inline-block align-bottom">{new URL(s).hostname}</a>
                        ))}
                     </div>
                  )}
                </div>

                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-widest text-white/40 font-bold flex justify-between">
                     <span>Product Reference Anchor</span>
                     <span className="text-yellow-400 font-normal normal-case">Required for Accurate Mood Board</span>
                   </label>
                   
                   <div className="border border-dashed border-white/20 rounded-xl p-4 hover:bg-white/5 transition relative group flex items-center justify-center h-24">
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
                            <span className="font-medium text-white/60 text-sm group-hover:text-white transition"><i className="fa-solid fa-upload mr-2"></i> Upload Image</span>
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

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full gradient-accent text-black font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
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
                              disabled={generatingMoodBoard || !brief.tone}
                              className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                             >
                               {generatingMoodBoard ? <i className="fa-solid fa-spinner fa-spin"></i> : "Generate"}
                             </button>
                           )}
                        </div>
                        {brief.moodBoard ? (
                          <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-white/10">
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
                          <div className="h-64 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20">
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
                               {brief.tone ? brief.tone.split(',').map((t, i) => (
                                 <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">{t.trim()}</span>
                               )) : <span className="text-white/20 text-sm italic">Define tone...</span>}
                            </div>
                          </div>
                          <div>
                            <span className="text-white/40 text-xs block mb-1">Audience</span>
                            <p className="text-sm text-white/80">{brief.targetAudience || <span className="text-white/20 italic">Define audience...</span>}</p>
                          </div>
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
                  <p className="text-white/50 text-lg text-center lg:text-left">Three unique cinematic directions based on your brief.</p>
               </div>
               <button 
                  onClick={generateConceptsLogic}
                  disabled={loading}
                  className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 transition flex items-center gap-2 text-sm font-bold"
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
                              <div className="flex flex-col items-center gap-2">
                                <i className="fa-solid fa-circle-notch fa-spin text-white/20"></i>
                                <span className="text-[10px] text-white/20 uppercase tracking-widest">Visualizing...</span>
                              </div>
                           ) : (
                              <i className="fa-solid fa-lightbulb text-white/10 text-4xl group-hover:text-white/20 transition"></i>
                           )}
                        </div>
                      )}
                   </div>
                   <h3 className="text-2xl font-bold mb-3">{concept.title}</h3>
                   <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">{concept.hook}</div>
                   <p className="text-white/50 leading-relaxed flex-grow">{concept.summary}</p>
                   <button className="mt-8 border border-white/10 group-hover:bg-white group-hover:text-black font-bold py-3 rounded-xl transition-all">
                     Choose Direction
                   </button>
                 </div>
               ))}
             </div>
             {loading && (
               <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
                 <div className="w-16 h-16 border-4 border-white/10 border-t-yellow-500 rounded-full animate-spin mb-6"></div>
                 <p className="text-xl font-bold">Directing the scene...</p>
                 <p className="text-white/50">Generating cinematic storyboard & scripts</p>
               </div>
             )}
          </div>
        )}

        {/* Step 3: Production */}
        {step === AppStep.STORYBOARDING && project && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-serif mb-2 gradient-text">{project.selectedConcept?.title}</h1>
                <p className="text-white/50">Production Studio: Scene-by-scene cinematography</p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setStep(AppStep.CONCEPTS)}
                  className="px-6 py-2 rounded-full border border-white/10 text-sm font-medium hover:bg-white/5 transition"
                >
                  Change Concept
                </button>
              </div>
            </div>
            <div className="space-y-12">
              {project.scenes.map((scene, idx) => (
                <div key={idx} className="glass rounded-[40px] overflow-hidden flex flex-col md:flex-row min-h-[400px]">
                  <div className="md:w-3/5 bg-black relative group">
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
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-12 text-center">
                         {scene.isGeneratingImage ? (
                             <>
                               <div className="w-12 h-12 border-4 border-white/10 border-t-yellow-500 rounded-full animate-spin"></div>
                               <p className="text-sm font-bold tracking-widest uppercase">Auto-Rendering Scene...</p>
                             </>
                         ) : (
                             <>
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                  <i className="fa-solid fa-camera-movie text-white/20 text-3xl"></i>
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
                    <div className="absolute bottom-6 left-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={() => generateSceneImage(idx)}
                        disabled={scene.isGeneratingImage}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                      >
                        {scene.isGeneratingImage ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-image"></i>}
                        <span>{scene.imageUrl ? "Regenerate Image" : "Generate Image"}</span>
                      </button>
                      <button 
                        onClick={() => generateSceneVideo(idx)}
                        disabled={scene.isGeneratingVideo || !scene.imageUrl}
                        className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scene.isGeneratingVideo ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-play"></i>}
                        <span>Animate Cinematic Video</span>
                      </button>
                    </div>
                    {(scene.isGeneratingVideo) && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                         <div className="w-12 h-12 border-4 border-white/10 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
                         <p className="text-sm font-bold tracking-widest uppercase">Rendering Cinematic Motion...</p>
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/5 p-10 flex flex-col border-l border-white/5">
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Scene {scene.sceneNumber}</span>
                       <button 
                        onClick={() => playVoiceover(idx)}
                        disabled={scene.isGeneratingVoice}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-400 transition"
                       >
                         {scene.isGeneratingVoice ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-volume-high"></i>}
                       </button>
                    </div>
                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Cinematography Prompt</label>
                          <button 
                            onClick={() => handleCopyPrompt(scene.visualPrompt, idx)}
                            className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                          >
                             {copiedPromptIndex === idx ? (
                                <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                             ) : (
                                <><i className="fa-regular fa-copy"></i> Copy</>
                             )}
                          </button>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed italic border-l-2 border-yellow-500/30 pl-4">"{scene.visualPrompt}"</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                         <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Audio Script</label>
                         <button 
                            onClick={() => handlePolishScript(idx)}
                            disabled={scene.isPolishingScript}
                            className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                         >
                            {scene.isPolishingScript ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                            <span>Polish Script</span>
                         </button>
                      </div>
                      <p className="text-xl font-medium leading-snug">{scene.audioScript}</p>
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
            <div className="mt-20 glass p-12 rounded-[40px] text-center max-w-2xl mx-auto border-dashed">
                <h2 className="text-3xl font-serif mb-4">Ready to premiere?</h2>
                <p className="text-white/50 mb-8">Compile your scenes into a final high-bitrate MP4 with seamless transitions and professional sound mastering.</p>
                <button className="gradient-accent px-10 py-4 rounded-2xl font-bold text-lg text-black hover:scale-105 transition-transform">
                  Master Final Commercial
                </button>
            </div>
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
