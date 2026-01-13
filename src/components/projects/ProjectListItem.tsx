import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FolderOpen,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    Clock,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, formatDate } from "@/lib/projects";

interface ProjectListItemProps {
    project: Project;
    isActive: boolean;
    isEditing: boolean;
    editingName: string;
    onEditingNameChange: (value: string) => void;
    onConfirmRename: () => void;
    onCancelRename: () => void;
    onStartRename: (project: Project) => void;
    onOpen: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onViewHistory: (id: string) => void;
    className?: string; // Allow passing extra classes like opacity control
}

export const ProjectListItem = ({
    project,
    isActive,
    isEditing,
    editingName,
    onEditingNameChange,
    onConfirmRename,
    onCancelRename,
    onStartRename,
    onOpen,
    onDuplicate,
    onDelete,
    onViewHistory,
    className,
}: ProjectListItemProps) => {
    return (
        <div
            className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50",
                className
            )}
            onClick={() => onOpen(project.id)}
        >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-md bg-muted/30 border border-panel-border overflow-hidden flex-shrink-0">
                {project.thumbnail ? (
                    <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <FolderOpen className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                            value={editingName}
                            onChange={(e) => onEditingNameChange(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onConfirmRename();
                                if (e.key === 'Escape') onCancelRename();
                            }}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onConfirmRename}>
                            <Check className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <h3 className="font-medium text-sm truncate text-foreground">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(project.updatedAt)}
                            {project.history.length > 0 && (
                                <span className="ml-1">• {project.history.length} snapshots</span>
                            )}
                        </p>
                    </>
                )}
            </div>

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartRename(project); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(project.id); }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewHistory(project.id); }}>
                        <Clock className="w-4 h-4 mr-2" />
                        History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
