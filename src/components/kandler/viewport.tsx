"use client";

import { useEffect, useRef, useState } from "react";
import { useKandler } from "@/lib/kandler/store";
import type { Transform } from "@/lib/kandler/types";

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<import("@/lib/kandler/three-engine").ThreeEngine | null>(null);
  const scene = useKandler((s) => s.scene);
  const selectedIds = useKandler((s) => s.selectedIds);
  const select = useKandler((s) => s.select);
  const updateTransformField = useKandler((s) => s.updateTransformField);
  const pushHistory = useKandler((s) => s.pushHistory);
  const setCursor = useKandler((s) => s.setCursor);
  const [stats, setStats] = useState({ fps: 0, dc: 0, tris: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const { ThreeEngine } = await import("@/lib/kandler/three-engine");
      if (disposed || !containerRef.current) return;
      const te = new ThreeEngine(containerRef.current);
      te.onSelect = (id, additive) => {
        if (id) select([id], additive);
        else select([], false);
      };
      te.onTransformChange = (id, transform: Transform) => {
        pushHistory();
        updateTransformField(id, "position", transform.position);
        updateTransformField(id, "rotation", transform.rotation);
        updateTransformField(id, "scale", transform.scale);
      };
      te.onCursorMove = (pos) => setCursor(pos);
      te.onBoxSelect = (ids) => select(ids, false);
      te.statsCallback = (fps, dc, tris) => setStats({ fps, dc, tris });
      engineRef.current = te;
      te.sync(useKandler.getState().scene);
      te.setSelected(useKandler.getState().selectedIds);
      te.setTransformMode(useKandler.getState().scene.ui.transformMode);
      setReady(true);
    })();
    return () => {
      disposed = true;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.sync(scene);
      engineRef.current.setSelected(selectedIds);
      engineRef.current.setTransformMode(scene.ui.transformMode);
      engineRef.current.setSnap(
        scene.ui.snapEnabled,
        scene.ui.snapTranslate,
        scene.ui.snapRotate,
        scene.ui.snapScale,
      );
    }
  }, [scene, selectedIds]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0614]">
      <div ref={containerRef} className="absolute inset-0" />
      {ready && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 text-[10px] text-purple-300/70 pointer-events-none select-none">
          <div className="px-2 py-0.5 rounded bg-black/40 border border-purple-500/20 backdrop-blur-sm flex items-center gap-2">
            <img src="icons/kandler-192.png" alt="" className="w-3 h-3 rounded" />
            <span className="text-purple-200 font-semibold">three.js</span>
            {scene.ui.editMode && <span className="ml-1 text-fuchsia-300">EDIT MODE</span>}
            {scene.ui.sculptMode && <span className="ml-1 text-orange-300">SCULPT MODE</span>}
          </div>
          {scene.ui.shadingMode !== "material" && (
            <div className="px-2 py-0.5 rounded bg-black/40 border border-purple-500/20 backdrop-blur-sm capitalize">
              Shading: {scene.ui.shadingMode}
            </div>
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-1 text-[10px] font-mono rounded bg-black/50 text-purple-200 border border-purple-500/30 pointer-events-none">
        Cursor: ({scene.ui.cursor[0].toFixed(2)}, {scene.ui.cursor[1].toFixed(2)}, {scene.ui.cursor[2].toFixed(2)})
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-purple-300 text-sm pointer-events-none">
          <div className="flex items-center gap-3">
            <img src="icons/kandler-192.png" alt="" className="w-8 h-8 rounded animate-pulse" />
            <span>Loading Kandler 3D viewport…</span>
          </div>
        </div>
      )}
      {scene.ui.showStats && ready && (
        <div className="absolute bottom-2 right-2 px-2 py-1 text-[10px] font-mono rounded bg-black/60 text-purple-200 border border-purple-500/30 pointer-events-none">
          three.js · {stats.fps.toFixed(0)} FPS · {stats.dc} DC · {stats.tris.toLocaleString()} tris
        </div>
      )}
      <div className="absolute top-2 right-2 text-[9px] text-purple-500/40 pointer-events-none flex items-center gap-1">
        <img src="icons/kandler-192.png" alt="" className="w-3 h-3 rounded" />
        <span>by KANTASU</span>
      </div>
    </div>
  );
}
