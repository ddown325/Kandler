"use client";
/**
 * Kandler — Main 3D Viewport Component
 *
 * Wraps the Three.js engine, handles pointer interactions (picking, orbit, pan,
 * zoom, box select), renders the in-viewport overlay HUD (mode indicator,
 * shading toggle, view presets), and installs global keyboard shortcuts.
 *
 * Made by Kantasu.
 */
import { useEffect, useRef } from "react";
import { useStore, defaultMaterial, generatePrimitiveMesh, uid, PrimitiveType, LightType } from "@/lib/kandler/store";
import { createViewport, ViewportHandle } from "@/lib/kandler/viewport";
import { extrudeFaces, insetFaces, deleteFaces, deleteVertices, subdivideMesh as subdivideOp, mergeVertices, moveSelectedVertices, fillFaces } from "@/lib/kandler/mesh-ops";

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<ViewportHandle | null>(null);

  // Store subscriptions
  const objects = useStore(s => s.objects);
  const objectOrder = useStore(s => s.objectOrder);
  const selection = useStore(s => s.selection);
  const activeObjectId = useStore(s => s.activeObjectId);
  const editMode = useStore(s => s.editMode);
  const componentMode = useStore(s => s.componentMode);
  const shadingMode = useStore(s => s.shadingMode);
  const materials = useStore(s => s.materials);
  const render = useStore(s => s.render);
  const showGrid = useStore(s => s.showGrid);
  const showAxes = useStore(s => s.showAxes);
  const showOutline = useStore(s => s.showOutline);
  const cursor = useStore(s => s.cursor);
  const activeTool = useStore(s => s.activeTool);

  const store = useStore;

  // Init viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const vp = createViewport(containerRef.current);
    vpRef.current = vp;
    // Trigger initial sizing
    const ro = new ResizeObserver(() => {
      if (containerRef.current && vp) {
        vp.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      vp.dispose();
      vpRef.current = null;
    };
  }, []);

  // Pick handler
  const handlePick = (e: React.MouseEvent) => {
    if (!vpRef.current) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // additive — handled by store
    }
    // Only treat as pick if mouse didn't move much between mousedown and up
    // (For simplicity here: clicks always pick)
    const id = vpRef.current.pickObject(e.clientX, e.clientY);
    if (id) {
      useStore.getState().selectObject(id, e.shiftKey);
    } else if (!e.shiftKey) {
      useStore.getState().deselectAll();
    }
  };

  // Place 3D cursor
  const handlePlaceCursor = (e: React.MouseEvent) => {
    if (activeTool !== "cursor" || !vpRef.current) return;
    const pt = vpRef.current.screenToWorld(e.clientX, e.clientY);
    if (pt) useStore.getState().setCursor([pt.x, pt.y, pt.z]);
  };

  // Keyboard shortcuts (Blender-style)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip if focused in an input/textarea
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const s = useStore.getState();
      const k = e.key.toLowerCase();
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (k === "a" && !ctrl && !shift) { s.selectAll(); return; }
      if (k === "a" && !ctrl && shift) { s.deselectAll(); return; }
      if (k === "i" && !ctrl && shift) { s.invertSelection(); return; }
      if (k === "b" && !ctrl && !shift) { s.setActiveTool("box-select"); return; }
      if (k === "c" && !ctrl && !shift) { s.setActiveTool("cursor"); return; }
      if (k === "tab" && !ctrl) {
        e.preventDefault();
        s.setEditMode(s.editMode === "edit" ? "object" : "edit");
        return;
      }
      if (k === "g" && !ctrl && !shift) { s.setActiveTool("move"); s.showToast("Move tool — drag selected object(s)", "info"); return; }
      if (k === "r" && !ctrl && !shift) { s.setActiveTool("rotate"); s.showToast("Rotate tool — drag selected object(s)", "info"); return; }
      if (k === "s" && !ctrl && !shift) { s.setActiveTool("scale"); s.showToast("Scale tool — drag selected object(s)", "info"); return; }
      if (k === "s" && shift) { s.setActiveTool("snap-menu"); return; }
      if (k === "z" && !ctrl && !shift) {
        // shading cycle
        const order = ["wireframe", "solid", "material", "rendered"] as const;
        const next = order[(order.indexOf(s.shadingMode) + 1) % order.length];
        s.setShadingMode(next);
        s.showToast(`Shading: ${next}`, "info");
        return;
      }
      if (k === "x" || k === "delete") {
        // delete active
        for (const id of s.selection.objects) {
          if (s.editMode === "edit" && s.activeObjectId) {
            // component delete
            const obj = s.objects[s.activeObjectId];
            if (obj && obj.mesh) {
              if (s.componentMode === "vertex" && s.selection.vertices.length) {
                s.updateMesh(s.activeObjectId, m => deleteVertices(m, s.selection.vertices));
              } else if (s.componentMode === "face" && s.selection.faces.length) {
                s.updateMesh(s.activeObjectId, m => deleteFaces(m, s.selection.faces));
              }
              s.clearComponentSelection();
            }
          } else {
            s.removeObject(id);
          }
        }
        s.deselectAll();
        s.showToast("Deleted", "success");
        return;
      }
      if (k === "d" && shift) {
        // duplicate
        for (const id of [...s.selection.objects]) s.duplicateObject(id);
        s.showToast("Duplicated", "success");
        return;
      }
      if (k === "j" && ctrl) {
        // join
        if (s.selection.objects.length > 1) {
          s.showToast("Join not implemented in this build", "warning");
        }
        return;
      }
      if (k === "h" && !ctrl) {
        // hide
        for (const id of s.selection.objects) s.updateObject(id, { visible: false });
        s.deselectAll();
        return;
      }
      if (k === "h" && shift) {
        // unhide all
        for (const id of Object.keys(s.objects)) s.updateObject(id, { visible: true });
        return;
      }
      if (k === "f" && !ctrl && s.editMode === "edit") {
        // fill
        if (s.activeObjectId && s.selection.vertices.length >= 3) {
          s.updateMesh(s.activeObjectId, m => fillFaces(m, s.selection.vertices));
          s.showToast("Filled", "success");
        }
        return;
      }
      if (k === "e" && !ctrl && s.editMode === "edit") {
        // extrude
        if (s.activeObjectId && s.selection.faces.length > 0) {
          s.updateMesh(s.activeObjectId, m => extrudeFaces(m, s.selection.faces, 0.5));
          s.showToast("Extruded", "success");
        } else if (s.activeObjectId && s.selection.vertices.length > 0) {
          s.showToast("Vertex extrude — drag to offset", "info");
        }
        return;
      }
      if (k === "i" && !ctrl && !shift && s.editMode === "edit") {
        if (s.activeObjectId && s.selection.faces.length > 0) {
          s.updateMesh(s.activeObjectId, m => insetFaces(m, s.selection.faces, 0.2));
          s.showToast("Inset", "success");
        }
        return;
      }
      if (k === "m" && ctrl && s.editMode === "edit") {
        if (s.activeObjectId && s.selection.vertices.length > 1) {
          s.updateMesh(s.activeObjectId, m => mergeVertices(m, s.selection.vertices));
          s.clearComponentSelection();
          s.showToast("Merged", "success");
        }
        return;
      }
      if (k === "w" && !ctrl && s.editMode === "edit") {
        if (s.activeObjectId && s.selection.faces.length > 0) {
          s.updateMesh(s.activeObjectId, m => subdivideOp(m, 1));
          s.showToast("Subdivided", "success");
        }
        return;
      }
      if (k === "n" && ctrl) {
        e.preventDefault();
        s.togglePanel("properties");
        return;
      }
      // Undo/redo
      if (k === "z" && ctrl) {
        e.preventDefault();
        if (shift) s.redo(); else s.undo();
        return;
      }
      if (k === "y" && ctrl) {
        e.preventDefault();
        s.redo();
        return;
      }
      // Frame all
      if (k === "home") {
        vpRef.current?.frameAll();
        return;
      }
      if (k === "." && shift) {
        vpRef.current?.focusSelected();
        return;
      }
      // Numpad views
      if (k === "1" && e.code === "Numpad1") { vpRef.current?.setViewportMode("front"); return; }
      if (k === "3" && e.code === "Numpad3") { vpRef.current?.setViewportMode("side"); return; }
      if (k === "7" && e.code === "Numpad7") { vpRef.current?.setViewportMode("top"); return; }
      if (k === "0" && e.code === "Numpad0") { vpRef.current?.setViewportMode("camera"); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTool]);

  // Apply transform tool drag (very simple — full drag handled in separate transform component)
  // This is wired up here as a no-op; the transform gizmo overlay handles real drag.

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#1a1d23] kandler-ui"
      onMouseDown={(e) => {
        if (e.button === 0) {
          // could be pick or drag — track movement
          const startX = e.clientX, startY = e.clientY;
          const onUp = (ev: MouseEvent) => {
            window.removeEventListener("mouseup", onUp);
            if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) {
              if (activeTool === "cursor") handlePlaceCursor({ clientX: ev.clientX, clientY: ev.clientY } as any);
              else handlePick({ clientX: ev.clientX, clientY: ev.clientY } as any);
            }
          };
          window.addEventListener("mouseup", onUp);
        }
      }}
    >
      {/* Viewport HUD - top right */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-auto">
        <div className="bg-[#2a2d33]/80 backdrop-blur px-2 py-1 rounded text-[11px] flex gap-1">
          {(["wireframe", "solid", "material", "rendered"] as const).map(m => (
            <button
              key={m}
              className={`px-2 py-0.5 rounded text-[10px] ${shadingMode === m ? "bg-[#e08a3c] text-black" : "text-white/70 hover:bg-white/10"}`}
              onClick={() => useStore.getState().setShadingMode(m)}
              title={m}
            >
              {m === "wireframe" ? "_wire" : m === "solid" ? "solid" : m === "material" ? "mat" : "rend"}
            </button>
          ))}
        </div>
      </div>

      {/* Viewport HUD - top left (view presets) */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        <div className="bg-[#2a2d33]/80 backdrop-blur px-1 py-1 rounded flex gap-0.5">
          {[
            { label: "Cam", mode: "camera" as const },
            { label: "Top", mode: "top" as const },
            { label: "Front", mode: "front" as const },
            { label: "Side", mode: "side" as const },
            { label: "Free", mode: "free" as const },
          ].map(v => (
            <button
              key={v.label}
              className="px-2 py-0.5 rounded text-[10px] text-white/70 hover:bg-white/10"
              onClick={() => vpRef.current?.setViewportMode(v.mode)}
              title={`${v.label} view`}
            >
              {v.label}
            </button>
          ))}
          <button
            className="px-2 py-0.5 rounded text-[10px] text-white/70 hover:bg-white/10"
            onClick={() => vpRef.current?.frameAll()}
            title="Frame all (Home)"
          >
            Frame
          </button>
        </div>
      </div>

      {/* Mode indicator - bottom left */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <div className="bg-[#2a2d33]/80 backdrop-blur px-2 py-1 rounded text-[10px] text-white/70 font-mono">
          {editMode.toUpperCase()} MODE {editMode === "edit" ? `· ${componentMode.toUpperCase()}` : ""} · TOOL: {activeTool.toUpperCase()}
        </div>
      </div>

      {/* Branding - bottom right */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="bg-[#2a2d33]/80 backdrop-blur px-2 py-1 rounded text-[10px] text-white/40 font-mono">
          Kandler · by Kantasu
        </div>
      </div>
    </div>
  );
}
