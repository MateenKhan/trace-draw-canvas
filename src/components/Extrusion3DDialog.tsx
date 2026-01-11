import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Type, Palette, Settings } from "lucide-react";
import { Scene3D } from "@/components/3d/Scene3D";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ExtrusionSettings,
  MaterialSettings,
  Scene3DSettings,
  DEFAULT_EXTRUSION,
  DEFAULT_MATERIAL,
  DEFAULT_SCENE,
} from "@/lib/extrusion";

interface Extrusion3DDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Extrusion3DDialog = ({ open, onOpenChange }: Extrusion3DDialogProps) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"shape" | "text">("shape");
  const [shapeType, setShapeType] = useState<"rectangle" | "circle" | "triangle" | "star">("rectangle");
  const [text, setText] = useState("3D");
  const [extrusion, setExtrusion] = useState<ExtrusionSettings>(DEFAULT_EXTRUSION);
  const [material, setMaterial] = useState<MaterialSettings>(DEFAULT_MATERIAL);
  const [scene, setScene] = useState<Scene3DSettings>(DEFAULT_SCENE);

  const content = (
    <div className="flex flex-col gap-4">
      {/* 3D Preview */}
      <div className="h-[200px] md:h-[280px] w-full">
        <Scene3D
          mode={mode}
          shapeType={shapeType}
          text={text}
          extrusion={extrusion}
          material={material}
          scene={scene}
        />
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="shape" className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-1 p-1 bg-secondary/50 rounded-lg">
          <TabsTrigger value="shape" className="gap-1 text-xs">
            <Box className="w-3 h-3" />
            <span className="hidden sm:inline">Shape</span>
          </TabsTrigger>
          <TabsTrigger value="extrusion" className="gap-1 text-xs">
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">Depth</span>
          </TabsTrigger>
          <TabsTrigger value="material" className="gap-1 text-xs">
            <Palette className="w-3 h-3" />
            <span className="hidden sm:inline">Material</span>
          </TabsTrigger>
          <TabsTrigger value="scene" className="gap-1 text-xs">
            <Type className="w-3 h-3" />
            <span className="hidden sm:inline">Scene</span>
          </TabsTrigger>
        </TabsList>

        {/* Shape Settings */}
        <TabsContent value="shape" className="space-y-3 p-2">
          <div className="space-y-2">
            <Label className="text-xs">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "shape" | "text")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shape">Shape</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "shape" ? (
            <div className="space-y-2">
              <Label className="text-xs">Shape Type</Label>
              <Select value={shapeType} onValueChange={(v) => setShapeType(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="triangle">Triangle</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Text</Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text..."
                className="h-9"
              />
            </div>
          )}
        </TabsContent>

        {/* Extrusion Settings */}
        <TabsContent value="extrusion" className="space-y-3 p-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Depth</Label>
              <span className="text-xs text-muted-foreground">{extrusion.depth.toFixed(1)}</span>
            </div>
            <Slider
              value={[extrusion.depth]}
              onValueChange={(v) => setExtrusion({ ...extrusion, depth: v[0] })}
              min={0.1}
              max={5}
              step={0.1}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Bevel</Label>
            <Switch
              checked={extrusion.bevelEnabled}
              onCheckedChange={(v) => setExtrusion({ ...extrusion, bevelEnabled: v })}
            />
          </div>

          {extrusion.bevelEnabled && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Bevel Size</Label>
                  <span className="text-xs text-muted-foreground">{extrusion.bevelSize.toFixed(2)}</span>
                </div>
                <Slider
                  value={[extrusion.bevelSize]}
                  onValueChange={(v) => setExtrusion({ ...extrusion, bevelSize: v[0] })}
                  min={0}
                  max={0.5}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Bevel Thickness</Label>
                  <span className="text-xs text-muted-foreground">{extrusion.bevelThickness.toFixed(2)}</span>
                </div>
                <Slider
                  value={[extrusion.bevelThickness]}
                  onValueChange={(v) => setExtrusion({ ...extrusion, bevelThickness: v[0] })}
                  min={0}
                  max={0.5}
                  step={0.01}
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Material Settings */}
        <TabsContent value="material" className="space-y-3 p-2">
          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={material.color}
              onChange={(e) => setMaterial({ ...material, color: e.target.value })}
              className="h-9 w-full cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Metalness</Label>
              <span className="text-xs text-muted-foreground">{material.metalness.toFixed(2)}</span>
            </div>
            <Slider
              value={[material.metalness]}
              onValueChange={(v) => setMaterial({ ...material, metalness: v[0] })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Roughness</Label>
              <span className="text-xs text-muted-foreground">{material.roughness.toFixed(2)}</span>
            </div>
            <Slider
              value={[material.roughness]}
              onValueChange={(v) => setMaterial({ ...material, roughness: v[0] })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Wireframe</Label>
            <Switch
              checked={material.wireframe}
              onCheckedChange={(v) => setMaterial({ ...material, wireframe: v })}
            />
          </div>
        </TabsContent>

        {/* Scene Settings */}
        <TabsContent value="scene" className="space-y-3 p-2">
          <div className="space-y-2">
            <Label className="text-xs">Background</Label>
            <Input
              type="color"
              value={scene.backgroundColor}
              onChange={(e) => setScene({ ...scene, backgroundColor: e.target.value })}
              className="h-9 w-full cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Grid</Label>
            <Switch
              checked={scene.showGrid}
              onCheckedChange={(v) => setScene({ ...scene, showGrid: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Auto Rotate</Label>
            <Switch
              checked={scene.autoRotate}
              onCheckedChange={(v) => setScene({ ...scene, autoRotate: v })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Use Sheet for mobile (slides up from bottom)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              3D Extrusion
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            3D Extrusion
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
