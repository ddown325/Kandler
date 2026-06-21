"use client";
/**
 * Kandler — Transform Gizmo Overlay
 * Drag-to-transform overlay for the active tool (move/rotate/scale).
 * Renders axis handles over the active object's screen position. Dragging a
 * handle manipulates the corresponding transform axis.
 *
 * Made by Kantasu.
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/kandler/store";

interface GizmoState {
  active: boolean;
  axis: "x" | "y" | "z" | "xy" | "yz" | "xz" | null;
  startMouse: { x: number; y: number } | null;
  startValues: { x: number; y: number; z: number } | null;
}

export default function TransformGizmo() {
  const activeTool = useStore(s => s.activeTool);
  const activeId = useStore(s => s.activeObjectId);
  const objects = useStore(s => s.objects);
  const selection = useStore(s => s.selection);
  const setTransform = useStore(s => s.setObjectTransform);
  const updateMesh = useStore(s => s.updateMesh);
  const [state, setState] = useState<GizmoState>({ active: false, axis: null, startMouse: null, startValues: null });
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update gizmo screen position on every frame via rAF
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = requestAnimationFrame(update);
      if (!activeId || !containerRef.current) {
        setPosition(p => ({ ...p, visible: false }));
        return;
      }
      const obj = objects[activeId];
      if (!obj) {
        setPosition(p => ({ ...p, visible: false }));
        return;
      }
      // Get the canvas (viewport)
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Project object position to screen — find the camera from Three.js
      // Use a simple approximation: position the gizmo at the active object's screen coord
      // For now, position at center of viewport
      setPosition({
        x: rect.left + rect.width / 2 - containerRef.current!.getBoundingClientRect().left,
        y: rect.top + rect.height / 2 - containerRef.current!.getBoundingClientRect().top,
        visible: true,
      });
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [activeId, objects]);

  // Drag handlers
  const startDrag = (axis: "x" | "y" | "z" | "xy" | "yz" | "xz") => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeId) return;
    const obj = objects[activeId];
    if (!obj) return;
    const startValues =
      activeTool === "move" ? { ...obj.position } as any :
      activeTool === "rotate" ? { ...obj.rotation } as any :
      activeTool === "scale" ? { ...obj.scale } as any : null;
    setState({ active: true, axis, startMouse: { x: e.clientX, y: e.clientY }, startValues });

    const onMove = (ev: MouseEvent) => {
      if (!state.startMouse || !state.startValues || !startValues) return;
      const dx = (ev.clientX - state.startMouse.x) * 0.01;
      const dy = (ev.clientY - state.startMouse.y) * 0.01;
      const s = useStore.getState();
      const current = s.objects[activeId];
      if (!current) return;
      if (activeTool === "move") {
        const newPos: [number, number, number] = [startValues.x, startValues.y, startValues.z];
        if (axis === "x" || axis === "xy" || axis === "xz") newPos[0] += dx;
        if (axis === "y" || axis === "xy" || axis === "yz") newPos[1] -= dx;
        if (axis === "z" || axis === "xz" || axis === "yz") newPos[2] += dy;
        setTransform(activeId, newPos);
      } else if (activeTool === "rotate") {
        const newRot: [number, number, number] = [startValues.x, startValues.y, startValues.z];
        if (axis === "x") newRot[0] += dy;
        if (axis === "y") newRot[1] += dy;
        if (axis === "z") newRot[2] += dx;
        setTransform(activeId, undefined, newRot);
      } else if (activeTool === "scale") {
        const newScale: [number, number, number] = [startValues.x, startValues.y, startValues.z];
        const factor = 1 + dx;
        if (axis === "x") newScale[0] *= factor;
        if (axis === "y") newScale[1] *= factor;
        if (axis === "z") newScale[2] *= factor;
        if (axis === "xy" || axis === "yz" || axis === "xz") {
          newScale[0] *= factor; newScale[1] *= factor; newScale[2] *= factor;
        }
        setTransform(activeId, undefined, undefined, newScale);
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setState({ active: false, axis: null, startMouse: null, startValues: null });
      useStore.getState().pushHistory(`Transform ${activeTool}`);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (!["move", "rotate", "scale"].includes(activeTool)) return null;
  if (!position.visible || !activeId) return null;

  // Use the actual viewport's center as fallback if we can't project
  // Build axis arrows
  const axes: { id: "x" | "y" | "z"; color: string; label: string; dx: number; dy: number }[] = [
    { id: "x", color: "#e08a3c", label: "X", dx: 50, dy: 0 },
    { id: "y", color: "#4caf50", label: "Y", dx: 0, dy: -50 },
    { id: "z", color: "#5b9bd5", label: "Z", dx: 35, dy: 35 },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="absolute pointer-events-auto"
        style={{ left: position.x - 30, top: position.y - 30, width: 60, height: 60 }}
      >
        <svg width="60" height="60" viewBox="-30 -30 60 60" style={{ overflow: "visible" }}>
          {/* Center square */}
          <rect x="-5" y="-5" width="10" height="10" fill="#888" stroke="#fff" strokeWidth="1" className="cursor-move" />
          {axes.map(a => (
            <g key={a.id}>
              <line
                x1="0" y1="0" x2={a.dx} y2={a.dy}
                stroke={a.color} strokeWidth="2.5"
                className="cursor-pointer"
                style={{ pointerEvents: "stroke" }}
                onMouseDown={startDrag(a.id)}
              />
              <circle
                cx={a.dx} cy={a.dy} r="6"
                fill={a.color} stroke="#000" strokeWidth="1"
                className="cursor-pointer"
                style={{ pointerEvents: "all" }}
                onMouseDown={startDrag(a.id)}
              />
              <text x={a.dx + 8} y={a.dy + 4} fill="#fff" fontSize="10" fontFamily="monospace">{a.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
