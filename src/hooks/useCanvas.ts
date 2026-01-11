import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";

interface UseCanvasOptions {
  width?: number;
  height?: number;
}

export const useCanvas = (options: UseCanvasOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasImage, setHasImage] = useState(false);

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
      const center = canvas.getCenter();
      canvas.setZoom(newZoom);
      setZoom(newZoom);
    },
    [canvas]
  );

  const getImageData = useCallback((): ImageData | null => {
    if (!canvas) return null;

    const objects = canvas.getObjects();
    if (objects.length === 0) return null;

    // Get the first image object
    const imageObj = objects.find((obj) => obj.type === "image");
    if (!imageObj) return null;

    // Create a temporary canvas to get image data
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return null;

    const element = (imageObj as FabricImage).getElement();
    tempCanvas.width = element.width || 0;
    tempCanvas.height = element.height || 0;
    ctx.drawImage(element as HTMLImageElement, 0, 0);

    return ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  }, [canvas]);

  const getImageElement = useCallback((): HTMLImageElement | null => {
    if (!canvas) return null;

    const objects = canvas.getObjects();
    const imageObj = objects.find((obj) => obj.type === "image");
    if (!imageObj) return null;

    return (imageObj as FabricImage).getElement() as HTMLImageElement;
  }, [canvas]);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
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
