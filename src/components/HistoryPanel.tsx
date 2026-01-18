import { HistoryEntry } from "@/hooks/useUndoRedo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Undo2, Redo2, History, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  currentIndex: number;
  onRestoreToIndex: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDeleteEntry: (index: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  isMobile: boolean;
}

export const HistoryPanel = ({
  isVisible,
  onClose,
  history,
  currentIndex,
  onRestoreToIndex,
  onUndo,
  onRedo,
  onClear,
  onDeleteEntry,
  canUndo,
  canRedo,
  isMobile,
}: HistoryPanelProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 right-4 z-50 w-72 glass rounded-2xl border border-panel-border shadow-xl animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">History</h3>
          <span className="text-xs text-muted-foreground">
            ({history.length} states)
          </span>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Undo/Redo/Clear buttons */}
      <div className="flex items-center gap-2 p-3 border-b border-panel-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="w-4 h-4" />
          Redo
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All History?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all undo/redo steps. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onClear();
                  toast.success("History cleared successfully");
                }}
              >
                Clear All History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* History list */}
      <ScrollArea className="h-80">
        <div className="p-2 space-y-1.5">
          {history.length <= 1 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs">Make changes to see them here</p>
            </div>
          ) : (
            [...history].reverse().map((entry, reversedIndex) => {
              const actualIndex = history.length - 1 - reversedIndex;
              const isCurrent = actualIndex === currentIndex;
              const isPast = actualIndex < currentIndex;

              return (
                <button
                  key={entry.id}
                  onClick={() => onRestoreToIndex(actualIndex)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group",
                    isCurrent
                      ? "bg-primary/20 border border-primary/40 shadow-glow"
                      : isPast
                        ? "opacity-60 hover:opacity-100 hover:bg-secondary"
                        : "hover:bg-secondary",
                  )}
                >
                  {/* Thumbnail */}
                  <div className={cn(
                    "w-14 h-10 rounded-lg overflow-hidden border flex-shrink-0",
                    isCurrent ? "border-primary" : "border-panel-border"
                  )}>
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt={entry.label}
                        className="w-full h-full object-cover bg-background"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <History className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs font-medium truncate",
                        isCurrent && "text-primary"
                      )}>
                        {entry.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  {/* Index indicator */}
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    #{actualIndex + 1}
                  </span>

                  {/* Individual Delete Action (Desktop Only) */}
                  {!isCurrent && !isMobile && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 ml-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete this state"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete History State #{actualIndex + 1}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this specific state from your undo timeline. You won't be able to restore to this exact point anymore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteEntry(actualIndex)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete State
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t border-panel-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Click any state to restore • Ctrl+Z / Ctrl+Shift+Z
        </p>
      </div>
    </div>
  );
};
