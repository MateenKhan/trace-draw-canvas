import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X, Box, Circle, Triangle, Star, RotateCcw, Move3D } from "lucide-react";
import {
  ExtrusionSettings,
  MaterialSettings,
  CanvasShapeData,
  DEFAULT_EXTRUSION,
  DEFAULT_MATERIAL,
} from "@/lib/extrusion";
import { fabricObjectToShape } from "@/lib/three-converters";
import { CameraController, Grid3D } from "./3d/SceneHelpers";
import { ExtrudedCanvasShape, SampleShape } from "./3d/Shapes";

interface Inline3DExtrudeProps {
  isVisible: boolean;
  onClose: () => void;
  canvas: FabricCanvas | null;
}

const shapeOptions = [
  { id: "rectangle" as const, icon: Box, label: "Rect" },
  { id: "circle" as const, icon: Circle, label: "Circle" },
  { id: "triangle" as const, icon: Triangle, label: "Tri" },
  { id: "star" as const, icon: Star, label: "Star" },
];

export const Inline3DExtrude = ({ isVisible, onClose, canvas }: Inline3DExtrudeProps) => {
  const [canvasShapes, setCanvasShapes] = useState<CanvasShapeData[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [sampleShape, setSampleShape] = useState<"rectangle" | "circle" | "triangle" | "star">("rectangle");
  const [extrusion, setExtrusion] = useState<ExtrusionSettings>(DEFAULT_EXTRUSION);
  const [material, setMaterial] = useState<MaterialSettings>(DEFAULT_MATERIAL);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  // Drag-to-rotate state
  const [isDragging, setIsDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Mouse/touch handlers for drag rotation
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragDelta({ x: 0, y: 0 });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragDelta({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragDelta({ x: 0, y: 0 });
  }, []);

  // Extract shapes from canvas
  useEffect(() => {
    if (!canvas || !isVisible) return;

    const objects = canvas.getObjects();
    const shapes: CanvasShapeData[] = [];

    objects.forEach((obj, index) => {
      // Skip images
      if (obj.type === 'image') return;

      const shape = fabricObjectToShape(obj);
      if (shape) {
        shapes.push({
          id: `shape-${index}`,
          name: `${obj.type?.charAt(0).toUpperCase()}${obj.type?.slice(1) || 'Shape'} ${index + 1}`,
          type: obj.type || 'unknown',
          shape,
          color: (obj as any).fill?.toString() || (obj as any).stroke?.toString() || '#00d4ff',
          position: { x: obj.left || 0, y: obj.top || 0 },
        });
      }
    });

    setCanvasShapes(shapes);
    setShowSamples(shapes.length === 0);

    if (shapes.length > 0 && !selectedShapeId) {
      setSelectedShapeId(null); // Show all by default
    }
  }, [canvas, isVisible]);

  const displayedShapes = useMemo(() => {
    if (selectedShapeId) {
      return canvasShapes.filter(s => s.id === selectedShapeId);
    }
    return canvasShapes;
  }, [canvasShapes, selectedShapeId]);

  if (!isVisible) return null;

  const hasCanvasShapes = canvasShapes.length > 0;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-background">
      {/* 3D Preview - FULLSCREEN */}
      <div
        ref={canvasContainerRef}
        className={cn(
          "flex-1 cursor-grab touch-none relative",
          isDragging && "cursor-grabbing"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          shadows
          camera={{ position: [5, 5, 5], fov: 50 }}
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        >
          <color attach="background" args={["#1a1a2e"]} />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d4ff" />

          {/* 3D Grid */}
          <Grid3D />

          {/* Canvas shapes or sample shapes */}
          {hasCanvasShapes && !showSamples ? (
            displayedShapes.map((shapeData, index) => (
              <ExtrudedCanvasShape
                key={shapeData.id}
                shapeData={shapeData}
                extrusion={extrusion}
                material={material}
                isSelected={selectedShapeId === shapeData.id}
                index={index}
                totalShapes={displayedShapes.length}
              />
            ))
          ) : (
            <SampleShape
              shapeType={sampleShape}
              extrusion={extrusion}
              material={material}
            />
          )}

          {/* Camera Controller */}
          <CameraController
            autoRotate={autoRotate}
            isDragging={isDragging}
            dragDelta={dragDelta}
            onDragEnd={handleDragEnd}
          />
        </Canvas>

        {/* Origin indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-0.5 bg-red-500" />
            <span className="text-[8px] text-red-400">X</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-2 bg-green-500" />
            <span className="text-[8px] text-green-400">Y</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-0.5 bg-blue-500" />
            <span className="text-[8px] text-blue-400">Z</span>
          </div>
        </div>

        {/* Drag hint */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
          <Move3D className="w-3 h-3 text-white/60" />
          <span className="text-[10px] text-white/60">Drag to rotate</span>
        </div>

        {/* Shape count */}
        {hasCanvasShapes && (
          <div className="absolute bottom-20 left-4 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <span className="text-[10px] text-white/60">
              {canvasShapes.length} shape{canvasShapes.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Dock - Compact Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-panel-border px-3 py-2 pb-safe shrink-0">
        {/* Depth slider - inline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-muted-foreground w-10">Depth</span>
          <Slider
            value={[extrusion.depth]}
            onValueChange={(v) => setExtrusion({ ...extrusion, depth: v[0] })}
            min={0.1}
            max={3}
            step={0.1}
            className="flex-1 touch-none"
          />
          <span className="text-[10px] text-muted-foreground w-6">{extrusion.depth.toFixed(1)}</span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left - Shape options */}
          <div className="flex items-center gap-1">
            {(showSamples || !hasCanvasShapes) && shapeOptions.map((shape) => (
              <Button
                key={shape.id}
                variant={sampleShape === shape.id ? "default" : "ghost"}
                size="icon"
                className="w-8 h-8"
                onClick={() => setSampleShape(shape.id)}
              >
                <shape.icon className="w-4 h-4" />
              </Button>
            ))}
            {hasCanvasShapes && !showSamples && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[10px]"
                onClick={() => setShowSamples(true)}
              >
                Samples
              </Button>
            )}
            {showSamples && hasCanvasShapes && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[10px]"
                onClick={() => setShowSamples(false)}
              >
                Canvas
              </Button>
            )}
          </div>

          {/* Center - Toggle options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExtrusion({ ...extrusion, bevelEnabled: !extrusion.bevelEnabled })}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
                extrusion.bevelEnabled ? "bg-primary/20 text-primary" : "text-muted-foreground"
              )}
            >
              Bevel
            </button>
            <button
              onClick={() => setMaterial({ ...material, wireframe: !material.wireframe })}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
                material.wireframe ? "bg-primary/20 text-primary" : "text-muted-foreground"
              )}
            >
              Wire
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
                autoRotate ? "bg-primary/20 text-primary" : "text-muted-foreground"
              )}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Right - Close */}
          <div className="flex items-center gap-1">
            <Input
              type="color"
              value={material.color}
              onChange={(e) => setMaterial({ ...material, color: e.target.value })}
              className="w-8 h-8 p-0 border-0 cursor-pointer"
            />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => {
                setExtrusion(DEFAULT_EXTRUSION);
                setMaterial(DEFAULT_MATERIAL);
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-destructive"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
