import { useCallback } from "react";
import {
  Canvas as FabricCanvas,
  Rect,
  Circle,
  Line,
  Path,
  Polygon,
  IText,
  FabricObject,
  Shadow,
  loadSVGFromString,
  Group
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
      selectable: true,
      hasControls: true,
      hasBorders: true,
      // @ts-ignore
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
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
      selectable: true,
      hasControls: true,
      hasBorders: true,
      // @ts-ignore
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
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
      selectable: true,
      hasControls: true,
      hasBorders: true,
      // @ts-ignore
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
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
      selectable: true,
      hasControls: true,
      hasBorders: true,
      // @ts-ignore
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
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
  const addText = useCallback((text: string = "") => {
    if (!canvas) return;

    const itext = new IText(text || textStyle.content || "Double-click to edit", {
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
      shadow: textStyle.glowColor !== 'transparent' && textStyle.glowBlur > 0 ? new Shadow({
        color: textStyle.glowColor,
        blur: textStyle.glowBlur,
        offsetX: 0,
        offsetY: 0,
      }) : null,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      // @ts-ignore
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
    });

    canvas.add(itext);
    canvas.setActiveObject(itext);
    canvas.renderAll();
  }, [canvas, textStyle]);

  // Enable freehand drawing mode (pencil)
  const enableDrawingMode = useCallback((enable: boolean) => {
    if (!canvas) return;

    canvas.isDrawingMode = enable;
    if (enable && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = stroke.color;
      canvas.freeDrawingBrush.width = stroke.width;
      (canvas.freeDrawingBrush as any).strokeLineCap = "round";
      (canvas.freeDrawingBrush as any).strokeLineJoin = "round";
      (canvas.freeDrawingBrush as any).decimate = 0; // pencil = no smoothing
    }
  }, [canvas, stroke]);

  // Enable "pen" mode (smooth spline-like free draw)
  const enablePenMode = useCallback((enable: boolean) => {
    if (!canvas) return;

    canvas.isDrawingMode = enable;
    if (enable && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = stroke.color;
      canvas.freeDrawingBrush.width = stroke.width;
      (canvas.freeDrawingBrush as any).strokeLineCap = "round";
      (canvas.freeDrawingBrush as any).strokeLineJoin = "round";
      // Higher decimate = smoother curves; helps on touch devices
      (canvas.freeDrawingBrush as any).decimate = 4;
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
          shadow: newStyle.glowColor !== 'transparent' && newStyle.glowBlur > 0 ? new Shadow({
            color: newStyle.glowColor,
            blur: newStyle.glowBlur,
            offsetX: 0,
            offsetY: 0,
          }) : null,
          ...(newStyle.content !== undefined ? { text: newStyle.content } : {}),
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
      canvas.fire('object:modified', { target: activeObject });
    }
  }, [canvas]);

  const sendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
      canvas.fire('object:modified', { target: activeObject });
    }
  }, [canvas]);

  const addSVG = useCallback(async (svgString: string) => {
    if (!canvas) return;
    try {
      const { objects } = await loadSVGFromString(svgString);
      const validObjects = objects.filter((o): o is FabricObject => !!o);

      const group = new Group(validObjects);

      // Ensure it's selectable and has an ID for the layers panel
      group.set({
        left: canvas.getWidth() / 2 - (group.getScaledWidth() / 2),
        top: canvas.getHeight() / 2 - (group.getScaledHeight() / 2),
        selectable: true,
        hasControls: true,
        hasBorders: true,
        // @ts-ignore
        id: `shape_trace_${Math.random().toString(36).substr(2, 9)}`,
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      return group;
    } catch (error) {
      console.error("Error loading SVG:", error);
    }
  }, [canvas]);

  return {
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
    addSVG,
  };
};
