import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, filters } from "fabric";
import { ImageFilter } from "@/lib/types";

interface UseImageEditingOptions {
  canvas: FabricCanvas | null;
}

export const useImageEditing = ({ canvas }: UseImageEditingOptions) => {
  const imageRef = useRef<FabricImage | null>(null);

  // Find the first image on canvas
  const getImage = useCallback((): FabricImage | null => {
    if (!canvas) return null;
    
    const objects = canvas.getObjects();
    for (const obj of objects) {
      if (obj.type === 'image') {
        return obj as FabricImage;
      }
    }
    return null;
  }, [canvas]);

  // Apply filters to image
  const applyFilters = useCallback((filterSettings: ImageFilter) => {
    if (!canvas) return;

    const image = getImage();
    if (!image) return;

    // Clear existing filters
    image.filters = [];

    // Add brightness filter
    if (filterSettings.brightness !== 100) {
      image.filters.push(
        new filters.Brightness({ brightness: (filterSettings.brightness - 100) / 100 })
      );
    }

    // Add contrast filter
    if (filterSettings.contrast !== 100) {
      image.filters.push(
        new filters.Contrast({ contrast: (filterSettings.contrast - 100) / 100 })
      );
    }

    // Add saturation filter
    if (filterSettings.saturation !== 100) {
      image.filters.push(
        new filters.Saturation({ saturation: (filterSettings.saturation - 100) / 100 })
      );
    }

    // Add blur filter
    if (filterSettings.blur > 0) {
      image.filters.push(
        new filters.Blur({ blur: filterSettings.blur / 100 })
      );
    }

    // Apply filters
    image.applyFilters();
    canvas.renderAll();
  }, [canvas, getImage]);

  // Flip image horizontally
  const flipHorizontal = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set('flipX', !activeObject.flipX);
      canvas.renderAll();
    }
  }, [canvas]);

  // Flip image vertically
  const flipVertical = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set('flipY', !activeObject.flipY);
      canvas.renderAll();
    }
  }, [canvas]);

  // Rotate image by angle
  const rotate = useCallback((angle: number) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const currentAngle = activeObject.angle || 0;
      activeObject.rotate(currentAngle + angle);
      canvas.renderAll();
    }
  }, [canvas]);

  // Scale image
  const scale = useCallback((factor: number) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const currentScaleX = activeObject.scaleX || 1;
      const currentScaleY = activeObject.scaleY || 1;
      activeObject.scale(currentScaleX * factor);
      canvas.renderAll();
    }
  }, [canvas]);

  // Skew image
  const skew = useCallback((skewX: number, skewY: number) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set({
        skewX: skewX,
        skewY: skewY,
      });
      canvas.renderAll();
    }
  }, [canvas]);

  return {
    applyFilters,
    flipHorizontal,
    flipVertical,
    rotate,
    scale,
    skew,
    getImage,
  };
};
