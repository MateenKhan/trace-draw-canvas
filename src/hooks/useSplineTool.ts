import { useCallback, useRef, useEffect, useState } from "react";
import {
    Canvas as FabricCanvas,
    Path,
    Circle,
    FabricObject,
    Point,
    Line
} from "fabric";
import { StrokeStyle, FillStyle } from "@/lib/types";

interface UseSplineToolOptions {
    canvas: FabricCanvas | null;
    activeTool: string;
    stroke: StrokeStyle;
    fill: FillStyle;
}

interface SplineNode {
    anchor: Circle;
    handleIn: Circle | null;
    handleOut: Circle | null;
    lineIn: Line | null;
    lineOut: Line | null;
}

export const useSplineTool = ({ canvas, activeTool, stroke, fill }: UseSplineToolOptions) => {
    const [isEditing, setIsEditing] = useState(false);
    const activePathRef = useRef<Path | null>(null);
    const nodesRef = useRef<SplineNode[]>([]);

    const clearHelpers = useCallback(() => {
        if (!canvas) return;
        nodesRef.current.forEach(node => {
            canvas.remove(node.anchor);
            if (node.handleIn) canvas.remove(node.handleIn);
            if (node.handleOut) canvas.remove(node.handleOut);
            if (node.lineIn) canvas.remove(node.lineIn);
            if (node.lineOut) canvas.remove(node.lineOut);
        });
        nodesRef.current = [];
    }, [canvas]);

    const updatePath = useCallback(() => {
        if (!activePathRef.current || nodesRef.current.length < 2 || !canvas) return;

        const nodes = nodesRef.current;
        let pathData = `M ${nodes[0].anchor.left} ${nodes[0].anchor.top}`;

        for (let i = 0; i < nodes.length - 1; i++) {
            const p1 = nodes[i];
            const p2 = nodes[i + 1];

            const cp1 = p1.handleOut || p1.anchor;
            const cp2 = p2.handleIn || p2.anchor;

            pathData += ` C ${cp1.left} ${cp1.top}, ${cp2.left} ${cp2.top}, ${p2.anchor.left} ${p2.anchor.top}`;
        }

        activePathRef.current.set({ path: new Path(pathData).path });
        canvas.renderAll();
    }, [canvas]);

    const addNode = useCallback((x: number, y: number) => {
        if (!canvas) return;

        const anchor = new Circle({
            left: x,
            top: y,
            radius: 5,
            fill: stroke.color,
            stroke: '#fff',
            strokeWidth: 1,
            hasControls: false,
            hasBorders: false,
            selectable: true,
            // @ts-ignore
            isHelper: true,
            originX: 'center',
            originY: 'center',
        });

        const handleIn = new Circle({
            left: x - 30,
            top: y,
            radius: 3,
            fill: '#fff',
            stroke: stroke.color,
            strokeWidth: 1,
            hasControls: false,
            hasBorders: false,
            selectable: true,
            // @ts-ignore
            isHelper: true,
            originX: 'center',
            originY: 'center',
        });

        const handleOut = new Circle({
            left: x + 30,
            top: y,
            radius: 3,
            fill: '#fff',
            stroke: stroke.color,
            strokeWidth: 1,
            hasControls: false,
            hasBorders: false,
            selectable: true,
            // @ts-ignore
            isHelper: true,
            originX: 'center',
            originY: 'center',
        });

        const lineIn = new Line([x - 30, y, x, y], {
            stroke: stroke.color,
            strokeWidth: 1,
            opacity: 0.5,
            selectable: false,
            evented: false,
            // @ts-ignore
            isHelper: true,
        });

        const lineOut = new Line([x + 30, y, x, y], {
            stroke: stroke.color,
            strokeWidth: 1,
            opacity: 0.5,
            selectable: false,
            evented: false,
            // @ts-ignore
            isHelper: true,
        });

        const node: SplineNode = { anchor, handleIn, handleOut, lineIn, lineOut };
        nodesRef.current.push(node);

        // Add drag listeners
        const onMove = () => {
            if (lineIn) lineIn.set({ x1: handleIn.left, y1: handleIn.top, x2: anchor.left, y2: anchor.top });
            if (lineOut) lineOut.set({ x1: handleOut.left, y1: handleOut.top, x2: anchor.left, y2: anchor.top });
            updatePath();
        };

        anchor.on('moving', (opt) => {
            const dx = opt.transform.target.left - opt.transform.lastLeft;
            const dy = opt.transform.target.top - opt.transform.lastTop;
            handleIn.set({ left: handleIn.left + dx, top: handleIn.top + dy });
            handleOut.set({ left: handleOut.left + dx, top: handleOut.top + dy });
            onMove();
        });
        handleIn.on('moving', onMove);
        handleOut.on('moving', onMove);

        canvas.add(lineIn, lineOut, anchor, handleIn, handleOut);

        if (!activePathRef.current) {
            const path = new Path(`M ${x} ${y}`, {
                stroke: stroke.color,
                strokeWidth: stroke.width,
                fill: 'transparent',
                selectable: true,
                // @ts-ignore
                id: `spline_${Math.random().toString(36).substr(2, 9)}`,
            });
            activePathRef.current = path;
            canvas.add(path);
        }

        updatePath();
    }, [canvas, stroke, updatePath]);

    // Handle click to add points
    useEffect(() => {
        if (!canvas) return;

        if (activeTool !== 'spline') {
            clearHelpers();
            activePathRef.current = null;
            return;
        }

        const handleMouseDown = (opt: any) => {
            if (activeTool !== 'spline') return;
            if (opt.target && (opt.target as any).isHelper) return;

            const pointer = canvas.getScenePoint(opt.e);
            addNode(pointer.x, pointer.y);
        };

        canvas.on('mouse:down', handleMouseDown);
        return () => {
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [canvas, activeTool, clearHelpers, addNode]);

    return {
        isEditing,
    };
};
