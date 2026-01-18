import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlertTriangle,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    StrokeStyle,
    FillStyle,
    TextStyle,
    ImageFilter,
    FONT_FAMILIES,
    DEFAULT_IMAGE_FILTER,
    CANVAS_PRESETS,
    CanvasUnit,
    UNIT_CONVERTERS,
} from "@/lib/types";
import { TraceSettings } from "@/lib/tracing";

interface BottomSettingsPanelProps {
    stroke: StrokeStyle;
    fill: FillStyle;
    textStyle: TextStyle;
    imageFilter: ImageFilter;
    traceSettings: TraceSettings;
    onStrokeChange: (stroke: StrokeStyle) => void;
    onFillChange: (fill: FillStyle) => void;
    onTextStyleChange: (style: TextStyle) => void;
    onImageFilterChange: (filter: ImageFilter) => void;
    onTraceSettingsChange: (settings: TraceSettings) => void;
    maxHistory: number;
    onMaxHistoryChange: (value: number) => void;
    onDeleteAll: () => void;
    canvasSize?: { width: number; height: number };
    onCanvasSizeChange?: (size: { width: number; height: number }) => void;
    canvasUnit: CanvasUnit;
    onCanvasUnitChange: (unit: CanvasUnit) => void;
}

export const BottomSettingsPanel = ({
    stroke,
    fill,
    textStyle,
    imageFilter,
    traceSettings,
    onStrokeChange,
    onFillChange,
    onTextStyleChange,
    onImageFilterChange,
    onTraceSettingsChange,
    maxHistory,
    onMaxHistoryChange,
    onDeleteAll,
    canvasSize,
    onCanvasSizeChange,
    canvasUnit,
    onCanvasUnitChange,
}: BottomSettingsPanelProps) => {

    const updateTraceSetting = <K extends keyof TraceSettings>(
        key: K,
        value: TraceSettings[K]
    ) => {
        onTraceSettingsChange({ ...traceSettings, [key]: value });
    };

    // Helper to format values based on unit
    const formatValue = (px: number) => {
        const val = px / UNIT_CONVERTERS[canvasUnit];
        return Math.round(val * 100) / 100; // 2 decimal places
    };

    const handleDimensionChange = (dim: 'width' | 'height', valStr: string) => {
        if (!onCanvasSizeChange || !canvasSize) return;
        const val = parseFloat(valStr);
        if (isNaN(val)) return;

        const pxVal = Math.round(val * UNIT_CONVERTERS[canvasUnit]);
        onCanvasSizeChange({
            ...canvasSize,
            [dim]: pxVal
        });
    };

    return (
        <div className="w-full max-h-[50vh] overflow-y-auto bg-background/10 backdrop-blur-xl border-t border-white/10 shadow-2xl p-4 rounded-t-xl">
            <Accordion type="single" collapsible className="w-full">
                {/* Workspace Settings */}
                <AccordionItem value="workspace">
                    <AccordionTrigger>Workspace (Canvas) Size</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <Label className="text-xs">Unit</Label>
                            <Select value={canvasUnit} onValueChange={(v) => onCanvasUnitChange(v as CanvasUnit)}>
                                <SelectTrigger className="w-[120px] h-7 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="px">Pixels (px)</SelectItem>
                                    <SelectItem value="in">Inches (in)</SelectItem>
                                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                    <SelectItem value="ft">Feet (ft)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-muted-foreground font-mono">Width ({canvasUnit})</Label>
                                <Input
                                    type="number"
                                    value={canvasSize ? formatValue(canvasSize.width) : ''}
                                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                    step={canvasUnit === 'px' ? 1 : 0.1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-muted-foreground font-mono">Height ({canvasUnit})</Label>
                                <Input
                                    type="number"
                                    value={canvasSize ? formatValue(canvasSize.height) : ''}
                                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                    step={canvasUnit === 'px' ? 1 : 0.1}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {CANVAS_PRESETS.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 flex-col items-start py-0.5 min-h-[32px]"
                                    onClick={() => onCanvasSizeChange?.({ width: preset.width, height: preset.height })}
                                >
                                    <span>{preset.name}</span>
                                    {preset.sub && <span className="text-[8px] opacity-60 leading-none">{preset.sub}</span>}
                                </Button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Adjusting canvas size will affect the total drawing area.</p>
                    </AccordionContent>
                </AccordionItem>

                {/* Application Settings */}
                <AccordionItem value="application">
                    <AccordionTrigger>Application Settings</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Max History States</span>
                                <span>{maxHistory}</span>
                            </div>
                            <Slider
                                value={[maxHistory]}
                                min={5}
                                max={100}
                                step={5}
                                onValueChange={([v]) => onMaxHistoryChange(v)}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Higher values allow more undo steps but consume more memory.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <Label className="text-xs text-destructive font-medium mb-2 block">Danger Zone</Label>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Reset Application Data
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Everything?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will immediately wipe:
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                                                <li>All Canvas Drawings & Shapes</li>
                                                <li>All History & Undo States</li>
                                                <li>Project Storage & Snapshots</li>
                                                <li>Layer Structure</li>
                                            </ul>
                                            <div className="mt-4 font-semibold text-destructive">
                                                This action is irreversible.
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={onDeleteAll}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Yes, Delete Everything
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                {/* Stroke & Fill */}
                <AccordionItem value="appearance">
                    <AccordionTrigger>Appearance (Stroke & Fill)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-4">
                            {/* Stroke */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Stroke</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded border border-panel-border relative overflow-hidden"
                                            style={{ backgroundColor: stroke.color }}
                                        >
                                            <input
                                                type="color"
                                                value={stroke.color}
                                                onChange={(e) => onStrokeChange({ ...stroke, color: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <Input
                                            value={stroke.color}
                                            onChange={(e) => onStrokeChange({ ...stroke, color: e.target.value })}
                                            className="h-8 w-24 text-xs font-mono"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Width</span>
                                            <span>{stroke.width}px</span>
                                        </div>
                                        <Slider
                                            value={[stroke.width]}
                                            min={1}
                                            max={50}
                                            step={1}
                                            onValueChange={([v]) => onStrokeChange({ ...stroke, width: v })}
                                        />
                                        <div className="flex gap-1 pt-1 overflow-x-auto pb-1 scrollbar-none">
                                            {[1, 2, 4, 8, 12, 24].map((v) => (
                                                <Button
                                                    key={v}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-5 text-[9px] px-1.5 min-w-[24px]"
                                                    onClick={() => onStrokeChange({ ...stroke, width: v })}
                                                >
                                                    {v}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fill */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Fill</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded border border-panel-border relative overflow-hidden"
                                            style={{ backgroundColor: fill.color === 'transparent' ? 'transparent' : fill.color }}
                                        >
                                            {fill.color === 'transparent' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-full h-px bg-destructive rotate-45" />
                                                </div>
                                            )}
                                            <input
                                                type="color"
                                                value={fill.color === 'transparent' ? '#000000' : fill.color}
                                                onChange={(e) => onFillChange({ ...fill, color: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => onFillChange({ ...fill, color: 'transparent' })}
                                        >
                                            None
                                        </Button>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Opacity</span>
                                            <span>{Math.round(fill.opacity * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[fill.opacity * 100]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            onValueChange={([v]) => onFillChange({ ...fill, opacity: v / 100 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Text Settings */}
                <AccordionItem value="text">
                    <AccordionTrigger>Text Settings</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Font Family</Label>
                                <Select
                                    value={textStyle.fontFamily}
                                    onValueChange={(v) => onTextStyleChange({ ...textStyle, fontFamily: v })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_FAMILIES.map((font) => (
                                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                                {font.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs pb-1 block">Style</Label>
                                <div className="flex gap-1">
                                    <Button
                                        variant={textStyle.fontWeight >= 600 ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onTextStyleChange({ ...textStyle, fontWeight: textStyle.fontWeight >= 600 ? 400 : 700 })}
                                    >
                                        <Bold className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant={textStyle.fontStyle === 'italic' ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onTextStyleChange({ ...textStyle, fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                    >
                                        <Italic className="w-3 h-3" />
                                    </Button>
                                    <div className="w-px bg-border mx-1" />
                                    <Button
                                        variant={textStyle.textAlign === 'left' ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onTextStyleChange({ ...textStyle, textAlign: 'left' })}
                                    >
                                        <AlignLeft className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant={textStyle.textAlign === 'center' ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onTextStyleChange({ ...textStyle, textAlign: 'center' })}
                                    >
                                        <AlignCenter className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Size</span>
                                <span>{textStyle.fontSize}px</span>
                            </div>
                            <Slider
                                value={[textStyle.fontSize]}
                                min={8}
                                max={200}
                                step={1}
                                onValueChange={([v]) => onTextStyleChange({ ...textStyle, fontSize: v })}
                            />
                            <div className="flex gap-1 pt-1 overflow-x-auto pb-1 scrollbar-none">
                                {[12, 16, 24, 32, 48, 64, 96].map((v) => (
                                    <Button
                                        key={v}
                                        variant="secondary"
                                        size="sm"
                                        className="h-5 text-[9px] px-1.5 min-w-[28px]"
                                        onClick={() => onTextStyleChange({ ...textStyle, fontSize: v })}
                                    >
                                        {v}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Image Adjustment */}
                <AccordionItem value="image">
                    <AccordionTrigger>Image Adjustments</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Brightness</span>
                                    <span>{imageFilter.brightness}%</span>
                                </div>
                                <Slider
                                    value={[imageFilter.brightness]}
                                    min={0}
                                    max={200}
                                    onValueChange={([v]) => onImageFilterChange({ ...imageFilter, brightness: v })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Contrast</span>
                                    <span>{imageFilter.contrast}%</span>
                                </div>
                                <Slider
                                    value={[imageFilter.contrast]}
                                    min={0}
                                    max={200}
                                    onValueChange={([v]) => onImageFilterChange({ ...imageFilter, contrast: v })}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onImageFilterChange(DEFAULT_IMAGE_FILTER)}
                                className="w-full text-xs"
                            >
                                Reset Image Filters
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Trace Settings */}
                <AccordionItem value="trace">
                    <AccordionTrigger>Trace Settings (Vectorize)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-4">
                            {/* Detection */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">Detection Threshold</div>
                                <Slider
                                    value={[traceSettings.threshold]}
                                    max={255}
                                    onValueChange={([v]) => updateTraceSetting("threshold", v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Invert (Black on White)</Label>
                                <Switch
                                    checked={traceSettings.blackOnWhite}
                                    onCheckedChange={(v) => updateTraceSetting("blackOnWhite", v)}
                                />
                            </div>

                            {/* Optimization */}
                            <div className="space-y-2 border-t border-border pt-2">
                                <div className="flex justify-between text-xs font-medium">Curve Smoothness</div>
                                <Slider
                                    value={[traceSettings.optTolerance]}
                                    min={0.1}
                                    max={2}
                                    step={0.1}
                                    onValueChange={([v]) => updateTraceSetting("optTolerance", v)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">Speckle Removal</div>
                                <Slider
                                    value={[traceSettings.turdSize]}
                                    max={100}
                                    onValueChange={([v]) => updateTraceSetting("turdSize", v)}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div >
    );
};
