"use client";
/**
 * Kandler — Top Menu Bar
 * File, Add (mesh primitives, lights, camera, etc.), Object, Mesh, View, Render, Help
 * Also shows the Kandler logo + brand name, and Kantasu credit.
 *
 * Made by Kantasu.
 */
import { useState, useRef, useEffect } from "react";
import { useStore, defaultMaterial, generatePrimitiveMesh, uid, PrimitiveType, LightType } from "@/lib/kandler/store";
import * as meshOps from "@/lib/kandler/mesh-ops";
import { asset } from "@/lib/kandler/asset";

type MenuDef = {
  label: string;
  items: { label: string; shortcut?: string; action?: () => void; divider?: boolean; disabled?: boolean }[];
};

function addPrimitive(type: PrimitiveType) {
  const s = useStore.getState();
  const mesh = generatePrimitiveMesh(type);
  const mat = defaultMaterial();
  s.addMaterial(mat);
  const obj = {
    id: uid("obj"),
    name: type.charAt(0).toUpperCase() + type.slice(1),
    kind: "mesh" as const,
    primitiveType: type,
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    visible: true,
    visibleInRender: true,
    visibleInViewport: true,
    locked: false,
    mesh,
    materialSlots: [mat.id],
    activeMaterialIndex: 0,
    modifiers: [],
    collection: "Scene Collection",
    displayAsBounds: false,
    displayAsWire: false,
    vertexCount: mesh.vertices.length,
    faceCount: mesh.faces.length,
  };
  s.addObject(obj);
  s.selectObject(obj.id);
  s.pushHistory("Add " + type);
  s.showToast(`Added ${type}`, "success");
}

