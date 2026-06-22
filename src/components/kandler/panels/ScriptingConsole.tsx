"use client";
/**
 * Kandler — Scripting Console
 * A JS REPL that exposes the Kandler API (store + viewport + scene objects)
 * so power users can automate tasks, batch-edit objects, generate geometry, etc.
 *
 * Made by Kantasu.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/kandler/store";
import { getViewport } from "@/lib/kandler/viewport-registry";
import { Icon } from "@/components/kandler/Icon";

export function ScriptingConsole({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const history = useStore(s => s.consoleHistory);
  const pushConsole = useStore(s => s.pushConsole);
  const clearConsole = useStore(s => s.clearConsole);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history.length]);

  const runCommand = (cmd: string) => {
    pushConsole({ type: "input", text: cmd });
    try {
      const store = useStore.getState();
      const vp = getViewport();
      const scene = vp?.scene;
      // Try expression first: return (expr)
      // Fall back to statement eval
      let fnBody: string;
      try {
        new Function(`return (${cmd});`);
        fnBody = `return (${cmd});`;
      } catch {
        fnBody = cmd.endsWith(";") ? cmd : `${cmd};`;
      }
      const fn = new Function(
        "store", "vp", "scene", "THREE", "useStore",
        `"use strict"; ${fnBody}`
      );
      const result = fn(store, vp, scene, THREE, useStore);
      Promise.resolve(result).then(r => {
        const text = r === undefined ? "undefined" : typeof r === "object" ? JSON.stringify(r, null, 2).slice(0, 500) : String(r);
        pushConsole({ type: "output", text });
      }).catch((err) => {
        pushConsole({ type: "error", text: String(err) });
      });
    } catch (err: any) {
      pushConsole({ type: "error", text: String(err.message || err) });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    runCommand(input.trim());
    setInput("");
  };

  const examples = [
    { label: "List all objects", code: "Object.values(store.objects).map(o => o.name)" },
    { label: "Add a cube at origin", code: 'const { generatePrimitiveMesh, defaultMaterial } = require("@/lib/kandler/store"); const mat = defaultMaterial(); store.addMaterial(mat); store.addObject({ id: "obj_" + Date.now(), name: "Scripted Cube", kind: "mesh", primitiveType: "cube", position: [0,0,0], rotation: [0,0,0], scale: [1,1,1], visible: true, visibleInRender: true, visibleInViewport: true, locked: false, materialSlots: [mat.id], activeMaterialIndex: 0, modifiers: [], collection: "Scene Collection", displayAsBounds: false, displayAsWire: false, mesh: generatePrimitiveMesh("cube") })' },
    { label: "Count vertices", code: "Object.values(store.objects).filter(o => o.kind === 'mesh').reduce((sum, o) => sum + (o.vertexCount || 0), 0)" },
    { label: "Move all cubes up by 2", code: "Object.values(store.objects).filter(o => o.primitiveType === 'cube').forEach(o => store.setObjectTransform(o.id, [o.position[0], o.position[1], o.position[2] + 2]))" },
    { label: "Get FPS", code: "store.fps" },
    { label: "List materials", code: "Object.values(store.materials).map(m => ({ name: m.name, color: m.baseColor }))" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#1e1a2e] text-white kandler-ui">
      <div className="kandler-panel-header flex items-center justify-between px-3 py-2">
        <span>Scripting Console (JavaScript)</span>
        <div className="flex gap-1">
          <button
            onClick={() => clearConsole()}
            title="Clear console"
            className="p-1 hover:bg-white/10 rounded"
          >
            <Icon name="trash" size={12} />
          </button>
          <button
            onClick={onClose}
            title="Close console"
            className="p-1 hover:bg-white/10 rounded"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto kandler-scroll p-2 font-mono text-[11px]">
        <div className="text-white/40 mb-2">
          Kandler v1.0 — JavaScript console. Exposed: <code className="text-[#b388ff]">store</code>, <code className="text-[#b388ff]">vp</code>, <code className="text-[#b388ff]">scene</code>, <code className="text-[#b388ff]">THREE</code>, <code className="text-[#b388ff]">useStore</code>
        </div>
        {history.length === 0 && (
          <div className="text-white/30 italic">Try: <code>Object.keys(store.objects)</code></div>
        )}
        {history.map((entry, i) => (
          <div
            key={i}
            className={`mb-1 ${
              entry.type === "input" ? "text-[#b388ff]" :
              entry.type === "error" ? "text-red-400" :
              "text-white/80"
            }`}
          >
            <span className="text-white/30 mr-1">
              {entry.type === "input" ? "›" : entry.type === "error" ? "✗" : "←"}
            </span>
            <pre className="whitespace-pre-wrap inline">{entry.text}</pre>
          </div>
        ))}
      </div>

      {/* Example chips */}
      <div className="px-2 py-1 border-t border-[#2d2840] flex flex-wrap gap-1 max-h-20 overflow-y-auto kandler-scroll">
        {examples.map(ex => (
          <button
            key={ex.label}
            onClick={() => setInput(ex.code)}
            className="text-[10px] px-2 py-0.5 bg-[#2a2440] hover:bg-[#3d3654] rounded text-white/70 hover:text-white"
            title={ex.code}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="flex gap-1 p-2 border-t border-[#2d2840]">
        <span className="text-[#b388ff] font-mono text-[12px] py-1">›</span>
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter JavaScript and press Enter"
          className="kandler-input flex-1"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-[#b388ff] text-black text-[11px] rounded font-medium hover:brightness-110"
        >
          Run
        </button>
      </form>
    </div>
  );
}
