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
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingTool, StrokeStyle, FillStyle, TextStyle, ImageFilter } from "@/lib/types";
import { TraceSettings } from "@/lib/tracing";
import { ExportMenu } from "@/components/ExportMenu";
import { Canvas as FabricCanvas } from "fabric";
import { BottomSettingsPanel } from "@/components/BottomSettingsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  maxHistory: number;
  onMaxHistoryChange: (value: number) => void;
  activeCategory: DockCategory;
  onCategoryChange: (category: DockCategory) => void;
  onDeleteAll: () => void;
}

export type DockCategory = 'select' | 'draw' | 'shapes' | 'sim' | '3d' | 'settings' | 'image' | 'layers' | 'export' | 'projects' | 'text' | null;

export const DrawingToolbar = (props: DrawingToolbarProps) => {
  const { activeCategory, onCategoryChange } = props;
  const [showHelp, setShowHelp] = useState(false);

  // Auto-select category based on active tool change (external)
  useEffect(() => {
    switch (props.activeTool) {
      case 'select':
      case 'pan':
        onCategoryChange('select');
        break;
      case 'pen':
      case 'pencil':
        onCategoryChange('draw');
        break;
      case 'line':
      case 'rectangle':
      case 'ellipse':
      case 'polygon':
        onCategoryChange('shapes');
        break;
      case 'text':
        onCategoryChange('text');
        break;
      default:
        break;
    }
  }, [props.activeTool, onCategoryChange]);

  const handleCategoryClick = (cat: DockCategory) => {
    if (cat === activeCategory && cat !== 'sim' && cat !== '3d') {
      // Toggle off if clicking same, unless it's a trigger-only category
      onCategoryChange(null);
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

    // Auto-select tools for specific categories
    if (cat === 'shapes') {
      props.onToolChange('rectangle');
    }

    onCategoryChange(cat);
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

  const SubToolButton = ({ icon: Icon, label, isActive, onClick, disabled, className, iconClassName }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-2 rounded-full border transition-all whitespace-nowrap",
        isActive
          ? "bg-primary border-primary text-primary-foreground shadow-md"
          : "bg-transparent border-transparent text-foreground hover:bg-secondary/50",
        disabled && "opacity-50 cursor-not-allowed",
        !label && "px-3", // Reduce padding if icon only
        className
      )}
      title={label}
    >
      <Icon className={cn("w-5 h-5", iconClassName)} />
      {label && <span className="text-xs font-medium">{label}</span>}
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
              maxHistory={props.maxHistory}
              onMaxHistoryChange={props.onMaxHistoryChange}
              onDeleteAll={props.onDeleteAll}
            />
          )}

          {/* Sub-toolbar container */}
          {['select', 'draw', 'shapes', 'image', 'text'].includes(activeCategory || '') && (
            <div className="mb-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-2 flex gap-2 overflow-x-auto custom-horizontal-scrollbar mx-auto max-w-full justify-start md:justify-center">

              {/* Select Tools */}
              {activeCategory === 'select' && (
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex gap-2">
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
                  </div>

                  <div className="flex gap-2">
                    <SubToolButton
                      icon={Trash2}
                      disabled={!props.canDeleteSelected}
                      onClick={props.onDeleteSelected}
                      className="text-destructive hover:bg-destructive/20 border-destructive/20"
                      iconClassName="w-5 h-5"
                    />
                    <SubToolButton
                      icon={History}
                      onClick={props.onToggleHistory}
                      className="text-orange-500 hover:bg-orange-500/20 border-orange-500/20"
                      iconClassName="w-5 h-5"
                    />
                  </div>
                </div>
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

              {/* Text Tools */}
              {activeCategory === 'text' && (
                <SubToolButton
                  icon={Type}
                  label="Add Text"
                  isActive={props.activeTool === 'text'}
                  onClick={() => props.onToolChange('text')}
                />
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

          <ToolIcon
            icon={MousePointer2}
            label="Select"
            isActive={activeCategory === 'select'}
            onClick={() => handleCategoryClick('select')}
          />

          <ToolIcon
            icon={ImageIcon}
            label="Image"
            isActive={activeCategory === 'image'}
            onClick={() => handleCategoryClick('image')}
          />

          <ToolIcon
            icon={Type}
            label="Text"
            isActive={activeCategory === 'text'}
            onClick={() => handleCategoryClick('text')}
          />

          <ToolIcon
            icon={Shapes}
            label="Shapes"
            isActive={activeCategory === 'shapes'}
            onClick={() => handleCategoryClick('shapes')}
          />

          <ToolIcon
            icon={Pencil}
            label="Draw"
            isActive={activeCategory === 'draw'}
            onClick={() => handleCategoryClick('draw')}
          />

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

          <ToolIcon
            icon={Settings2}
            label="Settings"
            isActive={activeCategory === 'settings'}
            onClick={() => handleCategoryClick('settings')}
          />

          <button
            onClick={() => setShowHelp(true)}
            className="flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 rounded-xl transition-all text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-bold text-primary">Help</span>
          </button>
        </div>
      </div>

      {/* Main App Guide / Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              TraceDraw Guide
            </DialogTitle>
            <DialogDescription>
              Quick tips to master your workspace.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 pt-2">
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Navigation & Viewing</h3>
                <div className="grid grid-cols-1 gap-2">
                  <LegendItem icon={<MousePointer2 className="w-3.5 h-3.5" />} title="Selection" desc="Click shapes to move or edit. Drag to select multiple objects." />
                  <LegendItem icon={<Hand className="w-3.5 h-3.5" />} title="Pan View" desc="Move the canvas around without affecting your artwork." />
                  <LegendItem icon={<History className="w-3.5 h-3.5" />} title="History" desc="Access your undo/redo history to restore past versions." />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Advanced Features</h3>
                <div className="grid grid-cols-1 gap-2">
                  <LegendItem icon={<Sparkles className="w-3.5 h-3.5 text-orange-500" />} title="Auto-Trace" desc="Upload an image and use Trace to convert it into vector paths." />
                  <LegendItem icon={<Play className="w-3.5 h-3.5 text-green-500" />} title="Simulation" desc="Generate G-Code and simulate your design as a toolpath." />
                  <LegendItem icon={<Box className="w-3.5 h-3.5 text-blue-500" />} title="3D View" desc="Preview your 2D design with thickness and extrusion." />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Creation Tools</h3>
                <div className="grid grid-cols-1 gap-2">
                  <LegendItem icon={<Pen className="w-3.5 h-3.5" />} title="Pen & Pencil" desc="Free-hand drawing and smooth vector path creation." />
                  <LegendItem icon={<Shapes className="w-3.5 h-3.5" />} title="Shapes" desc="Add geometric primitives like Circles, Squares, and Polygons." />
                  <LegendItem icon={<Settings2 className="w-3.5 h-3.5" />} title="Settings" desc="Adjust stroke width, colors, opacity, and text properties." />
                </div>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Internal Legend Item Component
const LegendItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-3 p-2 rounded-lg bg-secondary/20 border border-border/20">
    <div className="shrink-0 w-8 h-8 rounded bg-background flex items-center justify-center border border-border/40 shadow-sm">
      {icon}
    </div>
    <div className="flex-1 space-y-0.5">
      <div className="text-[11px] font-bold text-foreground leading-none">{title}</div>
      <div className="text-[10px] text-muted-foreground leading-relaxed">{desc}</div>
    </div>
  </div>
);
