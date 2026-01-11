import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Paintbrush,
  Type,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
} from "lucide-react";
import {
  DrawingTool,
  StrokeStyle,
  FillStyle,
  TextStyle,
  ImageFilter,
  FONT_FAMILIES,
  DEFAULT_STROKE,
  DEFAULT_FILL,
  DEFAULT_TEXT_STYLE,
  DEFAULT_IMAGE_FILTER,
} from "@/lib/types";

interface PropertyPanelProps {
  activeTool: DrawingTool;
  stroke: StrokeStyle;
  fill: FillStyle;
  textStyle: TextStyle;
  imageFilter: ImageFilter;
  onStrokeChange: (stroke: StrokeStyle) => void;
  onFillChange: (fill: FillStyle) => void;
  onTextStyleChange: (style: TextStyle) => void;
  onImageFilterChange: (filter: ImageFilter) => void;
}

export const PropertyPanel = ({
  activeTool,
  stroke,
  fill,
  textStyle,
  imageFilter,
  onStrokeChange,
  onFillChange,
  onTextStyleChange,
  onImageFilterChange,
}: PropertyPanelProps) => {
  const isDrawingTool = ['pen', 'pencil', 'line', 'rectangle', 'ellipse', 'polygon'].includes(activeTool);
  const isTextTool = activeTool === 'text';
  const isImageTool = ['crop', 'transform'].includes(activeTool);

  return (
    <div className="panel w-full animate-slide-up">
      <Tabs defaultValue="stroke" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-lg">
          <TabsTrigger value="stroke" className="gap-1.5 text-xs">
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stroke</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-1.5 text-xs">
            <Type className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5 text-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Image</span>
          </TabsTrigger>
        </TabsList>

        {/* Stroke & Fill Tab */}
        <TabsContent value="stroke" className="space-y-4 p-3">
          {/* Stroke Color */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Stroke Color
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-panel-border cursor-pointer"
                style={{ backgroundColor: stroke.color }}
              >
                <input
                  type="color"
                  value={stroke.color}
                  onChange={(e) => onStrokeChange({ ...stroke, color: e.target.value })}
                  className="w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={stroke.color}
                onChange={(e) => onStrokeChange({ ...stroke, color: e.target.value })}
                className="flex-1 font-mono text-xs h-8"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Stroke Width
              </Label>
              <span className="text-xs font-mono text-primary">{stroke.width}px</span>
            </div>
            <Slider
              value={[stroke.width]}
              onValueChange={(v) => onStrokeChange({ ...stroke, width: v[0] })}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Fill Color */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Fill Color
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-panel-border cursor-pointer relative"
                style={{ backgroundColor: fill.color === 'transparent' ? 'transparent' : fill.color }}
              >
                {fill.color === 'transparent' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-destructive rotate-45 absolute" />
                  </div>
                )}
                <input
                  type="color"
                  value={fill.color === 'transparent' ? '#000000' : fill.color}
                  onChange={(e) => onFillChange({ ...fill, color: e.target.value })}
                  className="w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={fill.color}
                onChange={(e) => onFillChange({ ...fill, color: e.target.value })}
                className="flex-1 font-mono text-xs h-8"
              />
              <Button
                variant="toolbar"
                size="sm"
                onClick={() => onFillChange({ ...fill, color: 'transparent' })}
                className="text-xs h-8 px-2"
              >
                None
              </Button>
            </div>
          </div>

          {/* Fill Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Fill Opacity
              </Label>
              <span className="text-xs font-mono text-primary">{Math.round(fill.opacity * 100)}%</span>
            </div>
            <Slider
              value={[fill.opacity * 100]}
              onValueChange={(v) => onFillChange({ ...fill, opacity: v[0] / 100 })}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-4 p-3">
          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Font Family
            </Label>
            <Select
              value={textStyle.fontFamily}
              onValueChange={(v) => onTextStyleChange({ ...textStyle, fontFamily: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Font Size
              </Label>
              <span className="text-xs font-mono text-primary">{textStyle.fontSize}px</span>
            </div>
            <Slider
              value={[textStyle.fontSize]}
              onValueChange={(v) => onTextStyleChange({ ...textStyle, fontSize: v[0] })}
              min={8}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          {/* Font Weight & Style */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Style
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant={textStyle.fontWeight >= 600 ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8"
                onClick={() => onTextStyleChange({
                  ...textStyle,
                  fontWeight: textStyle.fontWeight >= 600 ? 400 : 700
                })}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={textStyle.fontStyle === 'italic' ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8"
                onClick={() => onTextStyleChange({
                  ...textStyle,
                  fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic'
                })}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-panel-border mx-1" />
              <Button
                variant={textStyle.textAlign === 'left' ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8"
                onClick={() => onTextStyleChange({ ...textStyle, textAlign: 'left' })}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={textStyle.textAlign === 'center' ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8"
                onClick={() => onTextStyleChange({ ...textStyle, textAlign: 'center' })}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={textStyle.textAlign === 'right' ? "toolbar-active" : "toolbar"}
                size="icon"
                className="w-8 h-8"
                onClick={() => onTextStyleChange({ ...textStyle, textAlign: 'right' })}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Text Color
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-panel-border cursor-pointer"
                style={{ backgroundColor: textStyle.fill }}
              >
                <input
                  type="color"
                  value={textStyle.fill}
                  onChange={(e) => onTextStyleChange({ ...textStyle, fill: e.target.value })}
                  className="w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={textStyle.fill}
                onChange={(e) => onTextStyleChange({ ...textStyle, fill: e.target.value })}
                className="flex-1 font-mono text-xs h-8"
              />
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Letter Spacing
              </Label>
              <span className="text-xs font-mono text-primary">{textStyle.letterSpacing}px</span>
            </div>
            <Slider
              value={[textStyle.letterSpacing]}
              onValueChange={(v) => onTextStyleChange({ ...textStyle, letterSpacing: v[0] })}
              min={-10}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Line Height
              </Label>
              <span className="text-xs font-mono text-primary">{textStyle.lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={[textStyle.lineHeight * 100]}
              onValueChange={(v) => onTextStyleChange({ ...textStyle, lineHeight: v[0] / 100 })}
              min={80}
              max={300}
              step={5}
              className="w-full"
            />
          </div>
        </TabsContent>

        {/* Image Tab */}
        <TabsContent value="image" className="space-y-4 p-3">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Brightness
              </Label>
              <span className="text-xs font-mono text-primary">{imageFilter.brightness}%</span>
            </div>
            <Slider
              value={[imageFilter.brightness]}
              onValueChange={(v) => onImageFilterChange({ ...imageFilter, brightness: v[0] })}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Contrast
              </Label>
              <span className="text-xs font-mono text-primary">{imageFilter.contrast}%</span>
            </div>
            <Slider
              value={[imageFilter.contrast]}
              onValueChange={(v) => onImageFilterChange({ ...imageFilter, contrast: v[0] })}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Saturation
              </Label>
              <span className="text-xs font-mono text-primary">{imageFilter.saturation}%</span>
            </div>
            <Slider
              value={[imageFilter.saturation]}
              onValueChange={(v) => onImageFilterChange({ ...imageFilter, saturation: v[0] })}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Blur
              </Label>
              <span className="text-xs font-mono text-primary">{imageFilter.blur}px</span>
            </div>
            <Slider
              value={[imageFilter.blur]}
              onValueChange={(v) => onImageFilterChange({ ...imageFilter, blur: v[0] })}
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Reset Filters */}
          <Button
            variant="panel"
            size="sm"
            className="w-full text-xs"
            onClick={() => onImageFilterChange(DEFAULT_IMAGE_FILTER)}
          >
            Reset Filters
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
