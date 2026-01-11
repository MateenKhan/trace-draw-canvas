import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onUpload: () => void;
  onTrace: () => void;
  onExport: () => void;
  onClear: () => void;
  hasImage: boolean;
  hasSvg: boolean;
  isTracing: boolean;
}

export const Toolbar = ({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onUpload,
  onTrace,
  onExport,
  onClear,
  hasImage,
  hasSvg,
  isTracing,
}: ToolbarProps) => {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pan", icon: Move, label: "Pan" },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-toolbar rounded-xl border border-panel-border animate-fade-in">
      {/* Tool selection */}
      <div className="flex items-center gap-1 pr-2 border-r border-panel-border">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "toolbar-active" : "toolbar"}
            size="icon"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 px-2 border-r border-panel-border">
        <Button variant="toolbar" size="icon" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="toolbar" size="icon" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="toolbar" size="icon" onClick={onReset} title="Reset View">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 border-r border-panel-border">
        <Button
          variant="toolbar"
          size="icon"
          onClick={onUpload}
          title="Upload Image"
          className="glow-effect"
        >
          <Upload className="w-4 h-4" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          onClick={onClear}
          disabled={!hasImage}
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Trace */}
      <div className="flex items-center gap-1 pl-2">
        <Button
          variant={isTracing ? "toolbar-active" : "default"}
          size="sm"
          onClick={onTrace}
          disabled={!hasImage || isTracing}
          className={cn("gap-2 font-mono text-xs", isTracing && "animate-pulse")}
        >
          <Sparkles className="w-4 h-4" />
          {isTracing ? "Tracing..." : "Trace"}
        </Button>
        <Button
          variant="panel"
          size="sm"
          onClick={onExport}
          disabled={!hasSvg}
          className="gap-2 font-mono text-xs"
        >
          <Download className="w-4 h-4" />
          Export SVG
        </Button>
      </div>
    </div>
  );
};
