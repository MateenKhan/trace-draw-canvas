import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshStandardMaterial, Shape, Vector2, Vector3, Spherical } from "three";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X, Box, Circle, Triangle, Star, RotateCcw, Sparkles, Layers, AlertCircle, Move3D } from "lucide-react";
import {
  ExtrusionSettings,
  MaterialSettings,
  DEFAULT_EXTRUSION,
  DEFAULT_MATERIAL,
} from "@/lib/extrusion";

interface CanvasShapeData {
  id: string;
  name: string;
  type: string;
  shape: Shape;
  color: string;
  position: { x: number; y: number };
}

interface Inline3DExtrudeProps {
  isVisible: boolean;
  onClose: () => void;
  canvas: FabricCanvas | null;
}

// Interactive camera controller with drag-to-rotate and auto-rotation
const CameraController = ({ 
  autoRotate, 
  isDragging,
  dragDelta,
  onDragEnd,
}: { 
  autoRotate: boolean;
  isDragging: boolean;
  dragDelta: { x: number; y: number };
  onDragEnd: () => void;
}) => {
  const { camera } = useThree();
  const sphericalRef = useRef(new Spherical(8, Math.PI / 3, 0));
  const autoRotationRef = useRef(0);
  const lastDragRef = useRef({ x: 0, y: 0 });
  
  useFrame(() => {
    const spherical = sphericalRef.current;
    
    // Apply drag rotation
    if (isDragging) {
      const deltaX = dragDelta.x - lastDragRef.current.x;
      const deltaY = dragDelta.y - lastDragRef.current.y;
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));
      
      lastDragRef.current = { x: dragDelta.x, y: dragDelta.y };
    } else {
      lastDragRef.current = { x: 0, y: 0 };
      
      // Auto-rotate when not dragging
      if (autoRotate) {
        autoRotationRef.current += 0.008;
        spherical.theta = autoRotationRef.current;
      }
    }
    
    // Convert spherical to cartesian and update camera
    const x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    const y = spherical.radius * Math.cos(spherical.phi);
    const z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

// 3D Grid helper - shows grid on XZ, XY, and YZ planes
const Grid3D = () => {
  const gridSize = 10;
  const gridDivisions = 10;
  const primaryColor = "#505050";
  const secondaryColor = "#353535";
  
  return (
    <group>
      {/* XZ plane (floor) */}
      <gridHelper args={[gridSize, gridDivisions, primaryColor, secondaryColor]} />
      
      {/* XY plane (back wall) */}
      <gridHelper 
        args={[gridSize, gridDivisions, primaryColor, secondaryColor]} 
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, gridSize / 2, -gridSize / 2]}
      />
      
      {/* YZ plane (side wall) */}
      <gridHelper 
        args={[gridSize, gridDivisions, primaryColor, secondaryColor]} 
        rotation={[0, 0, Math.PI / 2]}
        position={[-gridSize / 2, gridSize / 2, 0]}
      />
    </group>
  );
};

// Extruded shape from canvas
const ExtrudedCanvasShape = ({ 
  shapeData, 
  extrusion, 
  material,
  isSelected,
  index,
  totalShapes,
}: { 
  shapeData: CanvasShapeData;
  extrusion: ExtrusionSettings;
  material: MaterialSettings;
  isSelected: boolean;
  index: number;
  totalShapes: number;
}) => {
  const extrudeSettings = useMemo(() => ({
    steps: 2,
    depth: extrusion.depth,
    bevelEnabled: extrusion.bevelEnabled,
    bevelThickness: extrusion.bevelThickness,
    bevelSize: extrusion.bevelSize,
    bevelSegments: extrusion.bevelSegments,
  }), [extrusion]);

  const meshMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: isSelected ? material.color : shapeData.color,
      metalness: material.metalness,
      roughness: material.roughness,
      wireframe: material.wireframe,
    });
  }, [material, shapeData.color, isSelected]);

  // Position shapes in a grid if multiple
  const spacing = 4;
  const cols = Math.ceil(Math.sqrt(totalShapes));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const offsetX = (col - (cols - 1) / 2) * spacing;
  const offsetZ = (row - (Math.ceil(totalShapes / cols) - 1) / 2) * spacing;

  return (
    <mesh 
      position={[offsetX, 0, offsetZ]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      castShadow 
      receiveShadow 
      material={meshMaterial}
    >
      <extrudeGeometry args={[shapeData.shape, extrudeSettings]} />
    </mesh>
  );
};

