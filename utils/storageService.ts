import { AppStep, AdBrief, AdConcept, AdProject, ProductionType, Scene } from '../types';

const STORAGE_PREFIX = 'bananaads_';
const STORAGE_KEYS = {
  STEP: `${STORAGE_PREFIX}step`,
  BRIEF: `${STORAGE_PREFIX}brief`,
  CONCEPTS: `${STORAGE_PREFIX}concepts`,
  PROJECT: `${STORAGE_PREFIX}project`,
  PRODUCTION_TYPE: `${STORAGE_PREFIX}productionType`,
  VERSION: `${STORAGE_PREFIX}version`,
} as const;

const CURRENT_VERSION = '1.1';

let quotaExceeded = false;

export interface SavedState {
  step: AppStep;
  brief: AdBrief;
  concepts: AdConcept[];
  project: AdProject | null;
  productionType: ProductionType;
}

function isDataUrl(str: string | undefined): boolean {
  return typeof str === 'string' && str.startsWith('data:');
}

function stripLargeBinaryData<T extends Record<string, unknown>>(obj: T, keysToStrip: string[]): T {
  const result = { ...obj };
  for (const key of keysToStrip) {
    if (key in result && isDataUrl(result[key] as string | undefined)) {
      delete result[key];
    }
  }
  return result;
}

function stripBriefBinaryData(brief: AdBrief): AdBrief {
  return stripLargeBinaryData(brief, ['productImage', 'logoImage', 'moodBoard']) as AdBrief;
}

function stripConceptBinaryData(concept: AdConcept): AdConcept {
  return stripLargeBinaryData(concept, ['thumbnailUrl']) as AdConcept;
}

function stripSceneBinaryData(scene: Scene): Scene {
  return stripLargeBinaryData(scene, ['imageUrl', 'videoUrl', 'voiceoverUrl']) as Scene;
}

function stripProjectBinaryData(project: AdProject | null): AdProject | null {
  if (!project) return null;
  return {
    ...project,
    brief: stripBriefBinaryData(project.brief),
    selectedConcept: project.selectedConcept 
      ? stripConceptBinaryData(project.selectedConcept) 
      : undefined,
    scenes: project.scenes.map(stripSceneBinaryData),
  };
}

function prepareStateForStorage(state: SavedState): SavedState {
  return {
    ...state,
    brief: stripBriefBinaryData(state.brief),
    concepts: state.concepts.map(stripConceptBinaryData),
    project: stripProjectBinaryData(state.project),
  };
}

export function resetQuotaFlag(): void {
  quotaExceeded = false;
}

export function saveState(state: SavedState): void {
  if (quotaExceeded) {
    return;
  }

  try {
    const strippedState = prepareStateForStorage(state);
    
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    localStorage.setItem(STORAGE_KEYS.STEP, JSON.stringify(strippedState.step));
    localStorage.setItem(STORAGE_KEYS.BRIEF, JSON.stringify(strippedState.brief));
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(strippedState.concepts));
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(strippedState.project));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_TYPE, JSON.stringify(strippedState.productionType));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      quotaExceeded = true;
      console.warn('localStorage quota exceeded. Auto-save disabled until page refresh or data is cleared.');
      try {
        clearState();
        console.info('Cleared localStorage to free up space. You may need to re-enter your data.');
      } catch {
        // Ignore errors during cleanup
      }
    } else {
      console.error('Failed to save state to localStorage:', error);
    }
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
      ? JSON.parse(productionTypeStr) as ProductionType
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
