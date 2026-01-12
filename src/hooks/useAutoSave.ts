import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";

const STORAGE_KEY = "canvas-autosave";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface SavedState {
  json: string;
  timestamp: number;
  thumbnail: string;
}

interface UseAutoSaveOptions {
  canvas: FabricCanvas | null;
  enabled?: boolean;
  interval?: number;
}

export const useAutoSave = ({ 
  canvas, 
  enabled = true, 
  interval = AUTOSAVE_INTERVAL 
}: UseAutoSaveOptions) => {
  const [hasSavedState, setHasSavedState] = useState(false);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // Check for saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        setHasSavedState(true);
        setSavedTimestamp(parsed.timestamp);
      }
    } catch (error) {
      console.error("Failed to check saved state:", error);
    }
  }, []);

  // Generate thumbnail
  const generateThumbnail = useCallback((fabricCanvas: FabricCanvas): string => {
    try {
      return fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.3,
        multiplier: 0.2,
      });
    } catch {
      return '';
    }
  }, []);

  // Save canvas state to localStorage
  const saveToStorage = useCallback(() => {
    if (!canvas || isRestoringRef.current) return;

    try {
      const objects = canvas.getObjects();
      // Only save if there's content
      if (objects.length === 0) return;

      const state: SavedState = {
        json: JSON.stringify(canvas.toJSON()),
        timestamp: Date.now(),
        thumbnail: generateThumbnail(canvas),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSaved(new Date());
      setHasSavedState(true);
      setSavedTimestamp(state.timestamp);
    } catch (error) {
      console.error("Failed to save canvas state:", error);
    }
  }, [canvas, generateThumbnail]);

  // Recover canvas state from localStorage
  const recoverFromStorage = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const parsed: SavedState = JSON.parse(saved);
      
      isRestoringRef.current = true;
      setIsRecovering(true);

      await canvas.loadFromJSON(JSON.parse(parsed.json));
      canvas.renderAll();
      
      isRestoringRef.current = false;
      setIsRecovering(false);
      setLastSaved(new Date(parsed.timestamp));
      
      return true;
    } catch (error) {
      console.error("Failed to recover canvas state:", error);
      isRestoringRef.current = false;
      setIsRecovering(false);
      return false;
    }
  }, [canvas]);

  // Clear saved state
  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSavedState(false);
      setSavedTimestamp(null);
    } catch (error) {
      console.error("Failed to clear saved state:", error);
    }
  }, []);

  // Get saved state info
  const getSavedStateInfo = useCallback((): SavedState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  // Setup auto-save interval
  useEffect(() => {
    if (!canvas || !enabled) return;

    // Initial save after a short delay
    const initialTimeout = setTimeout(() => {
      saveToStorage();
    }, 5000);

    // Periodic auto-save
    intervalRef.current = setInterval(() => {
      saveToStorage();
    }, interval);

    // Save on important events
    const handleChange = () => {
      // Debounced save on changes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        saveToStorage();
      }, interval);
    };

    canvas.on('object:added', handleChange);
    canvas.on('object:removed', handleChange);
    canvas.on('object:modified', handleChange);

    // Save before page unload
    const handleBeforeUnload = () => {
      saveToStorage();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      canvas.off('object:added', handleChange);
      canvas.off('object:removed', handleChange);
      canvas.off('object:modified', handleChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [canvas, enabled, interval, saveToStorage]);

  return {
    saveToStorage,
    recoverFromStorage,
    clearSavedState,
    getSavedStateInfo,
    hasSavedState,
    savedTimestamp,
    lastSaved,
    isRecovering,
  };
};
