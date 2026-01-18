import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";

export interface HistoryEntry {
  id: string;
  json: string;
  thumbnail: string;
  timestamp: number;
  label: string;
}

interface UseUndoRedoOptions {
  canvas: FabricCanvas | null;
  maxHistory?: number;
}

export const useUndoRedo = ({ canvas, maxHistory = 30 }: UseUndoRedoOptions) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const isRestoringRef = useRef(false);
  const actionCounterRef = useRef(0);

  // Generate thumbnail from canvas
  const generateThumbnail = useCallback((fabricCanvas: FabricCanvas): string => {
    try {
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.3,
        multiplier: 0.15,
      });
      return dataUrl;
    } catch {
      return '';
    }
  }, []);

  // Get action label based on recent changes
  const getActionLabel = useCallback((index: number): string => {
    const labels = [
      'Initial State',
      'Added Shape',
      'Modified Object',
      'Moved Object',
      'Deleted Object',
      'Changed Style',
      'Drew Path',
      'Added Text',
      'Transformed',
      'Canvas Update',
    ];
    if (index === 0) return labels[0];
    return labels[Math.min(index % 9 + 1, labels.length - 1)];
  }, []);

  // Save current state to history
  const saveState = useCallback(() => {
    if (!canvas || isRestoringRef.current) return;

    const json = JSON.stringify(canvas.toJSON());
    const thumbnail = generateThumbnail(canvas);
    const newIndex = actionCounterRef.current;
    actionCounterRef.current++;

    const entry: HistoryEntry = {
      id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      json,
      thumbnail,
      timestamp: Date.now(),
      label: getActionLabel(newIndex),
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(entry);

      if (newHistory.length > maxHistory) {
        // Strictly keep only the last N states
        return newHistory.slice(-maxHistory);
      }
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIdx = Math.min(prev + 1, maxHistory - 1);
      setCanUndo(newIdx > 0);
      setCanRedo(false);
      return newIdx;
    });
  }, [canvas, currentIndex, maxHistory, generateThumbnail, getActionLabel]);

  // Restore to specific history entry
  const restoreToIndex = useCallback((index: number) => {
    if (!canvas || index < 0 || index >= history.length) return;

    isRestoringRef.current = true;

    const state = history[index];
    canvas.loadFromJSON(JSON.parse(state.json)).then(() => {
      canvas.renderAll();
      isRestoringRef.current = false;
      setCurrentIndex(index);
      setCanUndo(index > 0);
      setCanRedo(index < history.length - 1);
    });
  }, [canvas, history]);

  // Undo action
  const undo = useCallback(() => {
    if (currentIndex <= 0) return;
    restoreToIndex(currentIndex - 1);
  }, [currentIndex, restoreToIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return;
    restoreToIndex(currentIndex + 1);
  }, [currentIndex, history.length, restoreToIndex]);

  // Delete a specific history entry
  const deleteHistoryEntry = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;

    // If we are deleting the current state, we need to move to a safe state first
    if (index === currentIndex) {
      if (index > 0) {
        // Move to previous state
        restoreToIndex(index - 1);
      } else if (history.length > 1) {
        // We are at 0, but there are future states. Move to next state (which will become 0)
        restoreToIndex(index + 1);
      }
      // If it's the only state, we don't restore, just clear below
    }

    setHistory(prev => {
      const newHistory = [...prev];
      newHistory.splice(index, 1);
      return newHistory;
    });

    setCurrentIndex(prev => {
      if (index < prev) return prev - 1;
      if (index === prev) {
        // If we were at 0 and deleted 0, we stay at 0 (unless empty)
        if (prev === 0 && history.length === 1) return -1;
        return Math.max(0, prev - 1);
      }
      return prev;
    });

    // If we deleted the only entry
    if (history.length === 1) {
      actionCounterRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [currentIndex, history.length, restoreToIndex]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (!canvas) return;

    setHistory([]);
    setCurrentIndex(-1);
    setCanUndo(false);
    setCanRedo(false);
  }, [canvas]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas) return;

    const timeout = setTimeout(() => saveState(), 100);

    const handleChange = () => {
      saveState();
    };

    canvas.on('object:added', handleChange);
    canvas.on('object:removed', handleChange);
    canvas.on('object:modified', handleChange);

    return () => {
      clearTimeout(timeout);
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
    history,
    currentIndex,
    restoreToIndex,
    deleteHistoryEntry,
  };
};
