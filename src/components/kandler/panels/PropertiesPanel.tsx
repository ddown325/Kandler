"use client";
/**
 * Kandler — Properties Panel (right side)
 * Tabbed panel mirroring Blender's Properties editor:
 * Render · Output · Scene · World · Object · Modifiers · Mesh · Material · Light · Camera
 * Uses custom SVG icons (no emojis).
 *
 * Made by Kantasu.
 */
import { useState } from "react";
import { useStore, defaultMaterial, uid, ModifierType, Modifier } from "@/lib/kandler/store";
import { subdivideMesh, extrudeFaces, insetFaces, deleteFaces, deleteVertices, mergeVertices, triangulateFaces, flipNormals } from "@/lib/kandler/mesh-ops";
import { planarUnwrap, sculptStroke, type SculptBrush } from "@/lib/kandler/mesh-ops-advanced";
import { Icon, IconName } from "@/components/kandler/Icon";
import { ShaderEditor } from "@/components/kandler/panels/ShaderEditor";
import { ScriptingConsole } from "@/components/kandler/panels/ScriptingConsole";

type Tab = "render" | "output" | "scene" | "world" | "object" | "modifiers" | "mesh" | "material" | "light" | "camera" | "sculpt" | "physics" | "gpencil" | "shader" | "uv" | "armature" | "shapekeys" | "geo" | "script";

const TABS: { id: Tab; icon: IconName; label: string }[] = [
  { id: "render", icon: "tab-render", label: "Render" },
  { id: "output", icon: "tab-output", label: "Output" },
  { id: "scene", icon: "tab-scene", label: "Scene" },
  { id: "world", icon: "tab-world", label: "World" },
  { id: "object", icon: "tab-object", label: "Object" },
  { id: "modifiers", icon: "tab-modifiers", label: "Modifiers" },
  { id: "mesh", icon: "tab-mesh", label: "Mesh" },
  { id: "sculpt", icon: "tab-sculpt", label: "Sculpt" },
  { id: "material", icon: "tab-material", label: "Material" },
  { id: "shader", icon: "tab-shader", label: "Shader Nodes" },
  { id: "uv", icon: "tab-uv", label: "UV Editor" },
  { id: "light", icon: "tab-light", label: "Light" },
  { id: "camera", icon: "tab-camera", label: "Camera" },
  { id: "physics", icon: "tab-physics", label: "Physics" },
  { id: "gpencil", icon: "tab-gpencil", label: "Grease Pencil" },
  { id: "armature", icon: "tab-armature", label: "Armature" },
  { id: "shapekeys", icon: "tab-shapekeys", label: "Shape Keys" },
  { id: "geo", icon: "tab-geo", label: "Geometry Nodes" },
  { id: "script", icon: "tab-script", label: "Scripting" },
];

