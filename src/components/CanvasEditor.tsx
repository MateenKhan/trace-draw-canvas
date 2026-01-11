import { useState, useRef, useCallback, useEffect } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useDrawingTools } from "@/hooks/useDrawingTools";
import { useImageEditing } from "@/hooks/useImageEditing";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { PropertyPanel } from "@/components/PropertyPanel";
import { TraceSettingsPanel } from "@/components/TraceSettingsPanel";
import { SvgPreview } from "@/components/SvgPreview";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import { GCodeDialog } from "@/components/GCodeDialog";
import { LayersPanel } from "@/components/LayersPanel";
import { traceImageToSVG, defaultTraceSettings, TraceSettings } from "@/lib/tracing";
import { Layer, LayerGroup, createDefaultLayers } from "@/lib/layers";
import { 
  DrawingTool, 
  StrokeStyle, 
  FillStyle, 
  TextStyle, 
  ImageFilter,
  DEFAULT_STROKE,
  DEFAULT_FILL,
  DEFAULT_TEXT_STYLE,
  DEFAULT_IMAGE_FILTER,
} from "@/lib/types";
import { toast } from "sonner";
import { Layers2, Settings2, X, Palette, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CanvasEditor = () => {
  // Tool state
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  
  // Style states
  const [stroke, setStroke] = useState<StrokeStyle>(DEFAULT_STROKE);
  const [fill, setFill] = useState<FillStyle>(DEFAULT_FILL);
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const [imageFilter, setImageFilter] = useState<ImageFilter>(DEFAULT_IMAGE_FILTER);
  
  // Trace state
  const [traceSettings, setTraceSettings] = useState<TraceSettings>(defaultTraceSettings);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [showSvgOverlay, setShowSvgOverlay] = useState(true);
  const [isTracing, setIsTracing] = useState(false);
  
  // Layer state
  const [layers, setLayers] = useState<Layer[]>(createDefaultLayers());
  const [groups, setGroups] = useState<LayerGroup[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[0]?.id || null);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  
  // UI state
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [activePanel, setActivePanel] = useState<"properties" | "trace">("properties");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showGCodePanel, setShowGCodePanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas hook
  const {
    canvasRef,
    canvas,
    zoom,
    hasImage,
    loadImage,
    setZoomLevel,
    getImageData,
    clearCanvas,
    resetView,
  } = useCanvas({ width: 800, height: 600 });

  // Drawing tools hook
  const {
    addRectangle,
    addEllipse,
    addLine,
    addPolygon,
    addText,
    enableDrawingMode,
    deleteSelected,
    updateSelectedStroke,
    updateSelectedFill,
    updateSelectedTextStyle,
  } = useDrawingTools({ canvas, stroke, fill, textStyle });

  // Image editing hook
  const { applyFilters } = useImageEditing({ canvas });

  // Handle tool change
  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    enableDrawingMode(false);
    
    switch (tool) {
      case 'pencil':
        enableDrawingMode(true);
        break;
      case 'rectangle':
        addRectangle();
        setActiveTool('select');
        break;
      case 'ellipse':
        addEllipse();
        setActiveTool('select');
        break;
      case 'line':
        addLine();
        setActiveTool('select');
        break;
      case 'polygon':
        addPolygon(6);
        setActiveTool('select');
        break;
      case 'text':
        addText();
        setActiveTool('select');
        break;
    }
  }, [enableDrawingMode, addRectangle, addEllipse, addLine, addPolygon, addText]);

  const handleStrokeChange = useCallback((newStroke: StrokeStyle) => {
    setStroke(newStroke);
    updateSelectedStroke(newStroke);
    if (activeTool === 'pencil' && canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = newStroke.color;
      canvas.freeDrawingBrush.width = newStroke.width;
    }
  }, [updateSelectedStroke, activeTool, canvas]);

  const handleFillChange = useCallback((newFill: FillStyle) => {
    setFill(newFill);
    updateSelectedFill(newFill);
  }, [updateSelectedFill]);

  const handleTextStyleChange = useCallback((newStyle: TextStyle) => {
    setTextStyle(newStyle);
    updateSelectedTextStyle(newStyle);
  }, [updateSelectedTextStyle]);

  const handleImageFilterChange = useCallback((newFilter: ImageFilter) => {
    setImageFilter(newFilter);
    applyFilters(newFilter);
  }, [applyFilters]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      await loadImage(file);
      setSvgContent(null);
      setImageFilter(DEFAULT_IMAGE_FILTER);
      toast.success("Image loaded successfully");
    } catch (error) {
      toast.error("Failed to load image");
      console.error(error);
    }
  }, [loadImage]);

  const handleUploadClick = useCallback(() => {
    setShowImageUpload(true);
  }, []);

  const handleTrace = useCallback(async () => {
    const imageData = getImageData();
    if (!imageData) {
      toast.error("No image to trace");
      return;
    }
    setIsTracing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const svg = await traceImageToSVG(imageData, traceSettings);
      setSvgContent(svg);
      toast.success("Tracing complete!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Tracing failed: ${message}`);
    } finally {
      setIsTracing(false);
    }
  }, [getImageData, traceSettings]);

  const handleExport = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "traced-image.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("SVG exported successfully");
  }, [svgContent]);

  const handleClear = useCallback(() => {
    clearCanvas();
    setSvgContent(null);
    setImageFilter(DEFAULT_IMAGE_FILTER);
    toast.success("Canvas cleared");
  }, [clearCanvas]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    if (layers.length <= 1) {
      toast.error("Cannot delete the last layer");
      return;
    }
    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    if (activeLayerId === layerId) {
      const remaining = layers.filter((l) => l.id !== layerId);
      setActiveLayerId(remaining[0]?.id || null);
    }
    toast.success("Layer deleted");
  }, [layers, activeLayerId]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); enableDrawingMode(false); break;
        case 'h': setActiveTool('pan'); enableDrawingMode(false); break;
        case 'b': handleToolChange('pencil'); break;
        case 'l': handleToolChange('line'); break;
        case 'r': handleToolChange('rectangle'); break;
        case 'o': handleToolChange('ellipse'); break;
        case 't': handleToolChange('text'); break;
        case 'delete':
        case 'backspace':
          if (e.target === document.body) { e.preventDefault(); deleteSelected(); }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableDrawingMode, handleToolChange, deleteSelected]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-panel-border glass">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
            <Layers2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight">TraceFlow</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground font-mono hidden sm:block">Vector Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="toolbar" size="icon" className="lg:hidden" onClick={() => setShowMobileSettings(!showMobileSettings)}>
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button variant="toolbar" size="icon" className="hidden lg:flex" onClick={() => setShowLayersPanel(!showLayersPanel)} title="Toggle Layers">
            {showLayersPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </Button>
          <div className="text-[10px] md:text-xs font-mono text-muted-foreground">Zoom: {(zoom * 100).toFixed(0)}%</div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left panel - Settings (Desktop) */}
        <aside className="hidden lg:flex flex-col w-80 border-r border-panel-border overflow-hidden">
          <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as "properties" | "trace")} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 gap-1 p-2 bg-transparent border-b border-panel-border rounded-none">
              <TabsTrigger value="properties" className="gap-1.5 text-xs data-[state=active]:bg-primary/20"><Palette className="w-3.5 h-3.5" />Properties</TabsTrigger>
              <TabsTrigger value="trace" className="gap-1.5 text-xs data-[state=active]:bg-primary/20"><Settings2 className="w-3.5 h-3.5" />Trace</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="flex-1 p-4 overflow-y-auto scrollbar-thin m-0">
              <PropertyPanel activeTool={activeTool} stroke={stroke} fill={fill} textStyle={textStyle} imageFilter={imageFilter} onStrokeChange={handleStrokeChange} onFillChange={handleFillChange} onTextStyleChange={handleTextStyleChange} onImageFilterChange={handleImageFilterChange} />
            </TabsContent>
            <TabsContent value="trace" className="flex-1 p-4 overflow-y-auto scrollbar-thin m-0">
              <TraceSettingsPanel settings={traceSettings} onSettingsChange={setTraceSettings} />
              {svgContent && <div className="mt-4"><SvgPreview svgContent={svgContent} showPreview={showSvgOverlay} onTogglePreview={() => setShowSvgOverlay(!showSvgOverlay)} /></div>}
            </TabsContent>
          </Tabs>
        </aside>

        {/* Mobile Settings Panel */}
        {showMobileSettings && (
          <div className="absolute inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowMobileSettings(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-hidden glass animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-panel-border">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button variant="toolbar" size="icon" onClick={() => setShowMobileSettings(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-4 overflow-y-auto scrollbar-thin h-[calc(100%-60px)]">
                <PropertyPanel activeTool={activeTool} stroke={stroke} fill={fill} textStyle={textStyle} imageFilter={imageFilter} onStrokeChange={handleStrokeChange} onFillChange={handleFillChange} onTextStyleChange={handleTextStyleChange} onImageFilterChange={handleImageFilterChange} />
                <div className="mt-6"><TraceSettingsPanel settings={traceSettings} onSettingsChange={setTraceSettings} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas area */}
        <main className="flex-1 flex flex-col p-2 md:p-4 gap-2 md:gap-4 min-h-0">
          <DrawingToolbar activeTool={activeTool} onToolChange={handleToolChange} onZoomIn={() => setZoomLevel(Math.min(zoom + 0.25, 5))} onZoomOut={() => setZoomLevel(Math.max(zoom - 0.25, 0.25))} onReset={resetView} onUpload={handleUploadClick} onTrace={handleTrace} onClear={handleClear} onFullscreen={handleFullscreen} onGCode={() => setShowGCodePanel(true)} hasImage={hasImage} hasSvg={!!svgContent} isTracing={isTracing} isFullscreen={isFullscreen} canvas={canvas} svgContent={svgContent} />
          <div className="flex-1 canvas-container relative flex items-center justify-center rounded-xl border border-panel-border overflow-hidden min-h-[300px]" style={{ touchAction: 'none' }}>
            <canvas ref={canvasRef} className="max-w-full max-h-full" />
            {svgContent && showSvgOverlay && hasImage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ mixBlendMode: "normal" }}>
                <div dangerouslySetInnerHTML={{ __html: svgContent }} className="max-w-full max-h-full w-full h-full [&_svg]:w-full [&_svg]:h-full" style={{ width: canvas?.getWidth(), height: canvas?.getHeight() }} />
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Layers Panel */}
        <aside className={cn("hidden lg:flex flex-col border-l border-panel-border overflow-hidden transition-all duration-300", showLayersPanel ? "w-72" : "w-0")}>
          {showLayersPanel && (
            <LayersPanel layers={layers} groups={groups} activeLayerId={activeLayerId} onLayersChange={setLayers} onGroupsChange={setGroups} onActiveLayerChange={setActiveLayerId} onDeleteLayer={handleDeleteLayer} />
          )}
        </aside>
      </div>

      <ImageUploadDialog open={showImageUpload} onOpenChange={setShowImageUpload} onFileSelect={handleFileSelect} />
      <GCodeDialog open={showGCodePanel} onOpenChange={setShowGCodePanel} canvas={canvas} />
    </div>
  );
};

export default CanvasEditor;
