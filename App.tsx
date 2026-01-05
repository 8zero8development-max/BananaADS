import React, { useState, useCallback } from 'react';
import { AdBrief, AdConcept, Scene, AppStep, AdProject } from './types';
import { decodeBase64, decodeAudioData } from './utils/audioUtils';
import { validateBrief, validateResearchInput } from './utils/validation';
import { compressImageFile } from './utils/imageOptimization';
import { useAuth } from './hooks/useAuth';

import ApiKeyConfig from './components/shared/ApiKeyConfig';
import StepIndicator from './components/shared/StepIndicator';
import { ToastProvider, useToast } from './components/shared/Toast';
import BananaPro from './components/shared/BananaPro';
import ErrorBoundary from './components/ErrorBoundary';
import BriefingForm from './components/BriefingForm/BriefingForm';
import ConceptSelection from './components/ConceptSelection/ConceptSelection';
import Production from './components/Production/Production';
import { useAdCampaign } from './hooks/useAdCampaign';
import BananaAdsAssistant from './components/BananaAdsAssistant';
import HelpSystem from './components/Help/HelpSystem';
import OnboardingTour, { onboardingSteps } from './components/Onboarding/OnboardingTour';
import { ModelSelectionDashboard } from './components/ModelSelectionDashboard';
import { ModelAnalyticsDashboard } from './components/ModelAnalyticsDashboard';
import { providerManager } from './services/providers';
import ModelStatusIndicator from './components/ModelStatusIndicator/ModelStatusIndicator';
import { ProviderType } from './types/providers';

interface AppProps {
  onBackToLanding?: () => void;
}

