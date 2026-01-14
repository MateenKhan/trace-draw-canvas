import { useState, useCallback, useRef, useEffect } from "react";
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
  Maximize,
  Minimize,
  Settings2,
  PanelRightClose,
  PanelRight,
  Image as ImageIcon,
  Play,
  Shapes,
  FolderOpen,
  Box,
  Download,
  History,
  Menu,
  Spline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingTool, StrokeStyle, FillStyle, TextStyle, ImageFilter } from "@/lib/types";
import { TraceSettings } from "@/lib/tracing";
import { ExportMenu } from "@/components/ExportMenu";
import { Canvas as FabricCanvas } from "fabric";
import { BottomSettingsPanel } from "@/components/BottomSettingsPanel";

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
  onToggleHistory?: () => void;

  // Settings props
  stroke: StrokeStyle;
  fill: FillStyle;
  textStyle: TextStyle;
  imageFilter: ImageFilter;
  traceSettings: TraceSettings;
  onStrokeChange: (stroke: StrokeStyle) => void;
  onFillChange: (fill: FillStyle) => void;
  onTextStyleChange: (style: TextStyle) => void;
  onImageFilterChange: (filter: ImageFilter) => void;
  onTraceSettingsChange: (settings: TraceSettings) => void;
}

type DockCategory = 'select' | 'draw' | 'shapes' | 'sim' | '3d' | 'settings' | 'image' | 'layers' | 'export' | 'projects' | null;

