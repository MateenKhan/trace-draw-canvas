import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useDrawingTools } from "@/hooks/useDrawingTools";
import { useImageEditing } from "@/hooks/useImageEditing";
import { useMobileDrawing } from "@/hooks/useMobileDrawing";
import { useSplineTool } from "@/hooks/useSplineTool";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawingToolbar, DockCategory } from "@/components/DrawingToolbar";
import { PropertyPanel } from "@/components/PropertyPanel";
import { TraceSettingsPanel } from "@/components/TraceSettingsPanel";
import { SvgPreview } from "@/components/SvgPreview";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import { LayersPanel } from "@/components/LayersPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ToolpathOverlay } from "@/components/ToolpathOverlay";
import { ProjectsPanel } from "@/components/ProjectsPanel";
import { ProjectHistoryPanel } from "@/components/ProjectHistoryPanel";

// Lazy load heavy components
const GCodeDialog = lazy(() => import("@/components/GCodeDialog").then(module => ({ default: module.GCodeDialog })));
const Inline3DExtrude = lazy(() => import("@/components/Inline3DExtrude").then(module => ({ default: module.Inline3DExtrude })));
const MobileSimulationPlayer = lazy(() => import("@/components/MobileSimulationPlayer").then(module => ({ default: module.MobileSimulationPlayer })));
import { traceImageToSVG, defaultTraceSettings, TraceSettings } from "@/lib/tracing";
import { Layer, LayerGroup, createDefaultLayers } from "@/lib/layers";
import { ToolPath, PathPoint, extractToolPathsFromObjects } from "@/lib/gcode";
import {
  Project,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  getActiveProjectId,
  setActiveProjectId,
  addProjectSnapshot,
  restoreToSnapshot,
  getProject,
  clearProjectHistory,
} from "@/lib/projects";
import { FolderOpen } from "lucide-react";
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
import { X, Palette, Settings2, Pencil, Spline, Link, Undo2, Redo2 } from "lucide-react";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SimulationState {
  isPlaying: boolean;
  progress: number;
  currentLine: number;
  currentPoint: PathPoint | null;
  showOverlay: boolean;
}