// Sample shape for when canvas is empty
const SampleShape = ({ 
  shapeType, 
  extrusion, 
  material,
}: { 
  shapeType: "rectangle" | "circle" | "triangle" | "star";
  extrusion: ExtrusionSettings;
  material: MaterialSettings;
}) => {
  const shape = useMemo(() => {
    const s = new Shape();
    const size = 1.5;

    switch (shapeType) {
      case "rectangle":
        s.moveTo(-size, -size);
        s.lineTo(size, -size);
        s.lineTo(size, size);
        s.lineTo(-size, size);
        s.closePath();
        break;
      case "circle":
        s.absarc(0, 0, size, 0, Math.PI * 2, false);
        break;
      case "triangle":
        s.moveTo(0, size);
        s.lineTo(-size, -size);
        s.lineTo(size, -size);
        s.closePath();
        break;
      case "star":
        const points = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          if (i === 0) {
            s.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          } else {
            s.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          }
        }
        s.closePath();
        break;
    }
    return s;
  }, [shapeType]);

  const extrudeSettings = useMemo(() => ({
    steps: 2,
    depth: extrusion.depth,
    bevelEnabled: extrusion.bevelEnabled,
    bevelThickness: extrusion.bevelThickness,
    bevelSize: extrusion.bevelSize,
    bevelSegments: extrusion.bevelSegments,
  }), [extrusion]);

  const meshMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: material.color,
      metalness: material.metalness,
      roughness: material.roughness,
      wireframe: material.wireframe,
    });
  }, [material]);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      castShadow 
      receiveShadow 
      material={meshMaterial}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
    </mesh>
  );
};

// Convert Fabric.js object to Three.js Shape
const fabricObjectToShape = (obj: FabricObject): Shape | null => {
  const shape = new Shape();
  const type = obj.type;
  const scale = 0.02; // Scale down canvas coordinates

  try {
    if (type === 'rect') {
      const width = ((obj as any).width || 100) * scale;
      const height = ((obj as any).height || 100) * scale;
      shape.moveTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      shape.lineTo(width / 2, height / 2);
      shape.lineTo(-width / 2, height / 2);
      shape.closePath();
      return shape;
    }

    if (type === 'circle') {
      const radius = ((obj as any).radius || 50) * scale;
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
      return shape;
    }

    if (type === 'ellipse') {
      const rx = ((obj as any).rx || 50) * scale;
      const ry = ((obj as any).ry || 50) * scale;
      // Approximate ellipse with bezier curves
      const kappa = 0.5522848;
      const ox = rx * kappa;
      const oy = ry * kappa;
      shape.moveTo(-rx, 0);
      shape.bezierCurveTo(-rx, oy, -ox, ry, 0, ry);
      shape.bezierCurveTo(ox, ry, rx, oy, rx, 0);
      shape.bezierCurveTo(rx, -oy, ox, -ry, 0, -ry);
      shape.bezierCurveTo(-ox, -ry, -rx, -oy, -rx, 0);
      return shape;
    }

    if (type === 'polygon') {
      const points = (obj as any).points as Array<{ x: number; y: number }>;
      if (points && points.length > 2) {
        // Center the polygon
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        shape.moveTo((points[0].x - centerX) * scale, (points[0].y - centerY) * scale);
        for (let i = 1; i < points.length; i++) {
          shape.lineTo((points[i].x - centerX) * scale, (points[i].y - centerY) * scale);
        }
        shape.closePath();
        return shape;
      }
    }

    if (type === 'line') {
      const x1 = ((obj as any).x1 || 0) * scale;
      const y1 = ((obj as any).y1 || 0) * scale;
      const x2 = ((obj as any).x2 || 100) * scale;
      const y2 = ((obj as any).y2 || 0) * scale;
      
      // Create a thin rectangle for the line
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const thickness = 0.05;
      
      if (len > 0) {
        const nx = -dy / len * thickness;
        const ny = dx / len * thickness;
        
        shape.moveTo(x1 + nx, y1 + ny);
        shape.lineTo(x2 + nx, y2 + ny);
        shape.lineTo(x2 - nx, y2 - ny);
        shape.lineTo(x1 - nx, y1 - ny);
        shape.closePath();
        return shape;
      }
    }

    if (type === 'path') {
      // Try to extract path data
      const pathData = (obj as any).path;
      if (pathData && Array.isArray(pathData)) {
        let started = false;
        for (const cmd of pathData) {
          const [command, ...coords] = cmd;
          switch (command) {
            case 'M':
              shape.moveTo(coords[0] * scale, coords[1] * scale);
              started = true;
              break;
            case 'L':
              if (started) shape.lineTo(coords[0] * scale, coords[1] * scale);
              break;
            case 'C':
              if (started) {
                shape.bezierCurveTo(
                  coords[0] * scale, coords[1] * scale,
                  coords[2] * scale, coords[3] * scale,
                  coords[4] * scale, coords[5] * scale
                );
              }
              break;
            case 'Q':
              if (started) {
                shape.quadraticCurveTo(
                  coords[0] * scale, coords[1] * scale,
                  coords[2] * scale, coords[3] * scale
                );
              }
              break;
            case 'Z':
            case 'z':
              shape.closePath();
              break;
          }
        }
        if (started) return shape;
      }
    }

    // Fallback: try to create a bounding box shape
    const bounds = obj.getBoundingRect?.();
    if (bounds) {
      const width = bounds.width * scale;
      const height = bounds.height * scale;
      shape.moveTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      shape.lineTo(width / 2, height / 2);
      shape.lineTo(-width / 2, height / 2);
      shape.closePath();
      return shape;
    }
  } catch (e) {
    console.warn('Failed to convert shape:', type, e);
  }

  return null;
};

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
