import { Button } from "@/components/ui/button";
import { RotateCcw, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecoveryDialogProps {
  isVisible: boolean;
  timestamp: number | null;
  thumbnail?: string;
  onRecover: () => void;
  onDiscard: () => void;
}

export const RecoveryDialog = ({
  isVisible,
  timestamp,
  thumbnail,
  onRecover,
  onDiscard,
}: RecoveryDialogProps) => {
  if (!isVisible || !timestamp) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass rounded-2xl border border-panel-border shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-panel-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Recover Previous Work?</h2>
              <p className="text-sm text-muted-foreground">
                We found an auto-saved session
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Thumbnail preview */}
          {thumbnail && (
            <div className="relative rounded-xl overflow-hidden border border-panel-border bg-background">
              <img 
                src={thumbnail} 
                alt="Saved canvas preview" 
                className="w-full h-32 object-contain"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </div>
            </div>
          )}

          {!thumbnail && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last saved {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Your previous canvas session was automatically saved. Would you like to continue where you left off?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-panel-border bg-secondary/20">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onDiscard}
          >
            <X className="w-4 h-4" />
            Start Fresh
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={onRecover}
          >
            <RotateCcw className="w-4 h-4" />
            Recover
          </Button>
        </div>
      </div>
    </div>
  );
};
