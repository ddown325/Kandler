"use client";
/**
 * Kandler — Node-based Shader Editor
 * Visual node graph for building materials. Supports:
 *   - Output, PBR, Diffuse, Emission, Mix Shader
 *   - Color Ramp, TexCoord, Noise/Checker/Brick/Gradient textures
 *   - Math, Vector Math, Value, Color, Normal Map, Bump
 *
 * Made by Kantasu.
 */
import { useEffect, useRef, useState } from "react";
import { useStore, defaultMaterial, uid } from "@/lib/kandler/store";
import type { ShaderNode, ShaderNodeGraph, ShaderNodeType } from "@/lib/kandler/types-extended";
import { Icon } from "@/components/kandler/Icon";

const NODE_DEFS: Record<ShaderNodeType, { label: string; inputs: string[]; outputs: string[]; color: string }> = {
  output: { label: "Material Output", inputs: ["Surface"], outputs: [], color: "#b388ff" },
  pbr: { label: "Principled BSDF", inputs: ["Base Color", "Metallic", "Roughness", "Normal"], outputs: ["BSDF"], color: "#7c5cff" },
  diffuse: { label: "Diffuse BSDF", inputs: ["Color", "Roughness", "Normal"], outputs: ["BSDF"], color: "#7c5cff" },
  emission: { label: "Emission", inputs: ["Color", "Strength"], outputs: ["BSDF"], color: "#9d7cff" },
  "mix-shader": { label: "Mix Shader", inputs: ["Fac", "Shader A", "Shader B"], outputs: ["Shader"], color: "#7c5cff" },
  "color-ramp": { label: "Color Ramp", inputs: ["Fac"], outputs: ["Color"], color: "#c4a4ff" },
  "tex-coord": { label: "Texture Coordinate", inputs: [], outputs: ["UV", "Object", "Generated"], color: "#a78bfa" },
  "tex-noise": { label: "Noise Texture", inputs: ["Vector", "Scale", "Detail"], outputs: ["Fac", "Color"], color: "#a78bfa" },
  "tex-checker": { label: "Checker Texture", inputs: ["Vector", "Color A", "Color B", "Scale"], outputs: ["Fac", "Color"], color: "#a78bfa" },
  "tex-brick": { label: "Brick Texture", inputs: ["Vector", "Color A", "Color B", "Scale"], outputs: ["Fac", "Color"], color: "#a78bfa" },
  "tex-gradient": { label: "Gradient Texture", inputs: ["Vector"], outputs: ["Fac"], color: "#a78bfa" },
  math: { label: "Math", inputs: ["A", "B"], outputs: ["Value"], color: "#c4a4ff" },
  "vector-math": { label: "Vector Math", inputs: ["A", "B"], outputs: ["Vector"], color: "#c4a4ff" },
  value: { label: "Value", inputs: [], outputs: ["Value"], color: "#7dd3fc" },
  color: { label: "Color", inputs: [], outputs: ["Color"], color: "#7dd3fc" },
  "normal-map": { label: "Normal Map", inputs: ["Color", "Strength"], outputs: ["Normal"], color: "#a78bfa" },
  bump: { label: "Bump", inputs: ["Height", "Strength", "Normal"], outputs: ["Normal"], color: "#a78bfa" },
};

