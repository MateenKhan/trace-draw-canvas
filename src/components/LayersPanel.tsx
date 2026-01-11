import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  FolderPlus,
  Layers as LayersIcon,
} from "lucide-react";
import { Layer, LayerGroup, createLayer, createGroup } from "@/lib/layers";
import { LayerItem } from "@/components/layers/LayerItem";
import { LayerGroupItem } from "@/components/layers/LayerGroupItem";

interface LayersPanelProps {
  layers: Layer[];
  groups: LayerGroup[];
  activeLayerId: string | null;
  onLayersChange: (layers: Layer[]) => void;
  onGroupsChange: (groups: LayerGroup[]) => void;
  onActiveLayerChange: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export const LayersPanel = ({
  layers,
  groups,
  activeLayerId,
  onLayersChange,
  onGroupsChange,
  onActiveLayerChange,
  onDeleteLayer,
}: LayersPanelProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Get ungrouped layers (those without a groupId)
  const ungroupedLayers = layers.filter((l) => !l.groupId);

  // Get layers for a specific group
  const getGroupLayers = useCallback(
    (groupId: string) => layers.filter((l) => l.groupId === groupId),
    [layers]
  );

  const handleAddLayer = useCallback(() => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`, layers.length);
    onLayersChange([...layers, newLayer]);
    onActiveLayerChange(newLayer.id);
  }, [layers, onLayersChange, onActiveLayerChange]);

  const handleAddGroup = useCallback(() => {
    const newGroup = createGroup(`Group ${groups.length + 1}`, groups.length);
    onGroupsChange([...groups, newGroup]);
  }, [groups, onGroupsChange]);

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      onLayersChange(
        layers.map((l) =>
          l.id === layerId ? { ...l, visible: !l.visible } : l
        )
      );
    },
    [layers, onLayersChange]
  );

  const toggleLayerLock = useCallback(
    (layerId: string) => {
      onLayersChange(
        layers.map((l) =>
          l.id === layerId ? { ...l, locked: !l.locked } : l
        )
      );
    },
    [layers, onLayersChange]
  );

  const renameLayer = useCallback(
    (layerId: string, name: string) => {
      onLayersChange(
        layers.map((l) => (l.id === layerId ? { ...l, name } : l))
      );
    },
    [layers, onLayersChange]
  );

  const toggleGroupExpand = useCallback(
    (groupId: string) => {
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId ? { ...g, expanded: !g.expanded } : g
        )
      );
    },
    [groups, onGroupsChange]
  );

  const toggleGroupVisibility = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const newVisible = !group.visible;
      onGroupsChange(
        groups.map((g) => (g.id === groupId ? { ...g, visible: newVisible } : g))
      );
      // Also toggle visibility for all layers in the group
      onLayersChange(
        layers.map((l) =>
          l.groupId === groupId ? { ...l, visible: newVisible } : l
        )
      );
    },
    [groups, layers, onGroupsChange, onLayersChange]
  );

  const toggleGroupLock = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const newLocked = !group.locked;
      onGroupsChange(
        groups.map((g) => (g.id === groupId ? { ...g, locked: newLocked } : g))
      );
      // Also toggle lock for all layers in the group
      onLayersChange(
        layers.map((l) =>
          l.groupId === groupId ? { ...l, locked: newLocked } : l
        )
      );
    },
    [groups, layers, onGroupsChange, onLayersChange]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      // Remove groupId from all layers in the group (they become ungrouped)
      onLayersChange(
        layers.map((l) =>
          l.groupId === groupId ? { ...l, groupId: undefined } : l
        )
      );
      onGroupsChange(groups.filter((g) => g.id !== groupId));
    },
    [groups, layers, onGroupsChange, onLayersChange]
  );

  const renameGroup = useCallback(
    (groupId: string, name: string) => {
      onGroupsChange(
        groups.map((g) => (g.id === groupId ? { ...g, name } : g))
      );
    },
    [groups, onGroupsChange]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, layerId: string) => {
      setDraggedId(layerId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) return;

      const draggedIndex = layers.findIndex((l) => l.id === draggedId);
      const targetIndex = layers.findIndex((l) => l.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newLayers = [...layers];
      const [dragged] = newLayers.splice(draggedIndex, 1);
      
      // Inherit the target's groupId when dropped
      const targetLayer = layers[targetIndex];
      dragged.groupId = targetLayer.groupId;
      
      newLayers.splice(targetIndex, 0, dragged);

      onLayersChange(newLayers);
      setDraggedId(null);
    },
    [draggedId, layers, onLayersChange]
  );

  const canDeleteLayers = layers.length > 1;

  return (
    <div className="panel w-full animate-slide-up h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4" />
          Layers
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={handleAddGroup}
            title="Add Group"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={handleAddLayer}
            title="Add Layer"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Render groups */}
          {groups.map((group) => (
            <LayerGroupItem
              key={group.id}
              group={group}
              layers={getGroupLayers(group.id)}
              activeLayerId={activeLayerId}
              draggedId={draggedId}
              onToggleExpand={() => toggleGroupExpand(group.id)}
              onToggleVisibility={() => toggleGroupVisibility(group.id)}
              onToggleLock={() => toggleGroupLock(group.id)}
              onDelete={() => deleteGroup(group.id)}
              onRename={(name) => renameGroup(group.id, name)}
              onLayerSelect={onActiveLayerChange}
              onLayerToggleVisibility={toggleLayerVisibility}
              onLayerToggleLock={toggleLayerLock}
              onLayerDelete={onDeleteLayer}
              onLayerRename={renameLayer}
              onLayerDragStart={handleDragStart}
              onLayerDragOver={handleDragOver}
              onLayerDrop={handleDrop}
              canDeleteLayers={canDeleteLayers}
            />
          ))}

          {/* Render ungrouped layers */}
          {ungroupedLayers.slice().reverse().map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              isDragging={draggedId === layer.id}
              canDelete={canDeleteLayers}
              onSelect={() => onActiveLayerChange(layer.id)}
              onToggleVisibility={() => toggleLayerVisibility(layer.id)}
              onToggleLock={() => toggleLayerLock(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
              onRename={(name) => renameLayer(layer.id, name)}
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, layer.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Layer count */}
      <div className="px-3 py-2 border-t border-panel-border text-xs text-muted-foreground">
        {layers.length} layer{layers.length !== 1 ? "s" : ""} • {groups.length} group
        {groups.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};
