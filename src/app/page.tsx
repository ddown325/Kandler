"use client";

import { useEffect } from "react";
import { MenuBar } from "@/components/kandler/menubar";
import { Toolbar } from "@/components/kandler/toolbar";
import { Outliner } from "@/components/kandler/outliner";
import { PropertiesPanel } from "@/components/kandler/properties-panel";
import { WorldPanel } from "@/components/kandler/world-panel";
import { Timeline } from "@/components/kandler/timeline";
import { Viewport } from "@/components/kandler/viewport";
import { useKandler } from "@/lib/kandler/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Globe, Palette, Box as BoxIcon } from "lucide-react";

export default function Page() {
  const undo = useKandler((s) => s.undo);
  const redo = useKandler((s) => s.redo);
  const deleteObject = useKandler((s) => s.deleteObject);
  const duplicateObject = useKandler((s) => s.duplicateObject);
  const setTransformMode = useKandler((s) => s.setTransformMode);
  const pushHistory = useKandler((s) => s.pushHistory);
  const selectedIds = useKandler((s) => s.selectedIds);

  // global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          selectedIds.forEach(deleteObject);
        }
      } else if (e.key === "d" && e.shiftKey) {
        e.preventDefault();
        selectedIds.forEach((id) => duplicateObject(id));
      } else if (e.key === "w" || e.key === "W") setTransformMode("translate");
      else if (e.key === "e" || e.key === "E") setTransformMode("rotate");
      else if (e.key === "r" || e.key === "R") setTransformMode("scale");
      else if (e.key === "a" && !meta) {
        // select all
        const ids = Object.keys(useKandler.getState().scene.objects);
        useKandler.getState().select(ids, false);
      } else if (e.key === "g") {
        // grab — begin transform snapshot
        pushHistory();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("kandler:nudge", {
          detail: { key: e.key, mode: useKandler.getState().scene.ui.transformMode, step: 0.01, rotStep: 0.0175, selectedIds: [...selectedIds] },
        }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteObject, duplicateObject, setTransformMode, pushHistory, selectedIds]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0614] text-purple-100 overflow-hidden select-none">
      <MenuBar />
      <Toolbar />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* left: outliner */}
          <ResizablePanel defaultSize={18} minSize={12} maxSize={32} className="bg-[#150b25]">
            <Outliner />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-purple-500/30" />
          {/* center: viewport + timeline */}
          <ResizablePanel defaultSize={58} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={75} minSize={30} className="bg-[#0a0614]">
                <Viewport />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-purple-500/30" />
              <ResizablePanel defaultSize={25} minSize={10} maxSize={50}>
                <Timeline />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-purple-500/30" />
          {/* right: properties / world / materials tabs */}
          <ResizablePanel defaultSize={24} minSize={16} maxSize={45}>
            <Tabs defaultValue="properties" className="h-full flex flex-col bg-[#150b25]">
              <TabsList className="grid grid-cols-3 rounded-none border-b border-purple-500/30 bg-[#1a0e2e] h-9">
                <TabsTrigger value="properties" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200 gap-1">
                  <BoxIcon className="w-3 h-3" /> Props
                </TabsTrigger>
                <TabsTrigger value="world" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200 gap-1">
                  <Globe className="w-3 h-3" /> World
                </TabsTrigger>
                <TabsTrigger value="materials" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-white text-purple-200 gap-1">
                  <Palette className="w-3 h-3" /> Mats
                </TabsTrigger>
              </TabsList>
              <TabsContent value="properties" className="flex-1 min-h-0 m-0">
                <PropertiesPanel />
              </TabsContent>
              <TabsContent value="world" className="flex-1 min-h-0 m-0">
                <WorldPanel />
              </TabsContent>
              <TabsContent value="materials" className="flex-1 min-h-0 m-0 overflow-y-auto">
                <MaterialsList />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <StatusBar />
    </div>
  );
}

function MaterialsList() {
  const materials = useKandler((s) => s.scene.materials);
  const addMaterial = useKandler((s) => s.addMaterial);
  const update = useKandler((s) => s.updateMaterial);
  const deleteMat = useKandler((s) => s.deleteMaterial);
  return (
    <div className="bg-[#150b25]">
      <div className="px-3 py-2 border-b border-purple-500/30 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">Materials</span>
        <button onClick={() => addMaterial()} className="text-purple-300 hover:text-white text-xs">+ New</button>
      </div>
      <div className="divide-y divide-purple-500/15">
        {Object.values(materials).map((m) => (
          <div key={m.id} className="px-3 py-2 hover:bg-purple-500/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-purple-500/30" style={{ background: `rgb(${m.color.map((c) => Math.round(c * 255)).join(",")})` }} />
              <input
                value={m.name}
                onChange={(e) => update(m.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-xs text-purple-100 outline-none border-b border-transparent focus:border-purple-500/50"
              />
              <span className="text-[9px] text-purple-400 uppercase">{m.type}</span>
              <button onClick={() => deleteMat(m.id)} className="text-red-300 hover:text-red-400 text-xs">del</button>
            </div>
          </div>
        ))}
        {Object.keys(materials).length === 0 && (
          <div className="text-center text-xs text-purple-400/60 py-8">No materials. Click "+ New" above.</div>
        )}
      </div>
    </div>
  );
}

function StatusBar() {
  const scene = useKandler((s) => s.scene);
  const selectedIds = useKandler((s) => s.selectedIds);
  const objCount = Object.keys(scene.objects).length;
  const meshCount = Object.values(scene.objects).filter((o) => o.kind === "mesh").length;
  const lightCount = Object.values(scene.objects).filter((o) => o.kind === "light").length;
  const camCount = Object.values(scene.objects).filter((o) => o.kind === "camera").length;
  return (
    <div className="flex items-center gap-4 px-3 py-1 text-[10px] text-purple-300/80 bg-[#1a0e2e] border-t border-purple-500/30 font-mono">
      <img src="icons/kandler-192.png" alt="" className="w-3 h-3 rounded" />
      <span className="text-purple-200">Kandler 3D</span>
      <span className="text-purple-500/40">|</span>
      <span>Engine: <strong className="text-fuchsia-300">three.js</strong></span>
      <span className="text-purple-500/40">|</span>
      <span>{objCount} obj · {meshCount} mesh · {lightCount} light · {camCount} cam</span>
      <span className="text-purple-500/40">|</span>
      <span>{selectedIds.length} selected</span>
      <span className="text-purple-500/40">|</span>
      <span>Mode: {scene.ui.transformMode}</span>
      <div className="ml-auto flex items-center gap-3">
        <span>Snap: {scene.ui.snapEnabled ? "ON" : "off"}</span>
        <span className="text-purple-500/40">|</span>
        <span className="text-purple-400 hidden md:inline">W/E/R · Tab edit · Z wire · Ctrl+P palette · ? help</span>
        <span className="text-purple-500/40">|</span>
        <span className="text-purple-300/50">by KANTASU</span>
      </div>
    </div>
  );
}
