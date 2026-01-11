import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LayerGroup, Layer } from "@/lib/layers";
import { LayerItem } from "./LayerItem";

interface LayerGroupItemProps {
  group: LayerGroup;
  layers: Layer[];
  activeLayerId: string | null;
  draggedId: string | null;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onLayerSelect: (layerId: string) => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerRename: (layerId: string, name: string) => void;
  onLayerDragStart: (e: React.DragEvent, layerId: string) => void;
  onLayerDragOver: (e: React.DragEvent) => void;
  onLayerDrop: (e: React.DragEvent, layerId: string) => void;
  canDeleteLayers: boolean;
}

export const LayerGroupItem = memo(({
  group,
  layers,
  activeLayerId,
  draggedId,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onRename,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerDelete,
  onLayerRename,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  canDeleteLayers,
}: LayerGroupItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState("");

  const startRename = useCallback(() => {
    setIsEditing(true);
    setEditingName(group.name);
  }, [group.name]);

  const finishRename = useCallback(() => {
    if (editingName.trim()) {
      onRename(editingName.trim());
    }
    setIsEditing(false);
    setEditingName("");
  }, [editingName, onRename]);

  return (
    <div className="rounded-lg border border-panel-border overflow-hidden bg-secondary/20">
      {/* Group header */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 cursor-pointer group hover:bg-secondary/50"
        )}
        onClick={onToggleExpand}
      >
        {/* Expand/collapse icon */}
        <Button
          variant="ghost"
          size="icon"
          className="w-5 h-5"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {group.expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>

        {/* Folder icon */}
        {group.expanded ? (
          <FolderOpen className="w-4 h-4" style={{ color: group.color }} />
        ) : (
          <Folder className="w-4 h-4" style={{ color: group.color }} />
        )}

        {/* Group name */}
        {isEditing ? (
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
              "flex-1 text-xs font-medium truncate",
              !group.visible && "text-muted-foreground line-through"
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
          >
            {group.name}
          </span>
        )}

        {/* Layer count badge */}
        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
          {layers.length}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            title={group.visible ? "Hide Group" : "Show Group"}
          >
            {group.visible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            title={group.locked ? "Unlock Group" : "Lock Group"}
          >
            {group.locked ? (
              <Lock className="w-3 h-3 text-warning" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Group"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Expanded layers */}
      {group.expanded && layers.length > 0 && (
        <div className="px-2 pb-2 pl-6 space-y-1">
          {layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              isDragging={draggedId === layer.id}
              canDelete={canDeleteLayers}
              onSelect={() => onLayerSelect(layer.id)}
              onToggleVisibility={() => onLayerToggleVisibility(layer.id)}
              onToggleLock={() => onLayerToggleLock(layer.id)}
              onDelete={() => onLayerDelete(layer.id)}
              onRename={(name) => onLayerRename(layer.id, name)}
              onDragStart={(e) => onLayerDragStart(e, layer.id)}
              onDragOver={onLayerDragOver}
              onDrop={(e) => onLayerDrop(e, layer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

LayerGroupItem.displayName = "LayerGroupItem";
