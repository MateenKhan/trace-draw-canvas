import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useCallback, useState, useMemo } from "react";
import * as THREE from "three";
import { ExtrudedShape } from "./ExtrudedShape";
import { ExtrudedText } from "./ExtrudedText";
import { ExtrusionSettings, MaterialSettings, Scene3DSettings } from "@/lib/extrusion";

// Interactive camera controller with touch support
const CameraController = ({ 
  autoRotate,
  isDragging,
  dragDelta,
}: { 
  autoRotate: boolean;
  isDragging: boolean;
  dragDelta: { x: number; y: number };
}) => {
  const { camera } = useThree();
  const sphericalRef = useRef(new THREE.Spherical(8, Math.PI / 3, 0));
  const autoRotationRef = useRef(0);
  const lastDragRef = useRef({ x: 0, y: 0 });
  
  useFrame(() => {
    const spherical = sphericalRef.current;
    
    // Apply drag rotation
    if (isDragging && (dragDelta.x !== 0 || dragDelta.y !== 0)) {
      const deltaX = dragDelta.x - lastDragRef.current.x;
      const deltaY = dragDelta.y - lastDragRef.current.y;
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));
      
      lastDragRef.current = { x: dragDelta.x, y: dragDelta.y };
    } else if (!isDragging) {
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

// 3D Grid helper with origin marker
const Grid3D = ({ showOrigin = true }: { showOrigin?: boolean }) => {
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

      {/* Origin marker - visible axes at origin */}
      {showOrigin && <OriginMarker />}
    </group>
  );
};

// Origin marker component with proper materials
const OriginMarker = () => {
  const xMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xff4444 }), []);
  const yMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x44ff44 }), []);
  const zMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x4444ff }), []);
  const originMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);

  return (
    <group>
      {/* X axis - red */}
      <mesh position={[0.5, 0.01, 0]} material={xMaterial}>
        <boxGeometry args={[1, 0.05, 0.05]} />
      </mesh>
      {/* Y axis - green */}
      <mesh position={[0, 0.5, 0]} material={yMaterial}>
        <boxGeometry args={[0.05, 1, 0.05]} />
      </mesh>
      {/* Z axis - blue */}
      <mesh position={[0, 0.01, 0.5]} material={zMaterial}>
        <boxGeometry args={[0.05, 0.05, 1]} />
      </mesh>
      {/* Origin sphere */}
      <mesh position={[0, 0, 0]} material={originMaterial}>
        <sphereGeometry args={[0.1, 16, 16]} />
      </mesh>
    </group>
  );
};

interface Scene3DProps {
  mode: "shape" | "text";
  shapeType: "rectangle" | "circle" | "triangle" | "star";
  text: string;
  extrusion: ExtrusionSettings;
  material: MaterialSettings;
  scene: Scene3DSettings;
}

export const Scene3D = ({
  mode,
  shapeType,
  text,
  extrusion,
  material,
  scene,
}: Scene3DProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragDelta({ x: 0, y: 0 });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div 
      className="w-full h-full min-h-[200px] rounded-lg overflow-hidden bg-gradient-to-b from-secondary/50 to-background touch-none cursor-grab"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
        <color attach="background" args={[scene.backgroundColor]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* 3D Grid with origin */}
        {scene.showGrid && <Grid3D showOrigin={true} />}
        
        {/* 3D Object */}
        {mode === "shape" ? (
          <ExtrudedShape
            shapeType={shapeType}
            extrusion={extrusion}
            material={material}
          />
        ) : (
          <ExtrudedText
            text={text}
            extrusion={extrusion}
            material={material}
          />
        )}
        
        {/* Camera Controller */}
        <CameraController 
          autoRotate={scene.autoRotate} 
          isDragging={isDragging}
          dragDelta={dragDelta}
        />
      </Canvas>
    </div>
  );
};
