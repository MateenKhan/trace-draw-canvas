import { FabricObject } from "fabric";
import { Shape } from "three";

// Convert Fabric.js object to Three.js Shape
export const fabricObjectToShape = (obj: FabricObject): Shape | null => {
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
