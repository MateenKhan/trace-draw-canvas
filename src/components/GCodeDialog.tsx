import { forwardRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GCodePanel } from "@/components/GCodePanel";
import { ToolPath, pathToPoints, PathPoint } from "@/lib/gcode";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();

    // Extract toolpaths from canvas objects
    const getToolPaths = useCallback((): ToolPath[] => {
      if (!canvas) return [];

      const activeObjects = canvas.getActiveObjects();
      const objects = activeObjects.length > 0 ? activeObjects : canvas.getObjects();
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

      // Create a proper download link that works on mobile
      const link = document.createElement("a");
      link.href = url;
      link.download = "toolpath.gcode";
      link.style.display = "none";

      // For iOS Safari, we need to use a different approach
      const isSafariMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);

      if (isSafariMobile) {
        // Open in new tab for iOS Safari
        window.open(url, "_blank");
        toast.success("G-code opened in new tab - use Share > Save to Files");
      } else {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("G-code exported successfully");
      }

      // Cleanup after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, []);

    const toolPaths = getToolPaths();

    const content = (
      <>
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
      </>
    );

    // Use Sheet on mobile (slides up from bottom, partial height)
    if (isMobile) {
      return (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[50vh] overflow-y-auto rounded-t-xl"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="text-lg font-semibold">G-Code Generator</span>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-2 pb-4">
              {content}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    // Use Dialog on desktop
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg font-semibold">G-Code Generator</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

GCodeDialog.displayName = "GCodeDialog";
