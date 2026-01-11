import { Eye, EyeOff, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SvgPreviewProps {
  svgContent: string | null;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export const SvgPreview = ({
  svgContent,
  showPreview,
  onTogglePreview,
}: SvgPreviewProps) => {
  if (!svgContent) return null;

  return (
    <div className="panel w-72 animate-slide-up">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          SVG Preview
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onTogglePreview}
          title={showPreview ? "Hide overlay" : "Show overlay"}
        >
          {showPreview ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <div className="p-4">
        <div
          className="w-full aspect-square rounded-lg bg-canvas border border-panel-border overflow-hidden"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            background: `
              linear-gradient(45deg, hsl(220 16% 15%) 25%, transparent 25%),
              linear-gradient(-45deg, hsl(220 16% 15%) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, hsl(220 16% 15%) 75%),
              linear-gradient(-45deg, transparent 75%, hsl(220 16% 15%) 75%)
            `,
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
          }}
        />
        
        {svgContent && (
          <div className="mt-3 text-xs font-mono text-muted-foreground">
            <div className="flex justify-between">
              <span>Size:</span>
              <span>{(new Blob([svgContent]).size / 1024).toFixed(2)} KB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
