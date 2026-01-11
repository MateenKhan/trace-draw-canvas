import { useCallback } from "react";
import { 
  Canvas as FabricCanvas, 
  Rect, 
  Circle, 
  Line, 
  Path, 
  Polygon,
  IText,
  FabricObject
} from "fabric";
import { DrawingTool, StrokeStyle, FillStyle, TextStyle } from "@/lib/types";

interface UseDrawingToolsOptions {
  canvas: FabricCanvas | null;
  stroke: StrokeStyle;
  fill: FillStyle;
  textStyle: TextStyle;
}

export const useDrawingTools = ({
  canvas,
  stroke,
  fill,
  textStyle,
}: UseDrawingToolsOptions) => {
  // Add a rectangle
  const addRectangle = useCallback(() => {
    if (!canvas) return;

    const rect = new Rect({
      left: canvas.getWidth() / 2 - 50,
      top: canvas.getHeight() / 2 - 50,
      width: 100,
      height: 100,
      fill: fill.color === 'transparent' ? 'transparent' : fill.color,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      opacity: fill.opacity,
      rx: 0,
      ry: 0,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvas, stroke, fill]);

  // Add an ellipse
  const addEllipse = useCallback(() => {
    if (!canvas) return;

    const ellipse = new Circle({
      left: canvas.getWidth() / 2 - 50,
      top: canvas.getHeight() / 2 - 50,
      radius: 50,
      fill: fill.color === 'transparent' ? 'transparent' : fill.color,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      opacity: fill.opacity,
    });

    canvas.add(ellipse);
    canvas.setActiveObject(ellipse);
    canvas.renderAll();
  }, [canvas, stroke, fill]);

  // Add a line
  const addLine = useCallback(() => {
    if (!canvas) return;

    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;

    const line = new Line([centerX - 50, centerY, centerX + 50, centerY], {
      stroke: stroke.color,
      strokeWidth: stroke.width,
    });

    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }, [canvas, stroke]);

  // Add a polygon (hexagon by default)
  const addPolygon = useCallback((sides: number = 6) => {
    if (!canvas) return;

    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;
    const radius = 50;

    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }

    const polygon = new Polygon(points, {
      fill: fill.color === 'transparent' ? 'transparent' : fill.color,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      opacity: fill.opacity,
    });

    // Center the polygon
    polygon.set({
      left: centerX - polygon.width! / 2,
      top: centerY - polygon.height! / 2,
    });

    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.renderAll();
  }, [canvas, stroke, fill]);

  // Add text
  const addText = useCallback((text: string = "Double-click to edit") => {
    if (!canvas) return;

    const itext = new IText(text, {
      left: canvas.getWidth() / 2 - 100,
      top: canvas.getHeight() / 2 - 20,
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      textAlign: textStyle.textAlign,
      fill: textStyle.fill,
      charSpacing: textStyle.letterSpacing * 10,
      lineHeight: textStyle.lineHeight,
    });

    canvas.add(itext);
    canvas.setActiveObject(itext);
    canvas.renderAll();
  }, [canvas, textStyle]);

  // Enable freehand drawing mode
  const enableDrawingMode = useCallback((enable: boolean) => {
    if (!canvas) return;

    canvas.isDrawingMode = enable;
    if (enable && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = stroke.color;
      canvas.freeDrawingBrush.width = stroke.width;
    }
  }, [canvas, stroke]);

  // Delete selected objects
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [canvas]);

  // Update selected object's stroke
  const updateSelectedStroke = useCallback((newStroke: StrokeStyle) => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      obj.set({
        stroke: newStroke.color,
        strokeWidth: newStroke.width,
      });
    });
    canvas.renderAll();
  }, [canvas]);

  // Update selected object's fill
  const updateSelectedFill = useCallback((newFill: FillStyle) => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      obj.set({
        fill: newFill.color === 'transparent' ? 'transparent' : newFill.color,
        opacity: newFill.opacity,
      });
    });
    canvas.renderAll();
  }, [canvas]);

  // Update selected text style
  const updateSelectedTextStyle = useCallback((newStyle: TextStyle) => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        (obj as IText).set({
          fontFamily: newStyle.fontFamily,
          fontSize: newStyle.fontSize,
          fontWeight: newStyle.fontWeight,
          fontStyle: newStyle.fontStyle,
          textAlign: newStyle.textAlign,
          fill: newStyle.fill,
          charSpacing: newStyle.letterSpacing * 10,
          lineHeight: newStyle.lineHeight,
        });
      }
    });
    canvas.renderAll();
  }, [canvas]);

  // Bring forward / send backward
  const bringForward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  const sendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  return {
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
    bringForward,
    sendBackward,
  };
};
