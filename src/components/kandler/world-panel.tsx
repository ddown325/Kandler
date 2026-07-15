"use client";

import { useKandler } from "@/lib/kandler/store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function SliderRow({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <div className="py-1">
      <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
        <span>{label}</span>
        <span className="font-mono text-purple-300">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-300 [&_.bg-primary]:bg-purple-500/40" />
    </div>
  );
}

export function WorldPanel() {
  const env = useKandler((s) => s.scene.environment);
  const update = useKandler((s) => s.updateEnvironment);

  return (
    <ScrollArea className="h-full">
      <div className="px-3 py-2 space-y-3 bg-[#150b25]">
        <div>
          <Label className="text-[10px] uppercase text-purple-400">Background Color</Label>
          <input
            type="color"
            value={env.background ? rgbToHex(env.background) : "#000000"}
            onChange={(e) => update({ background: hexToRgb(e.target.value) })}
            className="w-full h-7 bg-[#1a0e2e] border border-purple-500/30 rounded"
          />
        </div>
        <SliderRow label="Ambient Intensity" value={env.ambientIntensity} min={0} max={3} step={0.05} onChange={(v) => update({ ambientIntensity: v })} />
        <SliderRow label="Exposure" value={env.exposure} min={0} max={3} step={0.05} onChange={(v) => update({ exposure: v })} />

        <Separator className="bg-purple-500/20" />

        <div>
          <Label className="text-[10px] uppercase text-purple-400">Tone Mapping</Label>
          <Select value={env.toneMapping} onValueChange={(v) => update({ toneMapping: v as any })}>
            <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
              <SelectItem value="none" className="text-purple-100">None</SelectItem>
              <SelectItem value="aces" className="text-purple-100">ACES Filmic</SelectItem>
              <SelectItem value="reinhard" className="text-purple-100">Reinhard</SelectItem>
              <SelectItem value="cineon" className="text-purple-100">Cineon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-purple-500/20" />

        <div className="flex items-center justify-between">
          <Label className="text-xs text-purple-200">Shadow Maps</Label>
          <Switch checked={env.shadowMapEnabled} onCheckedChange={(v) => update({ shadowMapEnabled: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-purple-200">Show Grid</Label>
          <Switch checked={env.gridVisible} onCheckedChange={(v) => update({ gridVisible: v })} />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-purple-400">Grid Color</Label>
          <input
            type="color"
            value={rgbToHex(env.gridColor)}
            onChange={(e) => update({ gridColor: hexToRgb(e.target.value) })}
            className="w-full h-7 bg-[#1a0e2e] border border-purple-500/30 rounded"
          />
        </div>
        <SliderRow label="Grid Size" value={env.gridDivisions} min={4} max={100} step={1} onChange={(v) => update({ gridDivisions: v })} fmt={(v) => v.toFixed(0)} />

        <Separator className="bg-purple-500/20" />

        <div className="flex items-center justify-between">
          <Label className="text-xs text-purple-200">Fog</Label>
          <Switch checked={!!env.fog} onCheckedChange={(v) => update({ fog: v ? { enabled: true, color: [0.1, 0.05, 0.15], near: 5, far: 50 } : null })} />
        </div>
        {env.fog && (
          <>
            <div>
              <Label className="text-[10px] uppercase text-purple-400">Fog Color</Label>
              <input
                type="color"
                value={rgbToHex(env.fog.color)}
                onChange={(e) => update({ fog: { ...env.fog!, color: hexToRgb(e.target.value) } })}
                className="w-full h-7 bg-[#1a0e2e] border border-purple-500/30 rounded"
              />
            </div>
            <SliderRow label="Fog Near" value={env.fog.near} min={0} max={100} step={1} onChange={(v) => update({ fog: { ...env.fog!, near: v } })} />
            <SliderRow label="Fog Far" value={env.fog.far} min={1} max={200} step={1} onChange={(v) => update({ fog: { ...env.fog!, far: v } })} />
          </>
        )}
      </div>
    </ScrollArea>
  );
}