const CanvasEditor = () => {
  const isMobile = useIsMobile();
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
  const [showLayersPanel, setShowLayersPanel] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // UI state
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [activePanel, setActivePanel] = useState<"properties" | "trace">("properties");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showGCodePanel, setShowGCodePanel] = useState(false);
  const [show3DPanel, setShow3DPanel] = useState(false);
  const [showMobileSimulation, setShowMobileSimulation] = useState(false);
  const [activeDockCategory, setActiveDockCategory] = useState<DockCategory>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [canDeleteSelected, setCanDeleteSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Project state
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => getActiveProjectId());
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [showProjectHistoryPanel, setShowProjectHistoryPanel] = useState(false);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);

  // G-code simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isPlaying: false,
    progress: 0,
    currentLine: 0,
    currentPoint: null,
    showOverlay: true,
  });
  const [toolPaths, setToolPaths] = useState<ToolPath[]>([]);
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

  const isReset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('reset');

  // Drawing tools hook
  const {
    addRectangle,
    addEllipse,
    addLine,
    addPolygon,
    addText,
    enableDrawingMode,
    enablePenMode,
    deleteSelected,
    updateSelectedStroke,
    updateSelectedFill,
    updateSelectedTextStyle,
    bringForward,
    sendBackward,
  } = useDrawingTools({ canvas, stroke, fill, textStyle });

  // Image editing hook
  const { applyFilters } = useImageEditing({ canvas });

  const [maxHistory, setMaxHistory] = useState(30);

  // Undo/Redo hook
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    saveState,
    history,
    currentIndex,
    restoreToIndex,
    deleteHistoryEntry,
  } = useUndoRedo({ canvas, maxHistory: 30, skipInitialSnapshot: isReset });


  // Mobile drawing hook for interactive shape creation
  const { isInteractiveMode } = useMobileDrawing({
    canvas,
    activeTool,
    stroke,
    fill,
    onShapeCreated: () => {
      // Switch back to select after creating a shape
      setActiveTool('select');
    },
  });

  // Spline tool hook
  useSplineTool({
    canvas,
    activeTool,
    stroke,
    fill,
  });

  // Handle tool change - modified to support both tap-to-place and drag-to-draw
  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    enableDrawingMode(false);
    enablePenMode(false);

    // For interactive tools (line, rectangle, ellipse, polygon), just set the tool
    // The useMobileDrawing hook will handle drag-to-draw
    // Double-tap or single tap when already in that mode creates default shape
    const isInteractiveTool = ['line', 'rectangle', 'ellipse', 'polygon'].includes(tool);

    if (isInteractiveTool) {
      // If already in this tool mode, create a default shape (tap-to-place)
      if (activeTool === tool) {
        switch (tool) {
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
        }
      }
      // Otherwise, just stay in this tool mode for drag-to-draw
      return;
    }

    switch (tool) {
      case 'pencil':
        enableDrawingMode(true);
        break;
      case 'pen':
        // Smooth "spline-like" free draw, tuned for touch
        enablePenMode(true);
        break;
      case 'text':
        addText();
        setActiveTool('select');
        break;
      case 'spline':
        // Spline tool handles its own logic via hook
        break;
    }
  }, [activeTool, enableDrawingMode, enablePenMode, addRectangle, addEllipse, addLine, addPolygon, addText]);

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

  // Handle simulation state changes and extract toolpaths
  const handleSimulationChange = useCallback((state: SimulationState) => {
    setSimulationState(state);
  }, []);

  // Generate canvas thumbnail
  const generateThumbnail = useCallback((): string => {
    if (!canvas) return '';
    try {
      return canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.25 });
    } catch {
      return '';
    }
  }, [canvas]);

  // Project CRUD handlers
  const handleCreateProject = useCallback((name: string) => {
    console.log('[CanvasEditor] handleCreateProject called', {
      name,
      hasCanvas: !!canvas,
      canvasWidth: canvas?.getWidth(),
      canvasHeight: canvas?.getHeight()
    });
    try {
      console.log('[CanvasEditor] Generating canvas JSON and thumbnail...');
      const canvasJson = canvas ? JSON.stringify(canvas.toJSON()) : '';
      console.log('[CanvasEditor] Canvas JSON length:', canvasJson.length);
      const thumbnail = generateThumbnail();
      console.log('[CanvasEditor] Thumbnail generated, length:', thumbnail.length);

      console.log('[CanvasEditor] Calling createProject...');
      const project = createProject(name || 'Base Project', canvasJson, thumbnail);
      console.log('[CanvasEditor] Project created successfully:', {
        id: project.id,
        name: project.name
      });

      console.log('[CanvasEditor] Updating projects list and active project...');
      setProjects(getProjects());
      setActiveProjectIdState(project.id);
      setActiveProjectId(project.id);
      console.log('[CanvasEditor] Showing success toast...');
      toast.success(`Project "${name}" created`);
      console.log('[CanvasEditor] handleCreateProject completed successfully');
    } catch (error) {
      console.error('[CanvasEditor] Failed to create project:', error);
      console.error('[CanvasEditor] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [canvas, generateThumbnail]);

  const handleOpenProject = useCallback((id: string) => {
    const project = getProject(id);
    if (!project || !canvas) return;

    canvas.loadFromJSON(project.canvasJson ? JSON.parse(project.canvasJson) : {}, () => {
      canvas.renderAll();
      setActiveProjectIdState(id);
      setActiveProjectId(id);
      setShowProjectsPanel(false);
      toast.success(`Opened "${project.name}"`);
    });
  }, [canvas]);

  const handleRenameProject = useCallback((id: string, name: string) => {
    updateProject(id, { name });
    setProjects(getProjects());
    toast.success("Project renamed");
  }, []);

  const handleDuplicateProject = useCallback((id: string) => {
    const dup = duplicateProject(id);
    if (dup) {
      setProjects(getProjects());
      toast.success(`Project duplicated`);
    }
  }, []);

  const handleDeleteProject = useCallback((id: string) => {
    deleteProject(id);
    setProjects(getProjects());
    if (activeProjectId === id) {
      setActiveProjectIdState(null);
      setActiveProjectId(null);
    }
    toast.success("Project deleted");
  }, [activeProjectId]);

  const handleViewProjectHistory = useCallback((id: string) => {
    setViewingProjectId(id);
    setShowProjectHistoryPanel(true);
    setShowProjectsPanel(false);
  }, []);

  const handleRestoreProjectSnapshot = useCallback((index: number) => {
    if (!viewingProjectId || !canvas) return;

    const project = restoreToSnapshot(viewingProjectId, index);
    if (project) {
      canvas.loadFromJSON(JSON.parse(project.canvasJson), () => {
        canvas.renderAll();
        setProjects(getProjects());
        toast.success("Snapshot restored");
      });
    }
  }, [viewingProjectId, canvas]);

  // Track previous ProjectsPanel state to detect when it closes
  const prevProjectsPanelRef = useRef(showProjectsPanel);

  // Reset zoom when ProjectsPanel closes
  useEffect(() => {
    if (!canvas) return;

    // Check if panel just closed (was open, now closed)
    const wasOpen = prevProjectsPanelRef.current;
    const isNowClosed = !showProjectsPanel;

    if (wasOpen && isNowClosed && zoom !== 1) {
      // Animate zoom out smoothly
      const targetZoom = 1;
      const startZoom = zoom;
      const duration = 300; // 300ms animation
      const startTime = Date.now();

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

        const center = canvas.getCenterPoint();
        canvas.zoomToPoint(center, currentZoom);
        setZoomLevel(currentZoom);
        canvas.renderAll();

        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        } else {
          // Ensure we end at exactly 1
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          setZoomLevel(1);
          canvas.renderAll();
        }
      };

      // Start animation
      requestAnimationFrame(animateZoom);
    }

    // Update ref for next render
    prevProjectsPanelRef.current = showProjectsPanel;
  }, [showProjectsPanel, canvas, zoom]);

  // Auto-save to active project
  useEffect(() => {
    if (!activeProjectId || !canvas) return;

    const saveToProject = () => {
      const canvasJson = JSON.stringify(canvas.toJSON());
      const thumbnail = generateThumbnail();
      const label = `Auto-save at ${new Date().toLocaleTimeString()}`;
      addProjectSnapshot(activeProjectId, canvasJson, thumbnail, label);
      setProjects(getProjects());
    };

    // Save on significant changes
    const handleChange = () => {
      // Debounce saves
      const timeout = setTimeout(saveToProject, 5000);
      return () => clearTimeout(timeout);
    };

    canvas.on('object:modified', handleChange);

    return () => {
      canvas.off('object:modified', handleChange);
    };
  }, [activeProjectId, canvas, generateThumbnail]);

  // Extract toolpaths when G-code panel or mobile simulation opens
  // This also needs to re-run on canvas changes when panel is open
  const extractToolPaths = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    console.log('Extracting toolpaths from', objects.length, 'objects');

    const paths = extractToolPathsFromObjects(objects);

    console.log('Total toolpaths:', paths.length);
    setToolPaths(paths);
  }, [canvas]);

  // Call extraction when panel opens or canvas changes
  useEffect(() => {
    if ((showGCodePanel || showMobileSimulation) && canvas) {
      // Extract immediately
      extractToolPaths();

      // Also listen for changes while panel is open
      const handleChange = () => extractToolPaths();
      canvas.on('object:added', handleChange);
      canvas.on('object:removed', handleChange);
      canvas.on('object:modified', handleChange);
      canvas.on('object:moving', handleChange);

      return () => {
        canvas.off('object:added', handleChange);
        canvas.off('object:removed', handleChange);
        canvas.off('object:modified', handleChange);
        canvas.off('object:moving', handleChange);
      };
    }
  }, [showGCodePanel, showMobileSimulation, canvas, extractToolPaths]);

  // Track selection + canvas content so mobile can enable/disable buttons correctly
  useEffect(() => {
    if (!canvas) return;

    const sync = () => {
      const activeObjects = canvas.getActiveObjects();
      setCanDeleteSelected(activeObjects.length > 0);

      if (activeObjects.length === 1) {
        const obj = activeObjects[0];

        // Sync Stroke
        if (obj.stroke) {
          setStroke(prev => {
            const newColor = obj.stroke as string;
            const newWidth = obj.strokeWidth || prev.width;
            if (prev.color === newColor && prev.width === newWidth) return prev;
            return { ...prev, color: newColor, width: newWidth };
          });
        }

        // Sync Fill
        if (obj.fill) {
          setFill(prev => {
            const newColor = obj.fill === 'transparent' ? 'transparent' : obj.fill as string;
            const newOpacity = obj.opacity ?? 1;
            if (prev.color === newColor && prev.opacity === newOpacity) return prev;
            return { ...prev, color: newColor, opacity: newOpacity };
          });
        }

        // Sync Text Style
        if (obj.type === 'i-text' || obj.type === 'text') {
          const textObj = obj as any;
          setTextStyle(prev => {
            if (
              prev.fontFamily === textObj.fontFamily &&
              prev.fontSize === textObj.fontSize &&
              prev.fontWeight === textObj.fontWeight &&
              prev.fontStyle === textObj.fontStyle &&
              prev.textAlign === textObj.textAlign &&
              prev.fill === (textObj.fill as string)
            ) return prev;

            return {
              ...prev,
              fontFamily: textObj.fontFamily || prev.fontFamily,
              fontSize: textObj.fontSize || prev.fontSize,
              fontWeight: textObj.fontWeight || prev.fontWeight,
              fontStyle: textObj.fontStyle || prev.fontStyle,
              textAlign: textObj.textAlign || prev.textAlign,
              fill: textObj.fill as string || prev.fill,
            };
          });
        }
      }
    };

    sync();

    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    canvas.on('object:added', sync);
    canvas.on('object:removed', sync);
    canvas.on('object:modified', sync);
    canvas.on('object:moving', sync);
    canvas.on('object:scaling', sync);
    canvas.on('object:rotating', sync);

    return () => {
      canvas.off('selection:created', sync);
      canvas.off('selection:updated', sync);
      canvas.off('selection:cleared', sync);
      canvas.off('object:added', sync);
      canvas.off('object:removed', sync);
      canvas.off('object:modified', sync);
      canvas.off('object:moving', sync);
      canvas.off('object:scaling', sync);
      canvas.off('object:rotating', sync);
    };
  }, [canvas]);

  // Handle Full History Clear (Memory + Storage)
  const handleClearAllHistory = useCallback(() => {
    // 1. Clear In-Memory Undo Stack
    clearHistory();

    // 2. Clear Persistent Project Storage
    // Fallback to first project (Base) if no active ID is set explicit
    const targetId = activeProjectId || projects[0]?.id;

    if (targetId) {
      const updated = clearProjectHistory(targetId);
      if (updated) {
        // Refresh projects list to reflect storage change
        setProjects(getProjects());
        setActiveProjectId(null); // Ensure session is unlinked from old project
        toast.info("History and Storage cleared completely.");
      }
    } else {
      setActiveProjectId(null);
      toast.info("Active session history cleared.");
    }
  }, [activeProjectId, projects, clearHistory]);

  // Handle Complete Nuclear Reset
  const handleDeleteEverything = useCallback(() => {
    // 1. Wipe Canvas (Visuals)
    clearCanvas();

    // Delay to let canvas events (object:removed) resolve
    setTimeout(() => {
      // 2. Wipe History (Undo Stack)
      clearHistory();

      // 3. NUCLEAR OPTION: Wipe LocalStorage completely
      // This ensures no hidden keys or "Zombie" projects remain
      try {
        localStorage.clear();
        console.log("LocalStorage cleared completely.");
      } catch (e) {
        console.error("Failed to clear localStorage", e);
      }

      // 4. Force Reload to clear Memory State (prevent auto-save resurrection)
      toast.success("System Reset. Performing hard reload...");

      // Short delay to show toast
      setTimeout(() => {
        // Force fresh load bypassing cache (critical for mobile)
        const url = new URL(window.location.href);
        url.searchParams.set('reset', Date.now().toString());
        window.location.href = url.toString();
      }, 1000);

    }, 100);
  }, [activeProjectId, clearCanvas, clearHistory, resetView]);

  // Click empty space to close panels
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      // If clicked on empty space (no target)
      if (!e.target) {
        // Close floating panels
        if (window.innerWidth < 768) {
          setShowLayersPanel(false);
        }
        setShowHistoryPanel(false);
        setShowProjectsPanel(false);
        setShowMobileSettings(false);

        // Close dock menus (settings, etc) - keeping tools active though
        setActiveDockCategory((prev) => {
          // Don't close if it's a tool category like 'draw' or 'shapes' or 'select'??
          // User request: "active popups should close including layers/hisotry"
          // If I have 'draw' category open (showing pen tool), maybe keep it?
          // "Settings" popup definitely close.
          // Let's close settings/export/image/layers categories.
          // Keep tool categories open?
          // "empty space on canvas is clicked then active popups should close"
          // The tool sub-bar is not exactly a popup, it's a toolbar extension.
          // But Settings IS a popup.
          if (prev === 'settings' || prev === 'export' || prev === 'image' || prev === 'layers' || prev === 'projects') {
            return null;
          }
          return prev;
        });

        // Deselect objects (Fabric usually handles this, but we can enforce)
        // canvas.discardActiveObject();
        // canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas]);

  // Auto-save to active project
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); enableDrawingMode(false); enablePenMode(false); break;
        case 'h': setActiveTool('pan'); enableDrawingMode(false); enablePenMode(false); break;
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
  }, [enableDrawingMode, enablePenMode, handleToolChange, deleteSelected]);

  // Clean Reset URL param
  useEffect(() => {
    if (isReset) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isReset]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col">

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
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" onClick={() => setShowMobileSettings(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-hidden bg-background/10 backdrop-blur-xl shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
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

        {/* Canvas area - maximized space */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {/* Top-Left Unified Toolbar (Undo/Redo + Selection Actions) */}
          <div className="absolute top-4 left-4 z-20">
            <SelectionToolbar
              canvas={canvas}
              onDelete={deleteSelected}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              hideToolbar={showLayersPanel}
            />
          </div>

          {/* Canvas container - takes all available space */}
          <div className="flex-1 canvas-container relative flex items-center justify-center overflow-hidden" style={{ touchAction: 'none' }}>
            <canvas ref={canvasRef} className="max-w-full max-h-full" style={{ touchAction: 'none' }} />

            {/* SVG trace overlay */}
            {svgContent && showSvgOverlay && hasImage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ mixBlendMode: "normal" }}>
                <div dangerouslySetInnerHTML={{ __html: svgContent }} className="max-w-full max-h-full w-full h-full [&_svg]:w-full [&_svg]:h-full" style={{ width: canvas?.getWidth(), height: canvas?.getHeight() }} />
              </div>
            )}

            {/* Inline 3D Extrude Panel */}
            <Suspense fallback={null}>
              {show3DPanel && (
                <Inline3DExtrude
                  isVisible={show3DPanel}
                  onClose={() => setShow3DPanel(false)}
                  canvas={canvas}
                />
              )}
            </Suspense>

            {/* History Panel */}
            <HistoryPanel
              isVisible={showHistoryPanel}
              onClose={() => setShowHistoryPanel(false)}
              history={history}
              currentIndex={currentIndex}
              onRestoreToIndex={restoreToIndex}
              onUndo={undo}
              onRedo={redo}
              onClear={handleClearAllHistory}
              onDeleteEntry={deleteHistoryEntry}
              canUndo={canUndo}
              canRedo={canRedo}
              isMobile={isMobile}
            />




            {/* Interactive drawing mode indicator */}
            {isInteractiveMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
                Drag to draw • Double-tap for default
              </div>
            )}


          </div>

          {/* Spacer for fixed bottom toolbar */}
          <div className="h-32 shrink-0" />
        </main>

        {/* Fixed Bottom Toolbar */}
        <DrawingToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onZoomIn={() => setZoomLevel(Math.min(zoom + 0.25, 5))}
          onZoomOut={() => setZoomLevel(Math.max(zoom - 0.25, 0.25))}
          onReset={resetView}
          onUpload={handleUploadClick}
          onTrace={handleTrace}
          onDeleteSelected={deleteSelected}
          canDeleteSelected={canDeleteSelected}
          onFullscreen={handleFullscreen}
          onGCode={() => {
            if (isMobile) {
              setShowMobileSimulation(true);
            } else {
              setShowGCodePanel(true);
            }
          }}
          on3D={() => setShow3DPanel(true)}
          hasImage={hasImage}
          hasSvg={!!svgContent}
          isTracing={isTracing}
          isFullscreen={isFullscreen}
          canvas={canvas}
          svgContent={svgContent}
          brushSize={stroke.width}
          onBrushSizeChange={(size) => handleStrokeChange({ ...stroke, width: size })}
          strokeColor={stroke.color}
          onToggleSettings={() => setShowMobileSettings(!showMobileSettings)}
          onToggleLayers={() => setShowLayersPanel(!showLayersPanel)}
          showLayersPanel={showLayersPanel}
          onToggleProjects={() => setShowProjectsPanel(!showProjectsPanel)}
          onToggleHistory={() => setShowHistoryPanel(!showHistoryPanel)}

          stroke={stroke}
          fill={fill}
          textStyle={textStyle}
          imageFilter={imageFilter}
          traceSettings={traceSettings}
          onStrokeChange={handleStrokeChange}
          onFillChange={handleFillChange}
          onTextStyleChange={handleTextStyleChange}
          onImageFilterChange={handleImageFilterChange}
          onTraceSettingsChange={setTraceSettings}
          maxHistory={maxHistory}
          onMaxHistoryChange={setMaxHistory}
          activeCategory={activeDockCategory}
          onCategoryChange={setActiveDockCategory}
          onDeleteAll={handleDeleteEverything}
        />

        {/* Mobile Layers Panel Overlay */}
        {showLayersPanel && isMobile && (
          <div className="absolute inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" onClick={() => setShowLayersPanel(false)} />
            <div className="relative w-72 h-full bg-background/10 backdrop-blur-xl border-l border-white/10 animate-slide-left flex flex-col pt-0 pb-20 shadow-2xl">
              <div className="flex-1 overflow-hidden">
                <LayersPanel
                  canvas={canvas}
                  projectName={projects.find(p => p.id === activeProjectId)?.name || "Base Project"}
                  onClose={() => setShowLayersPanel(false)}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar - Layers Panel (Desktop) */}
        <aside className={cn("hidden lg:flex flex-col border-l border-panel-border overflow-hidden transition-all duration-300", showLayersPanel ? "w-72" : "w-0")}>
          {showLayersPanel && (
            <LayersPanel
              canvas={canvas}
              projectName={projects.find(p => p.id === activeProjectId)?.name || "Untitled Project"}
              onClose={() => setShowLayersPanel(false)}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}
        </aside>
      </div>

      {/* G-code toolpath overlay - FIXED position for mobile visibility */}
      {simulationState.showOverlay && showGCodePanel && toolPaths.length > 0 && (
        <div
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Touch layer for pause/resume - only in center area */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                e.stopPropagation();
                setSimulationState(prev => ({
                  ...prev,
                  isPlaying: !prev.isPlaying
                }));
                toast.info(simulationState.isPlaying ? "Simulation paused" : "Simulation resumed");
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSimulationState(prev => ({
                ...prev,
                isPlaying: !prev.isPlaying
              }));
              toast.info(simulationState.isPlaying ? "Simulation paused" : "Simulation resumed");
            }}
          >
            <div className="w-full h-full max-w-[90vw] max-h-[70vh] flex items-center justify-center">
              <ToolpathOverlay
                toolPaths={toolPaths}
                progress={simulationState.progress}
                currentPoint={simulationState.currentPoint}
                isPlaying={simulationState.isPlaying}
                width={Math.min(canvas?.getWidth() || 800, window.innerWidth * 0.9)}
                height={Math.min(canvas?.getHeight() || 600, window.innerHeight * 0.7)}
                show={true}
              />
            </div>
          </div>
        </div>
      )}

      <ImageUploadDialog open={showImageUpload} onOpenChange={setShowImageUpload} onFileSelect={handleFileSelect} />
      <Suspense fallback={null}>
        {showGCodePanel && (
          <GCodeDialog
            open={showGCodePanel}
            onOpenChange={setShowGCodePanel}
            canvas={canvas}
            onSimulationChange={handleSimulationChange}
          />
        )}

        {/* Mobile Simulation Player */}
        {showMobileSimulation && (
          <MobileSimulationPlayer
            isVisible={showMobileSimulation}
            onClose={() => setShowMobileSimulation(false)}
            toolPaths={toolPaths}
            onSimulationChange={handleSimulationChange}
          />
        )}
      </Suspense>

      {/* Projects Panel */}
      <ProjectsPanel
        isVisible={showProjectsPanel}
        onClose={() => setShowProjectsPanel(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onRenameProject={handleRenameProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onViewHistory={handleViewProjectHistory}
      />

      {/* Project History Panel */}
      <ProjectHistoryPanel
        isVisible={showProjectHistoryPanel}
        onClose={() => setShowProjectHistoryPanel(false)}
        project={viewingProjectId ? getProject(viewingProjectId) : null}
        onRestoreSnapshot={handleRestoreProjectSnapshot}
      />
    </div>
  );
};

export default CanvasEditor;
