import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Layers as LayersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Layer, createLayer, LAYER_COLORS } from "@/lib/layers";

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayersChange: (layers: Layer[]) => void;
  onActiveLayerChange: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export const LayersPanel = ({
  layers,
  activeLayerId,
  onLayersChange,
  onActiveLayerChange,
  onDeleteLayer,
}: LayersPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleAddLayer = useCallback(() => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`, layers.length);
    onLayersChange([...layers, newLayer]);
    onActiveLayerChange(newLayer.id);
  }, [layers, onLayersChange, onActiveLayerChange]);

  const toggleVisibility = useCallback((layerId: string) => {
    onLayersChange(
      layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      )
    );
  }, [layers, onLayersChange]);

  const toggleLock = useCallback((layerId: string) => {
    onLayersChange(
      layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      )
    );
  }, [layers, onLayersChange]);

  const startRename = useCallback((layer: Layer) => {
    setEditingId(layer.id);
    setEditingName(layer.name);
  }, []);

  const finishRename = useCallback(() => {
    if (editingId && editingName.trim()) {
      onLayersChange(
        layers.map((l) =>
          l.id === editingId ? { ...l, name: editingName.trim() } : l
        )
      );
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, layers, onLayersChange]);

  const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    setDraggedId(layerId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = layers.findIndex((l) => l.id === draggedId);
    const targetIndex = layers.findIndex((l) => l.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLayers = [...layers];
    const [dragged] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, dragged);

    onLayersChange(newLayers);
    setDraggedId(null);
  }, [draggedId, layers, onLayersChange]);

  return (
    <div className="panel w-full animate-slide-up">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4" />
          Layers
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleAddLayer}
          title="Add Layer"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[250px]">
        <div className="p-2 space-y-1">
          {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, layer.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer group",
                activeLayerId === layer.id
                  ? "bg-primary/20 border border-primary/30"
                  : "hover:bg-secondary/50 border border-transparent",
                draggedId === layer.id && "opacity-50"
              )}
              onClick={() => onActiveLayerChange(layer.id)}
            >
              {/* Drag handle */}
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: layer.color }}
              />

              {/* Layer name */}
              {editingId === layer.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => e.key === "Enter" && finishRename()}
                  className="h-6 text-xs flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    "flex-1 text-xs truncate",
                    !layer.visible && "text-muted-foreground line-through"
                  )}
                  onDoubleClick={() => startRename(layer)}
                >
                  {layer.name}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  title={layer.visible ? "Hide" : "Show"}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  title={layer.locked ? "Unlock" : "Lock"}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-warning" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  title="Delete Layer"
                  disabled={layers.length <= 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Layer count */}
      <div className="px-3 py-2 border-t border-panel-border text-xs text-muted-foreground">
        {layers.length} layer{layers.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};
