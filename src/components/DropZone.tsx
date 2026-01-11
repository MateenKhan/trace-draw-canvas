import { useRef, useCallback } from "react";
import { Upload, ImageIcon } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  hasImage: boolean;
}

export const DropZone = ({ onFileSelect, hasImage }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  if (hasImage) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-pointer group p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-3 md:gap-4 p-6 md:p-8 rounded-2xl border-2 border-dashed glass transition-all group-hover:border-primary/50">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Upload className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-base md:text-lg font-medium text-foreground">
            Drop an image here
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
          <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
          <span>PNG, JPG, GIF, WebP, BMP</span>
        </div>
      </div>
    </div>
  );
};