export function ShaderEditor({ onClose }: { onClose: () => void }) {
  const activeId = useStore(s => s.activeObjectId);
  const objects = useStore(s => s.objects);
  const setShaderGraph = useStore(s => s.setShaderGraph);
  const obj = activeId ? objects[activeId] : null;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [linking, setLinking] = useState<{ fromNode: string; fromOutput: string } | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const graph: ShaderNodeGraph = obj?.shaderGraph || { nodes: [], output: null };

  useEffect(() => {
    if (!obj || !obj.shaderGraph) {
      // Initialize default graph with output + PBR
      const outId = uid("node");
      const pbrId = uid("node");
      const newGraph: ShaderNodeGraph = {
        nodes: [
          { id: outId, type: "output", name: "Material Output", position: { x: 400, y: 200 }, params: {}, inputs: { Surface: { nodeId: pbrId, outputName: "BSDF" } } },
          { id: pbrId, type: "pbr", name: "Principled BSDF", position: { x: 200, y: 200 }, params: { baseColor: "#b0b0b0", metallic: 0, roughness: 0.5 }, inputs: {} },
        ],
        output: outId,
      };
      if (activeId) setShaderGraph(activeId, newGraph);
    }
  }, [activeId]);

  const addNode = (type: ShaderNodeType) => {
    if (!activeId) return;
    const def = NODE_DEFS[type];
    const newNode: ShaderNode = {
      id: uid("node"),
      type,
      name: def.label,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      params: type === "value" ? { value: 1 } : type === "color" ? { color: "#ffffff" } : {},
      inputs: {},
    };
    setShaderGraph(activeId, {
      nodes: [...graph.nodes, newNode],
      output: graph.output,
    });
  };

  const moveNode = (nodeId: string, x: number, y: number) => {
    if (!activeId) return;
    setShaderGraph(activeId, {
      nodes: graph.nodes.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n),
      output: graph.output,
    });
  };

  const startLink = (nodeId: string, outputName: string) => {
    setLinking({ fromNode: nodeId, fromOutput: outputName });
  };

  const completeLink = (nodeId: string, inputName: string) => {
    if (!activeId || !linking) return;
    setShaderGraph(activeId, {
      nodes: graph.nodes.map(n => n.id === nodeId ? {
        ...n,
        inputs: { ...n.inputs, [inputName]: { nodeId: linking.fromNode, outputName: linking.fromOutput } },
      } : n),
      output: graph.output,
    });
    setLinking(null);
  };

  const startDrag = (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ nodeId, offsetX: e.clientX - rect.left - nodeX, offsetY: e.clientY - rect.top - nodeY });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      moveNode(dragging.nodeId, e.clientX - rect.left - dragging.offsetX, e.clientY - rect.top - dragging.offsetY);
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  return (
    <div className="h-full flex flex-col bg-[#1e1a2e] text-white kandler-ui">
      <div className="kandler-panel-header flex items-center justify-between px-3 py-2">
        <span>Shader Node Editor {obj && `— ${obj.name}`}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><Icon name="x" size={12} /></button>
      </div>

      {/* Add node buttons */}
      <div className="px-2 py-1 border-b border-[#2d2840] flex flex-wrap gap-1 max-h-20 overflow-y-auto kandler-scroll">
        {Object.entries(NODE_DEFS).map(([type, def]) => (
          <button
            key={type}
            onClick={() => addNode(type as ShaderNodeType)}
            className="text-[10px] px-2 py-0.5 bg-[#2a2440] hover:bg-[#3d3654] rounded text-white/70 hover:text-white"
            style={{ borderLeft: `2px solid ${def.color}` }}
          >
            {def.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(170,130,255,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        onMouseMove={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onClick={() => setLinking(null)}
      >
        {/* Render links (SVG bezier curves) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {graph.nodes.flatMap(node =>
            Object.entries(node.inputs).map(([inputName, link]) => {
              if (!link) return null;
              const fromNode = graph.nodes.find(n => n.id === link.nodeId);
              if (!fromNode) return null;
              const fromDef = NODE_DEFS[fromNode.type];
              const toDef = NODE_DEFS[node.type];
              const fromOutIdx = fromDef.outputs.indexOf(link.outputName);
              const toInIdx = toDef.inputs.indexOf(inputName);
              const x1 = fromNode.position.x + 180;
              const y1 = fromNode.position.y + 20 + fromOutIdx * 20;
              const x2 = node.position.x;
              const y2 = node.position.y + 20 + toInIdx * 20;
              const c1 = x1 + 60, c2 = x2 - 60;
              return (
                <path
                  key={`${link.nodeId}-${link.outputName}-${node.id}-${inputName}`}
                  d={`M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`}
                  stroke="#b388ff"
                  strokeWidth="2"
                  fill="none"
                />
              );
            })
          )}
          {linking && (() => {
            const fromNode = graph.nodes.find(n => n.id === linking.fromNode);
            if (!fromNode) return null;
            const fromDef = NODE_DEFS[fromNode.type];
            const fromOutIdx = fromDef.outputs.indexOf(linking.fromOutput);
            const x1 = fromNode.position.x + 180;
            const y1 = fromNode.position.y + 20 + fromOutIdx * 20;
            return (
              <path
                d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${mouse.x - 60} ${mouse.y}, ${mouse.x} ${mouse.y}`}
                stroke="#b388ff"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
            );
          })()}
        </svg>

        {/* Render nodes */}
        {graph.nodes.map(node => {
          const def = NODE_DEFS[node.type];
          return (
            <div
              key={node.id}
              className="absolute bg-[#241f38] border border-[#3d3654] rounded shadow-lg select-none"
              style={{ left: node.position.x, top: node.position.y, width: 180, zIndex: 2 }}
            >
              <div
                className="px-2 py-1 text-[11px] font-semibold cursor-move flex items-center justify-between"
                style={{ background: def.color, color: "#1a1626" }}
                onMouseDown={(e) => startDrag(e, node.id, node.position.x, node.position.y)}
              >
                {node.name}
              </div>
              <div className="p-2">
                {def.inputs.length > 0 && (
                  <div className="mb-1">
                    {def.inputs.map(input => (
                      <div key={input} className="flex items-center gap-1 text-[10px] py-0.5">
                        <div
                          className="w-2 h-2 rounded-full bg-[#b388ff] cursor-crosshair"
                          onClick={() => completeLink(node.id, input)}
                          title="Click to connect"
                        />
                        <span className="text-white/70">{input}</span>
                      </div>
                    ))}
                  </div>
                )}
                {def.outputs.length > 0 && (
                  <div>
                    {def.outputs.map(output => (
                      <div key={output} className="flex items-center justify-end gap-1 text-[10px] py-0.5">
                        <span className="text-white/70">{output}</span>
                        <div
                          className="w-2 h-2 rounded-full bg-[#b388ff] cursor-crosshair"
                          onMouseDown={() => startLink(node.id, output)}
                          title="Drag to connect"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* Type-specific params */}
                {node.type === "value" && (
                  <input
                    type="number"
                    value={(node.params.value as number) || 0}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setShaderGraph(activeId!, {
                        nodes: graph.nodes.map(n => n.id === node.id ? { ...n, params: { ...n.params, value: v } } : n),
                        output: graph.output,
                      });
                    }}
                    className="kandler-input mt-1"
                    step={0.1}
                  />
                )}
                {node.type === "color" && (
                  <input
                    type="color"
                    value={(node.params.color as string) || "#ffffff"}
                    onChange={(e) => {
                      setShaderGraph(activeId!, {
                        nodes: graph.nodes.map(n => n.id === node.id ? { ...n, params: { ...n.params, color: e.target.value } } : n),
                        output: graph.output,
                      });
                    }}
                    className="w-full h-6 mt-1 rounded cursor-pointer"
                  />
                )}
                {node.type === "pbr" && (
                  <input
                    type="color"
                    value={(node.params.baseColor as string) || "#b0b0b0"}
                    onChange={(e) => {
                      setShaderGraph(activeId!, {
                        nodes: graph.nodes.map(n => n.id === node.id ? { ...n, params: { ...n.params, baseColor: e.target.value } } : n),
                        output: graph.output,
                      });
                    }}
                    className="w-full h-6 mt-1 rounded cursor-pointer"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
