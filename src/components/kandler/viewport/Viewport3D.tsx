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
import * as THREE from "three";
import { useStore, defaultMaterial, generatePrimitiveMesh, uid, PrimitiveType, LightType } from "@/lib/kandler/store";
import { createViewport, ViewportHandle } from "@/lib/kandler/viewport";
import { registerViewport, unregisterViewport } from "@/lib/kandler/viewport-registry";
import { extrudeFaces, insetFaces, deleteFaces, deleteVertices, subdivideMesh as subdivideOp, mergeVertices, moveSelectedVertices, fillFaces } from "@/lib/kandler/mesh-ops";

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<ViewportHandle | null>(null);

  // Save scene helper — used by the Ctrl+S shortcut to download a .kandler.json
  // file (preventing the browser's native "Save Page As" dialog)
  const saveSceneViaStore = () => {
    const data = useStore.getState().exportScene();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.project.name || "kandler-scene"}.kandler.json`;
    a.click();
    URL.revokeObjectURL(url);
    useStore.getState().showToast("Scene saved", "success");
  };

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
    registerViewport(vp);
    // Trigger initial sizing
    const ro = new ResizeObserver(() => {
      if (containerRef.current && vp) {
        vp.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      unregisterViewport(vp);
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

      // ---- BLOCK BROWSER DEFAULTS for any key combo Kandler uses ----
      // Prevent browser from reloading the page, opening native dialogs,
      // cycling tabs, opening devtools, etc. We attach this listener in
      // the capture phase so we run BEFORE the browser's default handler.
      const kandlerCombos: Array<[string, boolean, boolean]> = [
        // [key, ctrl, shift]
        ["a", false, false], ["a", false, true], ["i", false, true],
        ["b", false, false], ["c", false, false],
        ["tab", false, false],
        ["g", false, false], ["r", false, false], ["r", true, true],
        ["s", false, false], ["s", false, true], ["s", true, false],  // Ctrl+S = save scene
        ["z", false, false], ["z", true, false], ["z", true, true],
        ["y", true, false],
        ["x", false, false], ["delete", false, false],
        ["d", false, true], ["d", false, false], ["d", true, false],  // Ctrl+D = duplicate (browser bookmark)
        ["j", true, false],  // Ctrl+J = join (browser downloads)
        ["h", false, false], ["h", false, true], ["h", true, false],  // Ctrl+H = hide (browser history)
        ["f", false, false], ["f", true, false],  // Ctrl+F = fill (browser find)
        ["e", false, false],
        ["i", false, false],
        ["m", true, false],  // Ctrl+M = merge (browser mute tab)
        ["w", false, false], ["w", true, false],  // Ctrl+W = subdivide (browser close tab)
        ["n", true, false],  // Ctrl+N = toggle properties (browser new window)
        ["o", true, false],  // Ctrl+O = open scene (browser open file)
        ["p", true, false],  // Ctrl+P = render (browser print)
        ["t", false, false], ["t", true, false],  // Ctrl+T = toolbar (browser new tab)
      ];
      const isKandlerCombo = kandlerCombos.some(([kk, cc, ss]) => k === kk && cc === ctrl && ss === shift);
      const isNumpad = e.code.startsWith("Numpad");
      const isFunctionKey = /^(F1|F3|F5|F7|F11|F12)$/i.test(e.key);
      const isHome = k === "home";
      const isSlash = k === "/" || k === "?";

      if (isKandlerCombo || isNumpad || isFunctionKey || isHome || isSlash) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Tool shortcuts
      if (k === "a" && !ctrl && !shift) { s.selectAll(); return; }
      if (k === "a" && !ctrl && shift) { s.deselectAll(); return; }
      if (k === "i" && !ctrl && shift) { s.invertSelection(); return; }
      if (k === "b" && !ctrl && !shift) { s.setActiveTool("box-select"); return; }
      if (k === "c" && !ctrl && !shift) { s.setActiveTool("cursor"); return; }
      if (k === "tab" && !ctrl) {
        s.setEditMode(s.editMode === "edit" ? "object" : "edit");
        return;
      }
      if (k === "t" && !ctrl && !shift) { s.togglePanel("toolbar"); return; }
      if (k === "g" && !ctrl && !shift) { s.setActiveTool("move"); s.showToast("Move tool — drag selected object(s)", "info"); return; }
      if (k === "r" && !ctrl && !shift) { s.setActiveTool("rotate"); s.showToast("Rotate tool — drag selected object(s)", "info"); return; }
      if (k === "r" && ctrl && shift) {
        // Clear rotation (Alt+R in Blender — we use Ctrl+Shift+R since Alt activates browser menus)
        for (const id of s.selection.objects) s.setObjectTransform(id, undefined, [0, 0, 0]);
        s.showToast("Rotation cleared", "success");
        return;
      }
      if (k === "s" && !ctrl && !shift) { s.setActiveTool("scale"); s.showToast("Scale tool — drag selected object(s)", "info"); return; }
      if (k === "s" && shift) { s.setActiveTool("snap-menu"); return; }
      if (k === "s" && ctrl) {
        // Ctrl+S = save scene (browser would save the page)
        saveSceneViaStore();
        return;
      }
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
      if (k === "h" && !ctrl && !shift) {
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
        s.togglePanel("properties");
        return;
      }
      // Undo/redo
      if (k === "z" && ctrl) {
        if (shift) s.redo(); else s.undo();
        return;
      }
      if (k === "y" && ctrl) {
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
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [activeTool]);

  // Apply transform tool drag (very simple — full drag handled in separate transform component)
  // This is wired up here as a no-op; the transform gizmo overlay handles real drag.

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#1a1626] kandler-ui"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const startX = e.clientX, startY = e.clientY;
        // First, attempt to pick the object under the cursor.
        // If a transform tool is active AND the user hits an already-selected
        // object, we initiate a direct drag on the camera-parallel plane.
        const vp = vpRef.current;
        const s = useStore.getState();
        let pickedId: string | null = null;
        if (vp) pickedId = vp.pickObject(e.clientX, e.clientY);

        const isTransformTool = ["move", "rotate", "scale"].includes(s.activeTool);
        const canDirectDrag = isTransformTool && pickedId && s.selection.objects.includes(pickedId) && !e.shiftKey;

        if (canDirectDrag && vp) {
          // Begin a free drag on the camera-parallel plane through the object origin
          const obj = s.objects[pickedId!];
          if (!obj) return;
          const origin = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
          const camForward = vp.getCameraForward();
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camForward, origin);
          const ray = vp.getRaycaster(e.clientX, e.clientY);
          const startHit = new THREE.Vector3();
          const hitOk = ray.ray.intersectPlane(plane, startHit);
          const startPos: [number, number, number] = [...obj.position] as any;
          const startRot: [number, number, number] = [...obj.rotation] as any;
          const startScale: [number, number, number] = [...obj.scale] as any;

          let moved = false;
          const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
            moved = true;
            const st = useStore.getState();
            const cur = st.objects[pickedId!];
            if (!cur) return;
            if (st.activeTool === "move") {
              const r = vp.getRaycaster(ev.clientX, ev.clientY);
              const newHit = new THREE.Vector3();
              if (r.ray.intersectPlane(plane, newHit) && hitOk) {
                const delta = new THREE.Vector3().subVectors(newHit, startHit);
                st.setObjectTransform(pickedId!, [
                  startPos[0] + delta.x,
                  startPos[1] + delta.y,
                  startPos[2] + delta.z,
                ]);
              }
            } else if (st.activeTool === "rotate") {
              const newRot: [number, number, number] = [...startRot];
              newRot[2] += dx * 0.01;
              st.setObjectTransform(pickedId!, undefined, newRot);
            } else if (st.activeTool === "scale") {
              const factor = 1 + dx * 0.01;
              const newScale: [number, number, number] = [
                startScale[0] * factor,
                startScale[1] * factor,
                startScale[2] * factor,
              ];
              st.setObjectTransform(pickedId!, undefined, undefined, newScale);
            }
          };
          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            if (!moved) {
              // Treat as a click — just select the picked object
              if (pickedId) useStore.getState().selectObject(pickedId, false);
            } else {
              useStore.getState().pushHistory(`Direct ${useStore.getState().activeTool}`);
            }
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
          // Also select the picked object immediately
          if (pickedId) useStore.getState().selectObject(pickedId, false);
          return;
        }

        // Default: track click vs drag for picking / cursor placement
        const onUp = (ev: MouseEvent) => {
          window.removeEventListener("mouseup", onUp);
          if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) {
            if (activeTool === "cursor") handlePlaceCursor({ clientX: ev.clientX, clientY: ev.clientY } as any);
            else handlePick({ clientX: ev.clientX, clientY: ev.clientY } as any);
          }
        };
        window.addEventListener("mouseup", onUp);
      }}
    >
      {/* Viewport HUD - top right */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-auto">
        <div className="bg-[#2a2440]/80 backdrop-blur px-2 py-1 rounded text-[11px] flex gap-1">
          {(["wireframe", "solid", "material", "rendered"] as const).map(m => (
            <button
              key={m}
              className={`px-2 py-0.5 rounded text-[10px] ${shadingMode === m ? "bg-[#b388ff] text-black" : "text-white/70 hover:bg-white/10"}`}
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
        <div className="bg-[#2a2440]/80 backdrop-blur px-1 py-1 rounded flex gap-0.5">
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
        <div className="bg-[#2a2440]/80 backdrop-blur px-2 py-1 rounded text-[10px] text-white/70 font-mono">
          {editMode.toUpperCase()} MODE {editMode === "edit" ? `· ${componentMode.toUpperCase()}` : ""} · TOOL: {activeTool.toUpperCase()}
        </div>
      </div>

      {/* Branding - bottom right */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="bg-[#2a2440]/80 backdrop-blur px-2 py-1 rounded text-[10px] text-white/40 font-mono">
          Kandler · by Kantasu
        </div>
      </div>
    </div>
  );
}
