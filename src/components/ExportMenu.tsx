import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileType, FileCode, File } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";

interface ExportMenuProps {
  canvas: FabricCanvas | null;
  svgContent: string | null;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export const ExportMenu = ({ canvas, svgContent, disabled, trigger }: ExportMenuProps) => {
  // Export as PNG
  const exportPNG = useCallback(() => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // 2x resolution
    });

    downloadFile(dataURL, 'canvas-export.png');
    toast.success('Exported as PNG');
  }, [canvas]);

  // Export as JPG
  const exportJPG = useCallback(() => {
    if (!canvas) return;

    // Set white background for JPG
    const originalBg = canvas.backgroundColor;
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 2,
    });

    // Restore original background
    canvas.backgroundColor = originalBg;
    canvas.renderAll();

    downloadFile(dataURL, 'canvas-export.jpg');
    toast.success('Exported as JPG');
  }, [canvas]);

  // Export as SVG
  const exportSVG = useCallback(() => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, 'traced-export.svg');
      URL.revokeObjectURL(url);
      toast.success('Exported traced SVG');
    } else if (canvas) {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, 'canvas-export.svg');
      URL.revokeObjectURL(url);
      toast.success('Exported as SVG');
    }
  }, [canvas, svgContent]);

  // Export as PDF (using canvas to image approach)
  const exportPDF = useCallback(async () => {
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
  }, [canvas]);

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
