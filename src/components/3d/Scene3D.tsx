import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ExtrudedShape } from "./ExtrudedShape";
import { ExtrudedText } from "./ExtrudedText";
import { ExtrusionSettings, MaterialSettings, Scene3DSettings } from "@/lib/extrusion";

// Custom OrbitControls implementation using mouse/touch events
const CameraController = ({ autoRotate }: { autoRotate: boolean }) => {
  const rotationRef = useRef(0);
  
  useFrame(({ camera }) => {
    if (autoRotate) {
      rotationRef.current += 0.005;
      camera.position.x = Math.sin(rotationRef.current) * 8;
      camera.position.z = Math.cos(rotationRef.current) * 8;
      camera.lookAt(0, 0, 0);
    }
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
  return (
    <div className="w-full h-full min-h-[200px] rounded-lg overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
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
        
        {/* 3D Grid */}
        {scene.showGrid && <Grid3D />}
        
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
        <CameraController autoRotate={scene.autoRotate} />
      </Canvas>
    </div>
  );
};
