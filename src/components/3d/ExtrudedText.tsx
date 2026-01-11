import { useMemo, useState, useEffect } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader.js";
import { ExtrusionSettings, MaterialSettings } from "@/lib/extrusion";

interface ExtrudedTextProps {
  text: string;
  extrusion: ExtrusionSettings;
  material: MaterialSettings;
}

export const ExtrudedText = ({ text, extrusion, material }: ExtrudedTextProps) => {
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load("/fonts/helvetiker_regular.typeface.json", (loadedFont) => {
      setFont(loadedFont);
    });
  }, []);

  const shapes = useMemo(() => {
    if (!font) return [];
    return font.generateShapes(text, 1);
  }, [font, text]);

  const extrudeSettings = useMemo(() => ({
    steps: 2,
    depth: extrusion.depth,
    bevelEnabled: extrusion.bevelEnabled,
    bevelThickness: extrusion.bevelThickness,
    bevelSize: extrusion.bevelSize,
    bevelSegments: extrusion.bevelSegments,
  }), [extrusion]);

  if (!font || shapes.length === 0) {
    return null;
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-text.length * 0.3, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shapes, extrudeSettings]} />
      <meshStandardMaterial
        color={material.color}
        metalness={material.metalness}
        roughness={material.roughness}
        wireframe={material.wireframe}
      />
    </mesh>
  );
};
