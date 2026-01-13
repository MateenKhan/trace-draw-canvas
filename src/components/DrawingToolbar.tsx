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
  Wand2,
  SlidersHorizontal,
  Play,
  Shapes,
  FolderOpen,
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
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
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
  onToggleProjects?: () => void;
}

// Shape tools cycle order for mobile
const shapeToolsCycle: DrawingTool[] = ['line', 'rectangle', 'ellipse', 'polygon'];

// Get icon for current shape tool
const getShapeIcon = (tool: DrawingTool) => {
  switch (tool) {
    case 'line': return Minus;
    case 'rectangle': return Square;
    case 'ellipse': return Circle;
    case 'polygon': return Hexagon;
    default: return Shapes;
  }
};

// Check if tool is a shape tool
const isShapeTool = (tool: DrawingTool): boolean => {
  return shapeToolsCycle.includes(tool);
};

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
  onDeleteSelected,
  canDeleteSelected,
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
  onToggleProjects,
}: DrawingToolbarProps) => {
  const isPenOrPencil = activeTool === 'pen' || activeTool === 'pencil';
  const [currentShapeTool, setCurrentShapeTool] = useState<DrawingTool>('line');

  // Cycle through shape tools on mobile
  const handleShapeToolClick = useCallback(() => {
    const currentIndex = shapeToolsCycle.indexOf(currentShapeTool);
    const nextIndex = (currentIndex + 1) % shapeToolsCycle.length;
    const nextTool = shapeToolsCycle[nextIndex];
    setCurrentShapeTool(nextTool);
    onToolChange(nextTool);
  }, [currentShapeTool, onToolChange]);

  const handleMobileToolClick = useCallback((id: string) => {
    if (id === 'settings') {
      onToggleSettings?.();
    } else if (id === 'trace') {
      onTrace();
    } else if (id === 'shape') {
      handleShapeToolClick();
    } else if (id === 'gcode') {
      onGCode();
    } else if (id === '3d') {
      on3D();
    } else if (id === 'projects') {
      onToggleProjects?.();
    } else {
      onToolChange(id as DrawingTool);
    }
  }, [onToolChange, onToggleSettings, onTrace, handleShapeToolClick, onGCode, on3D, onToggleProjects]);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background border-t border-panel-border pb-safe shrink-0" style={{ willChange: 'transform' }}>
      {/* Brush size slider - shown when pen/pencil is active */}
      <div className="px-4 pt-2">
        <BrushSizeSlider
          size={brushSize}
          onChange={onBrushSizeChange}
          isVisible={isPenOrPencil}
          strokeColor={strokeColor}
        />
      </div>

      {/* Mobile toolbar - Two-row layout */}
      <div className="flex sm:hidden flex-col">
        {/* Top row - Main tools */}
        <div className="flex items-center justify-around px-2 py-2 border-b border-panel-border/50">
          {/* Select */}
          <button
            onClick={() => handleMobileToolClick('select')}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]",
              activeTool === 'select' 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MousePointer2 className="w-5 h-5" />
            <span className="text-[9px] font-medium">Select</span>
          </button>

          {/* Draw */}
          <button
            onClick={() => handleMobileToolClick('pen')}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]",
              activeTool === 'pen' || activeTool === 'pencil'
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Pen className="w-5 h-5" />
            <span className="text-[9px] font-medium">Draw</span>
          </button>

          {/* Shape - cycles through line, rect, ellipse, polygon */}
          <button
            onClick={() => handleMobileToolClick('shape')}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]",
              isShapeTool(activeTool)
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {(() => {
              const ShapeIcon = getShapeIcon(currentShapeTool);
              return <ShapeIcon className="w-5 h-5" />;
            })()}
            <span className="text-[9px] font-medium">
              {currentShapeTool === 'line' ? 'Line' : 
               currentShapeTool === 'rectangle' ? 'Rect' :
               currentShapeTool === 'ellipse' ? 'Circle' : 'Polygon'}
            </span>
          </button>

          {/* Trace */}
          <button
            onClick={() => handleMobileToolClick('trace')}
            disabled={!hasImage || isTracing}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]",
              isTracing
                ? "text-primary bg-primary/10 animate-pulse" 
                : "text-muted-foreground hover:text-foreground",
              (!hasImage || isTracing) && "opacity-50"
            )}
          >
            <Wand2 className="w-5 h-5" />
            <span className="text-[9px] font-medium">Trace</span>
          </button>

          {/* Upload */}
          <button
            onClick={onUpload}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-5 h-5" />
            <span className="text-[9px] font-medium">Upload</span>
          </button>
        </div>

        {/* Bottom row - Actions & Export */}
        <div className="flex items-center justify-around px-2 py-2">
          {/* Projects */}
          <button
            onClick={() => handleMobileToolClick('projects')}
            className="flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-[8px] font-medium">Projects</span>
          </button>

          {/* Adjust/Settings */}
          <button
            onClick={() => handleMobileToolClick('settings')}
            className="flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[8px] font-medium">Adjust</span>
          </button>

          {/* Simulate/G-Code */}
          <button
            onClick={() => handleMobileToolClick('gcode')}
            className="flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] text-muted-foreground hover:text-foreground"
          >
            <Play className="w-4 h-4" />
            <span className="text-[8px] font-medium">Sim</span>
          </button>

          {/* 3D */}
          <button
            onClick={() => handleMobileToolClick('3d')}
            className="flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] text-muted-foreground hover:text-foreground"
          >
            <Box className="w-4 h-4" />
            <span className="text-[8px] font-medium">3D</span>
          </button>

          {/* Export */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
            <ExportMenu 
              canvas={canvas} 
              svgContent={svgContent} 
              disabled={!hasImage && !hasSvg}
            />
            <span className="text-[8px] font-medium text-muted-foreground">Export</span>
          </div>
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
