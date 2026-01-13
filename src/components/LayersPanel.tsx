import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Canvas, FabricObject } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers as LayersIcon, Folder, ChevronRight, ChevronDown, Plus, FolderOpen, MoreVertical, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LayerTreeItem } from "@/components/layers/LayerTreeItem";
import { ShapeItem } from "@/components/layers/ShapeItem";
import { LayerTreeState, createInitialState, generateId, findNode, flattenTree } from "@/lib/layer-tree";

interface LayersPanelProps {
  canvas: Canvas | null;
  projectName: string;
}

export const LayersPanel = ({ canvas, projectName }: LayersPanelProps) => {
  // Tree State
  const [tree, setTree] = useState<LayerTreeState>(createInitialState(projectName));

  // Fabric Objects State
  const [objects, setObjects] = useState<FabricObject[]>([]);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_base');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null); // For selection in tree
  const [version, setVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
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
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      // Ensure objects have layerId
      allObjects.forEach(obj => {
        if (!(obj as any).layerId) {
          (obj as any).layerId = 'layer_base'; // Default to base
        }
      });

      setObjects(allObjects.reverse());

      const active = canvas.getActiveObjects();
      setActiveObject(active.length === 1 ? active[0] : null);
      setVersion(v => v + 1);
    };

    syncLayers();

    canvas.on('object:added', (e) => {
      if (e.target && !(e.target as any).layerId) {
        const targetId = activeNodeId && tree.nodes[activeNodeId] ? activeNodeId : 'layer_base';
        (e.target as any).layerId = targetId;
      }
      syncLayers();
    });
    canvas.on('object:removed', syncLayers);
    canvas.on('object:modified', syncLayers);
    canvas.on('selection:created', syncLayers);
    canvas.on('selection:updated', syncLayers);
    canvas.on('selection:cleared', syncLayers);

    return () => {
      canvas.off('object:added');
      canvas.off('object:removed');
      canvas.off('object:modified');
      canvas.off('selection:created');
      canvas.off('selection:updated');
      canvas.off('selection:cleared');
    };
  }, [canvas, activeNodeId, tree]);

  // Map objects to nodes
  const objectsMap = useMemo(() => {
    const map: Record<string, FabricObject[]> = {};
    objects.forEach(obj => {
      const lid = (obj as any).layerId || 'layer_base';
      if (!map[lid]) map[lid] = [];
      map[lid].push(obj);
    });
    return map;
  }, [objects]);


  // Tree Operations
  const handleToggleExpand = (id: string) => {
    setTree(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], expanded: !prev.nodes[id].expanded }
      }
    }));
  };

  const handleCreateNode = (parentId: string, type: 'project' | 'layer') => {
    const newId = generateId();
    const newNode = {
      id: newId,
      type,
      name: type === 'project' ? 'New Project' : 'New Layer',
      expanded: true,
      children: [],
      parentId
    };

    setTree(prev => ({
      nodes: {
        ...prev.nodes,
        [newId]: newNode,
        [parentId]: {
          ...prev.nodes[parentId],
          children: [newId, ...prev.nodes[parentId].children]
        }
      },
      rootIds: prev.rootIds
    }));
    setActiveNodeId(newId);
    toast.success(`New ${type} created`);
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'layer_base' || id === tree.rootIds[0]) {
      toast.error("Cannot delete root/base elements");
      return;
    }

    const node = tree.nodes[id];
    if (objectsMap[id]) {
      objectsMap[id].forEach(obj => canvas?.remove(obj));
    }

    const parentId = node.parentId;
    if (!parentId) return;

    setTree(prev => {
      const parent = prev.nodes[parentId];
      const newChildren = parent.children.filter(cid => cid !== id);
      const { [id]: deleted, ...remainingNodes } = prev.nodes;
      return {
        nodes: {
          ...remainingNodes,
          [parentId]: { ...parent, children: newChildren }
        },
        rootIds: prev.rootIds
      };
    });
    toast.success("Deleted");
  };

  const handleRenameNode = (id: string, name: string) => {
    setTree(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], name }
      }
    }));
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragData(event.active.data.current);
    setOffsetLeft(0);
  };

  const rafId = useRef<number | null>(null);

  const handleDragMove = (event: DragMoveEvent) => {
    if (rafId.current) return; // Skip if already scheduled

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

    // Calculate depth change
    const indentStep = 12;
    const depthDelta = Math.round(offsetLeft / indentStep);
    setOffsetLeft(0);

    const activeItem = flattenedItems.find(i => i.id === activeId);
    if (!activeItem) return;

    // --- SHAPE DRAGGING ---
    if (activeItem.type === 'shape') {
      const overItem = flattenedItems.find(i => i.id === overId);
      if (!overItem) return;

      let targetLayerId = overItem.type === 'node' ? overItem.id : overItem.parentId;
      if (targetLayerId && (activeItem.object as any).layerId !== targetLayerId) {
        (activeItem.object as any).layerId = targetLayerId;
        setVersion(v => v + 1);
        toast.success("Shape moved");
      }
      return;
    }

    // --- NODE DRAGGING ---
    if (activeId === tree.rootIds[0]) {
      toast.error("Root project cannot be moved");
      return;
    }

    const itemsWithoutActive = flattenedItems.filter(i => i.id !== activeId);
    const newIndex = itemsWithoutActive.findIndex(i => i.id === overId);
    if (newIndex === -1) return;

    // Proposed new state
    setTree(prev => {
      const nextTree = { ...prev, nodes: { ...prev.nodes } };
      const node = nextTree.nodes[activeId];
      const oldParentId = node.parentId!;

      // 1. Remove from old parent
      const oldParent = nextTree.nodes[oldParentId];
      nextTree.nodes[oldParentId] = {
        ...oldParent,
        children: oldParent.children.filter(id => id !== activeId)
      };

      // 2. Determine new Parent and Index
      const itemBefore = newIndex > 0 ? itemsWithoutActive[newIndex - 1] : null;
      const itemAt = itemsWithoutActive[newIndex];

      let newDepth = Math.max(0, activeItem.depth + depthDelta);
      let newParentId = tree.rootIds[0];

      if (itemBefore) {
        // Can't be more than 1 level deeper than the item before
        newDepth = Math.min(newDepth, itemBefore.depth + 1);

        if (newDepth > itemBefore.depth) {
          // If moving deeper, try making it a child of the item above
          if (itemBefore.type === 'node' && itemBefore.node.type === 'project') {
            newParentId = itemBefore.id;
          } else {
            newParentId = itemBefore.parentId || tree.rootIds[0];
            newDepth = itemBefore.depth;
          }
        } else if (newDepth === itemBefore.depth) {
          newParentId = itemBefore.parentId || tree.rootIds[0];
        } else {
          // Moving shallower: find ancestor with matching depth
          let p = itemBefore.parentId;
          while (p) {
            const pDepth = flattenedItems.find(fi => fi.id === p)?.depth || 0;
            if (pDepth < newDepth) break;
            p = nextTree.nodes[p].parentId;
          }
          newParentId = p || tree.rootIds[0];
        }
      }

      // Final safety: ensuring newParent is a project
      while (newParentId && nextTree.nodes[newParentId].type !== 'project') {
        newParentId = nextTree.nodes[newParentId].parentId || tree.rootIds[0];
      }

      // 3. Insert into new parent
      const newParent = nextTree.nodes[newParentId];
      const newChildren = [...newParent.children];

      // Find best insertion point in new parent
      // If the 'over' item is now a child of the same parent, insert near it
      let insertAt = newChildren.length;
      const overIndexInNewParent = newChildren.indexOf(overId);
      if (overIndexInNewParent !== -1) {
        insertAt = overIndexInNewParent;
      }

      newChildren.splice(insertAt, 0, activeId);
      nextTree.nodes[newParentId] = { ...newParent, children: newChildren, expanded: true };
      nextTree.nodes[activeId] = { ...node, parentId: newParentId };

      return nextTree;
    });

    toast.success("Hierarchy updated");
  };


  // Recursive search filter
  const shouldShowNode = useCallback((nodeId: string): boolean => {
    if (!searchQuery) return true;
    const node = tree.nodes[nodeId];
    if (!node) return false;

    // Check self
    if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;

    // Check objects in this node
    const nodeObjects = objectsMap[nodeId] || [];
    if (nodeObjects.some(obj => ((obj as any).name || obj.type).toLowerCase().includes(searchQuery.toLowerCase()))) return true;

    // Check children recursively
    return node.children.some(id => shouldShowNode(id));
  }, [searchQuery, tree.nodes, objectsMap]);


  // Compute flat list for sorting
  const flattenedItems = useMemo(() => {
    return flattenTree(tree, objectsMap, tree.rootIds);
  }, [tree, objectsMap]);

  // Recursively render tree? No, let's use flat rendering for stability
  const renderFlatTree = () => {
    if (flattenedItems.length === 0) return null;

    return (
      <SortableContext
        items={flattenedItems.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {flattenedItems.map(item => {
          if (item.type === 'node') {
            const { node, depth, id } = item;
            if (!shouldShowNode(id)) return null;

            // Only show shapes if we want them inside nodes, 
            // but in flat mode, shapes are separate items.
            // So we pass an empty objects list to LayerTreeItem 
            // because shapes will be rendered as separate FlatItems.
            return (
              <LayerTreeItem
                key={id}
                node={node}
                depth={depth}
                objects={[]} // Shapes rendered as separate items
                onToggleExpand={handleToggleExpand}
                onCreateNode={handleCreateNode}
                onDeleteNode={handleDeleteNode}
                onRenameNode={handleRenameNode}
                lastDroppedId={lastDroppedId}
                lastOriginId={lastOriginId}
                activeObject={activeObject}
                onSelectObject={() => { }} // Not used here
                onToggleVisibility={() => { }}
                onToggleLock={() => { }}
                onDeleteObject={() => { }}
                onDuplicateObject={() => { }}
                onRenameObject={() => { }}
              />
            );
          } else {
            const { object, depth, id, parentId } = item;
            // Optionally filter shapes based on parent visibility/search
            if (!searchQuery && !tree.nodes[parentId]?.expanded) return null;
            if (searchQuery && !((object.name || object.type).toLowerCase().includes(searchQuery.toLowerCase()))) {
              // If the parent layer matches search, we might want to show all shapes.
              if (!tree.nodes[parentId].name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return null;
              }
            }

            return (
              <ShapeItem
                key={id}
                object={object}
                depth={depth}
                isActive={activeObject === object}
                onSelect={() => {
                  if (canvas) {
                    canvas.setActiveObject(object);
                    canvas.requestRenderAll();
                    setActiveNodeId(parentId);
                  }
                }}
                onToggleVisibility={() => {
                  object.visible = !object.visible;
                  if (!object.visible) canvas?.discardActiveObject();
                  canvas?.requestRenderAll();
                  setVersion(v => v + 1);
                }}
                onToggleLock={() => {
                  const v = !object.lockMovementX;
                  object.lockMovementX = v; object.lockMovementY = v; object.lockRotation = v; object.lockScalingX = v; object.lockScalingY = v;
                  canvas?.requestRenderAll();
                  setVersion(v => v + 1);
                }}
                onDelete={() => {
                  canvas?.remove(object);
                  canvas?.requestRenderAll();
                }}
                onDuplicate={async () => {
                  const cloned = await object.clone();
                  cloned.set({ left: (object.left || 0) + 20, top: (object.top || 0) + 20 });
                  (cloned as any).layerId = parentId;
                  canvas?.add(cloned);
                  canvas?.setActiveObject(cloned);
                  canvas?.requestRenderAll();
                }}
                onRename={(name) => {
                  object.set('name', name);
                  setVersion(v => v + 1);
                }}
              />
            );
          }
        })}
      </SortableContext>
    );
  };

  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.WhileDragging,
    },
  };

  if (!canvas) return null;

  return (
    <div className="panel w-full animate-slide-up h-full flex flex-col overflow-hidden bg-background">
      <div className="p-2 border-b border-border/40 flex-shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs bg-muted/30"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px] gap-1 px-2"
            onClick={() => handleCreateNode(activeLayerId || tree.rootIds[0], 'project')}
          >
            <Folder className="w-3 h-3" />
            New Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[10px] gap-1 px-2"
            onClick={() => handleCreateNode(activeLayerId || tree.rootIds[0], 'layer')}
          >
            <LayersIcon className="w-3 h-3" />
            New Layer
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.BeforeDragging,
          },
        }}
        modifiers={[]}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
          {renderFlatTree()}
        </div>

        <DragOverlay dropAnimation={null} zIndex={1000}>
          {activeDragId ? (
            <div
              className="opacity-95 bg-background border p-2 rounded shadow-2xl min-w-[200px] text-xs font-medium cursor-grabbing pointer-events-none ring-2 ring-primary/30 backdrop-blur-md"
              style={{ touchAction: 'none' }}
            >
              <div className="flex items-center gap-2">
                {activeDragData?.type === 'node' ? (
                  tree.nodes[activeDragId]?.type === 'project' ? <Folder className="w-3.5 h-3.5" /> : <LayersIcon className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span className="truncate">
                  {activeDragData?.type === 'node' ? tree.nodes[activeDragId]?.name : (activeDragData?.object?.name || activeDragData?.object?.type || 'Shape')}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
