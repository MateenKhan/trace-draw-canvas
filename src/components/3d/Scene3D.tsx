import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { ExtrudedShape } from "./ExtrudedShape";
import { ExtrudedText } from "./ExtrudedText";
import { ExtrusionSettings, MaterialSettings, Scene3DSettings } from "@/lib/extrusion";

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
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
        
        {/* Grid */}
        {scene.showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#404040"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#606060"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
          />
        )}
        
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
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={scene.autoRotate}
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
};
