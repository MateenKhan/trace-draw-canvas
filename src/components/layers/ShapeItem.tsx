import { memo, useCallback, useState, useEffect, useRef } from "react";
import { FabricObject } from "fabric";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    MousePointer2,
    GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShapeItemProps {
    object: FabricObject;
    depth?: number;
    isActive: boolean;
    onSelect: () => void;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onRename: (name: string) => void;
    isDropped?: boolean;
    isOrigin?: boolean;
}

export const ShapeItem = memo(({
    object,
    depth = 0,
    isActive,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onDelete,
    onDuplicate,
    onRename,
    isDropped,
    isOrigin,
}: ShapeItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState("");
    const [name, setName] = useState((object as any).name || object.type);

    const id = (object as any).id || `obj-${Math.random()}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting
    } = useSortable({ id, data: { type: 'shape', object, parentId: (object as any).layerId } });

    // Swipe State
    const [swipeX, setSwipeX] = useState(0);
    const startX = useRef(0);
    const dragY = useRef(0);
    const isSwiping = useRef(false);

    // Long Press State
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setName((object as any).name || object.type);
    }, [(object as any).name, object.type]);

    const startRename = useCallback(() => {
        setIsEditing(true);
        setEditingName(name || "Shape");
    }, [name]);

    const finishRename = useCallback(() => {
        if (editingName.trim()) {
            onRename(editingName.trim());
            setName(editingName.trim());
        }
        setIsEditing(false);
        setEditingName("");
    }, [editingName, onRename]);

    // Handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        if (isEditing) return;
        // Don't start swipe if clicking the drag handle or a button
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-drag-handle]')) return;

        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            startRename();
        }, 600);

        startX.current = e.clientX;
        dragY.current = e.clientY;
        isSwiping.current = true;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSwiping.current || isSorting) return;

        const deltaX = e.clientX - startX.current;
        const deltaY = e.clientY - dragY.current;

        // If vertical movement is dominant, this is a scroll, not a swipe
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            isSwiping.current = false;
            setSwipeX(0);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            return;
        }

        if (Math.abs(deltaX) > 5) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }

        if (deltaX < 0 && Math.abs(deltaX) < 100) {
            setSwipeX(deltaX);
        } else if (deltaX >= 0) {
            setSwipeX(0);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        isSwiping.current = false;

        const delta = e.clientX - startX.current;
        if (delta < -40) {
            // Swiped Left far enough - keep it open
            setSwipeX(-80);

            // Auto-close after 3 seconds
            setTimeout(() => {
                setSwipeX(0);
            }, 3000);
        } else {
            setSwipeX(0);
        }
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isSorting ? undefined : transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                transition: isSorting ? 'none' : transition,
                willChange: 'transform',
                marginLeft: `${depth * 12}px`,
                position: 'relative',
            }}
            className={cn(
                "relative overflow-hidden rounded-lg group/item touch-none select-none",
                isSorting ?
                    "opacity-40 ring-2 ring-primary/40 z-50 shadow-xl bg-accent/10" :
                    "transition-[background-color,ring,transform] duration-200",
                (isDropped || isOrigin) && "running-border"
            )}
        >
            {/* Background Actions (Delete on Left Swipe) */}
            <div
                className="absolute inset-y-0 right-0 bg-destructive w-full flex items-center justify-end pr-4 text-destructive-foreground cursor-pointer"
                onClick={() => onDelete()}
                style={{ opacity: swipeX < -20 ? 1 : 0 }}
            >
                <Trash2 className="w-4 h-4" />
            </div>

            {/* Foreground Content */}
            <div
                className={cn(
                    "relative flex items-center gap-1 p-1 bg-background border rounded-lg z-10 shadow-sm",
                    isActive ? "border-primary/50 ring-1 ring-primary/20" : "border-transparent hover:bg-accent/5"
                )}
                style={{ transform: `translateX(${swipeX}px)` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={onSelect}
            >
                {/* Drag Handle */}
                <div {...attributes} {...listeners} data-drag-handle className="cursor-grab active:cursor-grabbing p-0.5 touch-none">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-foreground flex-shrink-0" />
                </div>

                {/* Icon based on type */}
                <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                    <MousePointer2 className="w-3 h-3" />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 ml-1">
                    {isEditing ? (
                        <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={finishRename}
                            onKeyDown={(e) => e.key === "Enter" && finishRename()}
                            className="h-6 text-xs px-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className={cn(
                                "text-xs font-medium block truncate",
                                !object.visible && "text-muted-foreground line-through opacity-70"
                            )}
                        >
                            {name}
                        </span>
                    )}
                </div>

                {/* Always Visible Actions (User asked for View/Hide) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 hover:bg-background/80 flex-shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility();
                    }}
                >
                    {object.visible ? (
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                </Button>

                {/* Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 ml-0 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity"
                        >
                            <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 z-[1000]">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRename(); }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleLock(); }}>
                            {object.lockMovementX ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            {object.lockMovementX ? "Unlock" : "Lock"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
});

ShapeItem.displayName = "ShapeItem";