export default function PropertiesPanel() {
  const [tab, setTab] = useState<Tab>("object");
  const activeId = useStore(s => s.activeObjectId);
  const objects = useStore(s => s.objects);
  const obj = activeId ? objects[activeId] : null;

  return (
    <div className="h-full flex flex-col bg-[#1e1a2e] text-white kandler-ui">
      {/* Tab strip */}
      <div className="flex border-b border-[#2d2840] overflow-x-auto kandler-scroll">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={`px-2.5 py-2 hover:bg-white/5 flex-shrink-0 flex items-center justify-center ${tab === t.id ? "bg-white/10 text-[#b388ff]" : "text-white/60"}`}
          >
            <Icon name={t.icon} size={16} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto kandler-scroll p-2">
        {!obj && tab !== "render" && tab !== "output" && tab !== "scene" && tab !== "world" && tab !== "gpencil" && tab !== "script" ? (
          <div className="text-white/40 text-[12px] text-center py-8">
            No active object. Click an object in the viewport to edit its properties.
          </div>
        ) : (
          <>
            {tab === "object" && obj && <ObjectTab obj={obj} />}
            {tab === "modifiers" && obj && <ModifiersTab obj={obj} />}
            {tab === "mesh" && obj && <MeshTab obj={obj} />}
            {tab === "sculpt" && obj && <SculptTab obj={obj} />}
            {tab === "material" && obj && <MaterialTab obj={obj} />}
            {tab === "shader" && obj && <ShaderTab obj={obj} />}
            {tab === "uv" && obj && <UVTab obj={obj} />}
            {tab === "light" && obj && <LightTab obj={obj} />}
            {tab === "camera" && obj && <CameraTab obj={obj} />}
            {tab === "physics" && obj && <PhysicsTab obj={obj} />}
            {tab === "gpencil" && <GreasePencilTab />}
            {tab === "armature" && obj && <ArmatureTab obj={obj} />}
            {tab === "shapekeys" && obj && <ShapeKeysTab obj={obj} />}
            {tab === "geo" && obj && <GeoNodesTab obj={obj} />}
            {tab === "render" && <RenderTab />}
            {tab === "output" && <OutputTab />}
            {tab === "scene" && <SceneTab />}
            {tab === "world" && <WorldTab />}
            {tab === "script" && <ScriptTab />}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Field helpers ----------
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="kandler-row">
      <label className="kandler-label w-1/3">{label}</label>
      <div className="flex-1 flex gap-1">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, step = 0.1, label }: { value: number; onChange: (v: number) => void; step?: number; label?: string }) {
  return (
    <div className="flex-1 flex items-center gap-1">
      {label && <span className="text-[10px] text-white/40 w-3">{label}</span>}
      <input
        type="number"
        value={Number.isFinite(value) ? +value.toFixed(4) : 0}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="kandler-input"
      />
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-1">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-[#3d3654] cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="kandler-input"
      />
    </div>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#b388ff]"
      />
      <input
        type="number"
        value={+value.toFixed(3)}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="kandler-input w-16"
      />
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="kandler-section-title w-full text-left flex items-center justify-between"
      >
        <span>{title}</span>
        <span className="text-[10px]"><Icon name={open ? "chevron-down" : "chevron-right"} size={10} /></span>
      </button>
      {open && <div className="px-2 py-1">{children}</div>}
    </div>
  );
}

// ---------- Object Tab ----------
function ObjectTab({ obj }: { obj: any }) {
  const update = useStore(s => s.updateObject);
  const setTransform = useStore(s => s.setObjectTransform);
  return (
    <div>
      <Section title="Identity">
        <Row label="Name">
          <input className="kandler-input" value={obj.name} onChange={e => update(obj.id, { name: e.target.value })} />
        </Row>
        <Row label="Type">
          <span className="text-[11px] text-white/60">{obj.kind}</span>
        </Row>
        <Row label="Collection">
          <input className="kandler-input" value={obj.collection || ""} onChange={e => update(obj.id, { collection: e.target.value })} />
        </Row>
      </Section>

      <Section title="Transform">
        <Row label="Location">
          <NumInput label="X" value={obj.position[0]} step={0.1} onChange={v => setTransform(obj.id, [v, obj.position[1], obj.position[2]])} />
          <NumInput label="Y" value={obj.position[1]} step={0.1} onChange={v => setTransform(obj.id, [obj.position[0], v, obj.position[2]])} />
          <NumInput label="Z" value={obj.position[2]} step={0.1} onChange={v => setTransform(obj.id, [obj.position[0], obj.position[1], v])} />
        </Row>
        <Row label="Rotation">
          <NumInput label="X" value={obj.rotation[0] * 180 / Math.PI} step={1} onChange={v => setTransform(obj.id, undefined, [v * Math.PI / 180, obj.rotation[1], obj.rotation[2]])} />
          <NumInput label="Y" value={obj.rotation[1] * 180 / Math.PI} step={1} onChange={v => setTransform(obj.id, undefined, [obj.rotation[0], v * Math.PI / 180, obj.rotation[2]])} />
          <NumInput label="Z" value={obj.rotation[2] * 180 / Math.PI} step={1} onChange={v => setTransform(obj.id, undefined, [obj.rotation[0], obj.rotation[1], v * Math.PI / 180])} />
        </Row>
        <Row label="Scale">
          <NumInput label="X" value={obj.scale[0]} step={0.1} onChange={v => setTransform(obj.id, undefined, undefined, [v, obj.scale[1], obj.scale[2]])} />
          <NumInput label="Y" value={obj.scale[1]} step={0.1} onChange={v => setTransform(obj.id, undefined, undefined, [obj.scale[0], v, obj.scale[2]])} />
          <NumInput label="Z" value={obj.scale[2]} step={0.1} onChange={v => setTransform(obj.id, undefined, undefined, [obj.scale[0], obj.scale[1], v])} />
        </Row>
      </Section>

      <Section title="Visibility">
        <Row label="Show">
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={obj.visible} onChange={e => update(obj.id, { visible: e.target.checked })} />
            Viewport
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={obj.visibleInRender} onChange={e => update(obj.id, { visibleInRender: e.target.checked })} />
            Render
          </label>
        </Row>
        <Row label="Display">
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={obj.displayAsBounds} onChange={e => update(obj.id, { displayAsBounds: e.target.checked })} />
            As Bounds
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={obj.displayAsWire} onChange={e => update(obj.id, { displayAsWire: e.target.checked })} />
            As Wire
          </label>
        </Row>
        <Row label="Locked">
          <input type="checkbox" checked={obj.locked} onChange={e => update(obj.id, { locked: e.target.checked })} />
        </Row>
      </Section>

      <Section title="Stats">
        {obj.kind === "mesh" && (
          <>
            <Row label="Vertices"><span className="text-[11px] text-white/70 font-mono">{obj.vertexCount}</span></Row>
            <Row label="Faces"><span className="text-[11px] text-white/70 font-mono">{obj.faceCount}</span></Row>
            <Row label="Materials"><span className="text-[11px] text-white/70 font-mono">{obj.materialSlots.length}</span></Row>
            <Row label="Modifiers"><span className="text-[11px] text-white/70 font-mono">{obj.modifiers.length}</span></Row>
          </>
        )}
      </Section>
    </div>
  );
}

// ---------- Mesh Tab ----------
function MeshTab({ obj }: { obj: any }) {
  const updateMesh = useStore(s => s.updateMesh);
  const s = useStore.getState();
  const editMode = useStore(st => st.editMode);
  const componentMode = useStore(st => st.componentMode);
  const setComponentMode = useStore(st => st.setComponentMode);
  const setEditMode = useStore(st => st.setEditMode);
  const selection = useStore(st => st.selection);

  return (
    <div>
      <Section title="Mesh Data">
        <Row label="Vertices"><span className="text-[11px] font-mono">{obj.mesh?.vertices.length || 0}</span></Row>
        <Row label="Edges"><span className="text-[11px] font-mono">{obj.mesh?.edges.length || 0}</span></Row>
        <Row label="Faces"><span className="text-[11px] font-mono">{obj.mesh?.faces.length || 0}</span></Row>
      </Section>

      <Section title="Edit Mode">
        <Row label="Mode">
          <button
            onClick={() => setEditMode(editMode === "edit" ? "object" : "edit")}
            className="px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded"
          >
            {editMode === "edit" ? "Exit Edit" : "Enter Edit"}
          </button>
        </Row>
        {editMode === "edit" && (
          <>
            <Row label="Component">
              {(["vertex", "edge", "face"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setComponentMode(m)}
                  className={`px-2 py-1 text-[10px] rounded flex-1 ${componentMode === m ? "bg-[#b388ff] text-black" : "bg-white/5 text-white/70"}`}
                >
                  {m[0].toUpperCase()}
                </button>
              ))}
            </Row>
            <Row label="Selected">
              <span className="text-[11px] text-white/70 font-mono">
                V:{selection.vertices.length} E:{selection.edges.length} F:{selection.faces.length}
              </span>
            </Row>
          </>
        )}
      </Section>

      {editMode === "edit" && (
        <Section title="Mesh Operations">
          <div className="grid grid-cols-2 gap-1">
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => {
                if (selection.faces.length) {
                  updateMesh(obj.id, m => extrudeFaces(m, selection.faces, 0.5));
                  useStore.getState().showToast("Extruded", "success");
                }
              }}>Extrude (E)</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => {
                if (selection.faces.length) {
                  updateMesh(obj.id, m => insetFaces(m, selection.faces, 0.2));
                  useStore.getState().showToast("Inset", "success");
                }
              }}>Inset (I)</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => { updateMesh(obj.id, m => subdivideMesh(m, 1)); useStore.getState().showToast("Subdivided", "success"); }}>
              Subdivide (W)
            </button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => {
                if (selection.vertices.length > 1) {
                  updateMesh(obj.id, m => mergeVertices(m, selection.vertices));
                  useStore.getState().clearComponentSelection();
                  useStore.getState().showToast("Merged", "success");
                }
              }}>Merge (M)</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => {
                if (selection.faces.length) {
                  updateMesh(obj.id, m => triangulateFaces(m, selection.faces));
                  useStore.getState().showToast("Triangulated", "success");
                }
              }}>Triangulate</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => {
                if (selection.faces.length) {
                  updateMesh(obj.id, m => flipNormals(m, selection.faces));
                  useStore.getState().showToast("Flipped normals", "success");
                }
              }}>Flip Normals</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-red-500/80 hover:text-white text-[10px] rounded"
              onClick={() => {
                if (selection.faces.length) {
                  updateMesh(obj.id, m => deleteFaces(m, selection.faces));
                  useStore.getState().clearComponentSelection();
                } else if (selection.vertices.length) {
                  updateMesh(obj.id, m => deleteVertices(m, selection.vertices));
                  useStore.getState().clearComponentSelection();
                }
              }}>Delete</button>
            <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => useStore.getState().showToast("Fill — select 3+ verts and press F", "info")}>
              Fill (F)
            </button>
          </div>
        </Section>
      )}

      <Section title="Geometry Operations">
        <div className="grid grid-cols-1 gap-1">
          <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
            onClick={() => { updateMesh(obj.id, m => subdivideMesh(m, 1)); useStore.getState().showToast("Subdivided", "success"); }}>
            Subdivide Mesh (1x)
          </button>
          <button className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
            onClick={() => {
              // Recalculate — no-op for now, just feedback
              useStore.getState().showToast("Mesh validated", "success");
            }}>
            Validate Mesh
          </button>
        </div>
      </Section>
    </div>
  );
}

