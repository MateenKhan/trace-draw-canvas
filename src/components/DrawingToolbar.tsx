import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Hand,
  Pen,
  Pencil,
  Minus,
  Square,
  Circle,
  Hexagon,
  Type,
  Crop,
  Move3D,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  Sparkles,
  Trash2,
  Trash,
  Maximize,
  Minimize,
  Cog,
  Box,
  Settings2,
  PanelRightClose,
  PanelRight,
  Image,
  Sun,
  Palette,
  Droplet,
  Layers,
  Triangle,
  Wand2,
  Eraser,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingTool } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportMenu } from "@/components/ExportMenu";
import { BrushSizeSlider } from "@/components/BrushSizeSlider";
import { Canvas as FabricCanvas } from "fabric";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onUpload: () => void;
  onTrace: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
  canClear: boolean;
  onFullscreen: () => void;
  onGCode: () => void;
  on3D: () => void;
  hasImage: boolean;
  hasSvg: boolean;
  isTracing: boolean;
  isFullscreen: boolean;
  canvas: FabricCanvas | null;
  svgContent: string | null;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  strokeColor: string;
  onToggleSettings?: () => void;
  onToggleLayers?: () => void;
  showLayersPanel?: boolean;
}

// Top row - category buttons with labels (like Lightroom's Auto, Light, Color, etc.)
const categoryButtons = [
  { id: 'upload', icon: Image, label: 'Auto' },
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'color', icon: Palette, label: 'Color' },
  { id: 'blur', icon: Droplet, label: 'Blur' },
  { id: 'effects', icon: Layers, label: 'Effects' },
  { id: 'detail', icon: Triangle, label: 'Detail' },
];

