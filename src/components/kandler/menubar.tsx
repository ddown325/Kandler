"use client";

import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";
import { useKandler } from "@/lib/kandler/store";
import { exportGLTF, exportOBJ, exportSTLBinary, exportSTLASCII, exportPLY, exportKandler } from "@/lib/kandler/export-lib";
import { toast } from "sonner";
import { useRef } from "react";
import { PrimitiveKind, LightKind } from "@/lib/kandler/types";

function download(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function MenuBar() {
  const scene = useKandler((s) => s.scene);
  const newScene = useKandler((s) => s.newScene);
  const loadScene = useKandler((s) => s.loadScene);
  const setSceneName = useKandler((s) => s.setSceneName);
  const addPrimitive = useKandler((s) => s.addPrimitive);
  const addLight = useKandler((s) => s.addLight);
  const addCamera = useKandler((s) => s.addCamera);
  const addGroup = useKandler((s) => s.addGroup);
  const addEmpty = useKandler((s) => s.addEmpty);
  const undo = useKandler((s) => s.undo);
  const redo = useKandler((s) => s.redo);
  const deleteObject = useKandler((s) => s.deleteObject);
  const duplicateObject = useKandler((s) => s.duplicateObject);
  const selectedIds = useKandler((s) => s.selectedIds);
  const setTransformMode = useKandler((s) => s.setTransformMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = (format: string) => {
    const name = scene.name || "untitled";
    switch (format) {
      case "kandler": download(`${name}.kndl`, exportKandler(scene), "application/json"); break;
      case "gltf": download(`${name}.gltf`, exportGLTF(scene, true), "model/gltf+json"); break;
      case "obj": download(`${name}.obj`, exportOBJ(scene), "model/obj"); break;
      case "stl": download(`${name}.stl`, exportSTLASCII(scene), "model/stl"); break;
    }
    toast.success(`Exported ${format.toUpperCase()}`);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        if (file.name.endsWith(".kndl") || file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (parsed.scene) loadScene(parsed.scene);
          else if (parsed.objects) loadScene(parsed);
          else throw new Error("Unknown scene format");
          toast.success(`Loaded ${file.name}`);
        } else {
          toast.info(`Import of ${file.name.split(".").pop()?.toUpperCase()} — use .kndl for full fidelity.`);
        }
      } catch (err: any) {
        toast.error(`Load failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const primitives: PrimitiveKind[] = ["cube", "sphere", "cylinder", "cone", "torus", "torusknot", "plane", "dodecahedron", "icosahedron", "octahedron", "tetrahedron", "circle", "capsule", "suzanne", "grid", "tube", "helix"];
  const lightKinds: LightKind[] = ["point", "directional", "spot", "hemisphere", "area"];

  return (
    <>
      <Menubar className="rounded-none border-b border-purple-500/30 bg-[#1a0e2e]/95">
        <div className="flex items-center gap-2 px-3 py-1">
          <img src="icons/kandler-192.png" alt="Kandler" className="w-7 h-7 rounded shadow-lg shadow-purple-500/40 object-cover" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-purple-100 tracking-wide text-sm">Kandler</span>
            <span className="text-[8px] text-purple-400/60 tracking-widest uppercase">by KANTASU</span>
          </div>
          <input
            value={scene.name}
            onChange={(e) => setSceneName(e.target.value)}
            className="ml-2 bg-transparent text-xs text-purple-300/70 border-b border-transparent focus:border-purple-400 outline-none px-1 w-40"
            placeholder="Scene name"
          />
        </div>
        <MenubarMenu>
          <MenubarTrigger className="text-purple-100 data-[highlighted]:bg-purple-500/20">File</MenubarTrigger>
          <MenubarContent className="bg-[#1a0e2e] border-purple-500/40">
            <MenubarItem onClick={() => newScene()} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">New Scene<MenubarShortcut>Ctrl+N</MenubarShortcut></MenubarItem>
            <MenubarSeparator className="bg-purple-500/20" />
            <MenubarItem onClick={() => fileInputRef.current?.click()} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Open…<MenubarShortcut>Ctrl+O</MenubarShortcut></MenubarItem>
            <MenubarSeparator className="bg-purple-500/20" />
            <MenubarItem onClick={() => save("kandler")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Save Kandler (.kndl)<MenubarShortcut>Ctrl+S</MenubarShortcut></MenubarItem>
            <MenubarSeparator className="bg-purple-500/20" />
            <MenubarItem onClick={() => save("gltf")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Export glTF 2.0 (.gltf)</MenubarItem>
            <MenubarItem onClick={() => save("obj")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Export OBJ</MenubarItem>
            <MenubarItem onClick={() => save("stl")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Export STL</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="text-purple-100 data-[highlighted]:bg-purple-500/20">Edit</MenubarTrigger>
          <MenubarContent className="bg-[#1a0e2e] border-purple-500/40">
            <MenubarItem onClick={undo} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Undo<MenubarShortcut>Ctrl+Z</MenubarShortcut></MenubarItem>
            <MenubarItem onClick={redo} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Redo<MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut></MenubarItem>
            <MenubarSeparator className="bg-purple-500/20" />
            <MenubarItem onClick={() => selectedIds.forEach(duplicateObject)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Duplicate<MenubarShortcut>Shift+D</MenubarShortcut></MenubarItem>
            <MenubarItem onClick={() => selectedIds.forEach(deleteObject)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Delete<MenubarShortcut>Del</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="text-purple-100 data-[highlighted]:bg-purple-500/20">Add</MenubarTrigger>
          <MenubarContent className="bg-[#1a0e2e] border-purple-500/40 min-w-[200px]">
            <div className="px-2 py-1 text-[10px] uppercase text-purple-400 tracking-wider">Mesh</div>
            {primitives.map((p) => (
              <MenubarItem key={p} onClick={() => addPrimitive(p)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white capitalize">{p === "suzanne" ? "Kitsune (Fox)" : p}</MenubarItem>
            ))}
            <MenubarSeparator className="bg-purple-500/20" />
            <div className="px-2 py-1 text-[10px] uppercase text-purple-400 tracking-wider">Light</div>
            {lightKinds.map((l) => (
              <MenubarItem key={l} onClick={() => addLight(l)} className="text-purple-100 focus:bg-purple-500/30 focus:text-white capitalize">{l}</MenubarItem>
            ))}
            <MenubarSeparator className="bg-purple-500/20" />
            <div className="px-2 py-1 text-[10px] uppercase text-purple-400 tracking-wider">Other</div>
            <MenubarItem onClick={() => addCamera()} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Camera</MenubarItem>
            <MenubarItem onClick={() => addGroup()} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Group</MenubarItem>
            <MenubarItem onClick={() => addEmpty()} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Empty</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="text-purple-100 data-[highlighted]:bg-purple-500/20">View</MenubarTrigger>
          <MenubarContent className="bg-[#1a0e2e] border-purple-500/40">
            <MenubarItem onClick={() => setTransformMode("translate")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Move Tool<MenubarShortcut>W</MenubarShortcut></MenubarItem>
            <MenubarItem onClick={() => setTransformMode("rotate")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Rotate Tool<MenubarShortcut>E</MenubarShortcut></MenubarItem>
            <MenubarItem onClick={() => setTransformMode("scale")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Scale Tool<MenubarShortcut>R</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="text-purple-100 data-[highlighted]:bg-purple-500/20">Help</MenubarTrigger>
          <MenubarContent className="bg-[#1a0e2e] border-purple-500/40">
            <MenubarItem onClick={() => toast.info("Kandler 3D Editor — by KANTASU. W/E/R = move/rotate/scale. Tab = edit mode. Shift+D = duplicate. Del = delete. Arrow keys = nudge. Right-drag = orbit. Shift+right-drag = pan. Wheel = zoom. Ctrl+P = command palette. ? = shortcuts.")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Keyboard Shortcuts</MenubarItem>
            <MenubarItem onClick={() => window.open("https://github.com/ddown325/Kandler", "_blank")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">GitHub Repository</MenubarItem>
            <MenubarItem onClick={() => toast.success("Install Kandler from your browser's menu → 'Install App' for offline use.")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">Install for Offline Use</MenubarItem>
            <MenubarSeparator className="bg-purple-500/20" />
            <MenubarItem onClick={() => toast.info("Kandler 3D Editor\nCreated by KANTASU\n\nA Blender-like 3D modeling editor built with Three.js. Installable as a PWA for offline use. Runs entirely in your browser — no backend required.")} className="text-purple-100 focus:bg-purple-500/30 focus:text-white">About Kandler</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <div className="ml-auto flex items-center gap-2 pr-3 text-[11px] text-purple-300/70">
          <img src="icons/kandler-192.png" alt="" className="w-4 h-4 rounded hidden md:inline" />
          <span className="text-purple-400/60">Powered by Three.js</span>
          <span className="text-purple-500/40">|</span>
          <span className="text-purple-300/50">KANTASU</span>
        </div>
      </Menubar>
      <input ref={fileInputRef} type="file" accept=".kndl,.json,.gltf,.obj" onChange={onImport} className="hidden" />
    </>
  );
}
