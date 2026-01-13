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
} from "lucide-react";
import {
    StrokeStyle,
    FillStyle,
    TextStyle,
    ImageFilter,
    FONT_FAMILIES,
    DEFAULT_IMAGE_FILTER,
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
}: BottomSettingsPanelProps) => {

    const updateTraceSetting = <K extends keyof TraceSettings>(
        key: K,
        value: TraceSettings[K]
    ) => {
        onTraceSettingsChange({ ...traceSettings, [key]: value });
    };

    return (
        <div className="w-full max-h-[50vh] overflow-y-auto bg-background/95 backdrop-blur-md border-t border-panel-border shadow-2xl p-4 rounded-t-xl">
            <Accordion type="single" collapsible className="w-full" defaultValue="appearance">
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
        </div>
    );
};
