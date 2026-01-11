import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Move,
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
  Maximize,
  Minimize,
  Cog,
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
  onFullscreen: () => void;
  onGCode: () => void;
  hasImage: boolean;
  hasSvg: boolean;
  isTracing: boolean;
  isFullscreen: boolean;
  canvas: FabricCanvas | null;
  svgContent: string | null;
}

const navigationTools = [
  { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
  { id: 'pan' as DrawingTool, icon: Hand, label: 'Pan (H)', shortcut: 'H' },
];

const drawingTools = [
  { id: 'pen' as DrawingTool, icon: Pen, label: 'Pen Tool (P)', shortcut: 'P' },
  { id: 'pencil' as DrawingTool, icon: Pencil, label: 'Pencil (B)', shortcut: 'B' },
];

const shapeTools = [
  { id: 'line' as DrawingTool, icon: Minus, label: 'Line (L)', shortcut: 'L' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle (R)', shortcut: 'R' },
  { id: 'ellipse' as DrawingTool, icon: Circle, label: 'Ellipse (O)', shortcut: 'O' },
  { id: 'polygon' as DrawingTool, icon: Hexagon, label: 'Polygon (Y)', shortcut: 'Y' },
];

const textTools = [
  { id: 'text' as DrawingTool, icon: Type, label: 'Text (T)', shortcut: 'T' },
];

const imageTools = [
  { id: 'crop' as DrawingTool, icon: Crop, label: 'Crop (C)', shortcut: 'C' },
  { id: 'transform' as DrawingTool, icon: Move3D, label: 'Transform (E)', shortcut: 'E' },
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
  onFullscreen,
  onGCode,
  hasImage,
  hasSvg,
  isTracing,
  isFullscreen,
  canvas,
  svgContent,
}: DrawingToolbarProps) => {
  const renderToolGroup = (tools: typeof navigationTools, borderRight = true) => (
    <div className={cn("flex items-center gap-0.5", borderRight && "pr-1.5 md:pr-2 border-r border-panel-border")}>
      {tools.map((tool) => (
        <TooltipProvider key={tool.id} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8 md:w-9 md:h-9"
                onClick={() => onToolChange(tool.id)}
              >
                <tool.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <span>{tool.label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 md:p-2 glass rounded-xl border border-panel-border animate-fade-in">
      {/* Navigation tools */}
      {renderToolGroup(navigationTools)}

      {/* Drawing tools */}
      {renderToolGroup(drawingTools)}

      {/* Shape tools */}
      {renderToolGroup(shapeTools)}

      {/* Text tools */}
      {renderToolGroup(textTools)}

      {/* Image tools */}
      {renderToolGroup(imageTools)}

      {/* Zoom controls */}
      <div className="hidden sm:flex items-center gap-0.5 px-1.5 md:px-2 border-r border-panel-border">
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-9 md:h-9" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-9 md:h-9" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-9 md:h-9" onClick={onReset} title="Reset View">
          <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button 
          variant="toolbar" 
          size="icon" 
          className="w-8 h-8 md:w-9 md:h-9" 
          onClick={onFullscreen} 
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5 md:w-4 md:h-4" />
          ) : (
            <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
        </Button>
      </div>

      {/* File actions */}
      <div className="flex items-center gap-0.5 px-1.5 md:px-2 border-r border-panel-border">
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 md:w-9 md:h-9 glow-effect"
          onClick={onUpload}
          title="Upload Image"
        >
          <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 md:w-9 md:h-9"
          onClick={onClear}
          disabled={!hasImage}
          title="Clear Canvas"
        >
          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </div>

      {/* Trace & Export */}
      <div className="flex items-center gap-1 pl-1.5 md:pl-2">
        <Button
          variant={isTracing ? "toolbar-active" : "default"}
          size="sm"
          onClick={onTrace}
          disabled={!hasImage || isTracing}
          className={cn(
            "gap-1.5 md:gap-2 font-mono text-[10px] md:text-xs h-8 md:h-9 px-2 md:px-3",
            isTracing && "animate-pulse"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden xs:inline">{isTracing ? "Tracing..." : "Trace"}</span>
        </Button>
        
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="toolbar"
                size="icon"
                className="w-8 h-8 md:w-9 md:h-9"
                onClick={onGCode}
                title="G-Code Generator"
              >
                <Cog className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              G-Code Generator
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <ExportMenu 
          canvas={canvas} 
          svgContent={svgContent} 
          disabled={!hasImage && !hasSvg}
        />
      </div>
    </div>
  );
};