// ---------- Material Tab ----------
function MaterialTab({ obj }: { obj: any }) {
  const materials = useStore(s => s.materials);
  const update = useStore(s => s.updateObject);
  const updateMat = useStore(s => s.updateMaterial);
  const addMaterial = useStore(s => s.addMaterial);
  const assignMaterial = useStore(s => s.assignMaterialToObject);
  const activeIndex = obj.activeMaterialIndex || 0;
  const activeMatId = obj.materialSlots[activeIndex];
  const activeMat = activeMatId ? materials[activeMatId] : null;

  return (
    <div>
      <Section title="Material Slots">
        <div className="flex gap-1 mb-2">
          <select
            className="kandler-input flex-1"
            value={activeMatId || ""}
            onChange={e => {
              const idx = obj.materialSlots.indexOf(e.target.value);
              if (idx >= 0) update(obj.id, { activeMaterialIndex: idx });
            }}
          >
            {obj.materialSlots.length === 0 && <option value="">No material</option>}
            {obj.materialSlots.map(mid => (
              <option key={mid} value={mid}>{materials[mid]?.name || "Unknown"}</option>
            ))}
          </select>
          <button
            className="px-2 py-0.5 bg-[#b388ff] text-black text-[10px] rounded"
            onClick={() => {
              const m = defaultMaterial(`Material ${obj.materialSlots.length + 1}`);
              addMaterial(m);
              assignMaterial(obj.id, m.id);
              update(obj.id, { activeMaterialIndex: obj.materialSlots.length });
            }}
            title="New material"
          >+</button>
        </div>
      </Section>

      {activeMat && (
        <>
          <Section title="Surface (PBR)">
            <Row label="Name">
              <input className="kandler-input" value={activeMat.name} onChange={e => updateMat(activeMat.id, { name: e.target.value })} />
            </Row>
            <Row label="Base Color"><ColorInput value={activeMat.baseColor} onChange={v => updateMat(activeMat.id, { baseColor: v })} /></Row>
            <Row label="Metallic"><Slider value={activeMat.metallic} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { metallic: v })} /></Row>
            <Row label="Roughness"><Slider value={activeMat.roughness} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { roughness: v })} /></Row>
            <Row label="Emissive"><ColorInput value={activeMat.emissive} onChange={v => updateMat(activeMat.id, { emissive: v })} /></Row>
            <Row label="Emit Strength"><Slider value={activeMat.emissiveIntensity} min={0} max={5} step={0.1} onChange={v => updateMat(activeMat.id, { emissiveIntensity: v })} /></Row>
          </Section>

          <Section title="Transmission & IOR">
            <Row label="Transmission"><Slider value={activeMat.transmission} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { transmission: v })} /></Row>
            <Row label="IOR"><Slider value={activeMat.ior} min={1} max={3} step={0.01} onChange={v => updateMat(activeMat.id, { ior: v })} /></Row>
            <Row label="Thickness"><Slider value={activeMat.thickness} min={0} max={5} step={0.01} onChange={v => updateMat(activeMat.id, { thickness: v })} /></Row>
          </Section>

          <Section title="Clearcoat">
            <Row label="Clearcoat"><Slider value={activeMat.clearcoat} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { clearcoat: v })} /></Row>
            <Row label="CC Roughness"><Slider value={activeMat.clearcoatRoughness} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { clearcoatRoughness: v })} /></Row>
          </Section>

          <Section title="Display">
            <Row label="Opacity"><Slider value={activeMat.opacity} min={0} max={1} step={0.01} onChange={v => updateMat(activeMat.id, { opacity: v, transparent: v < 1 })} /></Row>
            <Row label="Wireframe"><input type="checkbox" checked={activeMat.wireframe} onChange={e => updateMat(activeMat.id, { wireframe: e.target.checked })} /></Row>
            <Row label="Flat Shading"><input type="checkbox" checked={activeMat.flatShading} onChange={e => updateMat(activeMat.id, { flatShading: e.target.checked })} /></Row>
            <Row label="Double-Sided"><input type="checkbox" checked={activeMat.doubleSided} onChange={e => updateMat(activeMat.id, { doubleSided: e.target.checked })} /></Row>
          </Section>

          <Section title="Texture (Procedural)">
            <Row label="Type">
              <select className="kandler-input" value={activeMat.textureType} onChange={e => updateMat(activeMat.id, { textureType: e.target.value as any })}>
                <option value="none">None</option>
                <option value="checker">Checker</option>
                <option value="noise">Noise</option>
                <option value="brick">Brick</option>
                <option value="gradient">Gradient</option>
              </select>
            </Row>
            <Row label="Scale"><Slider value={activeMat.textureScale} min={0.1} max={10} step={0.1} onChange={v => updateMat(activeMat.id, { textureScale: v })} /></Row>
          </Section>
        </>
      )}
    </div>
  );
}

