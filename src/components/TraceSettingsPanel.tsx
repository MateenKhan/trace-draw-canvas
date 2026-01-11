import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TraceSettings } from "@/lib/tracing";
import { Settings2, Palette, Sliders, Wand2 } from "lucide-react";

interface TraceSettingsPanelProps {
  settings: TraceSettings;
  onSettingsChange: (settings: TraceSettings) => void;
}

export const TraceSettingsPanel = ({
  settings,
  onSettingsChange,
}: TraceSettingsPanelProps) => {
  const updateSetting = <K extends keyof TraceSettings>(
    key: K,
    value: TraceSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="panel w-full animate-slide-up">
      <div className="panel-header flex items-center gap-2">
        <Settings2 className="w-4 h-4" />
        Trace Settings
      </div>
      
      <div className="p-3 md:p-4 space-y-5 md:space-y-6 scrollbar-thin max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Detection Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Sliders className="w-3 h-3" />
            Detection
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Threshold</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.threshold}
                </span>
              </div>
              <Slider
                value={[settings.threshold]}
                min={0}
                max={255}
                step={1}
                onValueChange={([v]) => updateSetting("threshold", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Speckle Size</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.turdSize}
                </span>
              </div>
              <Slider
                value={[settings.turdSize]}
                min={0}
                max={20}
                step={1}
                onValueChange={([v]) => updateSetting("turdSize", v)}
              />
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Remove speckles smaller than this
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Black on White</Label>
              <Switch
                checked={settings.blackOnWhite}
                onCheckedChange={(v) => updateSetting("blackOnWhite", v)}
              />
            </div>
          </div>
        </div>

        {/* Optimization Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Wand2 className="w-3 h-3" />
            Optimization
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Smooth Curves</Label>
              <Switch
                checked={settings.optCurve}
                onCheckedChange={(v) => updateSetting("optCurve", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Tolerance</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.optTolerance.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[settings.optTolerance]}
                min={0.1}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateSetting("optTolerance", v)}
              />
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Higher = simpler paths
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Corner Threshold</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.alphaMax.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[settings.alphaMax]}
                min={0}
                max={1.34}
                step={0.1}
                onValueChange={([v]) => updateSetting("alphaMax", v)}
              />
            </div>
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Palette className="w-3 h-3" />
            Style
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Stroke Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => updateSetting("color", e.target.value)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg cursor-pointer bg-transparent border border-panel-border"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.color}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Fill Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.fillColor === "transparent" ? "#000000" : settings.fillColor}
                  onChange={(e) => updateSetting("fillColor", e.target.value)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg cursor-pointer bg-transparent border border-panel-border"
                />
                <button
                  onClick={() => updateSetting("fillColor", "transparent")}
                  className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                    settings.fillColor === "transparent"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-panel-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Stroke Width</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {settings.strokeWidth}px
                </span>
              </div>
              <Slider
                value={[settings.strokeWidth]}
                min={0.5}
                max={5}
                step={0.5}
                onValueChange={([v]) => updateSetting("strokeWidth", v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
