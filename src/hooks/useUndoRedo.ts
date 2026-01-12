import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";

interface UseUndoRedoOptions {
  canvas: FabricCanvas | null;
  maxHistory?: number;
}

export const useUndoRedo = ({ canvas, maxHistory = 50 }: UseUndoRedoOptions) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const historyRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  // Save current state to history
  const saveState = useCallback(() => {
    if (!canvas || isRestoringRef.current) return;

    const json = JSON.stringify(canvas.toJSON());
    
    // Remove any states after current index (for redo functionality)
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(json);
    
    // Limit history size
    if (historyRef.current.length > maxHistory) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
    
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);
  }, [canvas, maxHistory]);

  // Undo action
  const undo = useCallback(() => {
    if (!canvas || currentIndexRef.current <= 0) return;
    
    isRestoringRef.current = true;
    currentIndexRef.current--;
    
    const state = historyRef.current[currentIndexRef.current];
    canvas.loadFromJSON(JSON.parse(state)).then(() => {
      canvas.renderAll();
      isRestoringRef.current = false;
      setCanUndo(currentIndexRef.current > 0);
      setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    });
  }, [canvas]);

  // Redo action
  const redo = useCallback(() => {
    if (!canvas || currentIndexRef.current >= historyRef.current.length - 1) return;
    
    isRestoringRef.current = true;
    currentIndexRef.current++;
    
    const state = historyRef.current[currentIndexRef.current];
    canvas.loadFromJSON(JSON.parse(state)).then(() => {
      canvas.renderAll();
      isRestoringRef.current = false;
      setCanUndo(currentIndexRef.current > 0);
      setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    });
  }, [canvas]);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    
    // Save initial state
    if (canvas) {
      saveState();
    }
  }, [canvas, saveState]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas) return;

    // Save initial state
    saveState();

    const handleChange = () => {
      saveState();
    };

    canvas.on('object:added', handleChange);
    canvas.on('object:removed', handleChange);
    canvas.on('object:modified', handleChange);

    return () => {
      canvas.off('object:added', handleChange);
      canvas.off('object:removed', handleChange);
      canvas.off('object:modified', handleChange);
    };
  }, [canvas, saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    saveState,
  };
};
