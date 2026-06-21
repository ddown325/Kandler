"use client";
/**
 * Kandler — Left Toolbar (vertical)
 * Blender-style tool strip: select, box-select, cursor, move, rotate, scale,
 * annotate, measure, plus edit-mode tools: extrude, inset, bevel, knife.
 *
 * Made by Kantasu.
 */
import { useStore } from "@/lib/kandler/store";

const TOOLS = [
  { id: "select", label: "Select", key: "T", icon: cursorIcon },
  { id: "box-select", label: "Box Select", key: "B", icon: boxIcon },
  { id: "cursor", label: "3D Cursor", key: "C", icon: crosshairIcon },
  { divider: true },
  { id: "move", label: "Move", key: "G", icon: moveIcon },
  { id: "rotate", label: "Rotate", key: "R", icon: rotateIcon },
  { id: "scale", label: "Scale", key: "S", icon: scaleIcon },
  { divider: true },
  { id: "extrude", label: "Extrude", key: "E", icon: extrudeIcon },
  { id: "inset", label: "Inset", key: "I", icon: insetIcon },
  { id: "bevel", label: "Bevel", key: "Ctrl+B", icon: bevelIcon },
  { id: "knife", label: "Knife", key: "K", icon: knifeIcon },
  { id: "loop-cut", label: "Loop Cut", key: "Ctrl+R", icon: loopIcon },
  { divider: true },
  { id: "annotate", label: "Annotate", key: "D", icon: annotateIcon },
  { id: "measure", label: "Measure", key: "M", icon: measureIcon },
];

export default function Toolbar() {
  const activeTool = useStore(s => s.activeTool);
  const setTool = useStore(s => s.setActiveTool);
  const editMode = useStore(s => s.editMode);

  return (
    <div className="w-11 bg-[#1f2228] border-r border-[#2f323a] flex flex-col items-center py-2 gap-1 kandler-ui">
      {TOOLS.map((t, i) =>
        "divider" in t ? (
          <div key={i} className="w-6 h-px bg-[#2f323a] my-1" />
        ) : (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            className={`kandler-tool-btn ${activeTool === t.id ? "active" : ""} ${editMode !== "edit" && ["extrude", "inset", "bevel", "knife", "loop-cut"].includes(t.id) ? "opacity-30 pointer-events-none" : ""}`}
          >
            <t.icon />
          </button>
        )
      )}
      <div className="flex-1" />
      <button
        onClick={() => useStore.getState().setEditMode(editMode === "object" ? "edit" : "object")}
        title="Toggle Edit Mode (Tab)"
        className={`kandler-tool-btn ${editMode === "edit" ? "active" : ""}`}
      >
        <EditIcon />
      </button>
    </div>
  );
}

// --- Icons ---
function cursorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l7 16 2-7 7-2z" />
    </svg>
  );
}
function boxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  );
}
function crosshairIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function moveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}
function rotateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
function scaleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
function extrudeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="14" width="14" height="7" rx="1" />
      <rect x="7" y="3" width="14" height="7" rx="1" fill="currentColor" fillOpacity="0.2" />
      <line x1="3" y1="14" x2="7" y2="3" />
      <line x1="17" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function insetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}
function bevelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21L21 3" />
      <path d="M3 21h18M3 21V3" />
    </svg>
  );
}
function knifeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4l6 6-9 9-6-6 9-9z" />
      <line x1="14" y1="4" x2="20" y2="10" />
    </svg>
  );
}
function loopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="4" />
    </svg>
  );
}
function annotateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    </svg>
  );
}
function measureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="9" width="20" height="6" rx="1" transform="rotate(45 12 12)" />
      <line x1="7" y1="14" x2="9" y2="12" />
      <line x1="11" y1="14" x2="13" y2="12" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