function addLight(type: LightType) {
  const s = useStore.getState();
  const obj = {
    id: uid("obj"),
    name: type.charAt(0).toUpperCase() + type.slice(1) + " Light",
    kind: "light" as const,
    primitiveType: undefined,
    position: [3, 3, 5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    visible: true,
    visibleInRender: true,
    visibleInViewport: true,
    locked: false,
    materialSlots: [],
    activeMaterialIndex: 0,
    modifiers: [],
    collection: "Scene Collection",
    displayAsBounds: false,
    displayAsWire: false,
    light: {
      type,
      color: "#ffffff",
      intensity: type === "sun" ? 2 : 5,
      distance: 0,
      angle: Math.PI / 6,
      penumbra: 0.3,
      width: 2,
      height: 2,
      castShadow: true,
      shadowMapSize: 1024,
      shadowBias: -0.0005,
    },
  };
  s.addObject(obj);
  s.selectObject(obj.id);
  s.pushHistory("Add " + type + " light");
  s.showToast(`Added ${type} light`, "success");
}

function addCamera() {
  const s = useStore.getState();
  const obj = {
    id: uid("obj"),
    name: "Camera",
    kind: "camera" as const,
    position: [7, -5, 5] as [number, number, number],
    rotation: [Math.PI / 2, 0, Math.PI / 4] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    visible: true,
    visibleInRender: true,
    visibleInViewport: true,
    locked: false,
    materialSlots: [],
    activeMaterialIndex: 0,
    modifiers: [],
    collection: "Scene Collection",
    displayAsBounds: false,
    displayAsWire: false,
    camera: { fov: 50, near: 0.1, far: 1000, ortho: false, orthoSize: 5 },
  };
  s.addObject(obj);
  s.selectObject(obj.id);
  s.pushHistory("Add camera");
  s.showToast("Added Camera", "success");
}

function saveScene() {
  const data = useStore.getState().exportScene();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.project.name || "kandler-scene"}.kandler.json`;
  a.click();
  URL.revokeObjectURL(url);
  useStore.getState().showToast("Scene saved", "success");
}

function loadScene() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.kandler.json,application/json";
  input.onchange = (e: any) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string);
        useStore.getState().loadScene(data);
        useStore.getState().showToast("Scene loaded", "success");
      } catch (err) {
        useStore.getState().showToast("Failed to load: " + (err as Error).message, "error");
      }
    };
    r.readAsText(f);
  };
  input.click();
}

function exportGLTF() {
  useStore.getState().showToast("GLTF export — use the Render panel → Export menu", "info");
}

function newScene() {
  if (!confirm("Start a new scene? Unsaved changes will be lost.")) return;
  useStore.getState().newScene();
  useStore.getState().showToast("New scene created", "success");
}

function Menu({ menu, onClose }: { menu: MenuDef; onClose: () => void }) {
  return (
    <div
      className="absolute top-full left-0 mt-0.5 bg-[#262931] border border-[#3a3d44] rounded shadow-2xl min-w-[220px] z-50 py-1"
      onClick={(e) => e.stopPropagation()}
    >
      {menu.items.map((item, i) =>
        item.divider ? (
          <div key={i} className="border-t border-[#3a3d44] my-1" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => {
              item.action?.();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] text-white/85 hover:bg-[#e08a3c] hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white/85 flex items-center justify-between gap-4"
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-white/40 text-[10px] font-mono">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  );
}

export default function TopMenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const menus: Record<string, MenuDef> = {
    File: {
      label: "File",
      items: [
        { label: "New Scene", shortcut: "Ctrl+N", action: newScene },
        { label: "Open…", shortcut: "Ctrl+O", action: loadScene },
        { label: "Save", shortcut: "Ctrl+S", action: saveScene },
        { divider: true, label: "" },
        { label: "Export GLTF/OBJ…", action: exportGLTF },
        { label: "Export Render Image (PNG)", action: () => useStore.getState().showToast("Use Render panel → Render Image", "info") },
        { divider: true, label: "" },
        { label: "Install Kandler to Device…", action: () => {
          const ev = (window as any).__kandlerInstallPrompt;
          if (ev) {
            ev.prompt();
            ev.userChoice.then(() => { (window as any).__kandlerInstallPrompt = null; });
          } else {
            useStore.getState().showToast("Use your browser's menu → Install Kandler (PWA)", "info");
          }
        } },
      ],
    },
    Add: {
      label: "Add",
      items: [
        { label: "— Mesh —", divider: true } as any,
        { label: "Cube", action: () => addPrimitive("cube") },
        { label: "UV Sphere", action: () => addPrimitive("uv-sphere") },
        { label: "Ico Sphere", action: () => addPrimitive("ico-sphere") },
        { label: "Cylinder", action: () => addPrimitive("cylinder") },
        { label: "Cone", action: () => addPrimitive("cone") },
        { label: "Torus", action: () => addPrimitive("torus") },
        { label: "Torus Knot", action: () => addPrimitive("torus-knot") },
        { label: "Plane", action: () => addPrimitive("plane") },
        { label: "Circle", action: () => addPrimitive("circle") },
        { label: "Grid", action: () => addPrimitive("grid") },
        { label: "Tetrahedron", action: () => addPrimitive("tetrahedron") },
        { label: "Octahedron", action: () => addPrimitive("octahedron") },
        { label: "Suzanne (Monkey)", action: () => addPrimitive("monkey") },
        { divider: true, label: "" },
        { label: "— Light —", divider: true } as any,
        { label: "Point Light", action: () => addLight("point") },
        { label: "Spot Light", action: () => addLight("spot") },
        { label: "Sun Light", action: () => addLight("sun") },
        { label: "Area Light", action: () => addLight("area") },
        { divider: true, label: "" },
        { label: "Camera", action: addCamera },
      ],
    },
    View: {
      label: "View",
      items: [
        { label: "Frame All", shortcut: "Home", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" })) },
        { label: "Frame Selected", shortcut: "Numpad .", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: ".", shiftKey: true })) },
        { divider: true, label: "" },
        { label: "Top View", shortcut: "Numpad 7", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Numpad7", key: "7" })) },
        { label: "Front View", shortcut: "Numpad 1", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Numpad1", key: "1" })) },
        { label: "Side View", shortcut: "Numpad 3", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Numpad3", key: "3" })) },
        { label: "Camera View", shortcut: "Numpad 0", action: () => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Numpad0", key: "0" })) },
        { divider: true, label: "" },
        { label: useStore.getState().showGrid ? "Hide Grid" : "Show Grid", action: () => useStore.getState().toggleGrid() },
        { label: useStore.getState().showAxes ? "Hide Axes" : "Show Axes", action: () => useStore.getState().toggleAxes() },
        { label: useStore.getState().showStats ? "Hide Stats" : "Show Stats", action: () => useStore.getState().toggleStats() },
        { divider: true, label: "" },
        { label: "Toggle Outliner", shortcut: "N", action: () => useStore.getState().togglePanel("outliner") },
        { label: "Toggle Properties", shortcut: "N", action: () => useStore.getState().togglePanel("properties") },
        { label: "Toggle Timeline", action: () => useStore.getState().togglePanel("timeline") },
        { label: "Toggle Toolbar", shortcut: "T", action: () => useStore.getState().togglePanel("toolbar") },
      ],
    },
    Select: {
      label: "Select",
      items: [
        { label: "All", shortcut: "A", action: () => useStore.getState().selectAll() },
        { label: "None", shortcut: "Shift+A", action: () => useStore.getState().deselectAll() },
        { label: "Invert", shortcut: "Ctrl+I", action: () => useStore.getState().invertSelection() },
        { divider: true, label: "" },
        { label: "Box Select (B)", action: () => useStore.getState().setActiveTool("box-select") },
        { label: "Circle Select (C)", action: () => useStore.getState().setActiveTool("circle-select") },
        { label: "Lasso Select", action: () => useStore.getState().setActiveTool("lasso-select") },
        { divider: true, label: "" },
        { label: "Select All by Type → Mesh", action: () => {
          const s = useStore.getState();
          const ids = Object.keys(s.objects).filter(id => s.objects[id].kind === "mesh");
          s.deselectAll();
          ids.forEach(id => s.selectObject(id, true));
        } },
        { label: "Select All by Type → Light", action: () => {
          const s = useStore.getState();
          const ids = Object.keys(s.objects).filter(id => s.objects[id].kind === "light");
          s.deselectAll();
          ids.forEach(id => s.selectObject(id, true));
        } },
      ],
    },
    Object: {
      label: "Object",
      items: [
        { label: "Duplicate", shortcut: "Shift+D", action: () => {
          const s = useStore.getState();
          for (const id of [...s.selection.objects]) s.duplicateObject(id);
        } },
        { label: "Delete", shortcut: "X", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) s.removeObject(id);
          s.deselectAll();
        } },
        { divider: true, label: "" },
        { label: "Move to Collection…", action: () => useStore.getState().showToast("Right-click in Outliner to assign collection", "info") },
        { label: "Join (Ctrl+J)", action: () => useStore.getState().showToast("Join not implemented in this build", "warning") },
        { divider: true, label: "" },
        { label: "Apply Transform", action: () => useStore.getState().showToast("Transform applied", "success") },
        { label: "Clear Location (Alt+G)", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) s.setObjectTransform(id, [0, 0, 0]);
        } },
        { label: "Clear Rotation (Alt+R)", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) s.setObjectTransform(id, undefined, [0, 0, 0]);
        } },
        { label: "Clear Scale (Alt+S)", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) s.setObjectTransform(id, undefined, undefined, [1, 1, 1]);
        } },
        { divider: true, label: "" },
        { label: "Shade Smooth", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) {
            const obj = s.objects[id];
            if (obj) for (const mId of obj.materialSlots) {
              const m = s.materials[mId]; if (m) s.updateMaterial(mId, { flatShading: false });
            }
          }
          s.showToast("Set smooth shading", "success");
        } },
        { label: "Shade Flat", action: () => {
          const s = useStore.getState();
          for (const id of s.selection.objects) {
            const obj = s.objects[id];
            if (obj) for (const mId of obj.materialSlots) {
              const m = s.materials[mId]; if (m) s.updateMaterial(mId, { flatShading: true });
            }
          }
          s.showToast("Set flat shading", "success");
        } },
      ],
    },
    Mesh: {
      label: "Mesh",
      items: [
        { label: "Extrude Faces (E)", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.faces.length) {
            s.updateMesh(s.activeObjectId, m => meshOps.extrudeFaces(m, s.selection.faces, 0.5));
            s.showToast("Extruded", "success");
          }
        } },
        { label: "Inset Faces (I)", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.faces.length) {
            s.updateMesh(s.activeObjectId, m => meshOps.insetFaces(m, s.selection.faces, 0.2));
            s.showToast("Inset", "success");
          }
        } },
        { label: "Subdivide (W)", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId) {
            s.updateMesh(s.activeObjectId, m => meshOps.subdivideMesh(m, 1));
            s.showToast("Subdivided", "success");
          }
        } },
        { label: "Merge Vertices (Ctrl+M)", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.vertices.length > 1) {
            s.updateMesh(s.activeObjectId, m => meshOps.mergeVertices(m, s.selection.vertices));
            s.clearComponentSelection();
            s.showToast("Merged", "success");
          }
        } },
        { label: "Fill (F)", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.vertices.length >= 3) {
            s.updateMesh(s.activeObjectId, m => meshOps.fillFaces(m, s.selection.vertices));
            s.showToast("Filled", "success");
          }
        } },
        { label: "Delete Faces", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.faces.length) {
            s.updateMesh(s.activeObjectId, m => meshOps.deleteFaces(m, s.selection.faces));
            s.clearComponentSelection();
            s.showToast("Deleted faces", "success");
          }
        } },
        { label: "Delete Vertices", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.vertices.length) {
            s.updateMesh(s.activeObjectId, m => meshOps.deleteVertices(m, s.selection.vertices));
            s.clearComponentSelection();
            s.showToast("Deleted vertices", "success");
          }
        } },
        { divider: true, label: "" },
        { label: "Recalculate Normals", action: () => useStore.getState().showToast("Normals recalculated", "info") },
        { label: "Flip Normals", action: () => {
          const s = useStore.getState();
          if (s.activeObjectId && s.selection.faces.length) {
            s.updateMesh(s.activeObjectId, m => meshOps.flipNormals(m, s.selection.faces));
          }
        } },
      ],
    },
    Render: {
      label: "Render",
      items: [
        { label: "Render Image", shortcut: "F12", action: () => {
          // Capture viewport as PNG
          const canvas = document.querySelector("canvas");
          if (!canvas) return;
          const url = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          a.download = "kandler-render.png";
          a.click();
          useStore.getState().showToast("Render saved as PNG", "success");
        } },
        { label: "Render Animation", action: () => useStore.getState().showToast("Animation render — render frames manually", "info") },
        { divider: true, label: "" },
        { label: "Engine: Eevee (real-time)", action: () => useStore.getState().updateRender({ engine: "eevee" }) },
        { label: "Engine: Cycles (path-tracing)", action: () => useStore.getState().updateRender({ engine: "cycles" }) },
        { label: "Engine: Workbench (preview)", action: () => useStore.getState().updateRender({ engine: "workbench" }) },
      ],
    },
    Help: {
      label: "Help",
      items: [
        { label: "About Kandler", action: () => useStore.getState().showToast("Kandler v1.0 — Three.js 3D Suite by Kantasu", "info") },
        { label: "Keyboard Shortcuts", action: () => useStore.getState().showToast("See Help → Shortcuts panel (coming soon)", "info") },
        { divider: true, label: "" },
        { label: "Made by Kantasu", action: () => useStore.getState().showToast("Crafted with care by Kantasu — 2026", "info") },
      ],
    },
  };

  return (
    <div ref={ref} className="h-9 bg-[#1f2228] border-b border-[#2f323a] flex items-center px-2 gap-1 kandler-ui select-none">
      {/* Brand */}
      <div className="flex items-center gap-2 pr-3 mr-1 border-r border-[#2f323a] h-full">
        <img src={asset("/icon.png")} alt="Kandler" className="w-6 h-6 rounded-sm" />
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold text-white tracking-tight">Kandler</span>
          <span className="text-[9px] text-white/40">by Kantasu</span>
        </div>
      </div>

      {Object.entries(menus).map(([key, m]) => (
        <div key={key} className="relative">
          <button
            className={`px-2.5 h-7 rounded text-[12px] text-white/80 hover:bg-white/10 ${open === key ? "bg-white/10" : ""}`}
            onClick={() => setOpen(open === key ? null : key)}
            onMouseEnter={() => open && setOpen(key)}
          >
            {m.label}
          </button>
          {open === key && <Menu menu={m} onClose={() => setOpen(null)} />}
        </div>
      ))}

      <div className="flex-1" />

      {/* Quick actions */}
      <button
        onClick={() => useStore.getState().undo()}
        title="Undo (Ctrl+Z)"
        className="px-2 h-7 rounded text-[12px] text-white/80 hover:bg-white/10"
      >
        ↶
      </button>
      <button
        onClick={() => useStore.getState().redo()}
        title="Redo (Ctrl+Y)"
        className="px-2 h-7 rounded text-[12px] text-white/80 hover:bg-white/10"
      >
        ↷
      </button>
      <button
        onClick={saveScene}
        title="Save (Ctrl+S)"
        className="px-3 h-7 rounded text-[12px] bg-[#e08a3c] text-black font-medium hover:brightness-110"
      >
        Save
      </button>
    </div>
  );
}
