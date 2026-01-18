import { UniqueIdentifier } from "@dnd-kit/core";

export type LayerNodeType = 'project' | 'layer';

export interface LayerNodeData {
    id: string;
    type: LayerNodeType;
    name: string;
    expanded: boolean;
    children: string[]; // IDs of children
    parentId: string | null;
    locked?: boolean;
}

export interface LayerTreeState {
    nodes: Record<string, LayerNodeData>;
    rootIds: string[];
}

export const generateId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

export const createInitialState = (baseProjectName: string = "Base Project"): LayerTreeState => {
    const baseId = 'layer_base';
    const projectId = 'root_project';

    return {
        nodes: {
            [projectId]: {
                id: projectId,
                type: 'project',
                name: baseProjectName,
                expanded: true,
                children: [baseId],
                parentId: null
            },
            [baseId]: {
                id: baseId,
                type: 'layer',
                name: 'Base Layer',
                expanded: true,
                children: [],
                parentId: projectId
            }
        },
        rootIds: [projectId]
    };
};

export function findNode(state: LayerTreeState, id: string): LayerNodeData | undefined {
    return state.nodes[id];
}

export type FlattenedItem =
    | { type: 'node'; id: string; node: LayerNodeData; depth: number; parentId: string | null }
    | { type: 'shape'; id: string; object: any; depth: number; parentId: string };

export function flattenTree(
    state: LayerTreeState,
    objectsMap: Record<string, any[]>, // From Fabric objects
    nodeIds: string[],
    depth = 0,
    parentId: string | null = null
): FlattenedItem[] {
    const flattened: FlattenedItem[] = [];

    nodeIds.forEach((id) => {
        const node = state.nodes[id];
        if (!node) return;

        flattened.push({
            type: 'node',
            id,
            node,
            depth,
            parentId
        });

        if (node.expanded) {
            // 1. Add child nodes first so they appear at the top
            if (node.children.length > 0) {
                flattened.push(...flattenTree(state, objectsMap, node.children, depth + 1, id));
            }

            // 2. Add shapes of this node after child nodes
            const shapes = objectsMap[id] || [];
            shapes.forEach((obj, idx) => {
                const shapeId = obj.id || `shape_${id}_${idx}`;
                flattened.push({
                    type: 'shape',
                    id: shapeId,
                    object: obj,
                    depth: depth + 1,
                    parentId: id
                });
            });
        }
    });

    return flattened;
}
