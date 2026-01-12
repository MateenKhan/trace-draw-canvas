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
  ChevronLeft,
  ChevronRight,
  Settings2,
  PanelRightClose,
  PanelRight,
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
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

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

// Tool groups for mobile swipe navigation
const toolGroups = [
  {
    id: 'select',
    label: 'Select',
    tools: [
      { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select' },
      { id: 'pan' as DrawingTool, icon: Hand, label: 'Pan' },
    ],
  },
  {
    id: 'draw',
    label: 'Draw',
    tools: [
      { id: 'pen' as DrawingTool, icon: Pen, label: 'Pen' },
      { id: 'pencil' as DrawingTool, icon: Pencil, label: 'Pencil' },
    ],
  },
  {
    id: 'shapes',
    label: 'Shapes',
    tools: [
      { id: 'line' as DrawingTool, icon: Minus, label: 'Line' },
      { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle' },
      { id: 'ellipse' as DrawingTool, icon: Circle, label: 'Ellipse' },
      { id: 'polygon' as DrawingTool, icon: Hexagon, label: 'Polygon' },
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    tools: [
      { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
      { id: 'crop' as DrawingTool, icon: Crop, label: 'Crop' },
      { id: 'transform' as DrawingTool, icon: Move3D, label: 'Transform' },
    ],
  },
];

// Desktop tools arrays (keep for desktop layout)
const selectionTools = toolGroups[0].tools;
const drawingTools = toolGroups[1].tools;
const shapeTools = toolGroups[2].tools;
const objectTools = toolGroups[3].tools;

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
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const goToNextGroup = useCallback(() => {
    setActiveGroupIndex((prev) => (prev + 1) % toolGroups.length);
  }, []);

  const goToPrevGroup = useCallback(() => {
    setActiveGroupIndex((prev) => (prev - 1 + toolGroups.length) % toolGroups.length);
  }, []);

  const { handlers } = useSwipeGesture({
    minSwipeDistance: 40,
    onSwipeLeft: goToNextGroup,
    onSwipeRight: goToPrevGroup,
  });

  const ToolButton = ({ tool, isActive, compact = false }: { 
    tool: typeof selectionTools[0]; 
    isActive: boolean;
    compact?: boolean;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "toolbar-active" : "toolbar"}
            size="icon"
            className={cn(compact ? "w-11 h-11" : "w-12 h-12")}
            onClick={() => onToolChange(tool.id)}
          >
            <tool.icon className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tool.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const ActionButton = ({ icon: Icon, label, onClick, disabled, active, className, compact = false }: {
    icon: typeof Upload;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    className?: string;
    compact?: boolean;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? "toolbar-active" : "toolbar"}
            size="icon"
            className={cn(compact ? "w-11 h-11" : "w-12 h-12", className)}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const activeGroup = toolGroups[activeGroupIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-2 p-3 pb-safe bg-background/80 backdrop-blur-lg border-t border-panel-border">
      {/* Brush size slider - shown when pen/pencil is active */}
      <BrushSizeSlider
        size={brushSize}
        onChange={onBrushSizeChange}
        isVisible={isPenOrPencil}
        strokeColor={strokeColor}
      />

      {/* Mobile toolbar with swipe navigation */}
      <div 
        className="flex sm:hidden items-center justify-between gap-1 p-2 glass rounded-2xl border border-panel-border"
        {...handlers}
      >
        {/* Prev button */}
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={goToPrevGroup}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Tool group with swipe area */}
        <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
          {/* Tools in current group */}
          <div className="flex items-center gap-1">
            {activeGroup.tools.map((tool) => (
              <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} compact />
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-panel-border mx-1" />

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <ActionButton icon={Upload} label="Upload" onClick={onUpload} compact />
            <ActionButton 
              icon={Sparkles} 
              label="Trace" 
              onClick={onTrace} 
              disabled={!hasImage || isTracing}
              active={isTracing}
              compact
            />
            <ExportMenu 
              canvas={canvas} 
              svgContent={svgContent} 
              disabled={!hasImage && !hasSvg}
            />
            {onToggleSettings && (
              <ActionButton icon={Settings2} label="Settings" onClick={onToggleSettings} compact />
            )}
          </div>
        </div>

        {/* Next button */}
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={goToNextGroup}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile group indicator dots */}
      <div className="flex sm:hidden items-center justify-center gap-1.5">
        {toolGroups.map((group, index) => (
          <button
            key={group.id}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              index === activeGroupIndex 
                ? "bg-primary w-3" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => setActiveGroupIndex(index)}
            aria-label={`Go to ${group.label} tools`}
          />
        ))}
      </div>

      {/* Desktop toolbar */}
      <div className="hidden sm:flex items-center justify-center gap-1 p-2 glass rounded-2xl border border-panel-border">
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
