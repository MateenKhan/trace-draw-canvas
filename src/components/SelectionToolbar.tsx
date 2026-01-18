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
  Layers,
  Ban,
  Slash,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
  "#ffffff", "#000000", "transparent",
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
  const [colorTarget, setColorTarget] = useState<'fill' | 'stroke'>('fill');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(2);

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

    const handleObjectModified = () => {
      updateState();
    };

    canvas.on('selection:created', updateState);
    canvas.on('selection:updated', updateState);
    canvas.on('selection:cleared', handleClear);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:scaling', handleObjectModified);

    // Initial check
    updateState();

    return () => {
      canvas.off('selection:created', updateState);
      canvas.off('selection:updated', updateState);
      canvas.off('selection:cleared', handleClear);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:scaling', handleObjectModified);
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
      if (colorTarget === 'stroke') {
        obj.set({ stroke: color === 'transparent' ? 'transparent' : color });
        if (obj.strokeWidth === 0 && color !== 'transparent') {
          obj.set({ strokeWidth: 2 });
        }
      } else {
        obj.set({ fill: color === 'transparent' ? 'transparent' : color });
      }
    });
    canvas.requestRenderAll();
    // Don't close popover to allow more edits
    onColorChange?.(color);
  }, [canvas, colorTarget, onColorChange]);

  const handleStrokeWidthChange = useCallback((width: number) => {
    if (!canvas) return;
    setActiveStrokeWidth(width);
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      obj.set({ strokeWidth: width });
    });
    canvas.requestRenderAll();
  }, [canvas]);

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
            <PopoverContent className="w-64 p-3 bg-background/90 backdrop-blur-md border-panel-border shadow-2xl" side="bottom" align="start">
              <div className="space-y-4">
                {/* Target Toggle */}
                <div className="flex bg-secondary/30 p-1 rounded-lg">
                  <button
                    className={cn(
                      "flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                      colorTarget === 'fill' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary/50 text-muted-foreground"
                    )}
                    onClick={() => setColorTarget('fill')}
                  >
                    Content / Fill
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                      colorTarget === 'stroke' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary/50 text-muted-foreground"
                    )}
                    onClick={() => setColorTarget('stroke')}
                  >
                    Border / Stroke
                  </button>
                </div>

                {/* Quick Colors */}
                <div className="grid grid-cols-6 gap-2">
                  {QUICK_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-lg border border-white/10 hover:border-primary transition-all active:scale-95 flex items-center justify-center overflow-hidden",
                        color === 'transparent' && "bg-secondary/20"
                      )}
                      style={{ backgroundColor: color !== 'transparent' ? color : 'transparent' }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    >
                      {color === 'transparent' && <Ban className="w-4 h-4 text-destructive/60" />}
                    </button>
                  ))}
                </div>

                {/* Stroke Width (only for Stroke target or if wanted) */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stroke Size</Label>
                    <span className="text-[10px] font-mono text-primary font-bold">{activeStrokeWidth}px</span>
                  </div>
                  <Slider
                    value={[activeStrokeWidth]}
                    onValueChange={(v) => handleStrokeWidthChange(v[0])}
                    min={0}
                    max={50}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex gap-1 pt-1 overflow-x-auto pb-1 scrollbar-none">
                    {[1, 2, 4, 8, 12, 24].map((v) => (
                      <Button
                        key={v}
                        variant="secondary"
                        size="sm"
                        className="h-5 text-[9px] px-1.5 min-w-[24px]"
                        onClick={() => handleStrokeWidthChange(v)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
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
