import { useMemo } from "react";
import { MeshStandardMaterial, Shape } from "three";
import { CanvasShapeData, ExtrusionSettings, MaterialSettings } from "@/lib/extrusion";

// Extruded shape from canvas
export const ExtrudedCanvasShape = ({
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
export const SampleShape = ({
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
