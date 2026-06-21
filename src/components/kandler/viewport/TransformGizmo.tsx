"use client";
/**
 * Kandler — Transform Gizmo Overlay (rewrite)
 *
 * Renders XYZ axis handles at the active object's screen-projected position.
 * Dragging an axis handle raycasts the mouse onto a camera-parallel plane that
 * contains the axis, then projects the world delta onto the axis — yielding
 * Blender-accurate axis-locked dragging in any view orientation.
 *
 * Also enables free-form viewport dragging: when the Move tool is active,
 * clicking and dragging an object moves it on a plane perpendicular to the
 * camera passing through the object's origin.
 *
 * Made by Kantasu.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/kandler/store";
import { getViewport } from "@/lib/kandler/viewport-registry";

type Axis = "x" | "y" | "z" | "free";

interface DragState {
  axis: Axis;
  startPointer: { x: number; y: number };
  startValues: [number, number, number];
  startWorldHit: THREE.Vector3 | null; // initial hit on the drag plane
  plane: THREE.Plane | null;
}

export default function TransformGizmo() {
  const activeTool = useStore(s => s.activeTool);
  const activeId = useStore(s => s.activeObjectId);
  const objects = useStore(s => s.objects);
  const setTransform = useStore(s => s.setObjectTransform);
  const selection = useStore(s => s.selection);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track active object's screen position every animation frame
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = requestAnimationFrame(update);
      const vp = getViewport();
      if (!vp || !activeId) {
        setScreenPos(p => p.visible ? { ...p, visible: false } : p);
        return;
      }
      const obj = objects[activeId];
      if (!obj) return;
      // Use object world position
      const wp = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
      const rect = vp.getCanvasRect();
      if (!rect) return;
      const sp = vp.worldToScreen(wp);
      // Convert to container-local coords
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return;
      setScreenPos({
        x: sp.x - cRect.left,
        y: sp.y - cRect.top,
        visible: sp.visible,
      });
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [activeId, objects]);

  // Build a drag plane for the given axis through the object's origin.
  // - For axis-locked drag: the plane contains the axis and the camera's
  //   forward direction (so the projected mouse delta aligns with the axis).
  // - For free drag: the plane is perpendicular to the camera (so the object
  //   slides on the view plane).
  function buildDragPlane(axis: Axis, origin: THREE.Vector3): THREE.Plane {
    const vp = getViewport();
    if (!vp) return new THREE.Plane(new THREE.Vector3(0, 0, 1), -origin.z);
    const camForward = vp.getCameraForward();
    if (axis === "free") {
      // Plane perpendicular to camera, passing through origin
      return new THREE.Plane().setFromNormalAndCoplanarPoint(camForward, origin);
    }
    // Axis direction in world space
    const axisVec = new THREE.Vector3(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0
    );
    // Plane normal = axis × camForward (this plane contains both the axis and the camera direction)
    let normal = new THREE.Vector3().crossVectors(axisVec, camForward);
    if (normal.lengthSq() < 1e-6) {
      // Camera is aligned with the axis — fall back to a different reference
      normal = new THREE.Vector3().crossVectors(axisVec, new THREE.Vector3(0, 0, 1));
      if (normal.lengthSq() < 1e-6) normal = new THREE.Vector3().crossVectors(axisVec, new THREE.Vector3(0, 1, 0));
    }
    normal.normalize();
    return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin);
  }

  function startDrag(axis: Axis) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!activeId) return;
      const obj = objects[activeId];
      if (!obj) return;
      const vp = getViewport();
      if (!vp) return;

      const origin = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
      const plane = buildDragPlane(axis, origin);

      // Initial hit on the drag plane (for delta computation)
      const ray = vp.getRaycaster(e.clientX, e.clientY);
      const startHit = new THREE.Vector3();
      const hit = ray.ray.intersectPlane(plane, startHit);

      const startValues =
        activeTool === "move" ? [...obj.position] as [number, number, number] :
        activeTool === "rotate" ? [...obj.rotation] as [number, number, number] :
        activeTool === "scale" ? [...obj.scale] as [number, number, number] :
        [...obj.position] as [number, number, number];

      const ds: DragState = {
        axis,
        startPointer: { x: e.clientX, y: e.clientY },
        startValues,
        startWorldHit: hit ? startHit.clone() : null,
        plane,
      };
      setDrag(ds);

      const onMove = (ev: MouseEvent) => {
        const s = useStore.getState();
        const current = s.objects[activeId];
        if (!current) return;
        const r = vp.getRaycaster(ev.clientX, ev.clientY);
        const newHit = new THREE.Vector3();
        const ok = r.ray.intersectPlane(plane, newHit);
        if (!ok || !ds.startWorldHit) return;
        const delta = new THREE.Vector3().subVectors(newHit, ds.startWorldHit);

        if (activeTool === "move") {
          if (axis === "free") {
            setTransform(activeId, [
              ds.startValues[0] + delta.x,
              ds.startValues[1] + delta.y,
              ds.startValues[2] + delta.z,
            ]);
          } else {
            // Project delta onto axis
            const comp = axis === "x" ? delta.x : axis === "y" ? delta.y : delta.z;
            const newVals: [number, number, number] = [...ds.startValues];
            newVals[axis === "x" ? 0 : axis === "y" ? 1 : 2] += comp;
            setTransform(activeId, newVals);
          }
        } else if (activeTool === "rotate") {
          // Use screen-space drag: dy → rotation about axis
          const dyScreen = ev.clientY - ds.startPointer.y;
          const dxScreen = ev.clientX - ds.startPointer.x;
          const newVals: [number, number, number] = [...ds.startValues];
          if (axis === "free") {
            // Free rotate: spin around camera-forward axis
            const sign = dxScreen > 0 ? 1 : -1;
            newVals[2] += (Math.abs(dxScreen) + Math.abs(dyScreen)) * 0.01 * sign;
          } else {
            const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
            newVals[idx] += dyScreen * 0.01;
          }
          setTransform(activeId, undefined, newVals);
        } else if (activeTool === "scale") {
          const dxScreen = ev.clientX - ds.startPointer.x;
          const factor = 1 + dxScreen * 0.01;
          const newVals: [number, number, number] = [...ds.startValues];
          if (axis === "free") {
            newVals[0] *= factor; newVals[1] *= factor; newVals[2] *= factor;
          } else {
            const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
            newVals[idx] *= factor;
          }
          setTransform(activeId, undefined, undefined, newVals);
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDrag(null);
        useStore.getState().pushHistory(`Transform ${activeTool} (${axis})`);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }

  if (!["move", "rotate", "scale"].includes(activeTool)) return null;
  if (!activeId || !screenPos.visible) return null;

  // Render axis arrows (X red, Y green, Z blue) + center free-move handle
  const axisLen = 60;
  const axes: { id: Axis; color: string; label: string; dx: number; dy: number }[] = [
    { id: "x", color: "#e08a3c", label: "X", dx: axisLen, dy: 0 },
    { id: "y", color: "#4caf50", label: "Y", dx: 0, dy: -axisLen },
    { id: "z", color: "#5b9bd5", label: "Z", dx: axisLen * 0.7, dy: axisLen * 0.7 },
  ];

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      <div
        className="absolute"
        style={{
          left: screenPos.x - axisLen - 10,
          top: screenPos.y - axisLen - 10,
          width: (axisLen + 10) * 2,
          height: (axisLen + 10) * 2,
          pointerEvents: "none",
        }}
      >
        <svg
          width={(axisLen + 10) * 2}
          height={(axisLen + 10) * 2}
          viewBox={`${-axisLen - 10} ${-axisLen - 10} ${(axisLen + 10) * 2} ${(axisLen + 10) * 2}`}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          {/* Center free-move square */}
          <rect
            x="-7" y="-7" width="14" height="14"
            fill="#888" stroke="#fff" strokeWidth="1.2"
            style={{ pointerEvents: "all", cursor: "move" }}
            onMouseDown={startDrag("free")}
          />
          {axes.map(a => (
            <g key={a.id}>
              {/* Line */}
              <line
                x1="0" y1="0" x2={a.dx} y2={a.dy}
                stroke={a.color} strokeWidth="2.5"
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
                onMouseDown={startDrag(a.id)}
              />
              {/* Arrowhead circle */}
              <circle
                cx={a.dx} cy={a.dy} r="7"
                fill={a.color} stroke="#000" strokeWidth="1"
                style={{ pointerEvents: "all", cursor: "pointer" }}
                onMouseDown={startDrag(a.id)}
              />
              <text
                x={a.dx + (a.id === "x" ? 8 : a.id === "y" ? 0 : 8)}
                y={a.dy + (a.id === "x" ? 4 : a.id === "y" ? -8 : 4)}
                fill="#fff" fontSize="11" fontFamily="ui-monospace, monospace"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {a.label}
              </text>
            </g>
          ))}
          {/* Cross-hairs at center for clarity */}
          <circle cx="0" cy="0" r="2" fill="#fff" style={{ pointerEvents: "none" }} />
        </svg>
      </div>
    </div>
  );
}
