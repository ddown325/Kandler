"use client";

import { useKandler } from "@/lib/kandler/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, Trash2, Plus, Link2, Link2Off } from "lucide-react";
import { useState, useEffect } from "react";
import type { ModifierKind, SceneObject } from "@/lib/kandler/types";
import { MaterialEditor } from "./material-editor";

function rad2deg(r: number) { return (r * 180) / Math.PI; }
function deg2rad(d: number) { return (d * Math.PI) / 180; }

function Number3({ value, onChange, step = 0.1, lockable = true }: { value: [number, number, number]; onChange: (v: [number, number, number]) => void; step?: number; lockable?: boolean }) {
  const [locked, setLocked] = useState(false);
  const set = (i: number, v: number) => {
    const nv = [...value] as [number, number, number];
    if (locked) {
      const ratio = v / (value[i] || 0.0001);
      nv[0] = value[0] * ratio; nv[1] = value[1] * ratio; nv[2] = value[2] * ratio;
    } else {
      nv[i] = v;
    }
    onChange(nv);
  };
  return (
    <div className="flex items-center gap-1">
      {(["X", "Y", "Z"] as const).map((axis, i) => (
        <div key={axis} className="relative flex-1">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-purple-400 pointer-events-none">{axis}</span>
          <Input
            type="number"
            step={step}
            value={Number(value[i].toFixed(4))}
            onChange={(e) => set(i, parseFloat(e.target.value) || 0)}
            className="h-7 pl-5 text-xs bg-[#1a0e2e] border-purple-500/30 text-purple-100"
          />
        </div>
      ))}
      {lockable && (
        <button onClick={() => setLocked(!locked)} className={`p-1 rounded ${locked ? "bg-purple-500/40 text-white" : "text-purple-400 hover:text-white"}`}>
          {locked ? <Link2 className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}
        </button>
      )}
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
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-300 [&_[role=slider]]:shadow-purple-500/50 [&_.bg-primary]:bg-purple-500/40" />
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-purple-500/20">
      <button onClick={() => setOpen(!open)} className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-purple-300 hover:bg-purple-500/10">
        {title}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-3 py-2 space-y-2">{children}</div>}
    </div>
  );
}

const MODIFIER_KINDS: { kind: ModifierKind; label: string }[] = [
  { kind: "bevel", label: "Bevel" },
  { kind: "subdivision", label: "Subdivision Surface" },
  { kind: "mirror", label: "Mirror" },
  { kind: "array", label: "Array" },
  { kind: "boolean", label: "Boolean" },
  { kind: "simpleDeform", label: "Simple Deform" },
  { kind: "wireframe", label: "Wireframe" },
  { kind: "solidify", label: "Solidify" },
  { kind: "decimate", label: "Decimate" },
];

const PRIMITIVE_LABELS: Record<string, string> = {
  width: "Width", height: "Height", depth: "Depth", radius: "Radius",
  radiusTop: "Radius Top", radiusBottom: "Radius Bottom", segments: "Segments",
  radialSegments: "Radial Segs", heightSegments: "Height Segs", tube: "Tube",
  tubularSegments: "Tubular Segs", arc: "Arc", p: "P", q: "Q", detail: "Detail",
  thetaStart: "Theta Start", thetaLength: "Theta Length",
};

