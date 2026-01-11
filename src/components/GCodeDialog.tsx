import { forwardRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GCodePanel } from "@/components/GCodePanel";
import { ToolPath, pathToPoints, PathPoint } from "@/lib/gcode";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";

interface SimulationState {
  isPlaying: boolean;
  progress: number;
  currentLine: number;
  currentPoint: PathPoint | null;
  showOverlay: boolean;
}

interface GCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvas: FabricCanvas | null;
  onSimulationChange?: (state: SimulationState) => void;
}

export const GCodeDialog = forwardRef<HTMLDivElement, GCodeDialogProps>(
  ({ open, onOpenChange, canvas, onSimulationChange }, ref) => {
    // Extract toolpaths from canvas objects
    const getToolPaths = useCallback((): ToolPath[] => {
      if (!canvas) return [];

      const objects = canvas.getObjects();
      const toolPaths: ToolPath[] = [];

      objects.forEach((obj, index) => {
        const pathData = obj.toSVG?.();
        if (!pathData) return;

        // Extract path d attribute from SVG
        const pathMatch = pathData.match(/d="([^"]+)"/);
        if (pathMatch) {
          const points = pathToPoints(pathMatch[1], 1);
          if (points.length > 0) {
            toolPaths.push({
              id: `path-${index}`,
              name: `Object ${index + 1}`,
              type: 'profile',
              points,
              depth: 3,
              color: '#00ff00',
            });
          }
        }
      });

      return toolPaths;
    }, [canvas]);

    const handleExportGCode = useCallback((gcode: string) => {
      const blob = new Blob([gcode], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "toolpath.gcode";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("G-code exported successfully");
    }, []);

    const toolPaths = getToolPaths();

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg font-semibold">G-Code Generator</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <GCodePanel 
              toolPaths={toolPaths} 
              onExportGCode={handleExportGCode}
              onSimulationChange={onSimulationChange}
            />
            {toolPaths.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add shapes to the canvas to generate toolpaths
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

GCodeDialog.displayName = "GCodeDialog";
