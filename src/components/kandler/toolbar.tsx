"use client";

import { useKandler } from "@/lib/kandler/store";
import { Move3D, RotateCw, Scale3D, Magnet, Grid3x3, Eye, Camera, Box, Lightbulb, Plus, Copy, Trash2, MagnetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PrimitiveKind, LightKind } from "@/lib/kandler/types";

export function Toolbar() {
  const scene = useKandler((s) => s.scene);
  const setTransformMode = useKandler((s) => s.setTransformMode);
  const setSnap = useKandler((s) => s.setSnap);
  const setUI = useKandler((s) => s.setUI);
  const updateEnvironment = useKandler((s) => s.updateEnvironment);
  const addPrimitive = useKandler((s) => s.addPrimitive);
  const addLight = useKandler((s) => s.addLight);
  const addCamera = useKandler((s) => s.addCamera);
  const selectedIds = useKandler((s) => s.selectedIds);
  const deleteObject = useKandler((s) => s.deleteObject);
  const duplicateObject = useKandler((s) => s.duplicateObject);

  const primitives: PrimitiveKind[] = ["cube", "sphere", "cylinder", "cone", "torus", "torusknot", "plane", "dodecahedron", "icosahedron", "octahedron", "tetrahedron", "circle", "capsule"];
  const lights: LightKind[] = ["point", "directional", "spot", "hemisphere", "area"];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-purple-500/30 bg-[#150b25]/95">
        <TButton tooltip="Move (W)" active={scene.ui.transformMode === "translate"} onClick={() => setTransformMode("translate")}>
          <Move3D className="w-4 h-4" />
        </TButton>
        <TButton tooltip="Rotate (E)" active={scene.ui.transformMode === "rotate"} onClick={() => setTransformMode("rotate")}>
          <RotateCw className="w-4 h-4" />
        </TButton>
        <TButton tooltip="Scale (R)" active={scene.ui.transformMode === "scale"} onClick={() => setTransformMode("scale")}>
          <Scale3D className="w-4 h-4" />
        </TButton>

        <Separator orientation="vertical" className="h-6 mx-1 bg-purple-500/30" />

        <TButton
          tooltip="Snapping"
          active={scene.ui.snapEnabled}
          onClick={() => setSnap({ snapEnabled: !scene.ui.snapEnabled })}
        >
          <Magnet className="w-4 h-4" />
        </TButton>
        <TButton
          tooltip="Toggle Grid"
          active={scene.environment.gridVisible}
          onClick={() => updateEnvironment({ gridVisible: !scene.environment.gridVisible })}
        >
          <Grid3x3 className="w-4 h-4" />
        </TButton>
        <TButton
          tooltip="Wireframe Mode"
          active={scene.ui.wireframeMode === "all"}
          onClick={() => setUI({ wireframeMode: scene.ui.wireframeMode === "all" ? "off" : "all" })}
        >
          <Box className="w-4 h-4" />
        </TButton>
        <TButton
          tooltip="Stats"
          active={scene.ui.showStats}
          onClick={() => setUI({ showStats: !scene.ui.showStats })}
        >
          <Eye className="w-4 h-4" />
        </TButton>

        <Separator orientation="vertical" className="h-6 mx-1 bg-purple-500/30" />

        {/* Add Mesh dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="text-purple-100 hover:bg-purple-500/20 gap-1">
              <Box className="w-4 h-4" /> Add Mesh
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a0e2e] border-purple-500/40 min-w-[180px]">
            <DropdownMenuLabel className="text-purple-400 text-[10px] uppercase tracking-wider">Primitives</DropdownMenuLabel>
            {primitives.map((p) => (
              <DropdownMenuItem key={p} onClick={() => addPrimitive(p)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white capitalize">
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Light dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="text-purple-100 hover:bg-purple-500/20 gap-1">
              <Lightbulb className="w-4 h-4" /> Add Light
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a0e2e] border-purple-500/40 min-w-[180px]">
            <DropdownMenuLabel className="text-purple-400 text-[10px] uppercase tracking-wider">Lights</DropdownMenuLabel>
            {lights.map((l) => (
              <DropdownMenuItem key={l} onClick={() => addLight(l)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white capitalize">
                {l}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant="ghost" className="text-purple-100 hover:bg-purple-500/20 gap-1" onClick={() => addCamera()}>
          <Camera className="w-4 h-4" /> Camera
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-purple-500/30" />

        <TButton tooltip="Duplicate Selected" onClick={() => selectedIds.forEach(duplicateObject)} disabled={selectedIds.length === 0}>
          <Copy className="w-4 h-4" />
        </TButton>
        <TButton tooltip="Delete Selected" onClick={() => selectedIds.forEach(deleteObject)} disabled={selectedIds.length === 0}>
          <Trash2 className="w-4 h-4" />
        </TButton>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-purple-300/70 pr-2">
          <Plus className="w-3 h-3" />
          <span className="hidden md:inline">{Object.keys(scene.objects).length} objects · {Object.keys(scene.materials).length} materials</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function TButton({ tooltip, active, children, onClick, disabled }: { tooltip: string; active?: boolean; children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle pressed={active} onPressedChange={onClick} disabled={disabled} className="data-[state=on]:bg-purple-500/40 data-[state=on]:text-white text-purple-200 hover:bg-purple-500/20 hover:text-white p-1.5 h-8 w-8">
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-[#1a0e2e] border-purple-500/40 text-purple-100">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

void MagnetIcon;
