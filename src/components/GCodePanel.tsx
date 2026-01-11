import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
  Wrench,
  Zap,
  Clock,
  RotateCcw,
} from "lucide-react";
import {
  GCodeSettings,
  ToolPath,
  DEFAULT_GCODE_SETTINGS,
  generateGCode,
  estimateMachiningTime,
} from "@/lib/gcode";
import { cn } from "@/lib/utils";

interface GCodePanelProps {
  toolPaths: ToolPath[];
  onExportGCode: (gcode: string) => void;
}

export const GCodePanel = ({ toolPaths, onExportGCode }: GCodePanelProps) => {
  const [settings, setSettings] = useState<GCodeSettings>(DEFAULT_GCODE_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const animationRef = useRef<number | null>(null);

  const estimatedTime = estimateMachiningTime(toolPaths, settings);
  const gcode = generateGCode(toolPaths, settings);
  const gcodeLines = gcode.split('\n');

  // Simulation controls
  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentLine(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
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
    if (!isPlaying) return;

    const animate = () => {
      setCurrentLine((prev) => {
        if (prev >= gcodeLines.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
      setProgress((prev) => {
        const newProgress = (currentLine / gcodeLines.length) * 100;
        return Math.min(newProgress, 100);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(animate, 50); // Speed of simulation
    return () => clearTimeout(timeout);
  }, [isPlaying, currentLine, gcodeLines.length]);

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
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono text-primary">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="toolbar" size="icon" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="toolbar" size="icon" onClick={skipBack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "toolbar-active" : "default"}
              size="icon"
              className="w-12 h-12"
              onClick={isPlaying ? pause : play}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button variant="toolbar" size="icon" onClick={skipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Current G-code line */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Line {currentLine + 1} / {gcodeLines.length}
            </div>
            <code className="text-xs font-mono text-primary">
              {gcodeLines[currentLine] || ''}
            </code>
          </div>

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
};
