import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";

interface UseCanvasOptions {
  width?: number;
  height?: number;
}

export const useCanvas = (options: UseCanvasOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasImage, setHasImage] = useState(false);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true,
    });

    // Enable touch gestures for mobile
    fabricCanvas.allowTouchScrolling = false; // Disable to allow proper drawing

    // Initialize freeDrawingBrush for mobile pencil support
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.width = 2;
      fabricCanvas.freeDrawingBrush.color = '#00d4ff';
    }

    // Add mouse wheel zoom
    fabricCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = fabricCanvas.getZoom() * (1 - delta / 500);
      
      // Clamp zoom
      newZoom = Math.max(0.1, Math.min(5, newZoom));
      
      // Zoom to cursor position
      const pointer = fabricCanvas.getViewportPoint(opt.e);
      fabricCanvas.zoomToPoint(pointer, newZoom);
      
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Track pinch gesture and two-finger pan for touch devices
    let lastDistance = 0;
    let isPinching = false;
    let isPanning = false;
    let lastCenter = { x: 0, y: 0 };

    const getDistance = (t1: Touch, t2: Touch) => 
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle two-finger gestures for pan/zoom
      // Single finger is handled by Fabric.js for drawing
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        isPanning = true;
        lastDistance = getDistance(e.touches[0], e.touches[1]);
        lastCenter = getCenter(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only intercept two-finger gestures
      if (e.touches.length !== 2) return;
      e.preventDefault();

      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Two-finger pan
      if (isPanning && lastCenter.x !== 0 && lastCenter.y !== 0) {
        const deltaX = center.x - lastCenter.x;
        const deltaY = center.y - lastCenter.y;
        
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          fabricCanvas.setViewportTransform(vpt);
        }
      }

      // Pinch to zoom
      if (isPinching && lastDistance > 0) {
        const scale = distance / lastDistance;
        let newZoom = fabricCanvas.getZoom() * scale;
        newZoom = Math.max(0.1, Math.min(5, newZoom));

        const point = { x: center.x - rect.left, y: center.y - rect.top };
        fabricCanvas.zoomToPoint(point as any, newZoom);
        setZoom(newZoom);
      }

      lastDistance = distance;
      lastCenter = center;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
        isPanning = false;
        lastDistance = 0;
        lastCenter = { x: 0, y: 0 };
      }
    };

    // Use the upper-level wrapper element for multi-touch gestures only
    const wrapperEl = canvasRef.current?.parentElement;
    wrapperEl?.addEventListener("touchstart", handleTouchStart, { passive: false });
    wrapperEl?.addEventListener("touchmove", handleTouchMove, { passive: false });
    wrapperEl?.addEventListener("touchend", handleTouchEnd);
    wrapperEl?.addEventListener("touchcancel", handleTouchEnd);

    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    return () => {
      wrapperEl?.removeEventListener("touchstart", handleTouchStart);
      wrapperEl?.removeEventListener("touchmove", handleTouchMove);
      wrapperEl?.removeEventListener("touchend", handleTouchEnd);
      wrapperEl?.removeEventListener("touchcancel", handleTouchEnd);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const loadImage = useCallback(
    async (file: File): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = async () => {
            if (!canvas) {
              reject(new Error("Canvas not initialized"));
              return;
            }

            try {
              canvas.clear();

              const fabricImage = await FabricImage.fromURL(
                e.target?.result as string
              );

              // Scale image to fit canvas
              const canvasWidth = canvas.getWidth();
              const canvasHeight = canvas.getHeight();
              const scale = Math.min(
                (canvasWidth * 0.9) / img.width,
                (canvasHeight * 0.9) / img.height
              );

              fabricImage.scale(scale);
              fabricImage.set({
                left: (canvasWidth - img.width * scale) / 2,
                top: (canvasHeight - img.height * scale) / 2,
                selectable: true,
                hasControls: true,
                hasBorders: true,
              });

              canvas.add(fabricImage);
              canvas.setActiveObject(fabricImage);
              canvas.renderAll();
              
              // Store reference to original image element
              imageElementRef.current = img;
              setHasImage(true);
              resolve(img);
            } catch (error) {
              console.error("Error adding image to canvas:", error);
              reject(error);
            }
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    [canvas]
  );

  const setZoomLevel = useCallback(
    (newZoom: number) => {
      if (!canvas) return;
      
      const center = canvas.getCenterPoint();
      canvas.zoomToPoint(center, newZoom);
      setZoom(newZoom);
    },
    [canvas]
  );

  const getImageData = useCallback((): ImageData | null => {
    // Use the stored image element reference
    if (!imageElementRef.current) {
      console.log("No image element reference found");
      return null;
    }

    const img = imageElementRef.current;
    
    // Create a temporary canvas to get image data
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) {
      console.log("Could not get 2d context");
      return null;
    }

    tempCanvas.width = img.naturalWidth || img.width;
    tempCanvas.height = img.naturalHeight || img.height;
    
    console.log("Getting image data:", tempCanvas.width, "x", tempCanvas.height);
    
    ctx.drawImage(img, 0, 0);

    return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  }, []);

  const getImageElement = useCallback((): HTMLImageElement | null => {
    return imageElementRef.current;
  }, []);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    imageElementRef.current = null;
    setHasImage(false);
    
    // Reset zoom
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  }, [canvas]);

  const resetView = useCallback(() => {
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
    canvas.renderAll();
  }, [canvas]);

  return {
    canvasRef,
    canvas,
    zoom,
    hasImage,
    loadImage,
    setZoomLevel,
    getImageData,
    getImageElement,
    clearCanvas,
    resetView,
  };
};
