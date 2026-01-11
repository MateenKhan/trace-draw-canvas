import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface BrushSizeSliderProps {
  size: number;
  onChange: (size: number) => void;
  isVisible: boolean;
  strokeColor: string;
}

export const BrushSizeSlider = ({
  size,
  onChange,
  isVisible,
  strokeColor,
}: BrushSizeSliderProps) => {
  const [localSize, setLocalSize] = useState(size);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!isInteracting) {
      setLocalSize(size);
    }
  }, [size, isInteracting]);

  const handleValueChange = (value: number[]) => {
    const newSize = value[0];
    setLocalSize(newSize);
    onChange(newSize);
  };

  const handlePointerDown = () => {
    setIsInteracting(true);
  };

  const handlePointerUp = () => {
    setIsInteracting(false);
  };

  if (!isVisible) return null;

  // Preview circle size scaled for visual representation (max 40px display)
  const previewSize = Math.min(localSize * 2, 40);

  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-3 py-2 glass rounded-lg border border-panel-border",
        "animate-fade-in"
      )}
    >
      {/* Live preview circle */}
      <div 
        className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50"
        title={`Brush size: ${localSize}px`}
      >
        <div
          className="rounded-full transition-all duration-75"
          style={{
            width: previewSize,
            height: previewSize,
            backgroundColor: strokeColor,
            boxShadow: `0 0 ${Math.max(localSize / 2, 2)}px ${strokeColor}40`,
          }}
        />
      </div>

      {/* Slider */}
      <div 
        className="flex flex-col gap-1 min-w-[100px] md:min-w-[140px]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-muted-foreground font-mono">Size</span>
          <span className="text-[10px] md:text-xs font-mono text-foreground">{localSize}px</span>
        </div>
        <Slider
          value={[localSize]}
          onValueChange={handleValueChange}
          min={1}
          max={50}
          step={1}
          className="touch-none"
        />
      </div>

      {/* Quick size buttons for mobile */}
      <div className="flex gap-1 md:hidden">
        {[2, 5, 10, 20].map((presetSize) => (
          <button
            key={presetSize}
            onClick={() => {
              setLocalSize(presetSize);
              onChange(presetSize);
            }}
            className={cn(
              "w-7 h-7 rounded-md text-[10px] font-mono transition-colors",
              localSize === presetSize 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {presetSize}
          </button>
        ))}
      </div>
    </div>
  );
};
