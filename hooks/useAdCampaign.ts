import { useState, useRef, useEffect, useCallback } from 'react';
import { AdBrief, AdConcept, AdProject, AppStep } from '../types';
import { saveState, loadState, clearState, SavedState } from '../utils/storageService';

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

const DEFAULT_BRIEF: AdBrief = {
  brandName: '',
  productName: '',
  targetAudience: '',
  tone: ['Premium', 'Cinematic', 'Inspiring'],
  keyFeatures: [],
  creativeDirection: '',
  voiceName: 'Kore'
};

interface UseAdCampaignReturn {
  step: AppStep;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  brief: AdBrief;
  setBrief: React.Dispatch<React.SetStateAction<AdBrief>>;
  concepts: AdConcept[];
  setConcepts: React.Dispatch<React.SetStateAction<AdConcept[]>>;
  project: AdProject | null;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
  productionType: 'video' | 'social' | 'food-social';
  setProductionType: React.Dispatch<React.SetStateAction<'video' | 'social' | 'food-social'>>;
  handleClearData: () => void;
  resetToDefaults: () => void;
}

export function useAdCampaign(isConfigured: boolean): UseAdCampaignReturn {
  const [step, setStep] = useState<AppStep>(AppStep.BRIEFING);
  const [brief, setBrief] = useState<AdBrief>(DEFAULT_BRIEF);
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [project, setProject] = useState<AdProject | null>(null);
  const [productionType, setProductionType] = useState<'video' | 'social' | 'food-social'>('video');

  const debouncedSaveRef = useRef(
    debounce((state: SavedState) => {
      saveState(state);
    }, 1000)
  );

  useEffect(() => {
    if (!isConfigured) return;
    
    const savedState = loadState();
    if (savedState) {
      setStep(savedState.step);
      setBrief(savedState.brief);
      setConcepts(savedState.concepts);
      setProject(savedState.project);
      setProductionType(savedState.productionType);
      console.log('Restored saved state from localStorage');
    }
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) return;
    
    debouncedSaveRef.current({
      step,
      brief,
      concepts,
      project,
      productionType,
    });
  }, [isConfigured, step, brief, concepts, project, productionType]);

  const resetToDefaults = useCallback(() => {
    setStep(AppStep.BRIEFING);
    setBrief(DEFAULT_BRIEF);
    setConcepts([]);
    setProject(null);
    setProductionType('video');
  }, []);

  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
      clearState();
      resetToDefaults();
    }
  }, [resetToDefaults]);

  return {
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
    handleClearData,
    resetToDefaults
  };
}

export default useAdCampaign;