const AppContent: React.FC<AppProps> = ({ onBackToLanding }) => {
  const { user, logout } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [generatingMoodBoard, setGeneratingMoodBoard] = useState(false);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>("");
  const [selectedFoodPostIdx, setSelectedFoodPostIdx] = useState<number>(0);
  const [selectedSocialPostIdx, setSelectedSocialPostIdx] = useState<number>(0);
  const [selectedEmailSectionIdx, setSelectedEmailSectionIdx] = useState<number>(0);
            const [showHelp, setShowHelp] = useState<boolean>(false);
          const [showModelDashboard, setShowModelDashboard] = useState<boolean>(false);
          const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState<boolean>(false);
          const [showOnboarding, setShowOnboarding] = useState(
          !localStorage.getItem('onboarding-completed')
        );
      const [activeModel, setActiveModel] = useState<{
        isActive: boolean;
        modelName: string;
        provider: ProviderType;
        operation: string;
      }>({ isActive: false, modelName: '', provider: 'gemini', operation: '' });

  const { showToast } = useToast();

  const {
    step,
    setStep,
    brief,
    setBrief,
    concepts,
    setConcepts,
    project,
    setProject,
    productionType,
    setProductionType,
    handleClearData
  } = useAdCampaign(isConfigured);

  const generateConceptsLogic = async () => {
    const validation = validateBrief(brief, productionType);
    if (!validation.success) {
      validation.errors.forEach(error => showToast(error, 'error'));
      return;
    }

        setLoading(true);
        setActiveModel({ isActive: true, modelName: 'Gemini Flash', provider: 'gemini', operation: 'Generating concepts...' });
        showToast('Gemini AI is generating your ad concepts...', 'info');
        try {
          let generatedConcepts;
      
          if (productionType === 'food-social') {
            setActiveModel({ isActive: true, modelName: 'AI Model', provider: 'gemini', operation: 'Analyzing brand DNA...' });
            const dna = await providerManager.researchBrandDna(brief);
            setBrief(prev => ({ ...prev, brandDna: dna, visualStyle: dna.visualStyle }));
            setActiveModel({ isActive: true, modelName: 'AI Model', provider: 'gemini', operation: 'Generating food social concepts...' });
            generatedConcepts = await providerManager.generateFoodSocialConcepts({ ...brief, brandDna: dna, visualStyle: dna.visualStyle });
          } else if (productionType === 'email') {
            setActiveModel({ isActive: true, modelName: 'AI Model', provider: 'gemini', operation: 'Analyzing brand DNA...' });
            const dna = await providerManager.researchBrandDna(brief);
            setBrief(prev => ({ ...prev, brandDna: dna, visualStyle: dna.visualStyle }));
            setActiveModel({ isActive: true, modelName: 'AI Model', provider: 'gemini', operation: 'Generating email campaign...' });
            generatedConcepts = await providerManager.generateEmailCampaign({ ...brief, brandDna: dna, visualStyle: dna.visualStyle });
          } else {
            generatedConcepts = await providerManager.generateConcepts(brief);
          }
      
      setConcepts(generatedConcepts);
      setStep(AppStep.CONCEPTS);
      
      // Generate previews in parallel and wait for all to complete
      setGeneratingPreviews(true);
      const previewPromises = generatedConcepts.map(async (concept) => {
        try {
          const url = await providerManager.generateConceptPreview(concept, brief.productImage);
          setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, thumbnailUrl: url } : c));
        } catch (e) {
          console.error("Failed to generate preview for concept", concept.id);
          showToast(`Failed to generate preview for "${concept.title}"`, 'error');
        }
      });
      await Promise.allSettled(previewPromises);
      setGeneratingPreviews(false);
      } catch (error) {
        console.error("Error generating concepts:", error);
        showToast("Failed to generate concepts. Please try again.", 'error');
      } finally {
        setLoading(false);
        setActiveModel({ isActive: false, modelName: '', provider: 'gemini', operation: '' });
      }
    };

  const handleStartBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateConceptsLogic();
  };

  const handleResearchBrand = async () => {
    const validation = validateResearchInput(brief, productionType);
    if (!validation.success) {
      validation.errors.forEach(error => showToast(error, 'error'));
      return;
    }
    
        setResearching(true);
        setActiveModel({ isActive: true, modelName: 'Gemini Pro', provider: 'gemini', operation: 'Researching brand...' });
        showToast('Gemini AI is researching your brand...', 'info');
        try {
          let researchData;
          let updatedBrief = { ...brief };
      
          if (productionType === 'food-social') {
        const desc = brief.keyFeatures.join(', ');
        researchData = await providerManager.autoFillFoodBrief(desc, brief.productUrl || '');
        updatedBrief = {
          ...updatedBrief,
          brandName: researchData.brandName || updatedBrief.brandName,
          productName: researchData.productName || updatedBrief.productName,
          targetAudience: researchData.targetAudience || updatedBrief.targetAudience,
          tone: researchData.tone || updatedBrief.tone,
          keyFeatures: researchData.keyFeatures || updatedBrief.keyFeatures,
          logoImage: researchData.logoImage || updatedBrief.logoImage,
        };
      } else {
        researchData = await providerManager.researchBrand(brief.brandName, brief.productName);
        updatedBrief = {
          ...updatedBrief,
          targetAudience: researchData.targetAudience || updatedBrief.targetAudience,
          tone: researchData.tone || updatedBrief.tone,
          keyFeatures: researchData.keyFeatures || updatedBrief.keyFeatures,
          logoImage: researchData.logoImage || updatedBrief.logoImage,
          researchSources: researchData.researchSources
        };
      }
      
      setBrief(updatedBrief);
      showToast('Brand research completed! Analyzing brand DNA...', 'success');
      
      // Generate Brand DNA profile (extracts colors, typography, etc.)
      try {
        const brandDna = await providerManager.researchBrandDna(updatedBrief);
        updatedBrief = { ...updatedBrief, brandDna, visualStyle: brandDna.visualStyle };
        setBrief(updatedBrief);
      } catch (dnaError) {
        console.error("Brand DNA analysis failed", dnaError);
        showToast('Brand DNA analysis failed, continuing with mood board...', 'warning');
      }
      
      showToast('Generating mood board...', 'success');
      
      // Automatically generate mood board after research completes
      setGeneratingMoodBoard(true);
      try {
        const moodBoardImage = await providerManager.generateMoodBoard(
          updatedBrief, 
          updatedBrief.productImage, 
          updatedBrief.logoImage
        );
        setBrief(prev => ({ ...prev, moodBoard: moodBoardImage }));
        showToast('Brand analysis complete! Mood board generated.', 'success');
      } catch (moodBoardError) {
        console.error("Mood board generation failed", moodBoardError);
        showToast('Research complete, but mood board generation failed. You can retry manually.', 'warning');
      } finally {
        setGeneratingMoodBoard(false);
      }
      
      } catch (error: any) {
        console.error("Research failed", error);
        showToast(`Research failed: ${error.message || "Unknown error"}`, 'error');
      } finally {
        setResearching(false);
        setActiveModel({ isActive: false, modelName: '', provider: 'gemini', operation: '' });
      }
    };

  const handleGenerateMoodBoard = async () => {
    setGeneratingMoodBoard(true);
    try {
      const image = await providerManager.generateMoodBoard(brief, brief.productImage, brief.logoImage);
      setBrief(prev => ({ ...prev, moodBoard: image }));
      showToast('Mood board generated successfully!', 'success');
    } catch (error) {
      console.error("Mood board generation failed", error);
      showToast('Failed to generate mood board. Please try again.', 'error');
    } finally {
      setGeneratingMoodBoard(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImageFile(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
        });
        setBrief(prev => ({ ...prev, productImage: compressedImage }));
      } catch (error) {
        console.error('Failed to compress image:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setBrief(prev => ({ ...prev, productImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedLogo = await compressImageFile(file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.9,
        });
        setBrief(prev => ({ ...prev, logoImage: compressedLogo }));
      } catch (error) {
        console.error('Failed to compress logo:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setBrief(prev => ({ ...prev, logoImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
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
        script = await providerManager.generateScript(brief, concept);
      } else if (productionType === 'social') {
        script = await providerManager.generateSocialCampaign(brief, concept);
      } else if (productionType === 'food-social') {
        const ctas = concept.overlayCtas || ['Check it out', 'Order Now', 'Try Today'];
        script = ctas.slice(0, 3).map((cta, idx) => ({
          sceneNumber: idx + 1,
          visualPrompt: concept.visualPrompt || "",
          audioScript: "",
          selectedCta: cta
        }));
      } else if (productionType === 'email') {
        script = await providerManager.generateEmailContent(brief, concept);
      }

      const newProject: AdProject = {
        id: Math.random().toString(36).substring(2, 11),
        brief,
        selectedConcept: concept,
        scenes: script,
        status: 'storyboarding',
        projectType: productionType
      };
      setProject(newProject);
      setStep(AppStep.STORYBOARDING);
      
      if (productionType === 'food-social') {
        for (let i = 0; i < script.length; i++) {
          const caption = await providerManager.generateFoodSocialPost(brief, concept, script[i]);
          newProject.scenes[i].audioScript = caption;
        }
        setProject({...newProject});
      }

      setTimeout(() => startAutoGeneration(newProject), 100);
      
    } catch (error) {
      console.error("Error generating script:", error);
      showToast("Failed to generate storyboard. Please try again.", 'error');
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
        imageUrl = await providerManager.generateFoodHeroImage(
          currentProject.brief, 
          currentProject.selectedConcept, 
          scene.selectedCta || ""
        );
      } else {
        const previousSceneImage = idx > 0 ? currentProject.scenes[idx - 1].imageUrl : undefined;
        const aspectRatio = currentProject.projectType === 'video' ? '16:9' : 
                           currentProject.projectType === 'email' ? '16:9' : '3:4';
        
        // Pass logo image for email and social campaigns to ensure brand continuity
        const shouldIncludeLogo = currentProject.projectType === 'email' || currentProject.projectType === 'social';
        
        imageUrl = await providerManager.generateStoryboardImage(
          scene.visualPrompt,
          currentProject.brief.productImage,
          previousSceneImage,
          aspectRatio,
          shouldIncludeLogo ? currentProject.brief.logoImage : undefined
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
      const newUrl = await providerManager.editHeroImage(project.scenes[idx].imageUrl!, editInstruction);
      setProject(prev => {
        if(!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], imageUrl: newUrl, isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
      setEditInstruction("");
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

  const generateSceneVideo = async (idx: number) => {
    if (!project) return;
    setProject(prev => {
      if(!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isGeneratingVideo = true;
      return { ...prev, scenes };
    });

    try {
      const videoUrl = await providerManager.generateCinematicVideo(
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
      const errorMessage = (error as any).message || 'Unknown error';
      
      // Handle "entity not found" error - typically means API key doesn't have video access
      if (errorMessage.includes("Requested entity was not found")) {
        // Only call Replit-specific API if it exists
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
          await (window as any).aistudio.openSelectKey();
        } else {
          showToast("Video generation requires a paid Gemini API key with Veo access.", 'error');
        }
      } else {
        showToast(`Video generation failed: ${errorMessage}`, 'error');
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

  const generateSocialVideo = async (idx: number) => {
    if (!project) return;
    const scene = project.scenes[idx];
    
    setProject(prev => {
      if(!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isGeneratingVideo = true;
      return { ...prev, scenes };
    });

    try {
      const videoUrl = await providerManager.generateSocialVideo(
        scene.visualPrompt,
        scene.motionPrompt || 'Subtle motion, gentle camera movement',
        scene.imageUrl,
        scene.aspectRatio || '16:9'
      );
      setProject(prev => {
        if(!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx] = { ...scenes[idx], videoUrl, isGeneratingVideo: false };
        return { ...prev, scenes };
      });
    } catch (error) {
      const errorMessage = (error as any).message || 'Unknown error';
      
      // Handle "entity not found" error - typically means API key doesn't have video access
      if (errorMessage.includes("Requested entity was not found")) {
        // Only call Replit-specific API if it exists
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
          await (window as any).aistudio.openSelectKey();
        } else {
          showToast("Video generation requires a paid Gemini API key with Veo access.", 'error');
        }
      } else {
        showToast(`Social video generation failed: ${errorMessage}`, 'error');
      }
      
      console.error("Error generating social video:", error);
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
    setProject(prev => {
      if(!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isGeneratingVoice = true;
      return { ...prev, scenes };
    });

    try {
      const base64Audio = await providerManager.generateVoiceover(project.scenes[idx].audioScript, project.brief.voiceName);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (error) {
      console.error("Error generating voiceover:", error);
      showToast("Failed to generate voiceover. Please try again.", 'error');
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
    
    setProject(prev => {
      if(!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isPolishingScript = true;
      return { ...prev, scenes };
    });

    try {
      const polished = await providerManager.polishSceneScript(project.scenes[idx].audioScript, project.brief.tone);
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

  const handleExport = async (format: 'html' | 'pdf' = 'html') => {
    if (!project) return;
    
    if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = 20;
      
      doc.setFontSize(24);
      doc.setTextColor(250, 204, 21);
      doc.text(project.brief.brandName, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Campaign: ${project.selectedConcept?.title || 'Untitled'}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      doc.text(`Tone: ${project.brief.tone.join(', ')} | Audience: ${project.brief.targetAudience}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      doc.setDrawColor(250, 204, 21);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
      
      const sectionLabels = project.projectType === 'email' 
        ? ['Hero', 'Body', 'Infographic', 'Footer']
        : project.projectType === 'food-social' || project.projectType === 'social'
        ? ['Post']
        : ['Scene'];
      
      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(250, 204, 21);
        const sectionTitle = project.projectType === 'email' 
          ? sectionLabels[i] || `Section ${i + 1}`
          : project.projectType === 'food-social' || project.projectType === 'social'
          ? `Post ${i + 1}`
          : `Scene ${scene.sceneNumber}`;
        doc.text(sectionTitle, margin, yPosition);
        yPosition += 10;
        
        if (scene.imageUrl && scene.imageUrl.startsWith('data:image')) {
          try {
            const imgFormat = scene.imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
            const imgWidth = contentWidth;
            const imgHeight = project.projectType === 'video' || project.projectType === 'email' ? imgWidth * (9/16) : imgWidth * (4/3);
            
            if (yPosition + imgHeight > 280) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.addImage(scene.imageUrl, imgFormat, margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          } catch {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('[Image could not be embedded]', margin, yPosition);
            yPosition += 10;
          }
        }
        
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        const visualPromptLines = doc.splitTextToSize(`Visual: "${scene.visualPrompt}"`, contentWidth);
        doc.text(visualPromptLines, margin, yPosition);
        yPosition += visualPromptLines.length * 5 + 5;
        
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        const scriptLabel = project.projectType === 'email' ? 'Content' : project.projectType === 'video' ? 'Script' : 'Caption';
        const scriptLines = doc.splitTextToSize(`${scriptLabel}: "${scene.audioScript}"`, contentWidth);
        doc.text(scriptLines, margin, yPosition);
        yPosition += scriptLines.length * 5 + 15;
      }
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by Banana Ads AI Agent', pageWidth / 2, 290, { align: 'center' });
      
      doc.save(`${project.brief.brandName.replace(/\s+/g, '_')}_Campaign.pdf`);
    } else {
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
    }
  };

  const handleReconfigureKey = async () => {
    providerManager.clearApiKey();
    setIsConfigured(false);
  };

  const handleStepClick = useCallback((targetStep: AppStep) => {
    setStep(targetStep);
  }, [setStep]);

  if (!isConfigured) {
    return <ApiKeyConfig onConfigured={() => setIsConfigured(true)} />;
  }

  return (
    <div className="min-h-screen pb-20">
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
                <ModelStatusIndicator
                  isActive={loading || researching || generatingMoodBoard || generatingPreviews}
                  modelName={activeModel.modelName || 'Gemini AI'}
                  provider={activeModel.provider}
                  operation={activeModel.operation || (researching ? 'Researching brand...' : loading ? 'Generating...' : generatingMoodBoard ? 'Creating mood board...' : generatingPreviews ? 'Generating previews...' : '')}
                />
              </div>
        <div className="flex items-center space-x-6 text-sm font-medium text-white/60">
                    <button onClick={handleReconfigureKey} className="hover:text-banana transition flex items-center gap-2">
                      <i className="fa-solid fa-key"></i> <span className="hidden sm:inline">API Key</span>
                    </button>
                              <button 
                                onClick={() => setShowModelDashboard(true)} 
                                className="hover:text-banana transition flex items-center gap-2"
                                title="Configure AI models"
                              >
                                <i className="fa-solid fa-sliders"></i> <span className="hidden sm:inline">Models</span>
                              </button>
                              <button 
                                onClick={() => setShowAnalyticsDashboard(true)} 
                                className="hover:text-banana transition flex items-center gap-2"
                                title="View model analytics"
                              >
                                <i className="fa-solid fa-chart-bar"></i> <span className="hidden sm:inline">Analytics</span>
                              </button>
                    <button 
                      onClick={handleClearData}
            className="hover:text-red-400 transition flex items-center gap-2"
            title="Clear all saved data"
          >
            <i className="fa-solid fa-trash"></i> <span className="hidden sm:inline">Clear Data</span>
          </button>
          <a href="#" className="hover:text-banana transition">Projects</a>
          <button 
            onClick={() => setShowHelp(true)} 
            className="hover:text-banana transition flex items-center gap-2"
          >
            <i className="fa-solid fa-question-circle"></i> <span className="hidden sm:inline">Help</span>
          </button>
          {user && (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/20">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.firstName || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <span className="hidden lg:inline text-white/80 text-sm">
                {user.firstName || user.email?.split('@')[0]}
              </span>
              <button 
                onClick={logout}
                className="hover:text-red-400 transition flex items-center gap-1"
                title="Sign out"
              >
                <i className="fa-solid fa-sign-out-alt"></i>
              </button>
            </div>
          )}
          <div className="flex space-x-2">
            <button 
              onClick={() => handleExport('html')}
              disabled={!project}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className="fa-solid fa-code"></i> HTML
            </button>
            <button 
              onClick={() => handleExport('pdf')}
              disabled={!project}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className="fa-solid fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-8 max-w-7xl mx-auto">
        <StepIndicator 
          currentStep={step} 
          onStepClick={handleStepClick}
          brief={brief}
          concepts={concepts}
          showToast={showToast}
        />

        {step === AppStep.BRIEFING && (
          <BriefingForm
            brief={brief}
            setBrief={setBrief}
            productionType={productionType}
            setProductionType={setProductionType}
            onSubmit={handleStartBriefing}
            onResearchBrand={handleResearchBrand}
            onGenerateMoodBoard={handleGenerateMoodBoard}
            onImageUpload={handleImageUpload}
            onLogoUpload={handleLogoUpload}
            onDownload={handleDownload}
            isGenerating={loading}
            isResearching={researching}
            isGeneratingMoodBoard={generatingMoodBoard}
          />
        )}

        {step === AppStep.CONCEPTS && (
          <ConceptSelection
            concepts={concepts}
            onSelectConcept={handleSelectConcept}
            onRegenerateConcepts={generateConceptsLogic}
            isLoading={loading}
            isGeneratingPreviews={generatingPreviews}
          />
        )}

        {step === AppStep.STORYBOARDING && project && (
          <Production
            project={project}
            setProject={setProject}
            setStep={setStep}
            selectedFoodPostIdx={selectedFoodPostIdx}
            setSelectedFoodPostIdx={setSelectedFoodPostIdx}
            selectedSocialPostIdx={selectedSocialPostIdx}
            setSelectedSocialPostIdx={setSelectedSocialPostIdx}
            selectedEmailSectionIdx={selectedEmailSectionIdx}
            setSelectedEmailSectionIdx={setSelectedEmailSectionIdx}
            editInstruction={editInstruction}
            setEditInstruction={setEditInstruction}
            copiedId={copiedId}
            generateSceneImage={generateSceneImage}
            generateSceneVideo={generateSceneVideo}
            generateSocialVideo={generateSocialVideo}
            playVoiceover={playVoiceover}
            handlePolishScript={handlePolishScript}
            handleEditImage={handleEditImage}
            handleCopyPrompt={handleCopyPrompt}
            handleDownload={handleDownload}
          />
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 py-12 text-center text-white/20 text-sm">
        <p>© 2025 Banana Ads AI Cinematography Agent. Built with Gemini 3.</p>
      </footer>

      <BananaAdsAssistant
        brief={brief}
        setBrief={setBrief}
        productionType={productionType}
        showToast={showToast}
      />

      <HelpSystem isOpen={showHelp} onClose={() => setShowHelp(false)} />

            <ModelSelectionDashboard 
              isOpen={showModelDashboard} 
              onClose={() => setShowModelDashboard(false)} 
            />

            <ModelAnalyticsDashboard 
              isOpen={showAnalyticsDashboard} 
              onClose={() => setShowAnalyticsDashboard(false)} 
            />

            {showOnboarding && (
        <OnboardingTour
          steps={onboardingSteps}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

const App: React.FC<AppProps> = (props) => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent {...props} />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
