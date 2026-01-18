import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  FolderOpen,
} from "lucide-react";
import { Project } from "@/lib/projects";
import { ProjectListItem } from "./projects/ProjectListItem";
import { CreateProjectDialog } from "./projects/CreateProjectDialog";
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog";

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
  const isMobile = useIsMobile();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const pendingNewProjectRef = useRef<boolean>(false);

  const handleCreateProject = useCallback(() => {
    if (isMobile) {
      // On mobile: create project immediately with default name
      const defaultName = 'Base Project';
      console.log('[ProjectsPanel] Mobile: Creating project with default name:', defaultName);
      pendingNewProjectRef.current = true;
      onCreateProject(defaultName);
    } else {
      // Desktop: use dialog
      if (newProjectName.trim()) {
        try {
          console.log('[ProjectsPanel] Desktop: Calling onCreateProject with:', newProjectName.trim());
          onCreateProject(newProjectName.trim());
          setNewProjectName("");
          setShowNewProjectDialog(false);
          console.log('[ProjectsPanel] Desktop: Project creation initiated, dialog closed');
        } catch (error) {
          console.error('[ProjectsPanel] Desktop: Error creating project:', error);
        }
      } else {
        console.warn('[ProjectsPanel] Desktop: handleCreateProject called but project name is empty');
      }
    }
  }, [newProjectName, onCreateProject, isMobile]);

  const handleStartRename = useCallback((project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (editingId && editingName.trim()) {
      onRenameProject(editingId, editingName.trim());
      pendingNewProjectRef.current = false;
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, onRenameProject]);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  // On mobile: auto-start editing when new project is created
  useEffect(() => {
    if (!isMobile || !pendingNewProjectRef.current) return;

    // Find the most recently created project with default name
    // Projects are sorted newest first, so the first one with default name is the newest
    const defaultName = 'Base Project';
    const newProject = projects.find(p => p.name === defaultName);

    if (newProject && editingId !== newProject.id) {
      // Check if it was created very recently (within last 3 seconds)
      const isRecent = Date.now() - newProject.createdAt < 3000;
      if (isRecent) {
        console.log('[ProjectsPanel] Mobile: Starting inline edit for new project:', newProject.id);
        setEditingId(newProject.id);
        setEditingName(defaultName);
        // Focus and select text after a brief delay to ensure DOM is updated
        setTimeout(() => {
          const input = document.activeElement as HTMLInputElement;
          if (input && input.tagName === 'INPUT' && input.value === defaultName) {
            input.select();
          }
        }, 150);
      }
    }
  }, [projects, isMobile, editingId]);

  const handleConfirmDelete = useCallback(() => {
    if (showDeleteDialog) {
      onDeleteProject(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  }, [showDeleteDialog, onDeleteProject]);

  if (!isVisible) return null;

  const ProjectListContent = () => (
    <div className="p-2 space-y-1">
      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No projects yet</p>
          <p className="text-xs mt-1">Create your first project to get started</p>
        </div>
      ) : (
        projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            isActive={activeProjectId === project.id}
            isEditing={editingId === project.id}
            editingName={editingName}
            onEditingNameChange={setEditingName}
            onConfirmRename={handleConfirmRename}
            onCancelRename={handleCancelRename}
            onStartRename={handleStartRename}
            onOpen={onOpenProject}
            onDuplicate={onDuplicateProject}
            onDelete={setShowDeleteDialog}
            onViewHistory={onViewHistory}
          />
        ))
      )}
    </div>
  );

  // Mobile: Use Sheet for slidable panel
  if (isMobile) {
    return (
      <>
        <Sheet open={isVisible} onOpenChange={(open) => !open && onClose()}>
          <SheetContent
            side="left"
            className="w-[85%] max-w-sm p-0 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-panel-border shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Projects</h2>
              </div>
              <div className="flex items-center gap-2 mr-8">
                <Button
                  variant="toolbar"
                  size="sm"
                  onClick={() => {
                    console.log('[ProjectsPanel] Mobile: New button clicked, creating project inline');
                    handleCreateProject();
                  }}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </div>
            </div>

            {/* Project List */}
            <ScrollArea className="flex-1">
              <ProjectListContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <CreateProjectDialog
          open={showNewProjectDialog}
          onOpenChange={setShowNewProjectDialog}
          projectName={newProjectName}
          onProjectNameChange={setNewProjectName}
          onCreate={handleCreateProject}
        />

        <DeleteProjectDialog
          open={!!showDeleteDialog}
          onOpenChange={(open) => !open && setShowDeleteDialog(null)}
          onConfirm={handleConfirmDelete}
        />
      </>
    );
  }

  // Desktop: Use fixed panel (doesn't affect layout)
  return (
    <>
      <div className="hidden lg:block fixed inset-y-0 left-0 w-80 z-[100] bg-background border-r border-panel-border flex flex-col overflow-hidden" style={{ willChange: 'transform' }}>
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
              onClick={() => {
                console.log('[ProjectsPanel] Desktop: New button clicked, opening dialog');
                setShowNewProjectDialog(true);
              }}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>
        </div>

        {/* Project List */}
        <ScrollArea className="flex-1">
          <ProjectListContent />
        </ScrollArea>
      </div>

      <CreateProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        projectName={newProjectName}
        onProjectNameChange={setNewProjectName}
        onCreate={handleCreateProject}
      />

      <DeleteProjectDialog
        open={!!showDeleteDialog}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
