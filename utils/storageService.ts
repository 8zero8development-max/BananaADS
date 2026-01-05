import { AppStep, AdBrief, AdConcept, AdProject, ProductionType, Scene, BrandDna } from '../types';
import { StorageQuotaError } from './errors';

const STORAGE_PREFIX = 'bananaads_';
const BRAND_PROFILE_PREFIX = 'bananaads_brand_';

const STORAGE_KEYS = {
  STEP: `${STORAGE_PREFIX}step`,
  BRIEF: `${STORAGE_PREFIX}brief`,
  CONCEPTS: `${STORAGE_PREFIX}concepts`,
  PROJECT: `${STORAGE_PREFIX}project`,
  PRODUCTION_TYPE: `${STORAGE_PREFIX}productionType`,
  VERSION: `${STORAGE_PREFIX}version`,
} as const;

// Event types for storage quota exceeded notifications
export type StorageQuotaCallback = (options: {
  onExport: () => void;
  onClearOldData: () => void;
  onContinueWithoutSave: () => void;
}) => void;

// Callback to notify UI about quota exceeded
let quotaExceededCallback: StorageQuotaCallback | null = null;

/**
 * Register a callback to be notified when storage quota is exceeded
 * This allows the UI to show a modal with options for the user
 */
export function onStorageQuotaExceeded(callback: StorageQuotaCallback): void {
  quotaExceededCallback = callback;
}

/**
 * Clear the quota exceeded callback
 */
export function clearStorageQuotaCallback(): void {
  quotaExceededCallback = null;
}

export interface BrandProfile {
  id: string;
  name: string;
  brandDna: BrandDna;
  // Core brand identity fields from AI research
  brandName: string;
  productName?: string;
  targetAudience?: string;
  tone?: string[];
  keyFeatures?: string[];
  researchSources?: string[];
  productUrl?: string;
  // Visual assets
  logoImage?: string;
  moodBoard?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

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

export function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeBriefArrays(brief: AdBrief): AdBrief {
  return {
    ...brief,
    tone: ensureStringArray(brief.tone),
    keyFeatures: ensureStringArray(brief.keyFeatures),
    researchSources: ensureStringArray(brief.researchSources),
  };
}

function stripLargeBinaryData<T extends Record<string, any>>(obj: T, keysToStrip: string[]): T {
  const result = { ...obj } as any;
  for (const key of keysToStrip) {
    if (key in result && isDataUrl(result[key] as string | undefined)) {
      delete result[key];
    }
  }
  return result as T;
}

function stripBriefBinaryData(brief: AdBrief): AdBrief {
  return stripLargeBinaryData(brief as any, ['productImage', 'logoImage', 'moodBoard']) as AdBrief;
}

function stripConceptBinaryData(concept: AdConcept): AdConcept {
  return stripLargeBinaryData(concept as any, ['thumbnailUrl']) as AdConcept;
}

function stripSceneBinaryData(scene: Scene): Scene {
  return stripLargeBinaryData(scene as any, ['imageUrl', 'videoUrl', 'voiceoverUrl']) as Scene;
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

/**
 * Export state to a downloadable JSON file
 * Used as a recovery option when storage quota is exceeded
 */
export function exportStateToFile(state: SavedState): void {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bananaads-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export state:', error);
    throw new Error('Failed to export your work. Please try again.');
  }
}

/**
 * Clear old brand profiles to free up storage space
 * Keeps the most recent 3 profiles
 */
export function clearOldBrandProfiles(): void {
  try {
    const profiles = loadBrandProfiles();
    // Keep only the 3 most recent profiles
    const profilesToDelete = profiles.slice(3);
    profilesToDelete.forEach(profile => {
      deleteBrandProfile(profile.id);
    });
    // Reset quota flag after clearing data
    quotaExceeded = false;
  } catch (error) {
    console.error('Failed to clear old brand profiles:', error);
  }
}

// Track the last state for export purposes
let lastSavedState: SavedState | null = null;

/**
 * Get the last saved state (useful for export when quota is exceeded)
 */
export function getLastSavedState(): SavedState | null {
  return lastSavedState;
}

export function saveState(state: SavedState): void {
  // Store the state for potential export
  lastSavedState = state;
  
  if (quotaExceeded) {
    // If quota was exceeded, don't try to save but don't lose the state
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
      console.warn('localStorage quota exceeded. Auto-save disabled.');
      
      // Notify the UI about quota exceeded so it can show a modal
      // DO NOT automatically clear data - let the user decide
      if (quotaExceededCallback) {
        quotaExceededCallback({
          onExport: () => exportStateToFile(state),
          onClearOldData: () => {
            clearOldBrandProfiles();
            // Try saving again after clearing old data
            quotaExceeded = false;
            saveState(state);
          },
          onContinueWithoutSave: () => {
            // User chose to continue without saving
            // Data is still in memory via lastSavedState
            console.info('Continuing without auto-save. Your work is still in memory.');
          }
        });
      } else {
        // No callback registered, log a warning but don't delete data
        console.error(
          'Storage quota exceeded! Your work is still in memory but cannot be saved. ' +
          'Please export your work or clear some browser storage.'
        );
      }
      
      // Throw error so callers know save failed
      throw new StorageQuotaError('Storage quota exceeded. Please export your work or clear old data.');
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
      brief: normalizeBriefArrays(brief),
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

export function saveBrandProfile(profile: BrandProfile): void {
  try {
    const key = `${BRAND_PROFILE_PREFIX}${profile.id}`;
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded when saving brand profile.');
      throw new Error('Storage quota exceeded. Try deleting some saved brand profiles.');
    }
    console.error('Failed to save brand profile:', error);
    throw error;
  }
}

export function loadBrandProfiles(): BrandProfile[] {
  try {
    const profiles: BrandProfile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BRAND_PROFILE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const profile = JSON.parse(data) as BrandProfile;
            profiles.push(profile);
          } catch {
            console.warn(`Failed to parse brand profile at key: ${key}`);
          }
        }
      }
    }
    return profiles.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load brand profiles:', error);
    return [];
  }
}

export function deleteBrandProfile(id: string): void {
  try {
    const key = `${BRAND_PROFILE_PREFIX}${id}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete brand profile:', error);
    throw error;
  }
}

export function getBrandProfile(id: string): BrandProfile | null {
  try {
    const key = `${BRAND_PROFILE_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as BrandProfile;
    }
    return null;
  } catch (error) {
    console.error('Failed to get brand profile:', error);
    return null;
  }
}
