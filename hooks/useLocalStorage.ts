import { useState, useEffect, useCallback } from 'react';
import { saveState, loadState, clearState, SavedState } from '../utils/storageService';

export function useLocalStorage() {
  const [state, setState] = useState<SavedState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedState = loadState();
    setState(savedState);
    setIsLoaded(true);
  }, []);

  const updateState = useCallback((newState: SavedState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const clearStoredState = useCallback(() => {
    clearState();
    setState(null);
  }, []);

  return {
    state,
    isLoaded,
    updateState,
    clearStoredState,
  };
}