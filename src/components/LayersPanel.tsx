import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Canvas, FabricObject } from "fabric";
import { Layers as LayersIcon, FolderKanban, ChevronRight, ChevronDown, Plus, MoreVertical, Search, Pencil, Trash2, Eye, EyeOff, X, FolderPlus, PlusSquare, Undo, Redo, Square, Circle, Triangle as TriangleIcon, Type, Image as ImageIcon, Filter, MousePointer2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragMoveEvent,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LayerTreeItem } from "@/components/layers/LayerTreeItem";
import { ShapeItem } from "@/components/layers/ShapeItem";
import { LayerTreeState, createInitialState, generateId, flattenTree } from "@/lib/layer-tree";

interface LayersPanelProps {
  canvas: Canvas | null;
  projectName: string;
  onClose?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const LayersPanel = ({ canvas, projectName, onClose, onUndo, onRedo, canUndo, canRedo }: LayersPanelProps) => {
  // Tree State - Load from localStorage or create initial
  const [tree, setTree] = useState<LayerTreeState>(() => {
    try {
      const saved = localStorage.getItem('layerTreeState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.rootIds) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load layer tree state:', error);
    }
    return createInitialState(projectName);
  });

  // Fabric Objects State
  const [objects, setObjects] = useState<FabricObject[]>([]);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_base');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [lastDroppedId, setLastDroppedId] = useState<string | null>(null);
  const [lastOriginId, setLastOriginId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    if (lastDroppedId || lastOriginId) {
      const timer = setTimeout(() => {
        setLastDroppedId(null);
        setLastOriginId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastDroppedId, lastOriginId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save tree state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('layerTreeState', JSON.stringify(tree));
    } catch (error) {
      console.error('Failed to save layer tree state:', error);
    }
  }, [tree]);

  // Sync Project Name change
  useEffect(() => {
    setTree(prev => {
      const rootId = prev.rootIds[0];
      if (prev.nodes[rootId]?.name !== projectName) {
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [rootId]: { ...prev.nodes[rootId], name: projectName }
          }
        };
      }
      return prev;
    });
  }, [projectName]);