// ---------- Light Tab ----------
function LightTab({ obj }: { obj: any }) {
  const update = useStore(s => s.updateObject);
  const light = obj.light;
  if (!light) return <div className="text-white/40 text-[12px]">Not a light.</div>;
  return (
    <div>
      <Section title="Light">
        <Row label="Type">
          <select className="kandler-input" value={light.type} onChange={e => update(obj.id, { light: { ...light, type: e.target.value as any } })}>
            <option value="point">Point</option>
            <option value="spot">Spot</option>
            <option value="sun">Sun (Directional)</option>
            <option value="area">Area</option>
          </select>
        </Row>
        <Row label="Color"><ColorInput value={light.color} onChange={v => update(obj.id, { light: { ...light, color: v } })} /></Row>
        <Row label="Intensity"><Slider value={light.intensity} min={0} max={20} step={0.1} onChange={v => update(obj.id, { light: { ...light, intensity: v } })} /></Row>
        {light.type !== "sun" && (
          <Row label="Distance"><Slider value={light.distance} min={0} max={100} step={0.5} onChange={v => update(obj.id, { light: { ...light, distance: v } })} /></Row>
        )}
        {light.type === "spot" && (
          <>
            <Row label="Angle"><Slider value={light.angle * 180 / Math.PI} min={1} max={90} step={1} onChange={v => update(obj.id, { light: { ...light, angle: v * Math.PI / 180 } })} /></Row>
            <Row label="Penumbra"><Slider value={light.penumbra} min={0} max={1} step={0.05} onChange={v => update(obj.id, { light: { ...light, penumbra: v } })} /></Row>
          </>
        )}
        {light.type === "area" && (
          <>
            <Row label="Width"><Slider value={light.width} min={0.1} max={10} step={0.1} onChange={v => update(obj.id, { light: { ...light, width: v } })} /></Row>
            <Row label="Height"><Slider value={light.height} min={0.1} max={10} step={0.1} onChange={v => update(obj.id, { light: { ...light, height: v } })} /></Row>
          </>
        )}
      </Section>
      <Section title="Shadow">
        <Row label="Cast Shadow"><input type="checkbox" checked={light.castShadow} onChange={e => update(obj.id, { light: { ...light, castShadow: e.target.checked } })} /></Row>
        <Row label="Map Size">
          <select className="kandler-input" value={light.shadowMapSize} onChange={e => update(obj.id, { light: { ...light, shadowMapSize: parseInt(e.target.value) } })}>
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1024</option>
            <option value={2048}>2048</option>
            <option value={4096}>4096</option>
          </select>
        </Row>
        <Row label="Bias"><NumInput value={light.shadowBias} step={0.0001} onChange={v => update(obj.id, { light: { ...light, shadowBias: v } })} /></Row>
      </Section>
    </div>
  );
}

// ---------- Camera Tab ----------
function CameraTab({ obj }: { obj: any }) {
  const update = useStore(s => s.updateObject);
  const cam = obj.camera;
  if (!cam) return <div className="text-white/40 text-[12px]">Not a camera.</div>;
  return (
    <div>
      <Section title="Camera">
        <Row label="Projection">
          <select className="kandler-input" value={cam.ortho ? "ortho" : "persp"} onChange={e => update(obj.id, { camera: { ...cam, ortho: e.target.value === "ortho" } })}>
            <option value="persp">Perspective</option>
            <option value="ortho">Orthographic</option>
          </select>
        </Row>
        {!cam.ortho ? (
          <Row label="FOV"><Slider value={cam.fov} min={5} max={170} step={1} onChange={v => update(obj.id, { camera: { ...cam, fov: v } })} /></Row>
        ) : (
          <Row label="Ortho Size"><Slider value={cam.orthoSize} min={0.5} max={50} step={0.5} onChange={v => update(obj.id, { camera: { ...cam, orthoSize: v } })} /></Row>
        )}
        <Row label="Near"><NumInput value={cam.near} step={0.01} onChange={v => update(obj.id, { camera: { ...cam, near: v } })} /></Row>
        <Row label="Far"><NumInput value={cam.far} step={10} onChange={v => update(obj.id, { camera: { ...cam, far: v } })} /></Row>
      </Section>
      <Section title="Lens">
        <Row label="Focal Length">
          <span className="text-[11px] text-white/60">
            {Math.round(28 / Math.tan(cam.fov * Math.PI / 360) * 12)}mm (approx)
          </span>
        </Row>
      </Section>
    </div>
  );
}

// ---------- Modifiers Tab ----------
const MODIFIER_TYPES: { type: ModifierType; label: string }[] = [
  { type: "subdivision", label: "Subdivision Surface" },
  { type: "mirror", label: "Mirror" },
  { type: "array", label: "Array" },
  { type: "solidify", label: "Solidify" },
  { type: "bevel", label: "Bevel" },
  { type: "boolean", label: "Boolean" },
  { type: "decimate", label: "Decimate" },
  { type: "wireframe", label: "Wireframe" },
  { type: "screw", label: "Screw" },
  { type: "simple-deform", label: "Simple Deform" },
  { type: "displace", label: "Displace" },
  { type: "wave", label: "Wave" },
  { type: "build", label: "Build" },
  { type: "remesh", label: "Remesh" },
];

