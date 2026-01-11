import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Settings,
  Zap,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  GCodeSettings,
  ToolPath,
  DEFAULT_GCODE_SETTINGS,
  generateGCode,
  estimateMachiningTime,
  PathPoint,
} from "@/lib/gcode";
import { cn } from "@/lib/utils";

interface SimulationState {
  isPlaying: boolean;
  progress: number;
  currentLine: number;
  currentPoint: PathPoint | null;
  showOverlay: boolean;
}

interface GCodePanelProps {
  toolPaths: ToolPath[];
  onExportGCode: (gcode: string) => void;
  onSimulationChange?: (state: SimulationState) => void;
}

export const GCodePanel = forwardRef<HTMLDivElement, GCodePanelProps>(({ toolPaths, onExportGCode, onSimulationChange }, ref) => {
  const [settings, setSettings] = useState<GCodeSettings>(DEFAULT_GCODE_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const estimatedTime = estimateMachiningTime(toolPaths, settings);
  const gcode = generateGCode(toolPaths, settings);
  const gcodeLines = gcode.split('\n');

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
      showOverlay,
    });
  }, [isPlaying, progress, currentLine, currentPoint, showOverlay, onSimulationChange]);

  // Simulation controls
  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentLine(0);
  }, []);

  const skipForward = useCallback(() => {
    setCurrentLine((prev) => Math.min(prev + 10, gcodeLines.length - 1));
    setProgress((prev) => Math.min(prev + 5, 100));
  }, [gcodeLines.length]);

  const skipBack = useCallback(() => {
    setCurrentLine((prev) => Math.max(prev - 10, 0));
    setProgress((prev) => Math.max(prev - 5, 0));
  }, []);

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

  const handleExport = useCallback(() => {
    onExportGCode(gcode);
  }, [gcode, onExportGCode]);

  const updateTool = useCallback((key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      tool: { ...prev.tool, [key]: value },
    }));
  }, []);

  const updateCutting = useCallback((key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      cutting: { ...prev.cutting, [key]: value },
    }));
  }, []);

  return (
    <div className="panel w-full animate-slide-up">
      <Tabs defaultValue="toolpath" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-lg">
          <TabsTrigger value="toolpath" className="gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tool</span>
          </TabsTrigger>
          <TabsTrigger value="cutting" className="gap-1.5 text-xs">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cutting</span>
          </TabsTrigger>
          <TabsTrigger value="simulate" className="gap-1.5 text-xs">
            <Play className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Simulate</span>
          </TabsTrigger>
        </TabsList>

        {/* Tool Settings */}
        <TabsContent value="toolpath" className="space-y-4 p-3">
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Tool Type
            </Label>
            <Select
              value={settings.tool.type}
              onValueChange={(v) => updateTool('type', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="endmill">End Mill</SelectItem>
                <SelectItem value="ballnose">Ball Nose</SelectItem>
                <SelectItem value="vbit">V-Bit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Tool Diameter
              </Label>
              <span className="text-xs font-mono text-primary">{settings.tool.diameter}mm</span>
            </div>
            <Slider
              value={[settings.tool.diameter]}
              onValueChange={(v) => updateTool('diameter', v[0])}
              min={0.5}
              max={12}
              step={0.1}
              className="w-full"
            />
          </div>

          {settings.tool.type === 'vbit' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  V-Bit Angle
                </Label>
                <span className="text-xs font-mono text-primary">{settings.tool.vbitAngle || 60}°</span>
              </div>
              <Slider
                value={[settings.tool.vbitAngle || 60]}
                onValueChange={(v) => updateTool('vbitAngle', v[0])}
                min={15}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Material
            </Label>
            <Select
              value={settings.tool.material}
              onValueChange={(v) => updateTool('material', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hss">HSS</SelectItem>
                <SelectItem value="carbide">Carbide</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Cutting Parameters */}
        <TabsContent value="cutting" className="space-y-4 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Feed Rate
              </Label>
              <span className="text-xs font-mono text-primary">{settings.cutting.feedRate} mm/min</span>
            </div>
            <Slider
              value={[settings.cutting.feedRate]}
              onValueChange={(v) => updateCutting('feedRate', v[0])}
              min={100}
              max={5000}
              step={50}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Plunge Rate
              </Label>
              <span className="text-xs font-mono text-primary">{settings.cutting.plungeRate} mm/min</span>
            </div>
            <Slider
              value={[settings.cutting.plungeRate]}
              onValueChange={(v) => updateCutting('plungeRate', v[0])}
              min={50}
              max={1000}
              step={25}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Spindle Speed
              </Label>
              <span className="text-xs font-mono text-primary">{settings.cutting.spindleSpeed} RPM</span>
            </div>
            <Slider
              value={[settings.cutting.spindleSpeed]}
              onValueChange={(v) => updateCutting('spindleSpeed', v[0])}
              min={1000}
              max={30000}
              step={500}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Depth Per Pass
              </Label>
              <span className="text-xs font-mono text-primary">{settings.cutting.depthPerPass} mm</span>
            </div>
            <Slider
              value={[settings.cutting.depthPerPass]}
              onValueChange={(v) => updateCutting('depthPerPass', v[0])}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Total Depth
              </Label>
              <span className="text-xs font-mono text-primary">{settings.cutting.totalDepth} mm</span>
            </div>
            <Slider
              value={[settings.cutting.totalDepth]}
              onValueChange={(v) => updateCutting('totalDepth', v[0])}
              min={0.5}
              max={25}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Coolant
            </Label>
            <Switch
              checked={settings.coolant}
              onCheckedChange={(v) => setSettings((prev) => ({ ...prev, coolant: v }))}
            />
          </div>
        </TabsContent>

        {/* Simulation */}
        <TabsContent value="simulate" className="space-y-4 p-3">
          {/* Overlay toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Show on Canvas
            </Label>
            <Button
              variant={showOverlay ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowOverlay(!showOverlay)}
            >
              {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showOverlay ? "Visible" : "Hidden"}
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono text-primary">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full bg-gradient-to-r from-primary to-success transition-all duration-100",
                  isPlaying && "animate-pulse"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="toolbar" size="icon" onClick={reset} title="Reset">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="toolbar" size="icon" onClick={skipBack} title="Skip Back">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "default" : "default"}
              size="icon"
              className={cn(
                "w-12 h-12",
                isPlaying && "bg-success hover:bg-success/80"
              )}
              onClick={isPlaying ? pause : play}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button variant="toolbar" size="icon" onClick={skipForward} title="Skip Forward">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Current G-code line */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Line {currentLine + 1} / {gcodeLines.length}
            </div>
            <code className="text-xs font-mono text-primary block truncate">
              {gcodeLines[currentLine] || 'Ready'}
            </code>
          </div>

          {/* Current position */}
          {currentPoint && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-muted-foreground">Position:</span>
              <span className="text-primary">X: {currentPoint.x.toFixed(2)}</span>
              <span className="text-primary">Y: {currentPoint.y.toFixed(2)}</span>
            </div>
          )}

          {/* Estimated time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            Estimated time: {estimatedTime.toFixed(1)} min
          </div>

          {/* Export button */}
          <Button
            className="w-full gap-2"
            onClick={handleExport}
            disabled={toolPaths.length === 0}
          >
            <Download className="w-4 h-4" />
            Export G-Code
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
});

GCodePanel.displayName = "GCodePanel";
