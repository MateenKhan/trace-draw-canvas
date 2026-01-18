import { useState, useEffect } from "react";
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
  Ruler,
  Lock,
  Unlock,
  Check,
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

  // Dimensions
  selectedObjectDimensions?: { width: number; height: number; type: string } | null;
  onDimensionsChange?: (width: number, height: number) => void;
}

const PPI = 96;
const CONVERSION = {
  px: 1,
  in: PPI,
  mm: PPI / 25.4,
  ft: PPI * 12,
};

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
  selectedObjectDimensions,
  onDimensionsChange,
}: PropertyPanelProps) => {
  const isDrawingTool = ['pen', 'pencil', 'line', 'rectangle', 'ellipse', 'polygon'].includes(activeTool);
  const isTextTool = activeTool === 'text';
  const isImageTool = ['crop', 'transform'].includes(activeTool);

  const [unit, setUnit] = useState<'px' | 'in' | 'mm' | 'ft'>('in');
  const [lockAspect, setLockAspect] = useState(true);

  // Local input state
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  // Helper to format values based on unit
  const formatValue = (px: number) => {
    const val = px / CONVERSION[unit];
    return unit === 'px' ? Math.round(val).toString() : val.toFixed(2);
  };

  // Sync inputs with selected object dimensions
  useEffect(() => {
    if (selectedObjectDimensions) {
      setWidthInput(formatValue(selectedObjectDimensions.width));
      setHeightInput(formatValue(selectedObjectDimensions.height));
    }
  }, [selectedObjectDimensions, unit]);

  const handleInputChange = (type: 'width' | 'height', value: string) => {
    if (type === 'width') setWidthInput(value);
    else setHeightInput(value);

    if (lockAspect && selectedObjectDimensions) {
      const numVal = parseFloat(value);
      if (!isNaN(numVal)) {
        const currentW = selectedObjectDimensions.width;
        const currentH = selectedObjectDimensions.height;
        const aspect = currentW / currentH;

        if (type === 'width') {
          // H = W / aspect
          const newH = numVal / aspect;
          setHeightInput(unit === 'px' ? Math.round(newH).toString() : newH.toFixed(2));
        } else {
          // W = H * aspect
          const newW = numVal * aspect;
          setWidthInput(unit === 'px' ? Math.round(newW).toString() : newW.toFixed(2));
        }
      }
    }
  };

  const handleApply = () => {
    if (!selectedObjectDimensions || !onDimensionsChange) return;

    const w = parseFloat(widthInput);
    const h = parseFloat(heightInput);

    if (!isNaN(w) && !isNaN(h)) {
      onDimensionsChange(w * CONVERSION[unit], h * CONVERSION[unit]);
    }
  };

  return (
    <div className="panel w-full animate-slide-up">
      <Tabs defaultValue="size" className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-1 p-1 bg-secondary/50 rounded-lg">
          <TabsTrigger value="size" className="gap-1.5 text-xs">
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Size</span>
          </TabsTrigger>
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

        {/* Size Tab */}
        <TabsContent value="size" className="space-y-4 p-3">
          {!selectedObjectDimensions ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Select an object to resize
            </div>
          ) : (
            <>
              {/* Unit Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Units
                </Label>
                <div className="flex gap-2">
                  <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="px">Pixels (px)</SelectItem>
                      <SelectItem value="in">Inches (in)</SelectItem>
                      <SelectItem value="mm">Millimeters (mm)</SelectItem>
                      <SelectItem value="ft">Feet (ft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dimensions Inputs */}
              <div className="flex items-end gap-2">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end flex-1">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      step={unit === 'px' ? 1 : 0.1}
                      value={widthInput}
                      onChange={(e) => handleInputChange('width', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mb-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setLockAspect(!lockAspect)}
                    title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                  >
                    {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Height</Label>
                    <Input
                      type="number"
                      step={unit === 'px' ? 1 : 0.1}
                      value={heightInput}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <Button onClick={handleApply} size="icon" className="h-8 w-8 mb-0.5" title="Apply Size">
                  <Check className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground text-center pt-2">
                Original: {Math.round(selectedObjectDimensions.width)} x {Math.round(selectedObjectDimensions.height)} px
              </div>
            </>
          )}
        </TabsContent>

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
