// 3D Extrusion Types and Utilities


import { Shape } from "three";

export interface CanvasShapeData {
  id: string;
  name: string;
  type: string;
  shape: Shape;
  color: string;
  position: { x: number; y: number };
}

export interface ExtrusionSettings {
  depth: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
}

export interface MaterialSettings {
  color: string;
  metalness: number;
  roughness: number;
  wireframe: boolean;
}

export interface Scene3DSettings {
  backgroundColor: string;
  showGrid: boolean;
  autoRotate: boolean;
}

export const DEFAULT_EXTRUSION: ExtrusionSettings = {
  depth: 1,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.1,
  bevelSegments: 3,
};

export const DEFAULT_MATERIAL: MaterialSettings = {
  color: "#00d4ff",
  metalness: 0.3,
  roughness: 0.4,
  wireframe: false,
};

export const DEFAULT_SCENE: Scene3DSettings = {
  backgroundColor: "#1a1a2e",
  showGrid: true,
  autoRotate: false,
};
