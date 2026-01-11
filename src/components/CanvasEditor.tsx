import { useState, useRef, useCallback } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "@/components/Toolbar";
import { TraceSettingsPanel } from "@/components/TraceSettingsPanel";
import { SvgPreview } from "@/components/SvgPreview";
import { DropZone } from "@/components/DropZone";
import { traceImageToSVG, defaultTraceSettings, TraceSettings } from "@/lib/tracing";
import { toast } from "sonner";
import { Layers2, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CanvasEditor = () => {
  const [activeTool, setActiveTool] = useState("select");
  const [traceSettings, setTraceSettings] = useState<TraceSettings>(defaultTraceSettings);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [showSvgOverlay, setShowSvgOverlay] = useState(true);
  const [isTracing, setIsTracing] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        await loadImage(file);
        setSvgContent(null);
        toast.success("Image loaded successfully");
      } catch (error) {
        toast.error("Failed to load image");
        console.error(error);
      }
    },
    [loadImage]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleTrace = useCallback(async () => {
    const imageData = getImageData();
    if (!imageData) {
      toast.error("No image to trace");
      return;
    }

    setIsTracing(true);
    try {
      // Use setTimeout to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const svg = await traceImageToSVG(imageData, traceSettings);
      setSvgContent(svg);
      toast.success("Tracing complete!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Tracing failed: ${message}`);
      console.error(error);
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
    toast.success("Canvas cleared");
  }, [clearCanvas]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-panel-border glass">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
            <Layers2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight">TraceFlow</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground font-mono hidden sm:block">
              Bitmap to Vector
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile settings toggle */}
          <Button
            variant="toolbar"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowMobileSettings(!showMobileSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <div className="text-[10px] md:text-xs font-mono text-muted-foreground">
            Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left panel - Settings (Desktop) */}
        <aside className="hidden lg:block w-80 p-4 border-r border-panel-border overflow-y-auto scrollbar-thin">
          <TraceSettingsPanel
            settings={traceSettings}
            onSettingsChange={setTraceSettings}
          />
          {svgContent && (
            <div className="mt-4">
              <SvgPreview
                svgContent={svgContent}
                showPreview={showSvgOverlay}
                onTogglePreview={() => setShowSvgOverlay(!showSvgOverlay)}
              />
            </div>
          )}
        </aside>

        {/* Mobile Settings Panel */}
        {showMobileSettings && (
          <div className="absolute inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowMobileSettings(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm p-4 overflow-y-auto scrollbar-thin glass animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button
                  variant="toolbar"
                  size="icon"
                  onClick={() => setShowMobileSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <TraceSettingsPanel
                settings={traceSettings}
                onSettingsChange={setTraceSettings}
              />
              {svgContent && (
                <div className="mt-4">
                  <SvgPreview
                    svgContent={svgContent}
                    showPreview={showSvgOverlay}
                    onTogglePreview={() => setShowSvgOverlay(!showSvgOverlay)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas area */}
        <main className="flex-1 flex flex-col p-2 md:p-4 gap-2 md:gap-4 min-h-0">
          {/* Toolbar */}
          <Toolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onZoomIn={() => setZoomLevel(Math.min(zoom + 0.25, 5))}
            onZoomOut={() => setZoomLevel(Math.max(zoom - 0.25, 0.25))}
            onReset={resetView}
            onUpload={handleUploadClick}
            onTrace={handleTrace}
            onExport={handleExport}
            onClear={handleClear}
            hasImage={hasImage}
            hasSvg={!!svgContent}
            isTracing={isTracing}
          />

          {/* Canvas container */}
          <div className="flex-1 canvas-container relative flex items-center justify-center rounded-xl border border-panel-border overflow-hidden min-h-[300px] touch-none">
            <canvas ref={canvasRef} className="max-w-full max-h-full touch-none" />
            
            {/* SVG overlay */}
            {svgContent && showSvgOverlay && hasImage && (
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{ mixBlendMode: "normal" }}
              >
                 <div
                   dangerouslySetInnerHTML={{ __html: svgContent }}
                   className="max-w-full max-h-full w-full h-full [&_svg]:w-full [&_svg]:h-full"
                   style={{
                     width: canvas?.getWidth(),
                     height: canvas?.getHeight(),
                   }}
                 />
              </div>
            )}

            {/* Drop zone */}
            <DropZone onFileSelect={handleFileSelect} hasImage={hasImage} />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CanvasEditor;
