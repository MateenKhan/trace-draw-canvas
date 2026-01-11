import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayersPanel } from "@/components/LayersPanel";
import { Layer, LayerGroup } from "@/lib/layers";
import { Layers as LayersIcon, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorSidebarProps {
  layers: Layer[];
  groups: LayerGroup[];
  activeLayerId: string | null;
  onLayersChange: (layers: Layer[]) => void;
  onGroupsChange: (groups: LayerGroup[]) => void;
  onActiveLayerChange: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
}

export const EditorSidebar = ({
  layers,
  groups,
  activeLayerId,
  onLayersChange,
  onGroupsChange,
  onActiveLayerChange,
  onDeleteLayer,
}: EditorSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      side="right"
      className="border-l border-panel-border"
      collapsible="icon"
    >
      <SidebarHeader className="p-2 border-b border-panel-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Layers</span>
            </div>
          )}
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        {!isCollapsed && (
          <LayersPanel
            layers={layers}
            groups={groups}
            activeLayerId={activeLayerId}
            onLayersChange={onLayersChange}
            onGroupsChange={onGroupsChange}
            onActiveLayerChange={onActiveLayerChange}
            onDeleteLayer={onDeleteLayer}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
};
