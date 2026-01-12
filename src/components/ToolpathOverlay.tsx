import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react";
import { ToolPath, PathPoint } from "@/lib/gcode";

interface ToolpathOverlayProps {
  toolPaths: ToolPath[];
  progress: number; // 0-100
  currentPoint: PathPoint | null;
  isPlaying: boolean;
  width: number;
  height: number;
  show: boolean;
}

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0,
  });

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; distance: number; angle: number } | null>(null);
  const lastTransformRef = useRef<TransformState>(transform);

  // Calculate bounds of all toolpaths for centering
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    toolPaths.forEach((tp) => {
      tp.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    if (!isFinite(minX)) {
      return { minX: 0, minY: 0, maxX: width, maxY: height, width: width, height: height, centerX: width / 2, centerY: height / 2 };
    }

    const boundsWidth = maxX - minX || 1;
    const boundsHeight = maxY - minY || 1;
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: boundsWidth,
      height: boundsHeight,
      centerX: minX + boundsWidth / 2,
      centerY: minY + boundsHeight / 2,
    };
  }, [toolPaths, width, height]);

  // Calculate initial scale and offset to center the toolpath
  const initialTransform = useMemo(() => {
    const padding = 40;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    
    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 3); // Cap at 3x zoom
    
    // Center the toolpath
    const translateX = (width / 2) - (bounds.centerX * scale);
    const translateY = (height / 2) - (bounds.centerY * scale);
    
    return { scale, translateX, translateY, rotation: 0 };
  }, [bounds, width, height]);

  // Reset transform when toolpaths change
  useEffect(() => {
    setTransform(initialTransform);
    lastTransformRef.current = initialTransform;
  }, [initialTransform]);

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

  // Get distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get angle between two touch points
  const getTouchAngle = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    return Math.atan2(
      touches[1].clientY - touches[0].clientY,
      touches[1].clientX - touches[0].clientX
    ) * (180 / Math.PI);
  }, []);

  // Get center of touch points
  const getTouchCenter = useCallback((touches: React.TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    const center = getTouchCenter(touches);
    
    touchStartRef.current = {
      x: center.x,
      y: center.y,
      distance: getTouchDistance(touches),
      angle: getTouchAngle(touches),
    };
    lastTransformRef.current = transform;
  }, [transform, getTouchCenter, getTouchDistance, getTouchAngle]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;

    const touches = e.touches;
    const center = getTouchCenter(touches);
    const start = touchStartRef.current;
    const last = lastTransformRef.current;

    // Single finger pan
    if (touches.length === 1) {
      const dx = center.x - start.x;
      const dy = center.y - start.y;
      
      setTransform({
        ...last,
        translateX: last.translateX + dx,
        translateY: last.translateY + dy,
      });
    }
    // Two finger pinch zoom and rotate
    else if (touches.length >= 2) {
      const currentDistance = getTouchDistance(touches);
      const currentAngle = getTouchAngle(touches);
      
      const scaleFactor = start.distance > 0 ? currentDistance / start.distance : 1;
      const newScale = Math.max(0.5, Math.min(5, last.scale * scaleFactor));
      
      const angleDiff = currentAngle - start.angle;
      const newRotation = last.rotation + angleDiff;
      
      // Pan with two fingers
      const dx = center.x - start.x;
      const dy = center.y - start.y;
      
      setTransform({
        scale: newScale,
        translateX: last.translateX + dx,
        translateY: last.translateY + dy,
        rotation: newRotation,
      });
    }
  }, [getTouchCenter, getTouchDistance, getTouchAngle]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lastTransformRef.current = transform;
  }, [transform]);

  // Double tap to reset
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setTransform(initialTransform);
      lastTransformRef.current = initialTransform;
    }
    lastTapRef.current = now;
  }, [initialTransform]);

  if (!show || toolPaths.length === 0) return null;

  const transformStyle = `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`;

  return (
    <div 
      ref={containerRef}
      className="relative touch-none overflow-hidden"
      style={{ width, height }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
    >
      <svg 
        width={width * 2} 
        height={height * 2} 
        className="absolute"
        style={{
          transform: transformStyle,
          transformOrigin: '0 0',
          left: -width / 2,
          top: -height / 2,
        }}
      >
        {/* Grid lines for reference */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Background toolpath (full path, dimmed) */}
        {pathData.map((path) => (
          <path
            key={`bg-${path.id}`}
            d={path.d}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={1.5 / transform.scale}
            strokeDasharray={`${4 / transform.scale} ${4 / transform.scale}`}
          />
        ))}
        
        {/* Animated cut path (shows progress) */}
        {animatedPathData.map((path) => (
          <path
            key={`cut-${path.id}`}
            d={path.d}
            fill="none"
            stroke={path.color}
            strokeWidth={2.5 / transform.scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,0,0.8))' }}
          />
        ))}
        
        {/* Cutting head indicator */}
        {currentPoint && isPlaying && (
          <g>
            {/* Outer glow */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={12 / transform.scale}
              fill="rgba(0, 255, 0, 0.2)"
              className="animate-pulse"
            />
            {/* Middle ring */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={8 / transform.scale}
              fill="none"
              stroke="rgba(0, 255, 0, 0.6)"
              strokeWidth={2 / transform.scale}
            />
            {/* Center point */}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={4 / transform.scale}
              fill="#00ff00"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,0,1))' }}
            />
            {/* Crosshairs */}
            <line
              x1={currentPoint.x - 16 / transform.scale}
              y1={currentPoint.y}
              x2={currentPoint.x - 6 / transform.scale}
              y2={currentPoint.y}
              stroke="#00ff00"
              strokeWidth={1 / transform.scale}
            />
            <line
              x1={currentPoint.x + 6 / transform.scale}
              y1={currentPoint.y}
              x2={currentPoint.x + 16 / transform.scale}
              y2={currentPoint.y}
              stroke="#00ff00"
              strokeWidth={1 / transform.scale}
            />
            <line
              x1={currentPoint.x}
              y1={currentPoint.y - 16 / transform.scale}
              x2={currentPoint.x}
              y2={currentPoint.y - 6 / transform.scale}
              stroke="#00ff00"
              strokeWidth={1 / transform.scale}
            />
            <line
              x1={currentPoint.x}
              y1={currentPoint.y + 6 / transform.scale}
              x2={currentPoint.x}
              y2={currentPoint.y + 16 / transform.scale}
              stroke="#00ff00"
              strokeWidth={1 / transform.scale}
            />
          </g>
        )}
        
        {/* Current position indicator (when paused) */}
        {currentPoint && !isPlaying && progress > 0 && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={6 / transform.scale}
            fill="#ffcc00"
            stroke="#ff9900"
            strokeWidth={2 / transform.scale}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,200,0,0.8))' }}
          />
        )}
      </svg>
      
      {/* Controls hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full backdrop-blur-sm">
        <span className="text-xs text-white/70">
          Pinch to zoom • Drag to pan • Double-tap to reset
        </span>
      </div>
      
      {/* Zoom level indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded backdrop-blur-sm">
        <span className="text-xs font-mono text-white/70">
          {(transform.scale * 100).toFixed(0)}%
        </span>
      </div>
      
      {/* Status indicator */}
      {isPlaying && (
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-green-500/90 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-mono text-white">CUTTING</span>
        </div>
      )}
    </div>
  );
});

ToolpathOverlay.displayName = "ToolpathOverlay";