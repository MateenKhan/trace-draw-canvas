import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  Download,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolPath, PathPoint, generateGCode, GCodeSettings, DEFAULT_GCODE_SETTINGS, estimateMachiningTime } from "@/lib/gcode";
import { ToolpathOverlay } from "./ToolpathOverlay";
import { toast } from "sonner";

interface SimulationState {
  isPlaying: boolean;
  progress: number;
  currentLine: number;
  currentPoint: PathPoint | null;
  showOverlay: boolean;
}

interface MobileSimulationPlayerProps {
  isVisible: boolean;
  onClose: () => void;
  toolPaths: ToolPath[];
  onSimulationChange?: (state: SimulationState) => void;
}

export const MobileSimulationPlayer = ({
  isVisible,
  onClose,
  toolPaths,
  onSimulationChange,
}: MobileSimulationPlayerProps) => {
  const [settings] = useState<GCodeSettings>(DEFAULT_GCODE_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const gcode = generateGCode(toolPaths, settings);
  const gcodeLines = gcode.split('\n');
  const estimatedTime = estimateMachiningTime(toolPaths, settings);

  // Calculate current point
  const allPoints = toolPaths.flatMap(tp => tp.points);
  const totalPoints = allPoints.length;
  const currentPoint: PathPoint | null = totalPoints > 0 
    ? allPoints[Math.min(Math.floor((progress / 100) * totalPoints), totalPoints - 1)] 
    : null;

  // Notify parent of simulation state changes
  useEffect(() => {
    onSimulationChange?.({
      isPlaying,
      progress,
      currentLine,
      currentPoint,
      showOverlay: isVisible,
    });
  }, [isPlaying, progress, currentLine, currentPoint, isVisible, onSimulationChange]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || gcodeLines.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentLine((prev) => {
        const nextLine = prev + 1;
        if (nextLine >= gcodeLines.length) {
          setIsPlaying(false);
          setProgress(100);
          return prev;
        }
        setProgress((nextLine / gcodeLines.length) * 100);
        return nextLine;
      });
    }, 80);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, gcodeLines.length]);

  // Reset when closing
  useEffect(() => {
    if (!isVisible) {
      setIsPlaying(false);
    }
  }, [isVisible]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentLine(0);
  };

  const skipForward = () => {
    setCurrentLine((prev) => Math.min(prev + 10, gcodeLines.length - 1));
    setProgress((prev) => Math.min(prev + 5, 100));
  };

  const skipBack = () => {
    setCurrentLine((prev) => Math.max(prev - 10, 0));
    setProgress((prev) => Math.max(prev - 5, 0));
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    setCurrentLine(Math.floor((newProgress / 100) * gcodeLines.length));
  };

  const handleExport = () => {
    const blob = new Blob([gcode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "toolpath.gcode";
    link.style.display = "none";
    
    const isSafariMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
    
    if (isSafariMobile) {
      window.open(url, "_blank");
      toast.success("G-code opened in new tab - use Share > Save to Files");
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("G-code exported successfully");
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[300] bg-black flex flex-col"
    >
      {/* Visualization Area - FULLSCREEN */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-950">
        {toolPaths.length > 0 ? (
          <>
            <ToolpathOverlay
              toolPaths={toolPaths}
              progress={progress}
              currentPoint={currentPoint}
              isPlaying={isPlaying}
              width={window.innerWidth}
              height={window.innerHeight - 100}
              show={true}
            />
            
            {/* Origin marker */}
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="text-[10px] text-white/70">Origin (0,0)</span>
            </div>
          </>
        ) : (
          <div className="text-white/60 text-center p-8">
            <p className="text-lg mb-2">No toolpaths available</p>
            <p className="text-sm">Add shapes to the canvas to generate toolpaths</p>
          </div>
        )}

        {/* Current position - compact */}
        {currentPoint && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded backdrop-blur-sm">
            <div className="text-[10px] font-mono text-white">
              X:{currentPoint.x.toFixed(1)} Y:{currentPoint.y.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dock - Compact Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-3 py-2 pb-safe shrink-0">
        {/* Progress Bar - Compact */}
        <div className="mb-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            min={0}
            max={100}
            step={0.1}
            className="w-full h-1 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.range]:bg-green-500"
          />
        </div>

        {/* Playback Controls - Dock Style */}
        <div className="flex items-center justify-between">
          {/* Left - Info */}
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className="text-[10px] text-white/60 font-mono">
              {((progress / 100) * estimatedTime).toFixed(1)}m
            </span>
          </div>

          {/* Center - Playback */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 w-8 h-8"
              onClick={reset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 w-8 h-8"
              onClick={skipBack}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              className={cn(
                "w-12 h-12 rounded-full",
                isPlaying 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-white hover:bg-white/90"
              )}
              onClick={isPlaying ? pause : play}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 w-8 h-8"
              onClick={skipForward}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 w-8 h-8"
              onClick={handleExport}
              disabled={toolPaths.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Right - Close */}
          <div className="flex items-center gap-1 min-w-[60px] justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 w-8 h-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
