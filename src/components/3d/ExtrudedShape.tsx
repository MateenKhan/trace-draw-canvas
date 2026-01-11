import { useMemo } from "react";
import { Shape, ExtrudeGeometry } from "three";
import { ExtrusionSettings, MaterialSettings } from "@/lib/extrusion";

interface ExtrudedShapeProps {
  shapeType: "rectangle" | "circle" | "triangle" | "star";
  extrusion: ExtrusionSettings;
  material: MaterialSettings;
}

export const ExtrudedShape = ({ shapeType, extrusion, material }: ExtrudedShapeProps) => {
  const shape = useMemo(() => {
    const s = new Shape();
    const size = 2;

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

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial
        color={material.color}
        metalness={material.metalness}
        roughness={material.roughness}
        wireframe={material.wireframe}
      />
    </mesh>
  );
};
