import { useEffect, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Copy, 
  Palette, 
  ArrowUp, 
  ArrowDown,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  canvas: FabricCanvas | null;
  onDelete: () => void;
  onColorChange?: (color: string) => void;
  onDuplicate?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const QUICK_COLORS = [
  "#00d4ff", "#ff3366", "#00ff88", "#ffaa00", "#aa66ff",
  "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7",
  "#ffffff", "#000000",
];

export const SelectionToolbar = ({
  canvas,
  onDelete,
  onColorChange,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: SelectionToolbarProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const updatePosition = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      setHasSelection(false);
      setPosition(null);
      return;
    }

    setHasSelection(true);

    // Get bounding rect of selection
    const bound = activeObject.getBoundingRect();
    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;

    if (!vpt) return;

    // Calculate position above the selected object
    const x = rect.left + bound.left * zoom + vpt[4] + (bound.width * zoom) / 2;
    const y = rect.top + bound.top * zoom + vpt[5] - 60;

    // Ensure toolbar stays within viewport
    const clampedX = Math.max(100, Math.min(x, window.innerWidth - 100));
    const clampedY = Math.max(60, y);

    setPosition({ x: clampedX, y: clampedY });
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      updatePosition();
    };

    const handleClear = () => {
      setHasSelection(false);
      setPosition(null);
      setShowColorPicker(false);
    };

    const handleModified = () => {
      updatePosition();
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleClear);
    canvas.on('object:moving', handleModified);
    canvas.on('object:scaling', handleModified);
    canvas.on('object:rotating', handleModified);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleClear);
      canvas.off('object:moving', handleModified);
      canvas.off('object:scaling', handleModified);
      canvas.off('object:rotating', handleModified);
    };
  }, [canvas, updatePosition]);

  const handleDuplicate = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });

    onDuplicate?.();
  }, [canvas, onDuplicate]);

  const handleColorSelect = useCallback((color: string) => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      // For strokes on lines, update stroke; for shapes, update fill
      if (obj.type === 'line') {
        obj.set({ stroke: color });
      } else {
        obj.set({ fill: color });
      }
    });
    canvas.renderAll();
    setShowColorPicker(false);
    onColorChange?.(color);
  }, [canvas, onColorChange]);

  if (!hasSelection || !position) return null;

  return (
    <div
      className="fixed z-[100] flex items-center gap-1 p-1.5 glass rounded-xl border border-panel-border shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Color picker */}
      <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
        <PopoverTrigger asChild>
          <Button variant="toolbar" size="icon" className="w-9 h-9">
            <Palette className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="grid grid-cols-6 gap-1">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-7 h-7 rounded-full border-2 border-transparent hover:border-primary transition-colors",
                  color === '#ffffff' && "border-muted-foreground/30"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-panel-border" />

      {/* Duplicate */}
      <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={handleDuplicate}>
        <Copy className="w-4 h-4" />
      </Button>

      {/* Layer order */}
      <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={onBringForward}>
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={onSendBackward}>
        <ArrowDown className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-panel-border" />

      {/* Undo/Redo */}
      <Button 
        variant="toolbar" 
        size="icon" 
        className="w-9 h-9" 
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button 
        variant="toolbar" 
        size="icon" 
        className="w-9 h-9" 
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-panel-border" />

      {/* Delete */}
      <Button 
        variant="toolbar" 
        size="icon" 
        className="w-9 h-9 hover:bg-destructive/20 hover:text-destructive" 
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
