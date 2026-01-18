import { useEffect, useCallback } from "react";
import { Canvas as FabricCanvas } from "fabric";
import {
    StrokeStyle,
    FillStyle,
    TextStyle,
    DEFAULT_STROKE,
    DEFAULT_FILL,
    DEFAULT_TEXT_STYLE
} from "@/lib/types";

interface UseCanvasSyncOptions {
    canvas: FabricCanvas | null;
    setStroke: (stroke: StrokeStyle | ((prev: StrokeStyle) => StrokeStyle)) => void;
    setFill: (fill: FillStyle | ((prev: FillStyle) => FillStyle)) => void;
    setTextStyle: (style: TextStyle | ((prev: TextStyle) => TextStyle)) => void;
    setCanDeleteSelected: (can: boolean) => void;
}

export const useCanvasSync = ({
    canvas,
    setStroke,
    setFill,
    setTextStyle,
    setCanDeleteSelected,
}: UseCanvasSyncOptions) => {
    const sync = useCallback(() => {
        if (!canvas) return;

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
    }, [canvas, setStroke, setFill, setTextStyle, setCanDeleteSelected]);

    useEffect(() => {
        if (!canvas) return;

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
    }, [canvas, sync]);
};
