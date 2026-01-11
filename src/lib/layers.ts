import { FabricObject } from "fabric";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objects: FabricObject[];
  color: string;
  expanded: boolean;
  groupId?: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  color: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
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

// Group colors
export const GROUP_COLORS = [
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
];

// Create a new layer
export function createLayer(name: string, index: number, groupId?: string): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    objects: [],
    color: LAYER_COLORS[index % LAYER_COLORS.length],
    expanded: false,
    groupId,
  };
}

// Create a new group
export function createGroup(name: string, index: number): LayerGroup {
  return {
    id: generateId(),
    name,
    color: GROUP_COLORS[index % GROUP_COLORS.length],
    expanded: true,
    visible: true,
    locked: false,
  };
}

// Create default layers
export function createDefaultLayers(): Layer[] {
  return [
    createLayer('Background', 0),
    createLayer('Layer 1', 1),
  ];
}