export function PropertiesPanel() {
  const scene = useKandler((s) => s.scene);
  const selectedIds = useKandler((s) => s.selectedIds);
  const updateTransformField = useKandler((s) => s.updateTransformField);
  const updateGeometry = useKandler((s) => s.updateGeometry);
  const updateLight = useKandler((s) => s.updateLight);
  const updateCamera = useKandler((s) => s.updateCamera);
  const addModifier = useKandler((s) => s.addModifier);
  const updateModifier = useKandler((s) => s.updateModifier);
  const removeModifier = useKandler((s) => s.removeModifier);
  const moveModifier = useKandler((s) => s.moveModifier);
  const assignMaterial = useKandler((s) => s.assignMaterial);
  const setActiveCamera = useKandler((s) => s.setActiveCamera);
  const materials = scene.materials;

  const obj: SceneObject | undefined = selectedIds.length === 1 ? scene.objects[selectedIds[0]] : undefined;
  const multi = selectedIds.length > 1;

  return (
    <div className="flex flex-col h-full bg-[#150b25]">
      <div className="px-3 py-2 border-b border-purple-500/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
          {obj ? obj.name : multi ? `${selectedIds.length} Objects` : "Properties"}
        </span>
      </div>
      <ScrollArea className="flex-1">
        {!obj && (
          <div className="p-6 text-center text-xs text-purple-400/60">
            Select an object to edit its properties
          </div>
        )}

        {obj && (
          <Tabs defaultValue="object" className="w-full">
            <TabsList className="w-full bg-[#1a0e2e] border-b border-purple-500/30 rounded-none h-8">
              <TabsTrigger value="object" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Object</TabsTrigger>
              {obj.kind === "mesh" && <TabsTrigger value="geo" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Geo</TabsTrigger>}
              {obj.kind === "mesh" && <TabsTrigger value="mod" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Mods</TabsTrigger>}
              {obj.kind === "mesh" && <TabsTrigger value="mat" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Material</TabsTrigger>}
              {obj.kind === "light" && <TabsTrigger value="light" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Light</TabsTrigger>}
              {obj.kind === "camera" && <TabsTrigger value="cam" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200">Camera</TabsTrigger>}
            </TabsList>

            <TabsContent value="object" className="p-0">
              <Section title="Transform">
                <div>
                  <Label className="text-[10px] uppercase text-purple-400">Location</Label>
                  <Number3 value={obj.transform.position} onChange={(v) => updateTransformField(obj.id, "position", v)} step={0.1} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-purple-400">Rotation (deg)</Label>
                  <Number3
                    value={[rad2deg(obj.transform.rotation[0]), rad2deg(obj.transform.rotation[1]), rad2deg(obj.transform.rotation[2])]}
                    onChange={(v) => updateTransformField(obj.id, "rotation", [deg2rad(v[0]), deg2rad(v[1]), deg2rad(v[2])])}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-purple-400">Scale</Label>
                  <Number3 value={obj.transform.scale} onChange={(v) => updateTransformField(obj.id, "scale", v)} step={0.1} />
                </div>
                <Separator className="bg-purple-500/20" />
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] uppercase text-purple-400">Visible</Label>
                  <Switch
                    checked={obj.visible}
                    onCheckedChange={(v) => useKandler.getState().setObjectVisible(obj.id, v)}
                  />
                </div>
              </Section>
              {obj.kind === "mesh" && (
                <Section title="Material" defaultOpen={false}>
                  <Select value={obj.materialId || "none"} onValueChange={(v) => v !== "none" && assignMaterial(obj.id, v)}>
                    <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
                      <SelectItem value="none" className="text-purple-200">— None —</SelectItem>
                      {Object.values(materials).map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-purple-100">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Section>
              )}
              {obj.kind === "camera" && (
                <Section title="Active Camera">
                  <Button
                    size="sm"
                    variant={scene.activeCameraId === obj.id ? "default" : "outline"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setActiveCamera(scene.activeCameraId === obj.id ? null : obj.id)}
                  >
                    {scene.activeCameraId === obj.id ? "Active (Editor Camera)" : "Set as Active"}
                  </Button>
                </Section>
              )}
            </TabsContent>

            {obj.kind === "mesh" && obj.geometry && (
              <TabsContent value="geo" className="p-0">
                <Section title={`Geometry · ${obj.geometry.kind}`}>
                  {Object.entries(obj.geometry)
                    .filter(([k]) => k !== "kind")
                    .map(([k, v]) => (
                      <div key={k}>
                        <Label className="text-[10px] uppercase text-purple-400">{PRIMITIVE_LABELS[k] || k}</Label>
                        <Input
                          type="number"
                          step={0.1}
                          value={Number(v)}
                          onChange={(e) => updateGeometry(obj.id, { [k]: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs bg-[#1a0e2e] border-purple-500/30 text-purple-100"
                        />
                      </div>
                    ))}
                </Section>
              </TabsContent>
            )}

            {obj.kind === "mesh" && (
              <TabsContent value="mod" className="p-0">
                <Section title="Modifiers">
                  <Select onValueChange={(v) => addModifier(obj.id, v as ModifierKind)}>
                    <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs">
                      <SelectValue placeholder="+ Add Modifier" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
                      {MODIFIER_KINDS.map((m) => (
                        <SelectItem key={m.kind} value={m.kind} className="text-purple-100">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Section>
                {(obj.modifiers || []).map((m, i) => (
                  <Section key={m.id} title={`${i + 1}. ${m.label || m.name}`} defaultOpen={false}>
                    <div className="flex items-center gap-1 mb-2">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-purple-200 hover:bg-purple-500/20" onClick={() => moveModifier(obj.id, m.id, "up")}>
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-purple-200 hover:bg-purple-500/20" onClick={() => moveModifier(obj.id, m.id, "down")}>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Switch checked={m.enabled} onCheckedChange={(v) => updateModifier(obj.id, m.id, { enabled: v })} />
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-auto text-red-300 hover:bg-red-500/20" onClick={() => removeModifier(obj.id, m.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {Object.entries(m.params).map(([k, v]) => (
                      <div key={k}>
                        <Label className="text-[10px] uppercase text-purple-400">{k}</Label>
                        {typeof v === "number" ? (
                          <Input
                            type="number"
                            step={0.05}
                            value={v}
                            onChange={(e) => updateModifier(obj.id, m.id, { params: { ...m.params, [k]: parseFloat(e.target.value) || 0 } })}
                            className="h-7 text-xs bg-[#1a0e2e] border-purple-500/30 text-purple-100"
                          />
                        ) : typeof v === "boolean" ? (
                          <Switch checked={v} onCheckedChange={(val) => updateModifier(obj.id, m.id, { params: { ...m.params, [k]: val } })} />
                        ) : (
                          <Input
                            value={String(v)}
                            onChange={(e) => updateModifier(obj.id, m.id, { params: { ...m.params, [k]: e.target.value } })}
                            className="h-7 text-xs bg-[#1a0e2e] border-purple-500/30 text-purple-100"
                          />
                        )}
                      </div>
                    ))}
                  </Section>
                ))}
                {(obj.modifiers || []).length === 0 && (
                  <div className="p-6 text-center text-xs text-purple-400/60">No modifiers. Add one above.</div>
                )}
              </TabsContent>
            )}

            {obj.kind === "mesh" && obj.materialId && materials[obj.materialId] && (
              <TabsContent value="mat" className="p-0">
                <MaterialEditor materialId={obj.materialId} />
              </TabsContent>
            )}

            {obj.kind === "mesh" && !obj.materialId && (
              <TabsContent value="mat" className="p-0">
                <div className="p-6 text-center text-xs text-purple-400/60">No material assigned</div>
              </TabsContent>
            )}

            {obj.kind === "light" && obj.light && (
              <TabsContent value="light" className="p-0">
                <Section title="Light">
                  <div>
                    <Label className="text-[10px] uppercase text-purple-400">Type</Label>
                    <Select value={obj.light.kind} onValueChange={(v) => updateLight(obj.id, { kind: v as any })}>
                      <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
                        <SelectItem value="point" className="text-purple-100">Point</SelectItem>
                        <SelectItem value="directional" className="text-purple-100">Directional</SelectItem>
                        <SelectItem value="spot" className="text-purple-100">Spot</SelectItem>
                        <SelectItem value="hemisphere" className="text-purple-100">Hemisphere</SelectItem>
                        <SelectItem value="area" className="text-purple-100">Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <SliderRow label="Intensity" value={obj.light.intensity} min={0} max={50} step={0.1} onChange={(v) => updateLight(obj.id, { intensity: v })} />
                  <div>
                    <Label className="text-[10px] uppercase text-purple-400">Color</Label>
                    <input
                      type="color"
                      value={`#${obj.light.color.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`}
                      onChange={(e) => {
                        const hex = e.target.value;
                        updateLight(obj.id, {
                          color: [
                            parseInt(hex.slice(1, 3), 16) / 255,
                            parseInt(hex.slice(3, 5), 16) / 255,
                            parseInt(hex.slice(5, 7), 16) / 255,
                          ] as any,
                        });
                      }}
                      className="w-full h-8 bg-[#1a0e2e] border border-purple-500/30 rounded"
                    />
                  </div>
                  {obj.light.kind === "spot" && (
                    <>
                      <SliderRow label="Angle (deg)" value={rad2deg(obj.light.angle ?? Math.PI / 6)} min={1} max={90} step={1} onChange={(v) => updateLight(obj.id, { angle: deg2rad(v) })} fmt={(v) => `${v.toFixed(0)}°`} />
                      <SliderRow label="Penumbra" value={obj.light.penumbra ?? 0} min={0} max={1} step={0.05} onChange={(v) => updateLight(obj.id, { penumbra: v })} />
                    </>
                  )}
                  {obj.light.kind === "point" && (
                    <SliderRow label="Distance" value={obj.light.distance ?? 0} min={0} max={200} step={1} onChange={(v) => updateLight(obj.id, { distance: v })} />
                  )}
                  <SliderRow label="Decay" value={obj.light.decay ?? 2} min={0} max={4} step={0.1} onChange={(v) => updateLight(obj.id, { decay: v })} />
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase text-purple-400">Cast Shadow</Label>
                    <Switch checked={obj.light.castShadow} onCheckedChange={(v) => updateLight(obj.id, { castShadow: v })} />
                  </div>
                </Section>
              </TabsContent>
            )}

            {obj.kind === "camera" && obj.camera && (
              <TabsContent value="cam" className="p-0">
                <Section title="Camera">
                  <div>
                    <Label className="text-[10px] uppercase text-purple-400">Type</Label>
                    <Select value={obj.camera.kind} onValueChange={(v) => updateCamera(obj.id, { kind: v as any })}>
                      <SelectTrigger className="bg-[#1a0e2e] border-purple-500/30 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a0e2e] border-purple-500/40">
                        <SelectItem value="perspective" className="text-purple-100">Perspective</SelectItem>
                        <SelectItem value="ortho" className="text-purple-100">Orthographic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {obj.camera.kind === "perspective" && (
                    <SliderRow label="FOV" value={obj.camera.fov ?? 50} min={10} max={170} step={1} onChange={(v) => updateCamera(obj.id, { fov: v })} fmt={(v) => `${v.toFixed(0)}°`} />
                  )}
                  <SliderRow label="Near" value={obj.camera.near ?? 0.1} min={0.01} max={5} step={0.01} onChange={(v) => updateCamera(obj.id, { near: v })} />
                  <SliderRow label="Far" value={obj.camera.far ?? 1000} min={50} max={5000} step={10} onChange={(v) => updateCamera(obj.id, { far: v })} />
                </Section>
              </TabsContent>
            )}
          </Tabs>
        )}
      </ScrollArea>
    </div>
  );
}

export { Plus };