  // Sync Canvas Objects
  useEffect(() => {
    if (!canvas) return;

    const syncLayers = () => {
      const allObjects = [...canvas.getObjects()];
      allObjects.forEach(obj => {
        if (!(obj as any).layerId) {
          (obj as any).layerId = activeNodeId && tree.nodes[activeNodeId] ? activeNodeId : 'layer_base';
        }
      });
      setObjects(allObjects.reverse());
      const active = canvas.getActiveObjects();
      setActiveObject(active.length === 1 ? active[0] : null);
      setVersion(v => v + 1);
    };

    const handleObjectAdded = (e: any) => {
      if (e.target && !(e.target as any).layerId) {
        const targetId = activeNodeId && tree.nodes[activeNodeId] ? activeNodeId : 'layer_base';
        (e.target as any).layerId = targetId;
      }
      syncLayers();
    };

    syncLayers();
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', syncLayers);
    canvas.on('object:modified', syncLayers);
    canvas.on('object:moving', syncLayers);
    canvas.on('selection:created', syncLayers);
    canvas.on('selection:updated', syncLayers);
    canvas.on('selection:cleared', syncLayers);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', syncLayers);
      canvas.off('object:modified', syncLayers);
      canvas.off('object:moving', syncLayers);
      canvas.off('selection:created', syncLayers);
      canvas.off('selection:updated', syncLayers);
      canvas.off('selection:cleared', syncLayers);
    };
  }, [canvas, activeNodeId, tree]);

  const objectsMap = useMemo(() => {
    const map: Record<string, FabricObject[]> = {};
    objects.forEach(obj => {
      const lid = (obj as any).layerId || 'layer_base';
      if (!map[lid]) map[lid] = [];
      map[lid].push(obj);
    });
    return map;
  }, [objects, version]);

  const flattenedItems = useMemo(() => {
    return flattenTree(tree, objectsMap, tree.rootIds);
  }, [tree, objectsMap, version]);

  // Sync Canvas Z-Order based on Layers Panel Hierarchy
  useEffect(() => {
    if (!canvas || flattenedItems.length === 0) return;

    // We want the order in the list to reflect Z-order (Top of list = Top of canvas)
    // Fabric Z-index: 0 is bottom.
    // So we iterate through shapes in REVERSE order and assign Z-index starting from 0.
    const shapes = flattenedItems
      .filter(item => item.type === 'shape')
      .map(item => item.object);

    // Filter out duplicates and invalid objects
    const uniqueShapes = Array.from(new Set(shapes)).filter(Boolean);

    // Bottom-most item in Fabric is at index 0.
    // In our list, bottom-most item is at the end.
    const reversedShapes = [...uniqueShapes].reverse();

    reversedShapes.forEach((obj, index) => {
      if (canvas.getObjects().includes(obj)) {
        canvas.moveObjectTo(obj, index);
      }
    });

    canvas.requestRenderAll();
  }, [flattenedItems, canvas]);

  const handleToggleExpand = (id: string) => {
    setTree(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], expanded: !prev.nodes[id].expanded }
      }
    }));
  };

  const handleCreateNode = (parentId: string | null, type: 'project' | 'layer') => {
    const actualParentId = parentId || 'layer_base';
    const newId = generateId();
    const existingNodes = Object.values(tree.nodes).filter(n => n.type === type);
    const existingNumbers = existingNodes
      .map(n => {
        const match = n.name.match(new RegExp(`${type === 'project' ? 'Project' : 'Layer'}-(\\d+)`, 'i'));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const name = type === 'project' ? `Project-${nextNumber}` : `Layer-${nextNumber}`;

    const newNode = {
      id: newId,
      type,
      name,
      expanded: true,
      children: [],
      parentId
    };

    setTree(prev => ({
      nodes: {
        ...prev.nodes,
        [newId]: newNode,
        [actualParentId]: {
          ...prev.nodes[actualParentId],
          children: [newId, ...prev.nodes[actualParentId].children]
        }
      },
      rootIds: prev.rootIds
    }));
    setActiveNodeId(newId);
    setHighlightId(newId);
    setTimeout(() => setHighlightId(null), 3000); // Clear highlight after 3s
    toast.success(`${name} created`);
  };

  const handleDeleteNode = useCallback((id: string) => {
    if (id === 'layer_base' || id === tree.rootIds[0]) {
      toast.error("Cannot delete root/base elements");
      return;
    }

    setTree(prev => {
      const nextNodes = { ...prev.nodes };
      const allCanvasObjects = canvas?.getObjects() || [];
      const objectsToRemove: FabricObject[] = [];

      const deleteRecursive = (nodeId: string) => {
        const node = nextNodes[nodeId];
        if (!node) return;

        // Collect shapes in this layer
        const nodeShapes = allCanvasObjects.filter(obj => (obj as any).layerId === nodeId);
        objectsToRemove.push(...nodeShapes);

        // Recurse children
        [...node.children].forEach(deleteRecursive);

        // Clean up parent's children list
        if (node.parentId && nextNodes[node.parentId]) {
          nextNodes[node.parentId] = {
            ...nextNodes[node.parentId],
            children: nextNodes[node.parentId].children.filter(cid => cid !== nodeId)
          };
        }
        delete nextNodes[nodeId];
      };

      deleteRecursive(id);
      objectsToRemove.forEach(obj => canvas?.remove(obj));
      return { ...prev, nodes: nextNodes };
    });
    toast.success("Deleted");
  }, [canvas, tree.rootIds]);

  const handleRenameNode = (id: string, name: string) => {
    setTree(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], name }
      }
    }));
  };

  const handleMoveNode = (id: string, direction: 'up' | 'down') => {
    setTree(prev => {
      const node = prev.nodes[id];
      if (!node || !node.parentId) return prev;
      const parent = prev.nodes[node.parentId];
      const children = [...parent.children];
      const idx = children.indexOf(id);
      if (direction === 'up' && idx > 0) {
        [children[idx], children[idx - 1]] = [children[idx - 1], children[idx]];
      } else if (direction === 'down' && idx < children.length - 1) {
        [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
      } else {
        return prev;
      }
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [node.parentId]: { ...parent, children }
        }
      };
    });
    toast.success("Layer reordered");
  };

  const handleGroup = () => {
    if (selectedIds.size < 1) return;

    const newId = generateId();
    const itemsToGroup = flattenedItems.filter(i => selectedIds.has(i.id));

    // Find a suitable parent (parent of the first selected item)
    const firstItem = itemsToGroup[0];
    const parentId = firstItem.parentId || tree.rootIds[0];

    const newLayer = {
      id: newId,
      type: 'layer' as const,
      name: 'New Group',
      expanded: true,
      children: itemsToGroup.filter(i => i.type === 'node').map(i => i.id),
      parentId: parentId
    };

    setTree(prev => {
      const nextNodes = { ...prev.nodes, [newId]: newLayer };

      // Update parent of new layer
      const parent = nextNodes[parentId];
      const newParentChildren = [...parent.children];
      // Keep order: insert where the first grouped item was
      const firstIdx = parent.children.indexOf(itemsToGroup[0].id);
      const insertAt = firstIdx !== -1 ? firstIdx : 0;

      // Remove grouped nodes from old parents and update their parentId
      itemsToGroup.forEach(item => {
        if (item.type === 'node') {
          const oldPid = nextNodes[item.id].parentId;
          if (oldPid && nextNodes[oldPid]) {
            nextNodes[oldPid] = {
              ...nextNodes[oldPid],
              children: nextNodes[oldPid].children.filter(cid => cid !== item.id)
            };
          }
          nextNodes[item.id] = { ...nextNodes[item.id], parentId: newId };
        } else {
          // If it's a shape, update its layerId property
          (item.object as any).layerId = newId;
        }
      });

      // Insert new layer into parent's children
      nextNodes[parentId] = {
        ...nextNodes[parentId],
        children: [...parent.children.filter(cid => !selectedIds.has(cid)), newId]
      };

      return { ...prev, nodes: nextNodes };
    });

    setSelectedIds(new Set([newId]));
    toast.success("Items grouped");
  };

  const handleUngroup = () => {
    if (selectedIds.size === 0) return;

    setTree(prev => {
      const nextNodes = { ...prev.nodes };
      const selectedNodeIds = Array.from(selectedIds).filter(id => nextNodes[id] && id !== prev.rootIds[0] && id !== 'layer_base');

      selectedNodeIds.forEach(id => {
        const node = nextNodes[id];
        const parentId = node.parentId;
        if (!parentId || !nextNodes[parentId]) return;

        const parent = nextNodes[parentId];

        // 1. Move child nodes to parent
        node.children.forEach(cid => {
          if (nextNodes[cid]) {
            nextNodes[cid] = { ...nextNodes[cid], parentId };
          }
        });

        // 2. Move shapes to parent (logical move)
        const nodeShapes = objects.filter(obj => (obj as any).layerId === id);
        nodeShapes.forEach(obj => {
          (obj as any).layerId = parentId;
        });

        // 3. Update parent's children list
        const idx = parent.children.indexOf(id);
        const newParentChildren = [...parent.children];
        if (idx !== -1) {
          newParentChildren.splice(idx, 1, ...node.children);
        } else {
          newParentChildren.push(...node.children);
        }
        nextNodes[parentId] = { ...parent, children: newParentChildren };

        // 4. Delete the node
        delete nextNodes[id];
      });

      return { ...prev, nodes: nextNodes };
    });

    setSelectedIds(new Set());
    toast.success("Items ungrouped");
  };

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems = useMemo(() => {
    return flattenedItems.filter(item => selectedIds.has(item.id));
  }, [selectedIds, flattenedItems]);

  const isAllSelected = flattenedItems.length > 0 && selectedIds.size === flattenedItems.length;
  const handleSelectAll = (checked: boolean | string) => {
    if (checked === true) {
      setSelectedIds(new Set(flattenedItems.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    setTree(prev => {
      let nextNodes = { ...prev.nodes };
      const allCanvasObjects = canvas?.getObjects() || [];
      const objectsToRemove: FabricObject[] = [];

      const deleteRecursive = (nodeId: string) => {
        const node = nextNodes[nodeId];
        if (!node) return;

        const nodeShapes = allCanvasObjects.filter(obj => (obj as any).layerId === nodeId);
        objectsToRemove.push(...nodeShapes);

        [...node.children].forEach(deleteRecursive);

        if (node.parentId && nextNodes[node.parentId]) {
          nextNodes[node.parentId] = {
            ...nextNodes[node.parentId],
            children: nextNodes[node.parentId].children.filter(cid => cid !== nodeId)
          };
        }
        delete nextNodes[nodeId];
      };

      idsToDelete.forEach(id => {
        if (nextNodes[id]) {
          if (id !== prev.rootIds[0] && id !== 'layer_base') {
            const item = flattenedItems.find(i => i.id === id);
            if (item?.type === 'shape') {
              objectsToRemove.push(item.object);
            } else {
              deleteRecursive(id);
            }
          } else {
            // Shapes in root layers can still be deleted if selected as a shape
            const item = flattenedItems.find(i => i.id === id);
            if (item?.type === 'shape') {
              objectsToRemove.push(item.object);
            }
          }
        }
      });

      objectsToRemove.forEach(obj => canvas?.remove(obj));
      return { ...prev, nodes: nextNodes };
    });

    setSelectedIds(new Set());
    canvas?.requestRenderAll();
    toast.success("Selected items deleted");
  };

  const handleToggleSelectionVisibility = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const selectedItems = flattenedItems.filter(item => selectedIds.has(item.id));
    const isAnyVisible = selectedItems.some(item => {
      if (item.type === 'shape') return item.object.visible;
      const shapesInLayer = objects.filter(obj => (obj as any).layerId === item.id);
      return shapesInLayer.some(s => s.visible);
    });

    const targetVisibility = !isAnyVisible;
    selectedItems.forEach(item => {
      if (item.type === 'shape') {
        item.object.visible = targetVisibility;
      } else {
        const shapesInLayer = objects.filter(obj => (obj as any).layerId === item.id);
        shapesInLayer.forEach(s => s.visible = targetVisibility);
      }
    });

    if (!targetVisibility) canvas?.discardActiveObject();
    canvas?.requestRenderAll();
    setVersion(v => v + 1);
    toast.success(targetVisibility ? "Selection Visible" : "Selection Hidden");
  };

  const handleCloneSelected = async () => {
    const idsToClone = Array.from(selectedIds);
    if (idsToClone.length === 0 || !canvas) return;

    let nextNodes = { ...tree.nodes };
    const allObjects = canvas.getObjects();

    const cloneNodeRecursive = async (nodeId: string, parentId: string): Promise<string> => {
      const node = tree.nodes[nodeId];
      if (!node) return "";

      const newNodeId = generateId();
      const newNode = {
        ...node,
        id: newNodeId,
        parentId: parentId,
        children: [] as string[],
        name: `${node.name} (Copy)`
      };

      nextNodes[newNodeId] = newNode;

      // Clone shapes
      const nodeShapes = allObjects.filter(obj => (obj as any).layerId === nodeId);
      for (const shape of nodeShapes) {
        const cloned = await shape.clone();
        cloned.set({
          left: (shape.left || 0) + 10,
          top: (shape.top || 0) + 10
        });
        (cloned as any).layerId = newNodeId;
        canvas.add(cloned);
      }

      // Clone children
      for (const childId of node.children) {
        const newChildId = await cloneNodeRecursive(childId, newNodeId);
        if (newChildId) newNode.children.push(newChildId);
      }

      return newNodeId;
    };

    for (const id of idsToClone) {
      const item = flattenedItems.find(i => i.id === id);
      if (!item) continue;

      if (item.type === 'shape') {
        const shape = item.object;
        const cloned = await shape.clone();
        cloned.set({
          left: (shape.left || 0) + 10,
          top: (shape.top || 0) + 10
        });
        (cloned as any).layerId = item.parentId;
        canvas.add(cloned);
      } else {
        if (id === 'layer_base' || id === tree.rootIds[0]) continue;
        const node = tree.nodes[id];
        const parentId = node.parentId;
        if (parentId) {
          const newNodeId = await cloneNodeRecursive(id, parentId);
          if (newNodeId) {
            nextNodes[parentId] = {
              ...nextNodes[parentId],
              children: [newNodeId, ...nextNodes[parentId].children]
            };
          }
        }
      }
    }

    setTree(prev => ({ ...prev, nodes: nextNodes }));
    canvas.requestRenderAll();
    setVersion(v => v + 1);
    toast.success("Selection cloned");
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragData(event.active.data.current);
    setOffsetLeft(0);
  };

  const rafId = useRef<number | null>(null);
  const handleDragMove = (event: DragMoveEvent) => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      setOffsetLeft(event.delta.x);
      rafId.current = null;
    });
  };

  const handleDragOver = (event: DragOverEvent) => { };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;
    setActiveDragId(null);
    setActiveDragData(null);
    if (!over) {
      setOffsetLeft(0);
      return;
    }
    setLastOriginId(activeId);
    setLastDroppedId(activeId);

    const horizontalOffset = offsetLeft;
    setOffsetLeft(0);

    const activeItem = flattenedItems.find(i => i.id === activeId);
    const overItem = flattenedItems.find(i => i.id === overId);
    if (!activeItem || !overItem) return;

    if (activeItem.type === 'shape') {
      let targetLayerId = overItem.type === 'node' ? overItem.id : overItem.parentId;
      if (targetLayerId && (activeItem.object as any).layerId !== targetLayerId) {
        (activeItem.object as any).layerId = targetLayerId;
      }
      const activeObj = activeItem.object;
      const overObj = overItem.type === 'shape' ? overItem.object : null;
      if (activeObj && overObj && activeObj !== overObj) {
        const overIdx = canvas?.getObjects().indexOf(overObj);
        if (overIdx !== undefined && overIdx !== -1) canvas?.moveObjectTo(activeObj, overIdx);
      } else if (activeObj && overItem.type === 'node') {
        const layerShapes = canvas?.getObjects().filter(o => (o as any).layerId === targetLayerId);
        if (layerShapes && layerShapes.length > 0) {
          const topIdx = canvas?.getObjects().indexOf(layerShapes[layerShapes.length - 1]);
          if (topIdx !== undefined && topIdx !== -1) canvas?.moveObjectTo(activeObj, topIdx);
        }
      }
      setVersion(v => v + 1);
      canvas?.requestRenderAll();
      canvas?.fire('object:modified', { target: activeObj });
      toast.success("Shape reordered");
      return;
    }

    if (activeId === tree.rootIds[0]) {
      toast.error("Root project cannot be moved");
      return;
    }

    const itemsWithoutActive = flattenedItems.filter(i => i.id !== activeId);
    const overIdxInFlat = itemsWithoutActive.findIndex(i => i.id === overId);
    if (overIdxInFlat === -1) return;

    setTree(prev => {
      const nextTree = { ...prev, nodes: { ...prev.nodes } };
      const node = nextTree.nodes[activeId];
      const oldParentId = node.parentId!;
      const oldParent = nextTree.nodes[oldParentId];
      nextTree.nodes[oldParentId] = { ...oldParent, children: oldParent.children.filter(id => id !== activeId) };

      // 2. Determine new Parent and Index
      const threshold = 5; // Reduced threshold for better nesting sensitivity
      const effectiveDepthDelta = Math.abs(horizontalOffset) > threshold ? Math.round(horizontalOffset / 10) : 0;

      const itemBefore = overIdxInFlat > 0 ? itemsWithoutActive[overIdxInFlat - 1] : null;
      let newDepth = itemBefore ? itemBefore.depth : 0;
      if (itemBefore) {
        newDepth = Math.max(0, Math.min(itemBefore.depth + (itemBefore.type === 'node' ? 1 : 0), itemBefore.depth + effectiveDepthDelta));
      }

      let newParentId = tree.rootIds[0];
      if (itemBefore) {
        if (newDepth > itemBefore.depth && itemBefore.type === 'node') {
          newParentId = itemBefore.id;
        } else {
          let currId: string | null = itemBefore.id;
          let currDepth = itemBefore.depth;
          while (currId && currDepth > newDepth) {
            currId = nextTree.nodes[currId]?.parentId || null;
            currDepth--;
          }
          newParentId = (currId ? nextTree.nodes[currId]?.parentId : null) || tree.rootIds[0];
        }
      }

      const newParent = nextTree.nodes[newParentId];
      const newChildren = [...newParent.children];
      let targetIdForIndex = overId;
      const overItemInFlat = itemsWithoutActive[overIdxInFlat];
      if (overItemInFlat.type === 'shape') targetIdForIndex = overItemInFlat.parentId;

      const newIdx = newChildren.indexOf(targetIdForIndex);
      if (newIdx !== -1) {
        const activeIdxInFlat = flattenedItems.findIndex(i => i.id === activeId);
        const overIdxInFlatOrg = flattenedItems.findIndex(i => i.id === overId);
        if (activeIdxInFlat < overIdxInFlatOrg) newChildren.splice(newIdx + 1, 0, activeId);
        else newChildren.splice(newIdx, 0, activeId);
      } else {
        newChildren.push(activeId);
      }

      nextTree.nodes[newParentId] = { ...newParent, children: newChildren, expanded: true };
      nextTree.nodes[activeId] = { ...node, parentId: newParentId };
      return nextTree;
    });
    toast.success("Hierarchy updated");
  };

  const shouldShowNode = useCallback((nodeId: string): boolean => {
    if (!searchQuery) return true;
    const node = tree.nodes[nodeId];
    if (!node) return false;
    if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    const nodeObjects = objectsMap[nodeId] || [];
    if (nodeObjects.some(obj => ((obj as any).name || obj.type).toLowerCase().includes(searchQuery.toLowerCase()))) return true;
    return node.children.some(id => shouldShowNode(id));
  }, [searchQuery, tree.nodes, objectsMap]);

  const renderFlatTree = () => {
    let filteredItems = flattenedItems;

    // Apply Type Filter
    if (typeFilter) {
      filteredItems = filteredItems.filter(item => {
        if (item.type === 'node') return true; // Keep nodes so children can be shown
        return item.object.type === typeFilter;
      });
      // Further filter: remove nodes that have no matching children
      const matchingItems = filteredItems.filter(i => i.type === 'shape');
      const validNodeIds = new Set(matchingItems.map(i => i.parentId));
      filteredItems = filteredItems.filter(i => i.type === 'shape' || validNodeIds.has(i.id));
    }

    if (filteredItems.length === 0) return null;
    return (
      <SortableContext items={filteredItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
        {filteredItems.map(item => {
          if (item.type === 'node') {
            const { node, depth, id } = item;
            if (!shouldShowNode(id)) return null;
            return (
              <LayerTreeItem
                key={id} node={node} depth={depth} objects={[]}
                onToggleExpand={handleToggleExpand} onCreateNode={handleCreateNode}
                onDeleteNode={handleDeleteNode} onRenameNode={handleRenameNode}
                onMoveNode={handleMoveNode} lastDroppedId={lastDroppedId}
                lastOriginId={lastOriginId} activeObject={activeObject}
                onSelectObject={() => { }}
                isNodeVisible={objectsMap[id]?.some(s => s.visible)}
                isHighlighted={highlightId === id}
                onToggleVisibility={() => {
                  const nodeShapes = objects.filter(obj => (obj as any).layerId === id);
                  const isAnyVisible = nodeShapes.some(s => s.visible);
                  nodeShapes.forEach(s => s.visible = !isAnyVisible);
                  if (isAnyVisible) canvas?.discardActiveObject();
                  canvas?.requestRenderAll();
                  setVersion(v => v + 1);
                }}
                onToggleLock={() => { }} onDeleteObject={() => { }}
                onDuplicateObject={() => { }} onRenameObject={() => { }}
                isSelected={selectedIds.has(id)}
                onToggleSelect={() => handleToggleSelect(id)}
              />
            );
          } else {
            const { object, depth, id, parentId } = item;
            if (!searchQuery && !tree.nodes[parentId]?.expanded) return null;
            if (searchQuery && !((object.name || object.type).toLowerCase().includes(searchQuery.toLowerCase()))) {
              if (!tree.nodes[parentId].name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
            }
            return (
              <ShapeItem
                key={id} id={id} object={object} depth={depth} isActive={activeObject === object}
                onSelect={() => { if (canvas) { canvas.setActiveObject(object); canvas.requestRenderAll(); setActiveNodeId(parentId); } }}
                onToggleVisibility={() => { object.visible = !object.visible; if (!object.visible) canvas?.discardActiveObject(); canvas?.requestRenderAll(); setVersion(v => v + 1); }}
                onToggleLock={() => { const v = !object.lockMovementX; object.lockMovementX = v; object.lockMovementY = v; object.lockRotation = v; object.lockScalingX = v; object.lockScalingY = v; canvas?.requestRenderAll(); setVersion(v => v + 1); }}
                onDelete={() => { canvas?.remove(object); canvas?.requestRenderAll(); }}
                onDuplicate={async () => { const cloned = await object.clone(); cloned.set({ left: (object.left || 0) + 20, top: (object.top || 0) + 20 }); (cloned as any).layerId = parentId; canvas?.add(cloned); canvas?.setActiveObject(cloned); canvas?.requestRenderAll(); }}
                onRename={(name) => { object.set('name', name); setVersion(v => v + 1); }}
                onMove={(direction) => { direction === 'up' ? canvas?.bringObjectForward(object) : canvas?.sendObjectBackwards(object); canvas?.requestRenderAll(); canvas?.fire('object:modified', { target: object }); setVersion(v => v + 1); }}
                isSelected={selectedIds.has(id)}
                isHighlighted={highlightId === id}
                onToggleSelect={() => handleToggleSelect(id)}
              />
            );
          }
        })}
      </SortableContext>
    );
  };

  if (!canvas) return null;
  return (
    <div className="panel w-full animate-slide-up h-full flex flex-col overflow-hidden bg-background">
      {/* Redesigned Header Row 1 */}
      <div className="flex items-center gap-2 h-11 px-3 border-b border-border/40 bg-background/95 backdrop-blur shrink-0">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          className="h-4 w-4 shrink-0"
          title="Select All"
        />

        {/* Scrollable Actions Area */}
        <div className="flex-1 overflow-x-auto flex items-center gap-0.5 mx-2 px-1 border-x border-border/20 custom-horizontal-scrollbar">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={() => handleCreateNode(activeLayerId, 'layer')}
            title="New Layer"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={() => handleCreateNode(activeLayerId, 'project')}
            title="New Project"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border/40 mx-1 shrink-0" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 disabled:opacity-30"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 disabled:opacity-30"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-border/40">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10 shrink-0"
                onClick={handleGroup}
                title="Group"
              >
                <PlusSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-accent shrink-0"
                onClick={handleUngroup}
                title="Ungroup"
              >
                <LayersIcon className="w-4 h-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-accent shrink-0"
                onClick={handleToggleSelectionVisibility}
                title="Toggle Visibility"
              >
                {selectedItems.some(item => {
                  if (item.type === 'shape') return item.object.visible;
                  const shapesInLayer = objects.filter(obj => (obj as any).layerId === item.id);
                  return shapesInLayer.some(s => s.visible);
                }) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-accent shrink-0"
                onClick={handleCloneSelected}
                title="Clone Selection"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={handleDeleteSelected}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Row 2: Search & Filter */}
      <div className="p-2 border-b border-border/40 flex-shrink-0 space-y-2">
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="h-8 pl-8 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/40" placeholder="Search layers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'rect', icon: Square, label: 'Squares' },
              { id: 'circle', icon: Circle, label: 'Circles' },
              { id: 'triangle', icon: TriangleIcon, label: 'Triangles' },
              { id: 'i-text', icon: Type, label: 'Text' },
              { id: 'image', icon: ImageIcon, label: 'Images' },
              { id: 'path', icon: Pencil, label: 'Paths' },
            ].map(f => (
              <Button
                key={f.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 transition-all duration-200",
                  typeFilter === f.id ? "bg-primary text-primary-foreground shadow-glow scale-110" : "text-muted-foreground hover:bg-accent"
                )}
                onClick={() => setTypeFilter(typeFilter === f.id ? null : f.id)}
                title={f.label}
              >
                <f.icon className="w-3.5 h-3.5" />
              </Button>
            ))}
          </div>
        </div>
        {typeFilter && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Active Filter:</span>
            <div className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border border-primary/20 animate-scale-in">
              {typeFilter}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-foreground" onClick={() => setTypeFilter(null)} />
            </div>
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} onDragOver={handleDragOver} measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }} modifiers={[]}>
        <div className="flex-1 overflow-auto p-2 custom-scrollbar custom-horizontal-scrollbar">
          <div className="min-w-max pb-20">{renderFlatTree()}</div>
        </div>
        <DragOverlay dropAnimation={null} zIndex={1000}>
          {activeDragId ? (
            <div className="opacity-95 bg-background border p-2 rounded shadow-2xl min-w-[200px] text-xs font-medium cursor-grabbing pointer-events-none ring-2 ring-primary/30 backdrop-blur-md" style={{ touchAction: 'none' }}>
              <div className="flex items-center gap-2">
                {activeDragData?.type === 'node' ? (tree.nodes[activeDragId]?.type === 'project' ? <FolderKanban className="w-3.5 h-3.5" /> : <LayersIcon className="w-3.5 h-3.5" />) : <Plus className="w-3.5 h-3.5" />}
                <span className="truncate">{activeDragData?.type === 'node' ? tree.nodes[activeDragId]?.name : (activeDragData?.object?.name || activeDragData?.object?.type || 'Shape')}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Localized Bottom Stats Area */}
      <div className="mt-auto border-t border-border/40 p-2 bg-background/50 backdrop-blur shrink-0 animate-slide-up-local">
        <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground uppercase font-semibold">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><LayersIcon className="w-3 h-3" /> {flattenedItems.length} Total</span>
            {selectedIds.size > 0 && (
              <span className="text-primary flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> {selectedIds.size} Selected</span>
            )}
          </div>
          <span>v{version}</span>
        </div>
      </div>
    </div>
  );
};
