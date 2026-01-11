import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, FabricObject } from "fabric";

interface UseCanvasOptions {
  width?: number;
  height?: number;
}

export const useCanvas = (options: UseCanvasOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [options.width, options.height]);

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
            });

            canvas.add(fabricImage);
            canvas.renderAll();
            
            // Store reference to original image element
            imageElementRef.current = img;
            setHasImage(true);
            resolve(img);
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
      canvas.setZoom(newZoom);
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
  };
};
