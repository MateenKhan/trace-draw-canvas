import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Spherical } from "three";

// Interactive camera controller with drag-to-rotate and auto-rotation
export const CameraController = ({
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
export const Grid3D = () => {
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
