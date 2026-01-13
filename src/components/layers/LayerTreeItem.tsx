import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, FolderKanban, MoreVertical, Plus, Pencil, Trash2, Layers, GripVertical, Eye, EyeOff } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { LayerNodeData } from "@/lib/layer-tree";
import { FabricObject } from "fabric";
import { ShapeItem } from "./ShapeItem";
import { useRef, useState, useEffect } from "react";

interface LayerTreeItemProps {
    node: LayerNodeData;
    depth: number;
    onToggleExpand: (id: string) => void;
    onCreateNode: (parentId: string, type: 'project' | 'layer') => void;
    onDeleteNode: (id: string) => void;
    onRenameNode: (id: string, name: string) => void;
    onMoveNode: (id: string, direction: 'up' | 'down') => void;
    objects: FabricObject[]; // Objects belonging to this node
    children?: React.ReactNode;
    // Shape handlers
    activeObject: FabricObject | null;
    onSelectObject: (obj: FabricObject) => void;
    onToggleVisibility: (obj: FabricObject) => void;
    onToggleLock: (obj: FabricObject) => void;
    onDeleteObject: (obj: FabricObject) => void;
    onDuplicateObject: (obj: FabricObject) => void;
    onRenameObject: (obj: FabricObject, name: string) => void;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    isNodeVisible?: boolean;
    isHighlighted?: boolean;
    lastDroppedId: string | null;
    lastOriginId: string | null;
}

export const LayerTreeItem = ({
    node,
    depth,
    onToggleExpand,
    onCreateNode,
    onDeleteNode,
    onRenameNode,
    onMoveNode,
    objects,
    children,
    // Shape props
    activeObject,
    onSelectObject,
    onToggleVisibility,
    onToggleLock,
    onDeleteObject,
    onDuplicateObject,
    onRenameObject,
    isSelected,
    onToggleSelect,
    isNodeVisible = true,
    isHighlighted = false,
    lastDroppedId,
    lastOriginId
}: LayerTreeItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: node.id, data: { type: 'node', node } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
    };

    // Rename State
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState(node.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            // Tiny delay ensures DOM is ready and helps trigger keyboard on some mobile browsers
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isEditing]);

    // Actions State
    const [swipeX, setSwipeX] = useState(0);
    const dragX = useRef(0);
    const startX = useRef(0);
    const isSwiping = useRef(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const Icon = node.type === 'project' ? FolderKanban : Layers;

    const startRename = () => {
        setIsEditing(true);
        setEditingName(node.name);
    };

    const finishRename = () => {
        if (editingName.trim() && editingName !== node.name) {
            onRenameNode(node.id, editingName.trim());
        }
        setIsEditing(false);
    };

    // Handlers for Swipe/LongPress
    const handlePointerDown = (e: React.PointerEvent) => {
        if (isEditing) return;
        // Don't start swipe if clicking the drag handle or a button
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-drag-handle]')) return;

        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            startRename();
        }, 600);

        startX.current = e.clientX;
        dragX.current = e.clientY; // Track Y for vertical scroll detection
        isSwiping.current = true;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSwiping.current || isDragging) return; // Don't swipe if DnD dragging (controlled by dnd-kit via handle)

        const deltaX = e.clientX - startX.current;
        const deltaY = e.clientY - dragX.current;

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

        // Only allow left swipe (negative deltaX)
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
            setSwipeX(-80); // Fixed position showing delete

            // Auto-close after 3 seconds
            setTimeout(() => {
                setSwipeX(0);
            }, 3000);
        } else {
            // Not swiped far enough - close immediately
            setSwipeX(0);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                transition: isDragging ? 'none' : transition,
                willChange: 'transform',
                paddingLeft: `${depth * 12}px`,
                position: 'relative',
            }}
            className={cn(
                "outline-none relative group/node rounded-md",
                isDragging ?
                    "opacity-40 ring-2 ring-primary/40 z-50 shadow-xl bg-accent/10" :
                    "transition-[background-color,ring,transform] duration-200",
                (node.id === lastDroppedId || node.id === lastOriginId) && "running-border"
            )}
        >

            {/* Background Actions (Delete on Left Swipe) */}
            {/* Note: Absolute positioning here might be tricky with nested children.
                Move this inside a wrapper div just for the header? Yes.
            */}

            <div className="relative overflow-hidden rounded-md my-0.5">
                {/* Delete Background */}
                <div
                    className="absolute inset-y-0 right-0 bg-destructive w-full flex items-center justify-end pr-8 text-destructive-foreground cursor-pointer"
                    onClick={() => onDeleteNode(node.id)}
                    style={{ opacity: swipeX < -20 ? 1 : 0 }}
                >
                    <Trash2 className="w-4 h-4" />
                </div>

                {/* Node Header */}
                <div
                    className={cn(
                        "group flex items-center gap-1 p-1.5 rounded-md bg-background hover:bg-accent/5 select-none relative z-10",
                        isHighlighted && "ring-2 ring-primary animate-pulse-neon shadow-glow"
                    )}
                    style={{ transform: `translateX(${swipeX}px)` }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    {/* Explicit Drag Handle */}
                    <div {...attributes} {...listeners} data-drag-handle className="cursor-grab active:cursor-grabbing p-2 -ml-1 text-muted-foreground/50 hover:text-foreground touch-none shrink-0">
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        className="h-3.5 w-3.5 ml-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-transparent shrink-0"
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
                    >
                        {node.children.length > 0 || objects.length > 0 ? (
                            node.expanded ? <ChevronDown className="w-3.5 h-3.5 opacity-70" /> : <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                        ) : <span className="w-3.5" />}
                    </Button>

                    {/* Icon & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 p-0.5 rounded">
                        <Icon className={cn("w-4 h-4 shrink-0", node.type === 'project' ? "text-primary" : "text-blue-500")} />

                        {isEditing ? (
                            <Input
                                ref={inputRef}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={finishRename}
                                onKeyDown={(e) => e.key === "Enter" && finishRename()}
                                className="h-6 text-xs px-1"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-xs font-medium truncate" onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}>{node.name}</span>
                        )}
                    </div>

                    {/* Visibility & Add Actions */}
                    <div className="flex items-center">
                        {/* We don't have visibility state on node yet, just UI */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5"
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(objects[0]); }}
                            title="Toggle Visibility"
                        >
                            {isNodeVisible ? (
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                        </Button>
                    </div>

                    {/* Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 z-[1000]">
                            <DropdownMenuItem onClick={() => onCreateNode(node.id, 'project')}>
                                <Plus className="w-4 h-4 mr-2" /> New Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCreateNode(node.id, 'layer')}>
                                <Plus className="w-4 h-4 mr-2" /> New Layer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={startRename}>
                                <Pencil className="w-4 h-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoveNode(node.id, 'up')}>
                                <ChevronRight className="w-4 h-4 mr-2 -rotate-90" /> Move Up
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoveNode(node.id, 'down')}>
                                <ChevronRight className="w-4 h-4 mr-2 rotate-90" /> Move Down
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteNode(node.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>


                </div>
            </div>
        </div>
    );
};
