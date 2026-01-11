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

// Simple grid helper
const GridHelper = () => {
  return (
    <gridHelper args={[20, 20, "#404040", "#303030"]} rotation={[0, 0, 0]} />
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
        
        {/* Grid */}
        {scene.showGrid && <GridHelper />}
        
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
