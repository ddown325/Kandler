"use client";
import { useStore } from "@/lib/kandler/store";

export type WorkspaceId = "layout" | "modeling" | "sculpting" | "uv" | "texture" | "shading" | "animation" | "scripting";

const WORKSPACES = [
  { id: "layout", label: "Layout", icon: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z", showOutliner: true, showProperties: true, showTimeline: true, showToolbar: true, editMode: "object" },
  { id: "modeling", label: "Modeling", icon: "M12 2L2 7v10l10 5 10-5V7z M2 7l10 5 10-5 M12 12v10", showOutliner: true, showProperties: true, showTimeline: false, showToolbar: true, editMode: "edit" },
  { id: "sculpting", label: "Sculpting", icon: "M3 21c0-4 4-7 9-7s9 3 9 7 M12 14V8 M9 11l3-3 3 3 M10 5a2 2 0 1 1 4 0", showOutliner: false, showProperties: true, showTimeline: false, showToolbar: true, editMode: "sculpt" },
  { id: "uv", label: "UV Editing", icon: "M3 3h18v18H3z M3 12h18 M12 3v18 M12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z", showOutliner: true, showProperties: true, showTimeline: false, showToolbar: true, editMode: "edit" },
  { id: "texture", label: "Texture Paint", icon: "M19 11l-7 7-4-4 7-7a2.83 2.83 0 0 1 4 4z M5 21l3-3", showOutliner: false, showProperties: true, showTimeline: false, showToolbar: true, editMode: "object" },
  { id: "shading", label: "Shading", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 2v20 M2 12h20", showOutliner: true, showProperties: true, showTimeline: false, showToolbar: false, editMode: "object" },
  { id: "animation", label: "Animation", icon: "M3 12h18 M6 6l-3 6 3 6 M18 6l3 6-3 6", showOutliner: true, showProperties: true, showTimeline: true, showToolbar: true, editMode: "object" },
  { id: "scripting", label: "Scripting", icon: "M8 6L4 12l4 6 M16 6l4 6-4 6 M14 4l-4 16", showOutliner: false, showProperties: true, showTimeline: false, showToolbar: false, editMode: "object" },
];

export default function WorkspaceTabs() {
  const setWorkspace = (id: WorkspaceId) => {
    const ws = WORKSPACES.find(w => w.id === id);
    if (!ws) return;
    const s = useStore.getState();
    if (s.showOutliner !== ws.showOutliner) s.togglePanel("outliner");
    if (s.showProperties !== ws.showProperties) s.togglePanel("properties");
    if (s.showTimeline !== ws.showTimeline) s.togglePanel("timeline");
    if (s.showToolbar !== ws.showToolbar) s.togglePanel("toolbar");
    if (ws.editMode) s.setEditMode(ws.editMode as any);
    s.showToast(`Workspace: ${ws.label}`, "info");
  };

  return (
    <div className="flex items-end h-full gap-0">
      {WORKSPACES.map(ws => (
        <button
          key={ws.id}
          onClick={() => setWorkspace(ws.id as WorkspaceId)}
          title={ws.label}
          className="relative flex flex-col items-center justify-end px-3 py-1 text-[10px] font-medium text-white/50 hover:text-white/80 transition-colors"
          style={{ minWidth: 52 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <path d={ws.icon} />
          </svg>
          <span>{ws.label}</span>
        </button>
      ))}
    </div>
  );
}
