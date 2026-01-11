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
    fabricCanvas.allowTouchScrolling = true;

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

    // Track pinch gesture for touch devices
    let lastDistance = 0;
    let isPinching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastDistance > 0) {
          const scale = distance / lastDistance;
          let newZoom = fabricCanvas.getZoom() * scale;
          
          // Clamp zoom
          newZoom = Math.max(0.1, Math.min(5, newZoom));
          
          // Get center point between fingers
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;
          
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const point = {
              x: centerX - rect.left,
              y: centerY - rect.top,
            };
            fabricCanvas.zoomToPoint(point as any, newZoom);
            setZoom(newZoom);
          }
        }
        
        lastDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      isPinching = false;
      lastDistance = 0;
    };

    const canvasEl = canvasRef.current;
    canvasEl?.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvasEl?.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasEl?.addEventListener("touchend", handleTouchEnd);

    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    return () => {
      canvasEl?.removeEventListener("touchstart", handleTouchStart);
      canvasEl?.removeEventListener("touchmove", handleTouchMove);
      canvasEl?.removeEventListener("touchend", handleTouchEnd);
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
