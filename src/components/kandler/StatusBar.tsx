"use client";
/**
 * Kandler — Status Bar (bottom)
 * Shows active tool, snapping mode, scene stats (verts/objects/FPS/draw calls),
 * and a Kantasu credit line.
 *
 * Made by Kantasu.
 */
import { useStore } from "@/lib/kandler/store";
import { Icon } from "@/components/kandler/Icon";

export default function StatusBar() {
  const activeTool = useStore(s => s.activeTool);
  const snapping = useStore(s => s.snappingMode);
  const setSnapping = useStore(s => s.setSnappingMode);
  const snapInc = useStore(s => s.snapIncrement);
  const setSnapInc = useStore(s => s.setSnapIncrement);
  const objects = useStore(s => s.objects);
  const selection = useStore(s => s.selection);
  const fps = useStore(s => s.fps);
  const drawCalls = useStore(s => s.drawCalls);
  const editMode = useStore(s => s.editMode);
  const componentMode = useStore(s => s.componentMode);

  let totalVerts = 0, totalFaces = 0;
  for (const id of Object.keys(objects)) {
    const o = objects[id];
    if (o.kind === "mesh") {
      totalVerts += o.vertexCount || 0;
      totalFaces += o.faceCount || 0;
    }
  }

  return (
    <div className="h-6 bg-[#1a1d23] border-t border-[#2f323a] flex items-center px-3 gap-4 text-[11px] text-white/60 font-mono kandler-ui">
      <span className="text-[#e08a3c] flex items-center"><Icon name="dot" size={10} /></span>
      <span>Tool: <span className="text-white/85">{activeTool}</span></span>
      <span>Mode: <span className="text-white/85">{editMode}{editMode === "edit" ? `/${componentMode}` : ""}</span></span>
      <label className="flex items-center gap-1">
        Snap:
        <select
          value={snapping}
          onChange={e => setSnapping(e.target.value as any)}
          className="bg-transparent border-0 text-white/85 outline-none cursor-pointer"
        >
          <option value="off">Off</option>
          <option value="increment">Increment</option>
          <option value="grid">Grid</option>
          <option value="vertex">Vertex</option>
          <option value="edge">Edge</option>
          <option value="face">Face</option>
          <option value="volume">Volume</option>
        </select>
      </label>
      {snapping !== "off" && (
        <label className="flex items-center gap-1">
          Inc:
          <input
            type="number"
            value={snapInc}
            step={0.05}
            onChange={e => setSnapInc(parseFloat(e.target.value) || 0.1)}
            className="w-14 bg-transparent border-0 text-white/85 outline-none"
          />
        </label>
      )}
      <div className="flex-1" />
      <span>Selected: <span className="text-white/85">{selection.objects.length}</span></span>
      <span>Objects: <span className="text-white/85">{Object.keys(objects).length}</span></span>
      <span>Verts: <span className="text-white/85">{totalVerts.toLocaleString()}</span></span>
      <span>Faces: <span className="text-white/85">{totalFaces.toLocaleString()}</span></span>
      <span>Draws: <span className="text-white/85">{drawCalls}</span></span>
      <span>FPS: <span className={fps < 30 ? "text-red-400" : "text-white/85"}>{fps}</span></span>
      <span className="text-white/30 ml-3">Kandler v1.0 · by Kantasu</span>
    </div>
  );
}
