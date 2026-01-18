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
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    X,
    Type,
    Sparkles,
    Move,
    Square,
} from "lucide-react";
import {
    TextStyle,
    FONT_FAMILIES,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface TextSettingsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    textStyle: TextStyle;
    onTextStyleChange: (style: TextStyle) => void;
    onApply?: () => void;
    isMobile?: boolean;
}

export const TextSettingsPanel = ({
    isVisible,
    onClose,
    textStyle,
    onTextStyleChange,
    onApply,
    isMobile = false,
}: TextSettingsPanelProps) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop - Transparent but clickable to close */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onClick={() => isMobile && onClose()}
            />

            {/* Panel - Right sidebar with localized blur */}
            <div className="relative w-80 h-full bg-background/40 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-slide-left flex flex-col pt-0 pb-20 lg:pb-0 pointer-events-auto">
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                        <Type className="w-4 h-4" /> Text Settings
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {/* Text Content - Moved from Topbar */}
                    <div className="space-y-2">
                        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            Text Content
                        </Label>
                        <Input
                            value={textStyle.content || ""}
                            onChange={(e) => onTextStyleChange({ ...textStyle, content: e.target.value })}
                            className="bg-secondary/20 border-white/5 focus:border-primary/50 transition-colors"
                            placeholder="Type something..."
                        />
                    </div>

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

                    {/* Font Weight & Style */}
                    <div className="space-y-2">
                        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            Style & Alignment
                        </Label>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-white/5">
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
                            </div>

                            <div className="w-px h-6 bg-panel-border mx-1" />

                            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-white/5">
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
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2">
                        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            Text Color
                        </Label>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-10 h-10 rounded-xl border border-panel-border cursor-pointer overflow-hidden shadow-inner"
                                style={{ backgroundColor: textStyle.fill }}
                            >
                                <input
                                    type="color"
                                    value={textStyle.fill}
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        onTextStyleChange({
                                            ...textStyle,
                                            fill: newColor,
                                            glowColor: textStyle.glowColor === textStyle.fill ? newColor : textStyle.glowColor
                                        });
                                    }}
                                    className="w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <Input
                                value={textStyle.fill}
                                onChange={(e) => {
                                    const newColor = e.target.value;
                                    onTextStyleChange({
                                        ...textStyle,
                                        fill: newColor,
                                        glowColor: textStyle.glowColor === textStyle.fill ? newColor : textStyle.glowColor
                                    });
                                }}
                                className="flex-1 font-mono text-xs h-10 bg-secondary/20"
                            />
                        </div>
                    </div>

                    {/* Spacing Controls */}
                    <div className="grid grid-cols-1 gap-4 pt-2 border-t border-white/5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Letter Spacing
                                </Label>
                                <span className="text-[10px] font-mono text-primary">{textStyle.letterSpacing}px</span>
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Line Height
                                </Label>
                                <span className="text-[10px] font-mono text-primary">{textStyle.lineHeight.toFixed(1)}</span>
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
                    </div>

                    {/* Neon Glow Section */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                                Neon Glow
                            </Label>
                        </div>

                        <div className="space-y-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-muted-foreground uppercase">Glow Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer relative"
                                        style={{
                                            backgroundColor: textStyle.glowColor === 'transparent' ? 'transparent' : textStyle.glowColor,
                                            boxShadow: textStyle.glowColor !== 'transparent' && textStyle.glowBlur > 0
                                                ? `0 0 ${Math.min(textStyle.glowBlur, 20)}px ${textStyle.glowColor}`
                                                : 'none'
                                        }}
                                    >
                                        {textStyle.glowColor === 'transparent' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-0.5 bg-destructive rotate-45 absolute" />
                                            </div>
                                        )}
                                        <input
                                            type="color"
                                            value={textStyle.glowColor === 'transparent' ? '#00d4ff' : textStyle.glowColor}
                                            onChange={(e) => onTextStyleChange({ ...textStyle, glowColor: e.target.value })}
                                            className="w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={textStyle.glowColor}
                                        onChange={(e) => onTextStyleChange({ ...textStyle, glowColor: e.target.value })}
                                        className="flex-1 font-mono text-xs h-8 bg-background/50"
                                    />
                                    <Button
                                        variant="toolbar"
                                        size="sm"
                                        onClick={() => onTextStyleChange({ ...textStyle, glowColor: 'transparent', glowBlur: 0 })}
                                        className="text-xs h-8 px-2"
                                    >
                                        Off
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Intensity</Label>
                                    <span className="text-xs font-mono text-primary">{textStyle.glowBlur}px</span>
                                </div>
                                <Slider
                                    value={[textStyle.glowBlur || 0]}
                                    onValueChange={(v) => onTextStyleChange({ ...textStyle, glowBlur: v[0] })}
                                    min={0}
                                    max={250}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text Offset Section */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Move className="w-3.5 h-3.5 text-primary" />
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                                Text Offset
                            </Label>
                        </div>

                        <div className="space-y-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-muted-foreground uppercase">Offset Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer relative"
                                        style={{
                                            backgroundColor: textStyle.offsetColor || '#000000',
                                        }}
                                    >
                                        <input
                                            type="color"
                                            value={textStyle.offsetColor || '#000000'}
                                            onChange={(e) => onTextStyleChange({ ...textStyle, offsetColor: e.target.value })}
                                            className="w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={textStyle.offsetColor || '#000000'}
                                        onChange={(e) => onTextStyleChange({ ...textStyle, offsetColor: e.target.value })}
                                        className="flex-1 font-mono text-xs h-8 bg-background/50"
                                    />
                                    <Button
                                        variant="toolbar"
                                        size="sm"
                                        onClick={() => onTextStyleChange({ ...textStyle, offsetX: 0, offsetY: 0, offsetBlur: 0 })}
                                        className="text-xs h-8 px-2"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">X Offset</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.offsetX || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.offsetX || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, offsetX: v[0] })}
                                        min={-50}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Y Offset</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.offsetY || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.offsetY || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, offsetY: v[0] })}
                                        min={-50}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Blur</Label>
                                    <span className="text-xs font-mono text-primary">{textStyle.offsetBlur || 0}px</span>
                                </div>
                                <Slider
                                    value={[textStyle.offsetBlur || 0]}
                                    onValueChange={(v) => onTextStyleChange({ ...textStyle, offsetBlur: v[0] })}
                                    min={0}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text Outline Section */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Square className="w-3.5 h-3.5 text-primary" />
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                                Text Outline
                            </Label>
                        </div>

                        <div className="space-y-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-muted-foreground uppercase">Outline Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer relative"
                                        style={{
                                            backgroundColor: textStyle.outlineColor || '#000000',
                                        }}
                                    >
                                        <input
                                            type="color"
                                            value={textStyle.outlineColor || '#000000'}
                                            onChange={(e) => onTextStyleChange({ ...textStyle, outlineColor: e.target.value })}
                                            className="w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={textStyle.outlineColor || '#000000'}
                                        onChange={(e) => onTextStyleChange({ ...textStyle, outlineColor: e.target.value })}
                                        className="flex-1 font-mono text-xs h-8 bg-background/50"
                                    />
                                    <Button
                                        variant="toolbar"
                                        size="sm"
                                        onClick={() => onTextStyleChange({ ...textStyle, outlineWidth: 0, outlineBlur: 0, outlineOffsetX: 0, outlineOffsetY: 0, outlineGap: 0 })}
                                        className="text-xs h-8 px-2"
                                    >
                                        Off
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Stroke</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.outlineWidth || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.outlineWidth || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, outlineWidth: v[0] })}
                                        min={0}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Blur</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.outlineBlur || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.outlineBlur || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, outlineBlur: v[0] })}
                                        min={0}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Outline X</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.outlineOffsetX || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.outlineOffsetX || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, outlineOffsetX: v[0] })}
                                        min={-50}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Outline Y</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.outlineOffsetY || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.outlineOffsetY || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, outlineOffsetY: v[0] })}
                                        min={-50}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono text-muted-foreground uppercase">Gap Distance</Label>
                                        <span className="text-xs font-mono text-primary">{textStyle.outlineGap || 0}px</span>
                                    </div>
                                    <Slider
                                        value={[textStyle.outlineGap || 0]}
                                        onValueChange={(v) => onTextStyleChange({ ...textStyle, outlineGap: v[0] })}
                                        min={0}
                                        max={30}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Gap Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer relative"
                                            style={{
                                                backgroundColor: textStyle.outlineGapColor || 'transparent',
                                                backgroundImage: (!textStyle.outlineGapColor || textStyle.outlineGapColor === 'transparent')
                                                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                                                    : 'none',
                                                backgroundSize: '8px 8px',
                                                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                                            }}
                                        >
                                            <input
                                                type="color"
                                                value={textStyle.outlineGapColor === 'transparent' ? '#ffffff' : textStyle.outlineGapColor}
                                                onChange={(e) => onTextStyleChange({ ...textStyle, outlineGapColor: e.target.value })}
                                                className="w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <Input
                                            value={textStyle.outlineGapColor || 'transparent'}
                                            onChange={(e) => onTextStyleChange({ ...textStyle, outlineGapColor: e.target.value })}
                                            className="flex-1 font-mono text-xs h-8 bg-background/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono text-muted-foreground uppercase">Outline Layering</Label>
                                <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-white/5">
                                    <Button
                                        variant={textStyle.paintFirst === 'stroke' ? "toolbar-active" : "toolbar"}
                                        className="flex-1 text-[10px] h-7"
                                        onClick={() => onTextStyleChange({ ...textStyle, paintFirst: 'stroke' })}
                                    >
                                        Behind Text (Merging)
                                    </Button>
                                    <Button
                                        variant={textStyle.paintFirst === 'fill' ? "toolbar-active" : "toolbar"}
                                        className="flex-1 text-[10px] h-7"
                                        onClick={() => onTextStyleChange({ ...textStyle, paintFirst: 'fill' })}
                                    >
                                        In Front
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                <div className="p-4 border-t border-white/5 bg-background/20">
                    <Button
                        onClick={onApply}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-10 rounded-xl font-bold uppercase tracking-wider text-xs"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
};
