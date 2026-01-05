import React, { useCallback } from 'react';
import { AdProject, AdBrief, AdConcept } from '../types';
import { GeminiService } from '../services/geminiService';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

interface UseSceneGenerationProps {
  project: AdProject | null;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
}

interface UseSceneGenerationReturn {
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSceneVideo: (idx: number) => Promise<void>;
  playVoiceover: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number, editInstruction: string) => Promise<void>;
  startAutoGeneration: (currentProject: AdProject) => Promise<void>;
}

export function useSceneGeneration({
  project,
  setProject,
}: UseSceneGenerationProps): UseSceneGenerationReturn {
  
  const generateSceneImage = useCallback(async (idx: number, projectRef?: AdProject) => {
    const currentProject = projectRef || project;
    if (!currentProject) return;
    
    setProject(prev => {
      if (!prev) return null;
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
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], imageUrl, isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
      
    } catch (error) {
      console.error("Error generating image:", error);
      setProject(prev => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
    }
  }, [project, setProject]);

  const generateSceneVideo = useCallback(async (idx: number) => {
    if (!project) return;
    setProject(prev => {
      if (!prev) return null;
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
        if (!prev) return null;
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
        if (!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isGeneratingVideo = false;
        return { ...prev, scenes };
      });
    }
  }, [project, setProject]);

  const playVoiceover = useCallback(async (idx: number) => {
    if (!project) return;
    setProject(prev => {
      if (!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isGeneratingVoice = true;
      return { ...prev, scenes };
    });

    let audioCtx: AudioContext | null = null;
    try {
      const base64Audio = await GeminiService.generateVoiceover(
        project.scenes[idx].audioScript, 
        project.brief.voiceName
      );
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      // Close AudioContext after playback ends to prevent memory leak
      source.onended = () => {
        if (audioCtx) {
          audioCtx.close().catch(console.error);
        }
      };
      
      source.start();
    } catch (error) {
      console.error("Error generating voiceover:", error);
      // Close AudioContext on error to prevent memory leak
      if (audioCtx) {
        audioCtx.close().catch(console.error);
      }
    } finally {
      setProject(prev => {
        if (!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isGeneratingVoice = false;
        return { ...prev, scenes };
      });
    }
  }, [project, setProject]);

  const handlePolishScript = useCallback(async (idx: number) => {
    if (!project) return;
    
    setProject(prev => {
      if (!prev) return null;
      const scenes = [...prev.scenes];
      scenes[idx].isPolishingScript = true;
      return { ...prev, scenes };
    });

    try {
      const polished = await GeminiService.polishSceneScript(
        project.scenes[idx].audioScript, 
        project.brief.tone
      );
      setProject(prev => {
        if (!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].audioScript = polished;
        scenes[idx].isPolishingScript = false;
        return { ...prev, scenes };
      });
    } catch (e) {
      console.error("Failed to polish script", e);
      setProject(prev => {
        if (!prev) return null;
        const scenes = [...prev.scenes];
        scenes[idx].isPolishingScript = false;
        return { ...prev, scenes };
      });
    }
  }, [project, setProject]);

  const handleEditImage = useCallback(async (idx: number, editInstruction: string) => {
    if (!project || !project.scenes[idx].imageUrl || !editInstruction) return;
    
    setProject(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
      return { ...prev, scenes: newScenes };
    });

    try {
      const newUrl = await GeminiService.editHeroImage(project.scenes[idx].imageUrl!, editInstruction);
      setProject(prev => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], imageUrl: newUrl, isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
    } catch (e) {
      console.error("Edit failed", e);
      setProject(prev => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false };
        return { ...prev, scenes: newScenes };
      });
    }
  }, [project, setProject]);

  const startAutoGeneration = useCallback(async (currentProject: AdProject) => {
    for (let i = 0; i < currentProject.scenes.length; i++) {
      await generateSceneImage(i, currentProject);
    }
  }, [generateSceneImage]);

  return {
    generateSceneImage,
    generateSceneVideo,
    playVoiceover,
    handlePolishScript,
    handleEditImage,
    startAutoGeneration,
  };
}

export default useSceneGeneration;