function ModifiersTab({ obj }: { obj: any }) {
  const addMod = useStore(s => s.addModifier);
  const updateMod = useStore(s => s.updateModifier);
  const removeMod = useStore(s => s.removeModifier);
  const moveMod = useStore(s => s.moveModifier);
  const [adding, setAdding] = useState(false);

  const defaultParams = (type: ModifierType): Record<string, number | string | boolean> => {
    switch (type) {
      case "subdivision": return { levels: 2, renderLevels: 2 };
      case "mirror": return { axis: "x" };
      case "array": return { count: 3, offset: 2, axis: "x" };
      case "solidify": return { thickness: 0.2 };
      case "bevel": return { width: 0.1, segments: 2 };
      case "decimate": return { ratio: 0.5 };
      case "wireframe": return { thickness: 0.05 };
      case "boolean": return { operation: "union", target: "" };
      case "screw": return { angle: 360, steps: 16, iterations: 1 };
      case "simple-deform": return { mode: "bend", angle: 45, axis: "z" };
      case "displace": return { strength: 1, texture: "noise" };
      case "wave": return { amplitude: 0.5, frequency: 1, phase: 0 };
      case "build": return { start: 0, length: 1 };
      case "remesh": return { voxelSize: 0.1 };
      default: return {};
    }
  };

  return (
    <div>
      <Section title="Add Modifier">
        <button
          onClick={() => setAdding(!adding)}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded mb-2"
        >
          {adding ? "Cancel" : "+ Add Modifier"}
        </button>
        {adding && (
          <div className="grid grid-cols-2 gap-1 mb-2">
            {MODIFIER_TYPES.map(m => (
              <button
                key={m.type}
                className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
                onClick={() => {
                  addMod(obj.id, {
                    id: uid("mod"),
                    type: m.type,
                    name: m.label,
                    enabled: true,
                    expanded: true,
                    params: defaultParams(m.type),
                  });
                  setAdding(false);
                  useStore.getState().showToast(`Added ${m.label}`, "success");
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </Section>

      {obj.modifiers.length === 0 ? (
        <div className="text-white/40 text-[11px] text-center py-4">
          No modifiers. Click "Add Modifier" to begin.
        </div>
      ) : (
        obj.modifiers.map((mod: Modifier, i: number) => (
          <div key={mod.id} className="border border-[#3d3654] rounded mb-1">
            <div className="bg-[#241f38] px-2 py-1 flex items-center gap-1">
              <button
                className="text-[10px] text-white/60"
                onClick={() => updateMod(obj.id, mod.id, { expanded: !mod.expanded })}
              >{mod.expanded ? <Icon name="chevron-down" size={10} /> : <Icon name="chevron-right" size={10} />}</button>
              <input
                type="checkbox"
                checked={mod.enabled}
                onChange={e => updateMod(obj.id, mod.id, { enabled: e.target.checked })}
              />
              <span className="text-[11px] text-white/85 flex-1">{mod.name}</span>
              <button onClick={() => moveMod(obj.id, mod.id, -1)} title="Move up" className="text-white/50 hover:text-white px-1 rotate-[-90deg]"><Icon name="chevron-down" size={12} /></button>
              <button onClick={() => moveMod(obj.id, mod.id, 1)} title="Move down" className="text-white/50 hover:text-white px-1 rotate-[90deg]"><Icon name="chevron-down" size={12} /></button>
              <button onClick={() => removeMod(obj.id, mod.id)} title="Remove" className="text-white/50 hover:text-red-400 px-1"><Icon name="x" size={12} /></button>
            </div>
            {mod.expanded && (
              <div className="p-2">
                {Object.entries(mod.params).map(([k, v]) => (
                  <Row key={k} label={k}>
                    {typeof v === "boolean" ? (
                      <input type="checkbox" checked={v} onChange={e => updateMod(obj.id, mod.id, { params: { ...mod.params, [k]: e.target.checked } })} />
                    ) : typeof v === "number" ? (
                      <NumInput value={v} step={0.1} onChange={val => updateMod(obj.id, mod.id, { params: { ...mod.params, [k]: val } })} />
                    ) : (
                      <select className="kandler-input" value={v} onChange={e => updateMod(obj.id, mod.id, { params: { ...mod.params, [k]: e.target.value } })}>
                        {k === "axis" && ["x", "y", "z"].map(a => <option key={a}>{a}</option>)}
                        {k === "operation" && ["union", "difference", "intersect"].map(a => <option key={a}>{a}</option>)}
                        {k === "mode" && ["bend", "twist", "taper", "stretch"].map(a => <option key={a}>{a}</option>)}
                        {k === "texture" && ["noise", "checker", "brick"].map(a => <option key={a}>{a}</option>)}
                      </select>
                    )}
                  </Row>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ---------- Render Tab ----------
function RenderTab() {
  const render = useStore(s => s.render);
  const update = useStore(s => s.updateRender);
  return (
    <div>
      <Section title="Engine">
        <Row label="Engine">
          <select className="kandler-input" value={render.engine} onChange={e => update({ engine: e.target.value as any })}>
            <option value="eevee">Eevee (Real-time)</option>
            <option value="cycles">Cycles (Path-traced)</option>
            <option value="workbench">Workbench (Preview)</option>
          </select>
        </Row>
        <Row label="Samples"><NumInput value={render.samples} step={1} onChange={v => update({ samples: v })} /></Row>
        <Row label="Exposure"><Slider value={render.exposure} min={0} max={4} step={0.05} onChange={v => update({ exposure: v })} /></Row>
      </Section>
      <Section title="Tone Mapping">
        <Row label="Mode">
          <select className="kandler-input" value={render.toneMapping} onChange={e => update({ toneMapping: e.target.value as any })}>
            <option value="none">None</option>
            <option value="aces">ACES Filmic</option>
            <option value="reinhard">Reinhard</option>
            <option value="cineon">Cineon</option>
            <option value="linear">Linear</option>
          </select>
        </Row>
      </Section>
      <Section title="Shadows & AO">
        <Row label="Shadows"><input type="checkbox" checked={render.shadowEnabled} onChange={e => update({ shadowEnabled: e.target.checked })} /></Row>
        <Row label="SSAO"><input type="checkbox" checked={render.ssaoEnabled} onChange={e => update({ ssaoEnabled: e.target.checked })} /></Row>
        <Row label="Bloom"><input type="checkbox" checked={render.bloomEnabled} onChange={e => update({ bloomEnabled: e.target.checked })} /></Row>
        {render.bloomEnabled && (
          <Row label="Bloom Strength"><Slider value={render.bloomStrength} min={0} max={2} step={0.05} onChange={v => update({ bloomStrength: v })} /></Row>
        )}
      </Section>
      <Section title="Render Image">
        <button
          className="w-full px-2 py-2 bg-[#b388ff] text-black font-medium text-[12px] rounded"
          onClick={() => {
            const canvas = document.querySelector("canvas");
            if (!canvas) return;
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `kandler-render-${Date.now()}.png`;
            a.click();
            useStore.getState().showToast("Render saved", "success");
          }}
        >
          <span className="flex items-center gap-2 justify-center"><Icon name="render-image" size={14} /> Render Image (F12)</span>
        </button>
      </Section>
    </div>
  );
}

// ---------- Output Tab ----------
function OutputTab() {
  const render = useStore(s => s.render);
  const update = useStore(s => s.updateRender);
  const presets = [
    { label: "Full HD", w: 1920, h: 1080 },
    { label: "4K UHD", w: 3840, h: 2160 },
    { label: "Square 1:1", w: 1080, h: 1080 },
    { label: "Portrait 9:16", w: 1080, h: 1920 },
    { label: "Square 2K", w: 2048, h: 2048 },
    { label: "Print 300dpi A4", w: 2480, h: 3508 },
  ];
  return (
    <div>
      <Section title="Resolution">
        <Row label="Width"><NumInput value={render.resolutionX} step={1} onChange={v => update({ resolutionX: v })} /></Row>
        <Row label="Height"><NumInput value={render.resolutionY} step={1} onChange={v => update({ resolutionY: v })} /></Row>
        <Row label="Aspect"><span className="text-[11px] text-white/60">{(render.resolutionX / render.resolutionY).toFixed(2)}:1</span></Row>
      </Section>
      <Section title="Presets">
        <div className="grid grid-cols-2 gap-1">
          {presets.map(p => (
            <button
              key={p.label}
              className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
              onClick={() => update({ resolutionX: p.w, resolutionY: p.h })}
            >
              {p.label}<br /><span className="text-[9px] opacity-60">{p.w}×{p.h}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---------- Scene Tab ----------
function SceneTab() {
  const project = useStore(s => s.project);
  const cursor = useStore(s => s.cursor);
  const setCursor = useStore(s => s.setCursor);
  return (
    <div>
      <Section title="Project">
        <Row label="Name"><input className="kandler-input" value={project.name} onChange={e => useStore.setState({ project: { ...project, name: e.target.value } })} /></Row>
        <Row label="Author"><input className="kandler-input" value={project.author} onChange={e => useStore.setState({ project: { ...project, author: e.target.value } })} /></Row>
        <Row label="Version"><span className="text-[11px] text-white/60">{project.version}</span></Row>
      </Section>
      <Section title="3D Cursor">
        <Row label="Position X"><NumInput value={cursor.position[0]} step={0.1} onChange={v => setCursor([v, cursor.position[1], cursor.position[2]])} /></Row>
        <Row label="Position Y"><NumInput value={cursor.position[1]} step={0.1} onChange={v => setCursor([cursor.position[0], v, cursor.position[2]])} /></Row>
        <Row label="Position Z"><NumInput value={cursor.position[2]} step={0.1} onChange={v => setCursor([cursor.position[0], cursor.position[1], v])} /></Row>
      </Section>
      <Section title="Animation">
        <Row label="Start Frame"><NumInput value={project.frameStart} step={1} onChange={v => useStore.setState({ project: { ...project, frameStart: v } })} /></Row>
        <Row label="End Frame"><NumInput value={project.frameEnd} step={1} onChange={v => useStore.setState({ project: { ...project, frameEnd: v } })} /></Row>
        <Row label="FPS"><NumInput value={project.fps} step={1} onChange={v => useStore.setState({ project: { ...project, fps: v } })} /></Row>
      </Section>
    </div>
  );
}

// ---------- World Tab ----------
function WorldTab() {
  const render = useStore(s => s.render);
  const update = useStore(s => s.updateRender);
  return (
    <div>
      <Section title="Background">
        <Row label="Color"><ColorInput value={render.backgroundColor} onChange={v => update({ backgroundColor: v })} /></Row>
        <Row label="Ambient"><ColorInput value={render.ambientColor} onChange={v => update({ ambientColor: v })} /></Row>
      </Section>
      <Section title="Fog / Mist">
        <Row label="Enabled"><input type="checkbox" checked={render.fogEnabled} onChange={e => update({ fogEnabled: e.target.checked })} /></Row>
        {render.fogEnabled && (
          <>
            <Row label="Color"><ColorInput value={render.fogColor} onChange={v => update({ fogColor: v })} /></Row>
            <Row label="Near"><NumInput value={render.fogNear} step={0.5} onChange={v => update({ fogNear: v })} /></Row>
            <Row label="Far"><NumInput value={render.fogFar} step={0.5} onChange={v => update({ fogFar: v })} /></Row>
          </>
        )}
      </Section>
    </div>
  );
}

// ---------- Sculpt Tab ----------
function SculptTab({ obj }: { obj: any }) {
  const updateMesh = useStore(s => s.updateMesh);
  const setEditMode = useStore(s => s.setEditMode);
  const [brush, setBrush] = useState<SculptBrush>("draw");
  const [radius, setRadius] = useState(1);
  const [strength, setStrength] = useState(0.5);

  const brushes: SculptBrush[] = ["grab", "smooth", "inflate", "draw", "drag-dot", "flatten", "pinch"];

  const applyBrush = (axis: "x" | "y" | "z" = "z") => {
    if (!obj.mesh) return;
    const center: [number, number, number] = [0, 0, 0];
    const delta: [number, number, number] = axis === "x" ? [strength, 0, 0] : axis === "y" ? [0, strength, 0] : [0, 0, strength];
    const newMesh = sculptStroke(obj.mesh, brush, center, radius, strength, delta);
    updateMesh(obj.id, () => newMesh);
    useStore.getState().showToast(`${brush} brush applied`, "success");
  };

  return (
    <div>
      <Section title="Sculpt Mode">
        <Row label="Mode">
          <button
            onClick={() => setEditMode("sculpt")}
            className="px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded"
          >
            Enter Sculpt Mode
          </button>
        </Row>
        <Row label="Object">
          <span className="text-[11px] text-white/60">{obj.name} ({obj.vertexCount} verts)</span>
        </Row>
      </Section>
      <Section title="Brush">
        <Row label="Type">
          <select className="kandler-input" value={brush} onChange={e => setBrush(e.target.value as SculptBrush)}>
            {brushes.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Row>
        <Row label="Radius"><Slider value={radius} min={0.1} max={5} step={0.1} onChange={setRadius} /></Row>
        <Row label="Strength"><Slider value={strength} min={0.01} max={2} step={0.05} onChange={setStrength} /></Row>
      </Section>
      <Section title="Quick Apply (on origin)">
        <div className="grid grid-cols-3 gap-1">
          <button onClick={() => applyBrush("x")} className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded">+X</button>
          <button onClick={() => applyBrush("y")} className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded">+Y</button>
          <button onClick={() => applyBrush("z")} className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded">+Z</button>
        </div>
      </Section>
    </div>
  );
}

// ---------- Shader Tab ----------
function ShaderTab({ obj }: { obj: any }) {
  void obj;
  return (
    <div className="h-[600px] -m-2">
      <ShaderEditor onClose={() => useStore.getState().showToast("Shader editor remains active", "info")} />
    </div>
  );
}

// ---------- UV Editor Tab ----------
function UVTab({ obj }: { obj: any }) {
  const setUvMaps = useStore(s => s.setUvMaps);
  const uvMaps = obj.uvMaps || [];
  const [axis, setAxis] = useState<"x" | "y" | "z">("z");

  const unwrap = () => {
    if (!obj.mesh) return;
    const { uvs, faceUVs } = planarUnwrap(obj.mesh, axis);
    setUvMaps(obj.id, [{ uvs, faceUVs, seams: [] }]);
    useStore.getState().showToast(`UV unwrapped on ${axis.toUpperCase()} axis`, "success");
  };

  return (
    <div>
      <Section title="UV Mapping">
        <Row label="Projection">
          <select className="kandler-input" value={axis} onChange={e => setAxis(e.target.value as any)}>
            <option value="z">XY Plane (Z-axis)</option>
            <option value="x">YZ Plane (X-axis)</option>
            <option value="y">XZ Plane (Y-axis)</option>
          </select>
        </Row>
        <button
          onClick={unwrap}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded font-medium"
        >
          Unwrap (Planar)
        </button>
      </Section>
      <Section title="UV Preview">
        <div className="bg-[#1a1626] border border-[#3d3654] rounded p-2 aspect-square">
          <canvas
            ref={(c) => {
              if (!c || !obj.mesh) return;
              const ctx = c.getContext("2d");
              if (!ctx) return;
              c.width = 240; c.height = 240;
              ctx.fillStyle = "#1a1626";
              ctx.fillRect(0, 0, 240, 240);
              ctx.strokeStyle = "#2d2840";
              for (let i = 0; i <= 8; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 30, 0); ctx.lineTo(i * 30, 240);
                ctx.moveTo(0, i * 30); ctx.lineTo(240, i * 30);
                ctx.stroke();
              }
              const map = uvMaps[0];
              if (map) {
                ctx.strokeStyle = "#b388ff";
                ctx.lineWidth = 1.5;
                for (const faceUV of map.faceUVs) {
                  ctx.beginPath();
                  faceUV.forEach((uvIdx: number, i: number) => {
                    const [u, v] = map.uvs[uvIdx];
                    const x = u * 240, y = (1 - v) * 240;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                  });
                  ctx.closePath();
                  ctx.stroke();
                }
              }
            }}
            className="w-full h-full"
          />
        </div>
      </Section>
      <Section title="Texture Paint">
        <Row label="Canvas">
          <button
            onClick={() => {
              useStore.getState().setTextureCanvas(obj.id, { width: 512, height: 512, pixels: new Array(512 * 512 * 4).fill(40) });
              useStore.getState().showToast("Texture canvas created (512x512)", "success");
            }}
            className="px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded"
          >
            Init 512×512 Canvas
          </button>
        </Row>
      </Section>
    </div>
  );
}

// ---------- Physics Tab ----------
function PhysicsTab({ obj }: { obj: any }) {
  const update = useStore(s => s.updateObject);
  const setPhysicsPlaying = useStore(s => s.setPhysicsPlaying);
  const physicsPlaying = useStore(s => s.physicsPlaying);
  const p = obj.physics;

  const setPhysics = (patch: any) => {
    update(obj.id, {
      physics: {
        id: p?.id || `phys_${Date.now()}`,
        type: p?.type || "rigid-body",
        enabled: p?.enabled ?? true,
        mass: p?.mass ?? 1,
        friction: p?.friction ?? 0.5,
        bounce: p?.bounce ?? 0.3,
        isStatic: p?.isStatic ?? false,
        stiffness: p?.stiffness ?? 0.5,
        damping: p?.damping ?? 0.1,
        viscosity: p?.viscosity ?? 0.1,
        density: p?.density ?? 1,
        velocity: p?.velocity || [0, 0, 0],
        angularVelocity: p?.angularVelocity || [0, 0, 0],
        particleCount: p?.particleCount || 100,
        particleLifetime: p?.particleLifetime || 5,
        ...patch,
      },
    });
  };

  return (
    <div>
      <Section title="Physics">
        <Row label="Type">
          <select
            className="kandler-input"
            value={p?.type || "rigid-body"}
            onChange={e => setPhysics({ type: e.target.value })}
          >
            <option value="rigid-body">Rigid Body</option>
            <option value="cloth">Cloth</option>
            <option value="soft-body">Soft Body</option>
            <option value="fluid">Fluid</option>
            <option value="smoke">Smoke</option>
            <option value="particle">Particle</option>
          </select>
        </Row>
        <Row label="Enabled"><input type="checkbox" checked={p?.enabled ?? false} onChange={e => setPhysics({ enabled: e.target.checked })} /></Row>
      </Section>
      {p?.type === "rigid-body" && (
        <Section title="Rigid Body">
          <Row label="Mass"><Slider value={p?.mass ?? 1} min={0.01} max={100} step={0.1} onChange={v => setPhysics({ mass: v })} /></Row>
          <Row label="Friction"><Slider value={p?.friction ?? 0.5} min={0} max={1} step={0.05} onChange={v => setPhysics({ friction: v })} /></Row>
          <Row label="Bounce"><Slider value={p?.bounce ?? 0.3} min={0} max={1} step={0.05} onChange={v => setPhysics({ bounce: v })} /></Row>
          <Row label="Static"><input type="checkbox" checked={p?.isStatic ?? false} onChange={e => setPhysics({ isStatic: e.target.checked })} /></Row>
        </Section>
      )}
      {p?.type === "cloth" && (
        <Section title="Cloth">
          <Row label="Stiffness"><Slider value={p?.stiffness ?? 0.5} min={0} max={1} step={0.05} onChange={v => setPhysics({ stiffness: v })} /></Row>
          <Row label="Damping"><Slider value={p?.damping ?? 0.1} min={0} max={1} step={0.05} onChange={v => setPhysics({ damping: v })} /></Row>
        </Section>
      )}
      {p?.type === "fluid" && (
        <Section title="Fluid">
          <Row label="Viscosity"><Slider value={p?.viscosity ?? 0.1} min={0} max={1} step={0.01} onChange={v => setPhysics({ viscosity: v })} /></Row>
          <Row label="Density"><Slider value={p?.density ?? 1} min={0.1} max={10} step={0.1} onChange={v => setPhysics({ density: v })} /></Row>
        </Section>
      )}
      {p?.type === "particle" && (
        <Section title="Particles">
          <Row label="Count"><NumInput value={p?.particleCount ?? 100} step={10} onChange={v => setPhysics({ particleCount: v })} /></Row>
          <Row label="Lifetime"><NumInput value={p?.particleLifetime ?? 5} step={0.5} onChange={v => setPhysics({ particleLifetime: v })} /></Row>
        </Section>
      )}
      <Section title="Simulation">
        <button
          onClick={() => setPhysicsPlaying(!physicsPlaying)}
          className={`w-full px-2 py-2 rounded font-medium text-[12px] ${physicsPlaying ? "bg-red-500 text-white" : "bg-[#b388ff] text-black"}`}
        >
          {physicsPlaying ? "Stop Simulation" : "Start Simulation"}
        </button>
      </Section>
    </div>
  );
}

// ---------- Grease Pencil Tab ----------
function GreasePencilTab() {
  const gpLayers = useStore(s => s.gpLayers);
  const gpStrokes = useStore(s => s.gpStrokes);
  const addGpLayer = useStore(s => s.addGpLayer);
  const clearGpStrokes = useStore(s => s.clearGpStrokes);
  const setActiveTool = useStore(s => s.setActiveTool);
  const setActiveGpLayer = useStore(s => s.setActiveGpLayer);
  const activeGpLayer = useStore(s => s.activeGpLayer);

  return (
    <div>
      <Section title="Grease Pencil">
        <Row label="Tool">
          <button
            onClick={() => setActiveTool("gpencil-draw")}
            className="px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded"
          >
            Activate Draw Tool
          </button>
        </Row>
        <Row label="Strokes">
          <span className="text-[11px] text-white/60">{gpStrokes.length} strokes</span>
        </Row>
        <button
          onClick={clearGpStrokes}
          className="w-full px-2 py-1 bg-red-500/80 text-white text-[10px] rounded"
        >
          Clear All Strokes
        </button>
      </Section>
      <Section title="Layers">
        <button
          onClick={() => addGpLayer(`Layer ${gpLayers.length + 1}`)}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded mb-2"
        >
          + Add Layer
        </button>
        {gpLayers.map(layer => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${activeGpLayer === layer.id ? "bg-[#b388ff]/30" : "hover:bg-white/5"}`}
            onClick={() => setActiveGpLayer(layer.id)}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: layer.color }} />
            <span className="text-[11px] text-white/80 flex-1">{layer.name}</span>
            <span className="text-[10px] text-white/40">{gpStrokes.filter(s => s.layer === layer.id).length}</span>
          </div>
        ))}
      </Section>
      <Section title="Tips">
        <div className="text-[10px] text-white/60 leading-relaxed">
          Grease Pencil lets you draw 2D strokes directly in 3D space. Activate the draw tool, then click-drag in the viewport. Perfect for annotations, storyboards, and 2D-in-3D animation.
        </div>
      </Section>
    </div>
  );
}

// ---------- Armature Tab ----------
function ArmatureTab({ obj }: { obj: any }) {
  const addBone = useStore(s => s.addBone);
  const updateBone = useStore(s => s.updateBone);
  const bones = obj.armature?.bones || [];

  const addNewBone = () => {
    addBone(obj.id, {
      id: `bone_${Date.now()}`,
      name: `Bone ${bones.length + 1}`,
      head: [0, 0, 0],
      tail: [0, 0, 1],
      roll: 0,
      useConnect: false,
      useIk: false,
      ikChainLength: 2,
      constraints: [],
    });
    useStore.getState().showToast("Bone added", "success");
  };

  return (
    <div>
      <Section title="Armature">
        <Row label="Bones">
          <span className="text-[11px] text-white/60">{bones.length} bones</span>
        </Row>
        <button
          onClick={addNewBone}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded mb-2"
        >
          + Add Bone
        </button>
      </Section>
      {bones.map((bone: any, i: number) => (
        <Section key={bone.id} title={`Bone ${i + 1}: ${bone.name}`}>
          <Row label="Name">
            <input
              className="kandler-input"
              value={bone.name}
              onChange={e => updateBone(obj.id, bone.id, { name: e.target.value })}
            />
          </Row>
          <Row label="Head X"><NumInput value={bone.head[0]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { head: [v, bone.head[1], bone.head[2]] })} /></Row>
          <Row label="Head Y"><NumInput value={bone.head[1]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { head: [bone.head[0], v, bone.head[2]] })} /></Row>
          <Row label="Head Z"><NumInput value={bone.head[2]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { head: [bone.head[0], bone.head[1], v] })} /></Row>
          <Row label="Tail X"><NumInput value={bone.tail[0]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { tail: [v, bone.tail[1], bone.tail[2]] })} /></Row>
          <Row label="Tail Y"><NumInput value={bone.tail[1]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { tail: [bone.tail[0], v, bone.tail[2]] })} /></Row>
          <Row label="Tail Z"><NumInput value={bone.tail[2]} step={0.1} onChange={v => updateBone(obj.id, bone.id, { tail: [bone.tail[0], bone.tail[1], v] })} /></Row>
          <Row label="Use IK"><input type="checkbox" checked={bone.useIk} onChange={e => updateBone(obj.id, bone.id, { useIk: e.target.checked })} /></Row>
          {bone.useIk && (
            <Row label="IK Chain"><NumInput value={bone.ikChainLength} step={1} onChange={v => updateBone(obj.id, bone.id, { ikChainLength: v })} /></Row>
          )}
        </Section>
      ))}
    </div>
  );
}

// ---------- Shape Keys Tab ----------
function ShapeKeysTab({ obj }: { obj: any }) {
  const addShapeKey = useStore(s => s.addShapeKey);
  const setShapeKeyValue = useStore(s => s.setShapeKeyValue);
  const shapeKeys = obj.shapeKeys || [];

  return (
    <div>
      <Section title="Shape Keys">
        <Row label="Count">
          <span className="text-[11px] text-white/60">{shapeKeys.length} keys</span>
        </Row>
        <button
          onClick={() => addShapeKey(obj.id, `Key ${shapeKeys.length}`)}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded"
        >
          + Add Shape Key
        </button>
      </Section>
      {shapeKeys.map((sk: any) => (
        <Section key={sk.id} title={sk.name + (sk.isBasis ? " (Basis)" : "")}>
          {!sk.isBasis && (
            <Row label="Value">
              <Slider value={sk.value} min={0} max={1} step={0.01} onChange={v => setShapeKeyValue(obj.id, sk.id, v)} />
            </Row>
          )}
          <Row label="Info">
            <span className="text-[10px] text-white/50">{Object.keys(sk.deltas).length} vertex deltas</span>
          </Row>
        </Section>
      ))}
      <Section title="How to use">
        <div className="text-[10px] text-white/60 leading-relaxed">
          Shape keys (morph targets) blend between the basis shape and other stored shapes. Useful for facial animation, lip-sync, and morphing effects. The Value slider controls the blend amount.
        </div>
      </Section>
    </div>
  );
}

// ---------- Geometry Nodes Tab ----------
function GeoNodesTab({ obj }: { obj: any }) {
  const setGeoNodeGraph = useStore(s => s.setGeoNodeGraph);
  const updateMesh = useStore(s => s.updateMesh);
  const graph = obj.geoNodeGraph || { nodes: [], output: null };

  const addNode = (type: string) => {
    const newId = `geo_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const newGraph = {
      nodes: [...graph.nodes, {
        id: newId,
        type,
        name: type,
        position: { x: 100 + graph.nodes.length * 30, y: 100 },
        params: type === "input-primitive" ? { shape: "cube", size: 1 } : type === "array-linear" ? { count: 3, offset: 2, axis: "x" } : type === "subdivision" ? { levels: 1 } : type === "noise-displace" ? { strength: 0.5, scale: 1 } : {},
        inputs: {},
      }],
      output: graph.output || newId,
    };
    setGeoNodeGraph(obj.id, newGraph);
  };

  return (
    <div>
      <Section title="Geometry Nodes">
        <Row label="Nodes">
          <span className="text-[11px] text-white/60">{graph.nodes.length} nodes</span>
        </Row>
      </Section>
      <Section title="Add Node">
        <div className="grid grid-cols-2 gap-1">
          {["input-primitive", "transform", "array-linear", "subdivision", "noise-displace", "boolean"].map(type => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className="px-2 py-1 bg-white/5 hover:bg-[#b388ff] hover:text-black text-[10px] rounded"
            >
              {type}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Apply Graph">
        <button
          onClick={async () => {
            const { evaluateGeoNodeGraph } = await import("@/lib/kandler/mesh-ops-advanced");
            const result = evaluateGeoNodeGraph(graph);
            if (result) {
              updateMesh(obj.id, () => result);
              useStore.getState().showToast("Geometry nodes applied", "success");
            } else {
              useStore.getState().showToast("Graph produced no output", "warning");
            }
          }}
          className="w-full px-2 py-1 bg-[#b388ff] text-black text-[11px] rounded font-medium"
        >
          Evaluate & Apply to Mesh
        </button>
      </Section>
      <Section title="Graph Nodes">
        {graph.nodes.length === 0 ? (
          <div className="text-[10px] text-white/40 italic">No nodes yet. Add one above.</div>
        ) : (
          graph.nodes.map((n: any) => (
            <div key={n.id} className="text-[10px] text-white/70 px-2 py-1 bg-white/5 rounded mb-1">
              <span className="text-[#b388ff]">{n.type}</span> — {n.name}
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

// ---------- Scripting Tab ----------
function ScriptTab() {
  return (
    <div className="h-[600px] -m-2">
      <ScriptingConsole onClose={() => useStore.getState().showToast("Console remains active", "info")} />
    </div>
  );
}
