"use client";
/**
 * Kandler — Outliner Panel (left side)
 * Displays scene hierarchy: Collections → Objects. Supports visibility toggles,
 * selection sync, rename, delete, and collection colors.
 * Uses custom SVG icons (no emojis).
 *
 * Made by Kantasu.
 */
import { useState } from "react";
import { useStore } from "@/lib/kandler/store";
import { Icon, kindToIcon } from "@/components/kandler/Icon";

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="h-full flex flex-col bg-[#1f2228] text-white kandler-ui">
      <div className="kandler-panel-header flex items-center justify-between px-3 py-2">
        <span>Outliner</span>
        <div className="flex gap-1">
          <button
            title="New Collection"
            className="p-1 hover:bg-white/10 rounded"
            onClick={() => useStore.getState().addCollection({
              id: `col_${Date.now()}`,
              name: `Collection ${collections.length + 1}`,
              visible: true,
              selectable: true,
              color: "#e08a3c",
              objects: [],
              expanded: true,
            })}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto kandler-scroll">
        {collections.map(col => {
          const isCollapsed = collapsed[col.id];
          const allVisible = col.objects.every(id => objects[id]?.visible);
          return (
            <div key={col.id} className="select-none">
              <div
                className="flex items-center px-2 py-1 hover:bg-white/5 text-[12px] gap-1 cursor-pointer"
                onClick={() => setCollapsed(s => ({ ...s, [col.id]: !s[col.id] }))}
              >
                <button
                  className="w-3 text-white/50 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); setCollapsed(s => ({ ...s, [col.id]: !s[col.id] })); }}
                >
                  <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} size={12} />
                </button>
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
                    col.objects.forEach(id => update(id, { visible: !allVisible }));
                  }}
                >
                  <Icon name={allVisible ? "eye" : "eye-off"} size={12} />
                </button>
              </div>
              {!isCollapsed && col.objects.map(oid => {
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
                    <span className="text-white/70 flex items-center">
                      <Icon name={kindToIcon(obj.kind)} size={13} />
                    </span>
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
                      className="w-4 h-4 flex items-center justify-center text-white/50 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); update(oid, { visible: !obj.visible }); }}
                    >
                      <Icon name={obj.visible ? "eye" : "eye-off"} size={12} />
                    </button>
                    <button
                      title={obj.locked ? "Unlock" : "Lock"}
                      className="w-4 h-4 flex items-center justify-center text-white/50 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); update(oid, { locked: !obj.locked }); }}
                    >
                      <Icon name={obj.locked ? "lock" : "unlock"} size={12} />
                    </button>
                    <button
                      title="Delete"
                      className="w-4 h-4 flex items-center justify-center text-white/50 hover:text-red-400"
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${obj.name}?`)) remove(oid); }}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Stats footer */}
      <div className="border-t border-[#2f323a] px-3 py-1.5 text-[10px] text-white/50 font-mono">
        {Object.keys(objects).length} objects · {collections.length} collections
      </div>
    </div>
  );
}