// Bottom row - tool buttons (drawing tools)
const toolButtons = [
  { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select' },
  { id: 'pen' as DrawingTool, icon: Pen, label: 'Draw' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: 'Shape' },
  { id: 'settings', icon: SlidersHorizontal, label: 'Adjust' },
  { id: 'trace', icon: Wand2, label: 'Trace' },
  { id: 'eraser', icon: Eraser, label: 'Erase' },
];

// Desktop tools arrays
const selectionTools = [
  { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select' },
  { id: 'pan' as DrawingTool, icon: Hand, label: 'Pan' },
];

const drawingTools = [
  { id: 'pen' as DrawingTool, icon: Pen, label: 'Pen' },
  { id: 'pencil' as DrawingTool, icon: Pencil, label: 'Pencil' },
];

const shapeTools = [
  { id: 'line' as DrawingTool, icon: Minus, label: 'Line' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle' },
  { id: 'ellipse' as DrawingTool, icon: Circle, label: 'Ellipse' },
  { id: 'polygon' as DrawingTool, icon: Hexagon, label: 'Polygon' },
];

const objectTools = [
  { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
  { id: 'crop' as DrawingTool, icon: Crop, label: 'Crop' },
  { id: 'transform' as DrawingTool, icon: Move3D, label: 'Transform' },
];

export const DrawingToolbar = ({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onUpload,
  onTrace,
  onClear,
  onDeleteSelected,
  canDeleteSelected,
  canClear,
  onFullscreen,
  onGCode,
  on3D,
  hasImage,
  hasSvg,
  isTracing,
  isFullscreen,
  canvas,
  svgContent,
  brushSize,
  onBrushSizeChange,
  strokeColor,
  onToggleSettings,
  onToggleLayers,
  showLayersPanel,
}: DrawingToolbarProps) => {
  const isPenOrPencil = activeTool === 'pen' || activeTool === 'pencil';
  const [activeCategory, setActiveCategory] = useState('upload');

  const handleCategoryClick = useCallback((id: string) => {
    setActiveCategory(id);
    if (id === 'upload') {
      onUpload();
    }
  }, [onUpload]);

  const handleToolClick = useCallback((id: string) => {
    if (id === 'settings') {
      onToggleSettings?.();
    } else if (id === 'trace') {
      onTrace();
    } else if (id === 'eraser') {
      onClear();
    } else {
      onToolChange(id as DrawingTool);
    }
  }, [onToolChange, onToggleSettings, onTrace, onClear]);

  const ToolButton = ({ tool, isActive }: { 
    tool: typeof selectionTools[0]; 
    isActive: boolean;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "toolbar-active" : "toolbar"}
            size="icon"
            className="w-12 h-12 sm:w-12 sm:h-12"
            onClick={() => onToolChange(tool.id)}
          >
            <tool.icon className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tool.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const ActionButton = ({ icon: Icon, label, onClick, disabled, active, className }: {
    icon: typeof Upload;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    className?: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? "toolbar-active" : "toolbar"}
            size="icon"
            className={cn("w-12 h-12", className)}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background border-t border-panel-border pb-safe">
      {/* Brush size slider - shown when pen/pencil is active */}
      <div className="px-4 pt-2">
        <BrushSizeSlider
          size={brushSize}
          onChange={onBrushSizeChange}
          isVisible={isPenOrPencil}
          strokeColor={strokeColor}
        />
      </div>

      {/* Mobile toolbar - Two-row layout like Lightroom */}
      <div className="flex sm:hidden flex-col">
        {/* Top row - Categories with labels */}
        <div className="flex items-center justify-around px-2 py-3 border-b border-panel-border/50">
          {categoryButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleCategoryClick(btn.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-1 rounded-lg transition-colors min-w-[50px]",
                activeCategory === btn.id 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <btn.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Bottom row - Tools */}
        <div className="flex items-center justify-around px-2 py-3">
          {toolButtons.map((btn) => {
            const isActive = btn.id === activeTool || 
              (btn.id === 'settings' && false) ||
              (btn.id === 'trace' && isTracing);
            
            return (
              <button
                key={btn.id}
                onClick={() => handleToolClick(btn.id)}
                disabled={btn.id === 'trace' && (!hasImage || isTracing)}
                className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  btn.id === 'trace' && (!hasImage || isTracing) && "opacity-50"
                )}
              >
                <btn.icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden sm:flex items-center justify-center gap-1 p-2 m-2 glass rounded-2xl border border-panel-border">
        {/* Selection & Navigation */}
        <div className="flex items-center gap-0.5">
          {selectionTools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} />
          ))}
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* Drawing */}
        <div className="flex items-center gap-0.5">
          {drawingTools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} />
          ))}
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* Shapes */}
        <div className="flex items-center gap-0.5">
          {shapeTools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} />
          ))}
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* Objects */}
        <div className="flex items-center gap-0.5">
          {objectTools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} />
          ))}
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* View controls */}
        <div className="flex items-center gap-0.5">
          <ActionButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
          <ActionButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
          <ActionButton icon={RotateCcw} label="Reset View" onClick={onReset} />
          <ActionButton 
            icon={isFullscreen ? Minimize : Maximize} 
            label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} 
            onClick={onFullscreen} 
          />
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* File actions */}
        <div className="flex items-center gap-0.5">
          <ActionButton icon={Upload} label="Upload Image" onClick={onUpload} className="glow-effect" />
          <ActionButton icon={Trash2} label="Delete Selected" onClick={onDeleteSelected} disabled={!canDeleteSelected} />
          <ActionButton icon={Trash} label="Clear Canvas" onClick={onClear} disabled={!canClear} />
        </div>

        <div className="w-px h-6 bg-panel-border mx-1" />

        {/* Generate & Export */}
        <div className="flex items-center gap-0.5">
          <ActionButton 
            icon={Sparkles} 
            label={isTracing ? "Tracing..." : "Trace"} 
            onClick={onTrace} 
            disabled={!hasImage || isTracing}
            active={isTracing}
            className={cn(isTracing && "animate-pulse")}
          />
          <ActionButton icon={Cog} label="G-Code Generator" onClick={onGCode} />
          <ActionButton icon={Box} label="3D Extrusion" onClick={on3D} />
          <ExportMenu 
            canvas={canvas} 
            svgContent={svgContent} 
            disabled={!hasImage && !hasSvg}
          />
          {onToggleLayers && (
            <ActionButton 
              icon={showLayersPanel ? PanelRightClose : PanelRight} 
              label="Toggle Layers" 
              onClick={onToggleLayers} 
            />
          )}
        </div>
      </div>
    </div>
  );
};
