import { FabricObject } from "fabric";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objects: FabricObject[];
  color: string;
  expanded: boolean;
}

export interface LayerGroup {
  id: string;
  name: string;
  layers: Layer[];
  expanded: boolean;
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Default layer colors
export const LAYER_COLORS = [
  '#00d4ff',
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
];

// Create a new layer
export function createLayer(name: string, index: number): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    objects: [],
    color: LAYER_COLORS[index % LAYER_COLORS.length],
    expanded: false,
  };
}

// Create default layers
export function createDefaultLayers(): Layer[] {
  return [
    createLayer('Background', 0),
    createLayer('Layer 1', 1),
  ];
}
