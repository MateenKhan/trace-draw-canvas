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
    onTextSelect?: () => void;
    onTransformStart?: () => void;
    onTransformEnd?: () => void;
}

export const useCanvasSync = ({
    canvas,
    setStroke,
    setFill,
    setTextStyle,
    setCanDeleteSelected,
    onTextSelect,
    onTransformStart,
    onTransformEnd,
}: UseCanvasSyncOptions) => {
    const sync = useCallback((isSelectionEvent = false) => {
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
                if (isSelectionEvent) onTextSelect?.();
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
                        glowColor: textObj.shadow?.color || 'transparent',
                        glowBlur: textObj.shadow?.blur || 0,
                        content: textObj.text || '',
                    };
                });
            }
        }
    }, [canvas, setStroke, setFill, setTextStyle, setCanDeleteSelected]);

    useEffect(() => {
        if (!canvas) return;

        sync(false);

        const handleSelection = () => sync(true);
        const handleSync = () => sync(false);
        const handleTransformStart = () => onTransformStart?.();
        const handleTransformEnd = () => {
            onTransformEnd?.();
            sync(false);
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleSync);
        canvas.on('object:added', handleSync);
        canvas.on('object:removed', handleSync);
        canvas.on('object:modified', handleTransformEnd);
        canvas.on('object:moving', () => {
            handleTransformStart();
            handleSync();
        });
        canvas.on('object:scaling', () => {
            handleTransformStart();
            handleSync();
        });
        canvas.on('object:rotating', () => {
            handleTransformStart();
            handleSync();
        });

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleSync);
            canvas.off('object:added', handleSync);
            canvas.off('object:removed', handleSync);
            canvas.off('object:modified', handleTransformEnd);
            canvas.off('object:moving', handleSync);
            canvas.off('object:scaling', handleSync);
            canvas.off('object:rotating', handleSync);
        };
    }, [canvas, sync]);
};
