"use client";
/**
 * Kandler — Keyboard Shortcuts Modal
 * Shows the complete keyboard shortcuts reference, organized by category.
 * Opens via Help → Keyboard Shortcuts, or press "?" key.
 *
 * Made by Kantasu.
 */
import { Icon } from "@/components/kandler/Icon";

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Modes",
    shortcuts: [
      { key: "Tab", description: "Toggle Object / Edit mode" },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { key: "A", description: "Select all" },
      { key: "Shift+A", description: "Deselect all" },
      { key: "Ctrl+I", description: "Invert selection" },
      { key: "B", description: "Box select tool" },
      { key: "C", description: "3D cursor tool" },
      { key: "Shift+Click", description: "Add to selection" },
    ],
  },
  {
    title: "Transform Tools",
    shortcuts: [
      { key: "G", description: "Move tool (then click+drag the object)" },
      { key: "R", description: "Rotate tool" },
      { key: "S", description: "Scale tool" },
      { key: "Alt+G", description: "Clear location" },
      { key: "Alt+R", description: "Clear rotation" },
      { key: "Alt+S", description: "Clear scale" },
    ],
  },
  {
    title: "Edit Mode — Mesh Operations",
    shortcuts: [
      { key: "E", description: "Extrude faces/vertices" },
      { key: "I", description: "Inset faces" },
      { key: "W", description: "Subdivide" },
      { key: "Ctrl+M", description: "Merge vertices" },
      { key: "F", description: "Fill (with selected verts/edges)" },
      { key: "X / Del", description: "Delete (vertex/edge/face based on mode)" },
      { key: "Ctrl+B", description: "Bevel edges" },
      { key: "K", description: "Knife tool" },
      { key: "Ctrl+R", description: "Loop cut" },
    ],
  },
  {
    title: "Objects",
    shortcuts: [
      { key: "Shift+D", description: "Duplicate selected object(s)" },
      { key: "Ctrl+J", description: "Join objects (selected → active)" },
      { key: "H", description: "Hide selected" },
      { key: "Shift+H", description: "Unhide all" },
    ],
  },
  {
    title: "Viewport — Views",
    shortcuts: [
      { key: "Home", description: "Frame all objects in viewport" },
      { key: "Shift+.", description: "Frame selected" },
      { key: "Numpad 7", description: "Top view" },
      { key: "Numpad 1", description: "Front view" },
      { key: "Numpad 3", description: "Side view" },
      { key: "Numpad 0", description: "Camera view (through active camera)" },
    ],
  },
  {
    title: "Viewport — Shading & Display",
    shortcuts: [
      { key: "Z", description: "Cycle shading modes (wireframe → solid → material → rendered)" },
      { key: "T", description: "Toggle left toolbar" },
      { key: "N", description: "Toggle right properties panel" },
    ],
  },
  {
    title: "Viewport — Navigation",
    shortcuts: [
      { key: "Alt + Left-drag", description: "Orbit camera around target" },
      { key: "Shift + Left-drag", description: "Pan camera" },
      { key: "Mouse wheel", description: "Zoom in/out" },
      { key: "Middle-drag", description: "Orbit (no Alt needed)" },
      { key: "Shift + Middle-drag", description: "Pan" },
    ],
  },
  {
    title: "Edit — History",
    shortcuts: [
      { key: "Ctrl+Z", description: "Undo" },
      { key: "Ctrl+Y / Ctrl+Shift+Z", description: "Redo" },
    ],
  },
  {
    title: "File",
    shortcuts: [
      { key: "Ctrl+S", description: "Save scene (.kandler.json)" },
      { key: "Ctrl+O", description: "Open scene" },
      { key: "F12", description: "Render image (PNG)" },
    ],
  },
  {
    title: "Help",
    shortcuts: [
      { key: "? / Shift+/", description: "Open this keyboard shortcuts dialog" },
      { key: "Esc", description: "Close dialog" },
    ],
  },
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1f2228] border border-[#3a3d44] rounded-lg shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#3a3d44] flex items-center gap-3 bg-[#262931]">
          <img src={(typeof window !== "undefined" && (window as any).__KANDLER_BASE__ ? (window as any).__KANDLER_BASE__ : "") + "/icon.png"} alt="Kandler" className="w-6 h-6 rounded" />
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-white">Kandler — Keyboard Shortcuts</div>
            <div className="text-[10px] text-white/50">Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">?</kbd> to toggle, <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to close</div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10"
            title="Close (Esc)"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content — scrollable grid of shortcut groups */}
        <div className="flex-1 overflow-y-auto kandler-scroll p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GROUPS.map(group => (
              <div key={group.title} className="bg-[#262931] border border-[#3a3d44] rounded-lg overflow-hidden">
                <div className="kandler-section-title rounded-none m-0">{group.title}</div>
                <div className="p-2">
                  {group.shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 px-1 hover:bg-white/5 rounded text-[11px]">
                      <span className="text-white/70">{s.description}</span>
                      <kbd className="px-1.5 py-0.5 bg-[#1a1d23] border border-[#3a3d44] rounded text-[10px] font-mono text-[#e08a3c] whitespace-nowrap">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer credit */}
          <div className="mt-5 text-center text-[10px] text-white/40 font-mono">
            Kandler v1.0 · Made by Kantasu · 2026
          </div>
        </div>
      </div>
    </div>
  );
}