export const DrawingToolbar = (props: DrawingToolbarProps) => {
  const [activeCategory, setActiveCategory] = useState<DockCategory>(null);

  // Auto-select category based on active tool change (external)
  useEffect(() => {
    switch (props.activeTool) {
      case 'select':
      case 'pan':
        setActiveCategory('select');
        break;
      case 'pen':
      case 'pencil':
        setActiveCategory('draw');
        break;
      case 'line':
      case 'rectangle':
      case 'ellipse':
      case 'polygon':
        setActiveCategory('shapes');
        break;
      default:
        break;
    }
  }, [props.activeTool]);

  const handleCategoryClick = (cat: DockCategory) => {
    if (cat === activeCategory && cat !== 'sim' && cat !== '3d') {
      // Toggle off if clicking same, unless it's a trigger-only category
      setActiveCategory(null);
      return;
    }

    // Trigger-only categories
    if (cat === 'sim') {
      props.onGCode();
      return;
    }
    if (cat === '3d') {
      props.on3D();
      return;
    }
    if (cat === 'layers') {
      props.onToggleLayers?.();
      return;
    }
    if (cat === 'projects') {
      props.onToggleProjects?.();
      return;
    }

    setActiveCategory(cat);
  };

  const ToolIcon = ({ icon: Icon, label, isActive, onClick, disabled, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 rounded-xl transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  const SubToolButton = ({ icon: Icon, label, isActive, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
        isActive
          ? "bg-primary border-primary text-primary-foreground shadow-md"
          : "bg-background border-border text-foreground hover:bg-secondary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-none">

      {/* Row 2: Contextual Tools / Settings Panel */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="w-full max-w-3xl px-4 animate-slide-up">

          {/* Settings Popup */}
          {activeCategory === 'settings' && (
            <BottomSettingsPanel
              stroke={props.stroke}
              fill={props.fill}
              textStyle={props.textStyle}
              imageFilter={props.imageFilter}
              traceSettings={props.traceSettings}
              onStrokeChange={props.onStrokeChange}
              onFillChange={props.onFillChange}
              onTextStyleChange={props.onTextStyleChange}
              onImageFilterChange={props.onImageFilterChange}
              onTraceSettingsChange={props.onTraceSettingsChange}
            />
          )}

          {/* Sub-toolbar container */}
          {['select', 'draw', 'shapes', 'image'].includes(activeCategory || '') && (
            <div className="mb-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-2 flex gap-2 overflow-x-auto custom-horizontal-scrollbar mx-auto max-w-full justify-start md:justify-center">

              {/* Select Tools */}
              {activeCategory === 'select' && (
                <>
                  <SubToolButton
                    icon={MousePointer2}
                    label="Select"
                    isActive={props.activeTool === 'select'}
                    onClick={() => props.onToolChange('select')}
                  />
                  <SubToolButton
                    icon={Hand}
                    label="Pan"
                    isActive={props.activeTool === 'pan'}
                    onClick={() => props.onToolChange('pan')}
                  />
                  <div className="w-px bg-border/50 mx-1" />
                  <SubToolButton
                    icon={Trash2}
                    label="Delete"
                    disabled={!props.canDeleteSelected}
                    onClick={props.onDeleteSelected}
                  />
                  <SubToolButton
                    icon={History}
                    label="History"
                    onClick={props.onToggleHistory}
                  />
                </>
              )}

              {/* Draw Tools */}
              {activeCategory === 'draw' && (
                <>
                  <SubToolButton
                    icon={Pen}
                    label="Pen"
                    isActive={props.activeTool === 'pen'}
                    onClick={() => props.onToolChange('pen')}
                  />
                  <SubToolButton
                    icon={Pencil}
                    label="Pencil"
                    isActive={props.activeTool === 'pencil'}
                    onClick={() => props.onToolChange('pencil')}
                  />
                  <SubToolButton
                    icon={Spline}
                    label="Spline"
                    isActive={props.activeTool === 'spline'}
                    onClick={() => props.onToolChange('spline')}
                  />
                </>
              )}

              {/* Shape Tools */}
              {activeCategory === 'shapes' && (
                <>
                  <SubToolButton
                    icon={Square}
                    label="Square"
                    isActive={props.activeTool === 'rectangle'}
                    onClick={() => props.onToolChange('rectangle')}
                  />
                  <SubToolButton
                    icon={Minus}
                    label="Line"
                    isActive={props.activeTool === 'line'}
                    onClick={() => props.onToolChange('line')}
                  />
                  <SubToolButton
                    icon={Hexagon}
                    label="Polygon"
                    isActive={props.activeTool === 'polygon'}
                    onClick={() => props.onToolChange('polygon')}
                  />
                  <SubToolButton
                    icon={Circle}
                    label="Circle"
                    isActive={props.activeTool === 'ellipse'}
                    onClick={() => props.onToolChange('ellipse')}
                  />
                </>
              )}

              {/* Image Tools */}
              {activeCategory === 'image' && (
                <>
                  <SubToolButton
                    icon={Upload}
                    label="Upload"
                    onClick={props.onUpload}
                  />
                  <SubToolButton
                    icon={Sparkles}
                    label="Trace"
                    disabled={!props.hasImage}
                    isActive={props.isTracing}
                    onClick={props.onTrace}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Row 1: Bottom Dock (Scrollable) */}
      <div className="w-full bg-background/95 backdrop-blur-md border-t border-panel-border pb-safe pointer-events-auto">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto custom-horizontal-scrollbar justify-start md:justify-center min-w-full">



          <ToolIcon
            icon={PanelRight}
            label="Layers"
            isActive={props.showLayersPanel}
            onClick={() => handleCategoryClick('layers')}
          />

          <div className="w-px h-8 bg-border/50 mx-1 shrink-0" />

          <ToolIcon
            icon={MousePointer2}
            label="Select"
            isActive={activeCategory === 'select'}
            onClick={() => handleCategoryClick('select')}
          />
          <ToolIcon
            icon={Pencil}
            label="Draw"
            isActive={activeCategory === 'draw'}
            onClick={() => handleCategoryClick('draw')}
          />
          <ToolIcon
            icon={Shapes}
            label="Shapes"
            isActive={activeCategory === 'shapes'}
            onClick={() => handleCategoryClick('shapes')}
          />

          <div className="w-px h-8 bg-border/50 mx-1 shrink-0" />

          <ToolIcon
            icon={Play}
            label="Sim"
            onClick={() => handleCategoryClick('sim')}
          />
          <ToolIcon
            icon={Box}
            label="3D"
            onClick={() => handleCategoryClick('3d')}
          />
          <ToolIcon
            icon={Settings2}
            label="Settings"
            isActive={activeCategory === 'settings'}
            onClick={() => handleCategoryClick('settings')}
          />

          <div className="w-px h-8 bg-border/50 mx-1 shrink-0" />

          <ToolIcon
            icon={ImageIcon}
            label="Image"
            isActive={activeCategory === 'image'}
            onClick={() => handleCategoryClick('image')}
          />


          <ExportMenu
            canvas={props.canvas}
            svgContent={props.svgContent}
            disabled={!props.hasImage && !props.hasSvg && (!props.canvas || (props.canvas.getObjects().length === 0))}
            trigger={
              <button
                className="flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 rounded-xl transition-all text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              >
                <Download className="w-5 h-5" />
                <span className="text-[10px] font-medium">Export</span>
              </button>
            }
          />
        </div>
      </div>



    </div>
  );
};
