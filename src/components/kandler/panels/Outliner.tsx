"use client";
/**
 * Kandler — Outliner Panel (left side)
 * Displays scene hierarchy: Collections → Objects. Supports visibility toggles,
 * selection sync, rename, delete, and collection colors.
 *
 * Made by Kantasu.
 */
import { useState } from "react";
import { useStore } from "@/lib/kandler/store";

export default function Outliner() {
  const collections = useStore(s => s.collections);
  const objects = useStore(s => s.objects);
  const selection = useStore(s => s.selection);
  const activeObjectId = useStore(s => s.activeObjectId);
  const select = useStore(s => s.selectObject);
  const update = useStore(s => s.updateObject);
  const remove = useStore(s => s.removeObject);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const kindIcon = (kind: string) => {
    switch (kind) {
      case "mesh": return "▣";
      case "light": return "💡";
      case "camera": return "📷";
      case "empty": return "◯";
      case "curve": return "∿";
      case "armature": return "🦴";
      default: return "•";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1f2228] text-white kandler-ui">
      <div className="kandler-panel-header flex items-center justify-between px-3 py-2">
        <span>Outliner</span>
        <div className="flex gap-1">
          <button
            title="New Collection"
            className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[10px]"
            onClick={() => useStore.getState().addCollection({
              id: `col_${Date.now()}`,
              name: `Collection ${collections.length + 1}`,
              visible: true,
              selectable: true,
              color: "#e08a3c",
              objects: [],
              expanded: true,
            })}
          >+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto kandler-scroll">
        {collections.map(col => (
          <div key={col.id} className="select-none">
            <div className="flex items-center px-2 py-1 hover:bg-white/5 text-[12px] gap-1">
              <span className="w-3 text-white/50 text-[10px]">{col.expanded ? "▼" : "▶"}</span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: col.color }}
                title="Collection color"
              />
              <span className="text-white/85">{col.name}</span>
              <span className="text-white/40 text-[10px]">({col.objects.length})</span>
              <div className="flex-1" />
              <button
                className="w-4 h-4 flex items-center justify-center text-white/50 hover:text-white"
                title="Toggle collection visibility"
                onClick={(e) => {
                  e.stopPropagation();
                  // simple toggle for all objects in collection
                  const allVisible = col.objects.every(id => objects[id]?.visible);
                  col.objects.forEach(id => update(id, { visible: !allVisible }));
                }}
              >
                {col.objects.every(id => objects[id]?.visible) ? "👁" : "–"}
              </button>
            </div>
            {col.expanded && col.objects.map(oid => {
              const obj = objects[oid];
              if (!obj) return null;
              const selected = selection.objects.includes(oid);
              const active = activeObjectId === oid;
              return (
                <div
                  key={oid}
                  className={`flex items-center pl-7 pr-2 py-1 text-[12px] cursor-pointer gap-1.5 ${active ? "bg-[#e08a3c]/30" : selected ? "bg-white/10" : "hover:bg-white/5"}`}
                  onClick={(e) => select(oid, e.shiftKey)}
                  onDoubleClick={() => { setRenaming(oid); setRenameValue(obj.name); }}
                >
                  <span className="text-white/60 text-[11px]">{kindIcon(obj.kind)}</span>
                  {renaming === oid ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => { update(oid, { name: renameValue || obj.name }); setRenaming(null); }}
                      onKeyDown={e => { if (e.key === "Enter") { update(oid, { name: renameValue || obj.name }); setRenaming(null); } }}
                      className="kandler-input"
                    />
                  ) : (
                    <span className={obj.locked ? "text-white/40" : "text-white/90"}>{obj.name}</span>
                  )}
                  <div className="flex-1" />
                  <button
                    title={obj.visible ? "Hide" : "Show"}
                    className="w-4 h-4 flex items-center justify-center text-white/40 hover:text-white text-[10px]"
                    onClick={(e) => { e.stopPropagation(); update(oid, { visible: !obj.visible }); }}
                  >
                    {obj.visible ? "👁" : "–"}
                  </button>
                  <button
                    title="Lock"
                    className="w-4 h-4 flex items-center justify-center text-white/40 hover:text-white text-[10px]"
                    onClick={(e) => { e.stopPropagation(); update(oid, { locked: !obj.locked }); }}
                  >
                    {obj.locked ? "🔒" : ""}
                  </button>
                  <button
                    title="Delete"
                    className="w-4 h-4 flex items-center justify-center text-white/40 hover:text-red-400 text-[10px]"
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${obj.name}?`)) remove(oid); }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Stats footer */}
      <div className="border-t border-[#2f323a] px-3 py-1.5 text-[10px] text-white/50 font-mono">
        {Object.keys(objects).length} objects · {collections.length} collections
      </div>
    </div>
  );
}
