import { useEffect, useState, useCallback, useRef } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Copy,
  Palette,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
  Group,
  Ungroup,
  Type,
  Bold,
  Italic,
  Crop,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  onGroup?: () => void;
  onUngroup?: () => void;
  onCrop?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hideToolbar?: boolean;
}

const QUICK_COLORS = [
  "#00d4ff", "#ff3366", "#00ff88", "#ffaa00", "#aa66ff",
  "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7",
  "#ffffff", "#000000",
];

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times" },
  { value: "Courier New", label: "Courier" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
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
  onGroup,
  onUngroup,
  onCrop,
  canUndo = false,
  canRedo = false,
  hideToolbar = false,
}: SelectionToolbarProps) => {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionType, setSelectionType] = useState<'single' | 'multiple' | 'group' | 'text' | 'image'>('single');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Text State
  const [textContent, setTextContent] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    const updateState = () => {
      const activeObj = canvas.getActiveObject();
      const activeObjects = canvas.getActiveObjects();

      if (!activeObj) {
        setHasSelection(false);
        return;
      }

      setHasSelection(true);

      // Determine Selection Type
      if (activeObjects.length > 1) {
        setSelectionType('multiple');
      } else if (activeObj.type === 'group') {
        setSelectionType('group');
      } else if (activeObj.type === 'image') {
        setSelectionType('image');
      } else if (activeObj.type === 'i-text' || activeObj.type === 'text') {
        setSelectionType('text');
        if (!isUpdatingRef.current) {
          setTextContent((activeObj as any).text || "");
          setFontFamily((activeObj as any).fontFamily || "Inter");
        }
      } else {
        setSelectionType('single');
      }
    };

    const handleClear = () => {
      setHasSelection(false);
      setShowColorPicker(false);
    };

    canvas.on('selection:created', updateState);
    canvas.on('selection:updated', updateState);
    canvas.on('selection:cleared', handleClear);

    // Listen for object modifications to keep UI in sync (optional but good for text)
    // We avoid circular updates by checking isUpdatingRef roughly, mostly helpful for external updates

    // Initial check
    updateState();

    return () => {
      canvas.off('selection:created', updateState);
      canvas.off('selection:updated', updateState);
      canvas.off('selection:cleared', handleClear);
    };
  }, [canvas]);

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
      canvas.requestRenderAll();
    });
    onDuplicate?.();
  }, [canvas, onDuplicate]);

  const handleGroup = useCallback(() => {
    if (onGroup) {
      onGroup();
      return;
    }
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') return;
    (activeObj as any).toGroup();
    canvas.requestRenderAll();
    // Fire event to notify listeners (like LayersPanel)
    canvas.fire('selection:created', { selected: [canvas.getActiveObject()] } as any);
  }, [canvas, onGroup]);

  const handleUngroup = useCallback(() => {
    if (onUngroup) {
      onUngroup();
      return;
    }
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') return;
    (activeObj as any).toActiveSelection();
    canvas.requestRenderAll();
    canvas.fire('selection:created', { selected: canvas.getActiveObjects() } as any);
  }, [canvas, onUngroup]);

  const handleColorSelect = useCallback((color: string) => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      if (obj.type === 'line' || obj.type === 'path') {
        obj.set({ stroke: color });
      } else {
        obj.set({ fill: color });
      }
    });
    canvas.requestRenderAll();
    setShowColorPicker(false);
    onColorChange?.(color);
  }, [canvas, onColorChange]);

  // Text Handlers
  const handleTextChange = useCallback((text: string) => {
    setTextContent(text);
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      isUpdatingRef.current = true;
      (activeObj as any).set('text', text);
      canvas.requestRenderAll();
      isUpdatingRef.current = false;
    }
  }, [canvas]);

  const handleFontChange = useCallback((font: string) => {
    setFontFamily(font);
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      (activeObj as any).set('fontFamily', font);
      canvas.requestRenderAll();
    }
  }, [canvas]);


  if (hideToolbar) return null;

  return (
    <div className="flex items-center gap-1 p-1.5 glass rounded-xl border border-panel-border shadow-2xl transition-all duration-300 ease-in-out">

      {/* Undo/Redo - Always Visible */}
      <div className="flex items-center gap-1">
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
      </div>

      {hasSelection && (
        <div className="flex items-center gap-1 animate-in slide-in-from-left-2 fade-in duration-300">
          {/* Vertical Divider */}
          <div className="w-px h-5 bg-panel-border mx-1" />



          {/* Image Tools */}
          {selectionType === 'image' && (
            <>
              <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={onCrop} title="Crop Image">
                <Crop className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-panel-border mx-1" />
            </>
          )}

          {/* Grouping Tools */}
          {selectionType === 'multiple' && (
            <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={handleGroup} title="Group">
              <Group className="w-4 h-4" />
            </Button>
          )}
          {selectionType === 'group' && (
            <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={handleUngroup} title="Ungroup">
              <Ungroup className="w-4 h-4" />
            </Button>
          )}

          {/* Standard Tools (Color, Dupe, Order, Delete) */}

          {/* Color picker */}
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button variant="toolbar" size="icon" className="w-9 h-9">
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="bottom" align="start">
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

          <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={handleDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>

          <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={onBringForward}>
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button variant="toolbar" size="icon" className="w-9 h-9" onClick={onSendBackward}>
            <ArrowDown className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-panel-border mx-1" />

          <Button
            variant="toolbar"
            size="icon"
            className="w-9 h-9 hover:bg-destructive/20 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
