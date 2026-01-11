import { memo, useMemo } from "react";
import { ToolPath, PathPoint } from "@/lib/gcode";
import { cn } from "@/lib/utils";

interface ToolpathOverlayProps {
  toolPaths: ToolPath[];
  progress: number; // 0-100
  currentPoint: PathPoint | null;
  isPlaying: boolean;
  width: number;
  height: number;
  show: boolean;
}

export const ToolpathOverlay = memo(({
  toolPaths,
  progress,
  currentPoint,
  isPlaying,
  width,
  height,
  show,
}: ToolpathOverlayProps) => {
  // Convert toolpath points to SVG path data
  const pathData = useMemo(() => {
    return toolPaths.map((tp) => {
      if (tp.points.length === 0) return { id: tp.id, d: "", color: tp.color };
      
      const d = tp.points
        .map((p, i) => {
          const cmd = i === 0 ? "M" : p.type === "rapid" ? "M" : "L";
          return `${cmd}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        })
        .join(" ");
      
      return { id: tp.id, d, color: tp.color };
    });
  }, [toolPaths]);

  // Calculate the animated path based on progress
  const animatedPathData = useMemo(() => {
    if (progress === 0) return [];
    
    return toolPaths.map((tp) => {
      if (tp.points.length === 0) return { id: tp.id, d: "", color: tp.color };
      
      const totalPoints = tp.points.length;
      const pointsToShow = Math.floor((progress / 100) * totalPoints);
      const visiblePoints = tp.points.slice(0, pointsToShow + 1);
      
      if (visiblePoints.length === 0) return { id: tp.id, d: "", color: tp.color };
      
      const d = visiblePoints
        .map((p, i) => {
          const cmd = i === 0 ? "M" : p.type === "rapid" ? "M" : "L";
          return `${cmd}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        })
        .join(" ");
      
      return { id: tp.id, d, color: "#00ff00" }; // Green for cut path
    });
  }, [toolPaths, progress]);

  if (!show || toolPaths.length === 0) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width, height }}
    >
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Background toolpath (full path, dimmed) */}
        {pathData.map((path) => (
          <path
            key={`bg-${path.id}`}
            d={path.d}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        
        {/* Animated cut path (shows progress) */}
        {animatedPathData.map((path) => (
          <path
            key={`cut-${path.id}`}
            d={path.d}
            fill="none"
            stroke={path.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_4px_rgba(0,255,0,0.8)]"
          />
        ))}
        
        {/* Cutting head indicator */}
        {currentPoint && isPlaying && (
          <g>
            {/* Outer glow */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={12}
              fill="rgba(0, 255, 0, 0.2)"
              className="animate-pulse"
            />
            {/* Middle ring */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={8}
              fill="none"
              stroke="rgba(0, 255, 0, 0.6)"
              strokeWidth={2}
            />
            {/* Center point */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={4}
              fill="#00ff00"
              className="drop-shadow-[0_0_8px_rgba(0,255,0,1)]"
            />
            {/* Crosshairs */}
            <line
              x1={currentPoint.x - 16}
              y1={currentPoint.y}
              x2={currentPoint.x - 6}
              y2={currentPoint.y}
              stroke="#00ff00"
              strokeWidth={1}
            />
            <line
              x1={currentPoint.x + 6}
              y1={currentPoint.y}
              x2={currentPoint.x + 16}
              y2={currentPoint.y}
              stroke="#00ff00"
              strokeWidth={1}
            />
            <line
              x1={currentPoint.x}
              y1={currentPoint.y - 16}
              x2={currentPoint.x}
              y2={currentPoint.y - 6}
              stroke="#00ff00"
              strokeWidth={1}
            />
            <line
              x1={currentPoint.x}
              y1={currentPoint.y + 6}
              x2={currentPoint.x}
              y2={currentPoint.y + 16}
              stroke="#00ff00"
              strokeWidth={1}
            />
          </g>
        )}
        
        {/* Current position indicator (when paused) */}
        {currentPoint && !isPlaying && progress > 0 && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={6}
            fill="#ffcc00"
            stroke="#ff9900"
            strokeWidth={2}
            className="drop-shadow-[0_0_6px_rgba(255,200,0,0.8)]"
          />
        )}
      </svg>
      
      {/* Status indicator */}
      {isPlaying && (
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-success/30">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono text-success">CUTTING</span>
        </div>
      )}
    </div>
  );
});

ToolpathOverlay.displayName = "ToolpathOverlay";
