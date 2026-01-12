import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  FolderOpen, 
  MoreVertical, 
  Pencil, 
  Copy, 
  Trash2, 
  Clock,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, formatDate } from "@/lib/projects";

interface ProjectsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onCreateProject: (name: string) => void;
  onOpenProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onViewHistory: (id: string) => void;
}

export const ProjectsPanel = ({
  isVisible,
  onClose,
  projects,
  activeProjectId,
  onCreateProject,
  onOpenProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onViewHistory,
}: ProjectsPanelProps) => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreateProject = useCallback(() => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProjectDialog(false);
    }
  }, [newProjectName, onCreateProject]);

  const handleStartRename = useCallback((project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (editingId && editingName.trim()) {
      onRenameProject(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, onRenameProject]);

  const handleConfirmDelete = useCallback(() => {
    if (showDeleteDialog) {
      onDeleteProject(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  }, [showDeleteDialog, onDeleteProject]);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] lg:relative lg:inset-auto">
        {/* Backdrop for mobile */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm lg:hidden" 
          onClick={onClose} 
        />
        
        {/* Panel */}
        <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm lg:relative lg:w-80 lg:max-w-none bg-background border-r border-panel-border flex flex-col overflow-hidden animate-slide-up lg:animate-none">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Projects</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="toolbar" 
                size="sm" 
                onClick={() => setShowNewProjectDialog(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden" 
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Project List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs mt-1">Create your first project to get started</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      activeProjectId === project.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => onOpenProject(project.id)}
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
                      {editingId === project.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmRename();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleConfirmRename}>
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium text-sm truncate">{project.name}</h3>
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
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartRename(project); }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateProject(project.id); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewHistory(project.id); }}>
                          <Clock className="w-4 h-4 mr-2" />
                          History
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(project.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to start designing
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
