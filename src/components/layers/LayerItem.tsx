import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Layer } from "@/lib/layers";

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  isDragging: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const LayerItem = memo(({
  layer,
  isActive,
  isDragging,
  canDelete,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onRename,
  onDragStart,
  onDragOver,
  onDrop,
}: LayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState("");

  const startRename = useCallback(() => {
    setIsEditing(true);
    setEditingName(layer.name);
  }, [layer.name]);

  const finishRename = useCallback(() => {
    if (editingName.trim()) {
      onRename(editingName.trim());
    }
    setIsEditing(false);
    setEditingName("");
  }, [editingName, onRename]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer group",
        isActive
          ? "bg-primary/20 border border-primary/30"
          : "hover:bg-secondary/50 border border-transparent",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: layer.color }}
      />

      {/* Layer name */}
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
            "flex-1 text-xs truncate",
            !layer.visible && "text-muted-foreground line-through"
          )}
          onDoubleClick={startRename}
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
            onToggleVisibility();
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
            onToggleLock();
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
            onDelete();
          }}
          title="Delete Layer"
          disabled={!canDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
});

LayerItem.displayName = "LayerItem";
