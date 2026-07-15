"use client";

import { useKandler } from "@/lib/kandler/store";
import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, Box, Lightbulb, Camera, Layers, Folder, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import type { SceneObject, ObjectKind } from "@/lib/kandler/types";

function iconFor(kind: ObjectKind) {
  switch (kind) {
    case "mesh": return <Box className="w-3.5 h-3.5 text-purple-300" />;
    case "light": return <Lightbulb className="w-3.5 h-3.5 text-yellow-300" />;
    case "camera": return <Camera className="w-3.5 h-3.5 text-cyan-300" />;
    case "group": return <Folder className="w-3.5 h-3.5 text-fuchsia-300" />;
    case "empty": return <Layers className="w-3.5 h-3.5 text-purple-200/60" />;
    default: return <Box className="w-3.5 h-3.5 text-purple-300" />;
  }
}

export function Outliner() {
  const scene = useKandler((s) => s.scene);
  const selectedIds = useKandler((s) => s.selectedIds);
  const select = useKandler((s) => s.select);
  const toggleSelect = useKandler((s) => s.toggleSelect);
  const setObjectVisible = useKandler((s) => s.setObjectVisible);
  const setObjectLocked = useKandler((s) => s.setObjectLocked);
  const deleteObject = useKandler((s) => s.deleteObject);
  const renameObject = useKandler((s) => s.renameObject);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);

  const toggleCollapse = (id: string) => {
    const s = new Set(collapsed);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setCollapsed(s);
  };

  const renderNode = (id: string, depth = 0) => {
    const o: SceneObject | undefined = scene.objects[id];
    if (!o) return null;
    const isSel = selectedIds.includes(id);
    const hasChildren = (o.children?.length ?? 0) > 0;
    const isCol = collapsed.has(id);
    return (
      <div key={id}>
        <div
          className={`group flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer text-xs ${isSel ? "bg-purple-500/40 text-white" : "hover:bg-purple-500/15 text-purple-100"}`}
          style={{ paddingLeft: 6 + depth * 12 }}
          onClick={(e) => {
            if (e.shiftKey) toggleSelect(id);
            else select([id], false);
          }}
        >
          <button
            className="w-3 h-3 flex items-center justify-center text-purple-300 hover:text-white"
            onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
          >
            {hasChildren ? (isCol ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
          </button>
          {iconFor(o.kind)}
          {editing === id ? (
            <input
              autoFocus
              defaultValue={o.name}
              onBlur={(e) => { renameObject(id, e.target.value); setEditing(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { renameObject(id, (e.target as HTMLInputElement).value); setEditing(null); } }}
              className="bg-[#1a0e2e] border border-purple-500/40 px-1 outline-none rounded text-xs flex-1"
            />
          ) : (
            <span
              className="flex-1 truncate"
              onDoubleClick={() => setEditing(id)}
            >{o.name}</span>
          )}
          <button
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-purple-300 hover:text-white"
            onClick={(e) => { e.stopPropagation(); setObjectVisible(id, !o.visible); }}
          >
            {o.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-purple-300 hover:text-white"
            onClick={(e) => { e.stopPropagation(); setObjectLocked(id, !o.locked); }}
          >
            {o.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-300 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); deleteObject(id); }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {!isCol && hasChildren && o.children!.map((cid) => renderNode(cid, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#150b25]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">Scene Outliner</span>
        <Plus className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {scene.rootOrder.map((id) => renderNode(id))}
        {scene.rootOrder.length === 0 && (
          <div className="text-center text-purple-400/60 text-xs py-8">No objects yet</div>
        )}
      </div>
    </div>
  );
}
