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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-white">
            <h3 className="font-semibold text-sm">G-Code Simulation</h3>
            <p className="text-xs text-white/60">
              {toolPaths.length} toolpath{toolPaths.length !== 1 ? 's' : ''} • {estimatedTime.toFixed(1)} min
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={handleExport}
            disabled={toolPaths.length === 0}
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {toolPaths.length > 0 ? (
          <ToolpathOverlay
            toolPaths={toolPaths}
            progress={progress}
            currentPoint={currentPoint}
            isPlaying={isPlaying}
            width={Math.min(window.innerWidth * 0.95, 600)}
            height={Math.min(window.innerHeight * 0.5, 400)}
            show={true}
          />
        ) : (
          <div className="text-white/60 text-center p-8">
            <p className="text-lg mb-2">No toolpaths available</p>
            <p className="text-sm">Add shapes to the canvas to generate toolpaths</p>
          </div>
        )}

        {/* Status overlay */}
        {isPlaying && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/90 rounded-full text-white text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            CUTTING
          </div>
        )}

        {/* Current position */}
        {currentPoint && (
          <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/60 rounded-lg backdrop-blur-sm">
            <div className="text-xs text-white/60 mb-1">Position</div>
            <div className="text-sm font-mono text-white">
              X: {currentPoint.x.toFixed(2)} Y: {currentPoint.y.toFixed(2)}
            </div>
          </div>
        )}

        {/* Current G-code line */}
        <div className="absolute bottom-4 right-4 px-3 py-2 bg-black/60 rounded-lg backdrop-blur-sm max-w-[200px]">
          <div className="text-xs text-white/60 mb-1">
            Line {currentLine + 1} / {gcodeLines.length}
          </div>
          <code className="text-xs font-mono text-green-400 block truncate">
            {gcodeLines[currentLine] || 'Ready'}
          </code>
        </div>
      </div>

      {/* Video Player Controls */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-4 pb-safe">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            min={0}
            max={100}
            step={0.1}
            className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.range]:bg-green-500"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-white/60">
            <span>{((progress / 100) * estimatedTime).toFixed(1)} min</span>
            <span>{estimatedTime.toFixed(1)} min</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={reset}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={skipBack}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className={cn(
              "w-16 h-16 rounded-full",
              isPlaying 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-white hover:bg-white/90"
            )}
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? (
              <Pause className={cn("w-7 h-7", isPlaying ? "text-white" : "text-black")} />
            ) : (
              <Play className="w-7 h-7 text-black ml-1" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={skipForward}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={handleExport}
            disabled={toolPaths.length === 0}
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
