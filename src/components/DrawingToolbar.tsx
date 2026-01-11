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
  Download,
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
}

// Selection & Navigation tools
const selectionTools = [
  { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select (V)' },
  { id: 'pan' as DrawingTool, icon: Hand, label: 'Pan (H)' },
];

// Drawing tools
const drawingTools = [
  { id: 'pen' as DrawingTool, icon: Pen, label: 'Pen (P)' },
  { id: 'pencil' as DrawingTool, icon: Pencil, label: 'Pencil (B)' },
];

// Shape tools
const shapeTools = [
  { id: 'line' as DrawingTool, icon: Minus, label: 'Line (L)' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle (R)' },
  { id: 'ellipse' as DrawingTool, icon: Circle, label: 'Ellipse (O)' },
  { id: 'polygon' as DrawingTool, icon: Hexagon, label: 'Polygon (Y)' },
];

// Object tools
const objectTools = [
  { id: 'text' as DrawingTool, icon: Type, label: 'Text (T)' },
  { id: 'crop' as DrawingTool, icon: Crop, label: 'Crop (C)' },
  { id: 'transform' as DrawingTool, icon: Move3D, label: 'Transform (E)' },
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
}: DrawingToolbarProps) => {
  const isPenOrPencil = activeTool === 'pen' || activeTool === 'pencil';

  const ToolButton = ({ tool, isActive }: { tool: typeof selectionTools[0]; isActive: boolean }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "toolbar-active" : "toolbar"}
            size="icon"
            className="w-10 h-10"
            onClick={() => onToolChange(tool.id)}
          >
            <tool.icon className="w-5 h-5" />
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
            className={cn("w-10 h-10", className)}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Brush size slider - shown when pen/pencil is active */}
      <BrushSizeSlider
        size={brushSize}
        onChange={onBrushSizeChange}
        isVisible={isPenOrPencil}
        strokeColor={strokeColor}
      />

      {/* Main bottom toolbar */}
      <div className="flex items-center justify-center gap-1 p-2 glass rounded-2xl border border-panel-border">
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
        <div className="hidden sm:flex items-center gap-0.5">
          <ActionButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
          <ActionButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
          <ActionButton icon={RotateCcw} label="Reset View" onClick={onReset} />
          <ActionButton 
            icon={isFullscreen ? Minimize : Maximize} 
            label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} 
            onClick={onFullscreen} 
          />
        </div>

        <div className="hidden sm:block w-px h-6 bg-panel-border mx-1" />

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
        </div>
      </div>
    </div>
  );
};
