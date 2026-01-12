import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, ProjectSnapshot, formatDate } from "@/lib/projects";

interface ProjectHistoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
  project: Project | null;
  onRestoreSnapshot: (index: number) => void;
}

export const ProjectHistoryPanel = ({
  isVisible,
  onClose,
  project,
  onRestoreSnapshot,
}: ProjectHistoryPanelProps) => {
  if (!isVisible || !project) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-background border-l border-panel-border flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-panel-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Project History</h2>
              <p className="text-xs text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* History List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {project.history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No history yet</p>
                <p className="text-xs mt-1">Snapshots will appear here as you work</p>
              </div>
            ) : (
              project.history.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={cn(
                    "group relative flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    index === project.historyIndex
                      ? "bg-primary/10 border-primary/30"
                      : "border-transparent hover:bg-muted/50 hover:border-panel-border"
                  )}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2",
                      index === project.historyIndex
                        ? "bg-primary border-primary"
                        : "bg-background border-muted-foreground"
                    )} />
                    {index < project.history.length - 1 && (
                      <div className="w-0.5 h-full bg-muted-foreground/30 mt-1" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-md bg-muted/30 border border-panel-border overflow-hidden flex-shrink-0">
                    {snapshot.thumbnail ? (
                      <img 
                        src={snapshot.thumbnail} 
                        alt={snapshot.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{snapshot.label}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(snapshot.timestamp)}
                    </p>
                    {index === project.historyIndex && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Restore button */}
                  {index !== project.historyIndex && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRestoreSnapshot(index)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              )).reverse() // Show newest first
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
