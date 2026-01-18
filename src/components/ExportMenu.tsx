import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileType, FileCode, File, Ruler, Square } from "lucide-react";
import { Canvas as FabricCanvas, IText, Line, Group, FabricObject, Rect } from "fabric";
import { toast } from "sonner";

interface ExportMenuProps {
  canvas: FabricCanvas | null;
  svgContent: string | null;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export const ExportMenu = ({ canvas, svgContent, disabled, trigger }: ExportMenuProps) => {
  // Helper to isolate selection for export
  const runWithIsolation = useCallback((fn: () => void, excludeFromHiding: FabricObject[] = []) => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      fn();
      return;
    }

    const state: { obj: FabricObject; visible: boolean }[] = [];
    canvas.getObjects().forEach((obj) => {
      if (!activeObjects.includes(obj) && !excludeFromHiding.includes(obj)) {
        state.push({ obj, visible: obj.visible });
        obj.visible = false;
      }
    });

    canvas.renderAll();
    try {
      fn();
    } finally {
      state.forEach(({ obj, visible }) => {
        obj.visible = visible;
      });
      canvas.renderAll();
    }
  }, [canvas]);

  // Export as PNG
  const exportPNG = useCallback(() => {
    runWithIsolation(() => {
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      const options: any = {
        format: 'png',
        quality: 1,
        multiplier: 2,
      };

      if (activeObject) {
        const rect = activeObject.getBoundingRect();
        options.left = rect.left;
        options.top = rect.top;
        options.width = rect.width;
        options.height = rect.height;
      }

      const dataURL = canvas.toDataURL(options);
      downloadFile(dataURL, activeObject ? 'selection-export.png' : 'canvas-export.png');
      toast.success(activeObject ? 'Exported selection as PNG' : 'Exported as PNG');
    });
  }, [canvas, runWithIsolation]);

  // Export as JPG
  const exportJPG = useCallback(() => {
    runWithIsolation(() => {
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      const originalBg = canvas.backgroundColor;
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();

      const options: any = {
        format: 'jpeg',
        quality: 0.9,
        multiplier: 2,
      };

      if (activeObject) {
        const rect = activeObject.getBoundingRect();
        options.left = rect.left;
        options.top = rect.top;
        options.width = rect.width;
        options.height = rect.height;
      }

      const dataURL = canvas.toDataURL(options);

      canvas.backgroundColor = originalBg;
      canvas.renderAll();

      downloadFile(dataURL, activeObject ? 'selection-export.jpg' : 'canvas-export.jpg');
      toast.success(activeObject ? 'Exported selection as JPG' : 'Exported as JPG');
    });
  }, [canvas, runWithIsolation]);

  // Export as SVG
  const exportSVG = useCallback(() => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, 'traced-export.svg');
      URL.revokeObjectURL(url);
      toast.success('Exported traced SVG');
    } else if (canvas) {
      runWithIsolation(() => {
        const activeObject = canvas.getActiveObject();
        let svg = "";

        if (activeObject) {
          // Export just the selection
          svg = canvas.toSVG({
            viewBox: {
              x: activeObject.left,
              y: activeObject.top,
              width: activeObject.width * activeObject.scaleX,
              height: activeObject.height * activeObject.scaleY
            }
          });
        } else {
          svg = canvas.toSVG();
        }

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, activeObject ? 'selection-export.svg' : 'canvas-export.svg');
        URL.revokeObjectURL(url);
        toast.success(activeObject ? 'Exported selection as SVG' : 'Exported as SVG');
      });
    }
  }, [canvas, svgContent, runWithIsolation]);

  // Export with measurements helper
  const exportWithMeasurements = useCallback(async (format: 'png' | 'svg' = 'png') => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast.error("Please select items to export with measurements");
      return;
    }

    const rect = activeObject.getBoundingRect();
    const widthMm = (rect.width * 0.264583).toFixed(1); // Rough px to mm conversion
    const heightMm = (rect.height * 0.264583).toFixed(1);

    const padding = 60;

    // Create measurement labels
    const textStyle = {
      fontSize: 16,
      fontFamily: 'monospace',
      fill: '#00d4ff',
      backgroundColor: 'rgba(0,0,0,0.7)',
    };

    const wLabel = new IText(`W: ${widthMm}mm / ${Math.round(rect.width)}px`, {
      ...textStyle,
      left: rect.left + rect.width / 2,
      top: rect.top - 25,
      originX: 'center',
    });

    const hLabel = new IText(`H: ${heightMm}mm / ${Math.round(rect.height)}px`, {
      ...textStyle,
      left: rect.left - 25,
      top: rect.top + rect.height / 2,
      originX: 'center',
      angle: -90,
    });

    // Dimension lines
    const topLine = new Line([rect.left, rect.top - 10, rect.left + rect.width, rect.top - 10], {
      stroke: '#00d4ff',
      strokeWidth: 1,
    });

    const leftLine = new Line([rect.left - 10, rect.top, rect.left - 10, rect.top + rect.height], {
      stroke: '#00d4ff',
      strokeWidth: 1,
    });

    const markers = [wLabel, hLabel, topLine, leftLine];
    canvas.add(...markers);
    canvas.renderAll();

    runWithIsolation(() => {
      // Export with extra padding for labels
      if (format === 'png') {
        const dataURL = canvas.toDataURL({
          format: 'png',
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          multiplier: 2,
        });
        downloadFile(dataURL, 'blueprint-export.png');
      } else {
        const svg = canvas.toSVG({
          viewBox: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
          }
        });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, 'blueprint-export.svg');
        URL.revokeObjectURL(url);
      }
    }, markers);

    // Cleanup
    markers.forEach(m => canvas.remove(m));
    canvas.renderAll();
    toast.success('Exported with measurements');
  }, [canvas, runWithIsolation]);

  // Export as PDF (using canvas to image approach)
  const exportPDF = useCallback(async () => {
    runWithIsolation(() => {
      if (!canvas) return;

      // For PDF we'll create an HTML page with the image and trigger print
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      const width = canvas.getWidth();
      const height = canvas.getHeight();

      // Create a printable HTML document
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>TraceFlow Export</title>
            <style>
              @page {
                size: ${width}px ${height}px;
                margin: 0;
              }
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
              }
            </style>
          </head>
          <body>
            <img src="${dataURL}" />
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        toast.success('Opening PDF export...');
      } else {
        toast.error('Please allow popups to export PDF');
      }
    });
  }, [canvas, runWithIsolation]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="panel"
            size="sm"
            disabled={disabled}
            className="gap-1.5 md:gap-2 font-mono text-[10px] md:text-xs h-8 md:h-9 px-2 md:px-3"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportPNG} className="gap-2">
          <FileImage className="w-4 h-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJPG} className="gap-2">
          <FileImage className="w-4 h-4" />
          Export as JPG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportSVG} className="gap-2">
          <FileCode className="w-4 h-4" />
          Export as SVG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportWithMeasurements('png')} className="gap-2 text-primary font-bold">
          <Ruler className="w-4 h-4" />
          Export with Measurements
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportWithMeasurements('svg')} className="gap-2 text-primary">
          <Ruler className="w-4 h-4" />
          Export SVG with Measurements
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <File className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Mobile-friendly download function
function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Check for iOS Safari or in-app browsers
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line|WeChat|MicroMessenger/i.test(navigator.userAgent);

  if (isIOS && (isSafari || isInAppBrowser)) {
    // For iOS Safari and in-app browsers, open in new tab
    // User can then long-press to save
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // Fallback: show instructions
      const toast = document.createElement('div');
      toast.textContent = 'Long-press and select "Download" or "Save Image"';
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
    return;
  }

  // Standard download for other browsers
  document.body.appendChild(link);

  // Use setTimeout to ensure the download triggers on mobile
  setTimeout(() => {
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      // Revoke blob URLs after delay
      if (url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    }, 100);
  }, 0);
}
