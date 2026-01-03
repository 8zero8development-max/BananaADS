import { AppStep, AdBrief, AdConcept, AdProject } from '../types';

const STORAGE_PREFIX = 'bananaads_';
const STORAGE_KEYS = {
  STEP: `${STORAGE_PREFIX}step`,
  BRIEF: `${STORAGE_PREFIX}brief`,
  CONCEPTS: `${STORAGE_PREFIX}concepts`,
  PROJECT: `${STORAGE_PREFIX}project`,
  PRODUCTION_TYPE: `${STORAGE_PREFIX}productionType`,
  VERSION: `${STORAGE_PREFIX}version`,
} as const;

const CURRENT_VERSION = '1.0';

export interface SavedState {
  step: AppStep;
  brief: AdBrief;
  concepts: AdConcept[];
  project: AdProject | null;
  productionType: 'video' | 'social' | 'food-social';
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    localStorage.setItem(STORAGE_KEYS.STEP, JSON.stringify(state.step));
    localStorage.setItem(STORAGE_KEYS.BRIEF, JSON.stringify(state.brief));
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(state.concepts));
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(state.project));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_TYPE, JSON.stringify(state.productionType));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

export function loadState(): SavedState | null {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (savedVersion !== CURRENT_VERSION) {
      clearState();
      return null;
    }

    const stepStr = localStorage.getItem(STORAGE_KEYS.STEP);
    const briefStr = localStorage.getItem(STORAGE_KEYS.BRIEF);
    const conceptsStr = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    const projectStr = localStorage.getItem(STORAGE_KEYS.PROJECT);
    const productionTypeStr = localStorage.getItem(STORAGE_KEYS.PRODUCTION_TYPE);

    if (!stepStr || !briefStr) {
      return null;
    }

    const step = JSON.parse(stepStr) as AppStep;
    const brief = JSON.parse(briefStr) as AdBrief;
    const concepts = conceptsStr ? JSON.parse(conceptsStr) as AdConcept[] : [];
    const project = projectStr ? JSON.parse(projectStr) as AdProject | null : null;
    const productionType = productionTypeStr 
      ? JSON.parse(productionTypeStr) as 'video' | 'social' | 'food-social'
      : 'video';

    if (typeof step !== 'number' || brief.brandName === undefined) {
      clearState();
      return null;
    }

    return {
      step,
      brief,
      concepts,
      project,
      productionType,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    clearState();
    return null;
  }
}

export function clearState(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

export function hasSavedState(): boolean {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    const stepStr = localStorage.getItem(STORAGE_KEYS.STEP);
    return savedVersion === CURRENT_VERSION && stepStr !== null;
  } catch {
    return false;
  }
}
