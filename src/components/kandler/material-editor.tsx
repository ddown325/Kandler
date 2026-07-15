"use client";

import { useKandler } from "@/lib/kandler/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useRef } from "react";

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

export function MaterialEditor({ materialId }: { materialId: string }) {
  const mat = useKandler((s) => s.scene.materials[materialId]);
  const update = useKandler((s) => s.updateMaterial);
  const addMaterial = useKandler((s) => s.addMaterial);
  const deleteMat = useKandler((s) => s.deleteMaterial);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!mat) return <div className="p-6 text-center text-xs text-purple-400/60">Material not found</div>;

  const onTextureUpload = (key: "map" | "normalMap" | "roughnessMap") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update(materialId, { [key]: reader.result as string });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="bg-[#150b25]">
      <div className="px-3 py-2 border-b border-purple-500/30 flex items-center gap-2">
        <Input
          value={mat.name}
          onChange={(e) => update(materialId, { name: e.target.value })}
          className="h-7 text-xs bg-[#1a0e2e] border-purple-500/30 text-purple-100"
        />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-300 hover:bg-red-500/20" onClick={() => deleteMat(materialId)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="px-3 py-2 space-y-3">
        <div>
          <Label className="text-[10px] uppercase text-purple-400">Type</Label>
          <Select value={mat.type} onValueChange={(v) => update(materialId, { type: v as any })}>
            <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
              <SelectItem value="pbr" className="text-purple-100">PBR (Standard)</SelectItem>
              <SelectItem value="standard" className="text-purple-100">Standard (Phong)</SelectItem>
              <SelectItem value="basic" className="text-purple-100">Basic (Unlit)</SelectItem>
              <SelectItem value="wireframe" className="text-purple-100">Wireframe</SelectItem>
              <SelectItem value="normal" className="text-purple-100">Normal Map Debug</SelectItem>
              <SelectItem value="toon" className="text-purple-100">Toon / Cel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 items-center">
          <div className="w-14 h-14 rounded border border-purple-500/30 overflow-hidden" style={{ background: rgbToHex(mat.color) }} />
          <div className="flex-1 space-y-2">
            <div>
              <Label className="text-[10px] uppercase text-purple-400">Base Color</Label>
              <input
                type="color"
                value={rgbToHex(mat.color)}
                onChange={(e) => update(materialId, { color: hexToRgb(e.target.value) })}
                className="w-full h-7 bg-[#1a0e2e] border border-purple-500/30 rounded"
              />
            </div>
            {mat.type === "pbr" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase text-purple-400">Metallic</Label>
                  <Slider value={[mat.metalness]} min={0} max={1} step={0.01} onValueChange={(v) => update(materialId, { metalness: v[0] })} className="[&_[role=slider]]:bg-purple-500 [&_.bg-primary]:bg-purple-500/40" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-purple-400">Roughness</Label>
                  <Slider value={[mat.roughness]} min={0} max={1} step={0.01} onValueChange={(v) => update(materialId, { roughness: v[0] })} className="[&_[role=slider]]:bg-purple-500 [&_.bg-primary]:bg-purple-500/40" />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-purple-500/20" />

        <div>
          <Label className="text-[10px] uppercase text-purple-400">Emissive Color</Label>
          <input
            type="color"
            value={rgbToHex(mat.emissive)}
            onChange={(e) => update(materialId, { emissive: hexToRgb(e.target.value) })}
            className="w-full h-7 bg-[#1a0e2e] border border-purple-500/30 rounded"
          />
        </div>
        <SliderRow label="Emissive Strength" value={mat.emissiveIntensity} min={0} max={10} step={0.1} onChange={(v) => update(materialId, { emissiveIntensity: v })} />
        <SliderRow label="Opacity" value={mat.opacity} min={0} max={1} step={0.01} onChange={(v) => update(materialId, { opacity: v, transparent: v < 1 })} />

        <Separator className="bg-purple-500/20" />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 text-purple-200">
            <Switch checked={mat.wireframe} onCheckedChange={(v) => update(materialId, { wireframe: v })} /> Wireframe
          </label>
          <label className="flex items-center gap-2 text-purple-200">
            <Switch checked={mat.flatShading} onCheckedChange={(v) => update(materialId, { flatShading: v })} /> Flat Shade
          </label>
          <label className="flex items-center gap-2 text-purple-200">
            <Switch checked={mat.doubleSided} onCheckedChange={(v) => update(materialId, { doubleSided: v })} /> Double Sided
          </label>
          <label className="flex items-center gap-2 text-purple-200">
            <Switch checked={mat.transparent} onCheckedChange={(v) => update(materialId, { transparent: v })} /> Transparent
          </label>
        </div>

        {mat.type === "toon" && (
          <SliderRow label="Toon Steps" value={mat.toonSteps ?? 3} min={2} max={8} step={1} onChange={(v) => update(materialId, { toonSteps: v })} fmt={(v) => v.toFixed(0)} />
        )}

        <Separator className="bg-purple-500/20" />

        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-purple-400">Textures</Label>
          {(["map", "normalMap", "roughnessMap"] as const).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-200" onClick={() => fileRef.current?.click()}>
                Upload {key === "map" ? "Albedo" : key === "normalMap" ? "Normal" : "Roughness"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onTextureUpload(key)} className="hidden" />
              {mat[key] && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-300 hover:bg-red-500/20" onClick={() => update(materialId, { [key]: null })}>
                  Clear
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button size="sm" variant="outline" className="w-full border-purple-500/30 text-purple-200" onClick={() => addMaterial()}>
          <Plus className="w-3 h-3 mr-1" /> New Material
        </Button>
      </div>
    </div>
  );
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
