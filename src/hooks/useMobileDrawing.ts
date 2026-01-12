import { useCallback, useRef, useEffect, useState } from "react";
import { 
  Canvas as FabricCanvas, 
  Rect, 
  Circle, 
  Line, 
  Polygon,
  FabricObject
} from "fabric";
import { DrawingTool, StrokeStyle, FillStyle } from "@/lib/types";

interface UseMobileDrawingOptions {
  canvas: FabricCanvas | null;
  activeTool: DrawingTool;
  stroke: StrokeStyle;
  fill: FillStyle;
  onShapeCreated?: () => void;
}

interface DrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentShape: FabricObject | null;
}

export const useMobileDrawing = ({
  canvas,
  activeTool,
  stroke,
  fill,
  onShapeCreated,
}: UseMobileDrawingOptions) => {
  const drawStateRef = useRef<DrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentShape: null,
  });
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);

  // Check if current tool supports interactive drawing
  const isInteractiveTool = useCallback((tool: DrawingTool): boolean => {
    return ['line', 'rectangle', 'ellipse', 'polygon'].includes(tool);
  }, []);

  // Get canvas-relative coordinates from touch/mouse event
  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!canvas) return null;
    
    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    
    if (!vpt) return null;
    
    // Account for zoom and pan
    const x = (clientX - rect.left - vpt[4]) / zoom;
    const y = (clientY - rect.top - vpt[5]) / zoom;
    
    return { x, y };
  }, [canvas]);

  // Start drawing a shape
  const startDrawing = useCallback((x: number, y: number) => {
    if (!canvas || !isInteractiveTool(activeTool)) return;

    const state = drawStateRef.current;
    state.isDrawing = true;
    state.startX = x;
    state.startY = y;

    let shape: FabricObject | null = null;

    switch (activeTool) {
      case 'rectangle':
        shape = new Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: fill.color === 'transparent' ? 'transparent' : fill.color,
          stroke: stroke.color,
          strokeWidth: stroke.width,
          opacity: fill.opacity,
          selectable: false,
          evented: false,
        });
        break;

      case 'ellipse':
        shape = new Circle({
          left: x,
          top: y,
          radius: 0,
          fill: fill.color === 'transparent' ? 'transparent' : fill.color,
          stroke: stroke.color,
          strokeWidth: stroke.width,
          opacity: fill.opacity,
          selectable: false,
          evented: false,
        });
        break;

      case 'line':
        shape = new Line([x, y, x, y], {
          stroke: stroke.color,
          strokeWidth: stroke.width,
          selectable: false,
          evented: false,
        });
        break;

      case 'polygon':
        // For polygon, we create a hexagon that will be sized by dragging
        shape = new Polygon([{ x: 0, y: 0 }], {
          left: x,
          top: y,
          fill: fill.color === 'transparent' ? 'transparent' : fill.color,
          stroke: stroke.color,
          strokeWidth: stroke.width,
          opacity: fill.opacity,
          selectable: false,
          evented: false,
        });
        break;
    }

    if (shape) {
      state.currentShape = shape;
      canvas.add(shape);
      canvas.renderAll();
    }
  }, [canvas, activeTool, stroke, fill, isInteractiveTool]);

  // Update shape while drawing
  const updateDrawing = useCallback((x: number, y: number) => {
    const state = drawStateRef.current;
    if (!state.isDrawing || !state.currentShape || !canvas) return;

    const { startX, startY, currentShape } = state;
    
    switch (activeTool) {
      case 'rectangle': {
        const rect = currentShape as Rect;
        const width = Math.abs(x - startX);
        const height = Math.abs(y - startY);
        rect.set({
          left: Math.min(x, startX),
          top: Math.min(y, startY),
          width,
          height,
        });
        break;
      }

      case 'ellipse': {
        const ellipse = currentShape as Circle;
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2)) / 2;
        const centerX = (startX + x) / 2;
        const centerY = (startY + y) / 2;
        ellipse.set({
          left: centerX - radius,
          top: centerY - radius,
          radius,
        });
        break;
      }

      case 'line': {
        const line = currentShape as Line;
        line.set({
          x2: x,
          y2: y,
        });
        break;
      }

      case 'polygon': {
        const polygon = currentShape as Polygon;
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        const sides = 6;
        const points = [];
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
          });
        }
        
        polygon.set({ points });
        polygon.set({
          left: startX - radius,
          top: startY - radius,
        });
        break;
      }
    }

    currentShape.setCoords();
    canvas.renderAll();
  }, [canvas, activeTool]);

  // Finish drawing
  const finishDrawing = useCallback(() => {
    const state = drawStateRef.current;
    if (!state.isDrawing || !state.currentShape || !canvas) return;

    const shape = state.currentShape;
    
    // Make shape selectable
    shape.set({
      selectable: true,
      evented: true,
    });
    shape.setCoords();
    
    // Select the new shape
    canvas.setActiveObject(shape);
    canvas.renderAll();

    // Reset state
    state.isDrawing = false;
    state.currentShape = null;
    
    // Notify parent
    onShapeCreated?.();
  }, [canvas, onShapeCreated]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    const state = drawStateRef.current;
    if (!state.currentShape || !canvas) return;

    canvas.remove(state.currentShape);
    canvas.renderAll();
    
    state.isDrawing = false;
    state.currentShape = null;
  }, [canvas]);

  // Set up event listeners for interactive drawing
  useEffect(() => {
    if (!canvas) return;

    const isInteractive = isInteractiveTool(activeTool);
    setIsInteractiveMode(isInteractive);

    if (!isInteractive) {
      // Ensure drawing mode is disabled for non-interactive tools
      return;
    }

    // Disable object selection during drawing
    canvas.selection = false;
    canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    const state = drawStateRef.current;

    // Get canvas coordinates helper
    const getCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvasEl = canvas.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;
      
      if (!vpt) return null;
      
      const x = (clientX - rect.left - vpt[4]) / zoom;
      const y = (clientY - rect.top - vpt[5]) / zoom;
      
      return { x, y };
    };

    // Mouse events
    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      startDrawing(e.pointer.x, e.pointer.y);
    };

    const handleMouseMove = (e: any) => {
      if (!e.pointer) return;
      updateDrawing(e.pointer.x, e.pointer.y);
    };

    const handleMouseUp = () => {
      finishDrawing();
      // Re-enable selection
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    };

    // Touch events (for mobile) - attach directly to canvas element
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const coords = getCoords(touch.clientX, touch.clientY);
      if (coords) {
        startDrawing(coords.x, coords.y);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (!state.isDrawing) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const coords = getCoords(touch.clientX, touch.clientY);
      if (coords) {
        updateDrawing(coords.x, coords.y);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!state.isDrawing) return;
      e.preventDefault();
      e.stopPropagation();
      finishDrawing();
      // Re-enable selection
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    };

    // Add Fabric.js events
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    // Add touch events directly to canvas element (not wrapper)
    const canvasEl = canvas.getElement();
    
    canvasEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasEl.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);

      canvasEl.removeEventListener('touchstart', handleTouchStart);
      canvasEl.removeEventListener('touchmove', handleTouchMove);
      canvasEl.removeEventListener('touchend', handleTouchEnd);

      // Restore selection
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    };
  }, [canvas, activeTool, isInteractiveTool, startDrawing, updateDrawing, finishDrawing]);

  return {
    isInteractiveMode,
    isDrawing: drawStateRef.current.isDrawing,
    cancelDrawing,
  };
};
