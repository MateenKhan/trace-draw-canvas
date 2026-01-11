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
    <div className="flex flex-wrap items-center gap-1 p-1.5 md:p-2 glass rounded-xl border border-panel-border animate-fade-in">
      {/* Tool selection */}
      <div className="flex items-center gap-1 pr-1.5 md:pr-2 border-r border-panel-border">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "toolbar-active" : "toolbar"}
            size="icon"
            className="w-8 h-8 md:w-10 md:h-10"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <tool.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        ))}
      </div>

      {/* Zoom controls - hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-1 px-1.5 md:px-2 border-r border-panel-border">
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-10 md:h-10" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-10 md:h-10" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button variant="toolbar" size="icon" className="w-8 h-8 md:w-10 md:h-10" onClick={onReset} title="Reset View">
          <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-1.5 md:px-2 border-r border-panel-border">
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 md:w-10 md:h-10 glow-effect"
          onClick={onUpload}
          title="Upload Image"
        >
          <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          className="w-8 h-8 md:w-10 md:h-10"
          onClick={onClear}
          disabled={!hasImage}
          title="Clear Canvas"
        >
          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </div>

      {/* Trace */}
      <div className="flex items-center gap-1 pl-1.5 md:pl-2">
        <Button
          variant={isTracing ? "toolbar-active" : "default"}
          size="sm"
          onClick={onTrace}
          disabled={!hasImage || isTracing}
          className={cn(
            "gap-1.5 md:gap-2 font-mono text-[10px] md:text-xs h-8 md:h-9 px-2 md:px-3",
            isTracing && "animate-pulse"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden xs:inline">{isTracing ? "Tracing..." : "Trace"}</span>
        </Button>
        <Button
          variant="panel"
          size="sm"
          onClick={onExport}
          disabled={!hasSvg}
          className="gap-1.5 md:gap-2 font-mono text-[10px] md:text-xs h-8 md:h-9 px-2 md:px-3"
        >
          <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Export SVG</span>
        </Button>
      </div>
    </div>
  );
};
