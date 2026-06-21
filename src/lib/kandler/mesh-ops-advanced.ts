/**
 * Kandler — Advanced Mesh Operations
 * - Boolean CSG (union/difference/intersect) — simple geometric
 * - UV unwrap (planar projection)
 * - Sculpt brushes (grab/smooth/inflate/draw/drag-dot)
 * - Procedural geometry node evaluators
 *
 * Made by Kantasu.
 */
import { MeshData, Vertex, Face } from "./store";
import type { GeoNodeGraph, GeoNode } from "./types-extended";

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

// ---------- Boolean CSG (simple geometric) ----------
// Implementation: builds a unified vertex pool from A and B, then keeps faces
// from A whose centroid is outside B (for difference), inside B (for intersect),
// or both (for union). Approximate — true CSG would need intersection edges.
export function booleanMesh(
  a: MeshData,
  b: MeshData,
  operation: "union" | "difference" | "intersect"
): MeshData {
  const result: MeshData = { vertices: [], edges: [], faces: [] };
  const aOffset = 0;
  const bOffset = a.vertices.length;
  result.vertices = [...a.vertices, ...b.vertices];

  const centroidInsideB = (face: Face, verts: Vertex[]): boolean => {
    let cx = 0, cy = 0, cz = 0;
    for (const i of face.indices) {
      cx += verts[i].x; cy += verts[i].y; cz += verts[i].z;
    }
    cx /= face.indices.length; cy /= face.indices.length; cz /= face.indices.length;
    // Simple "inside" test: check if centroid is inside B's bounding box
    let minB = { x: Infinity, y: Infinity, z: Infinity };
    let maxB = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const v of b.vertices) {
      minB = { x: Math.min(minB.x, v.x), y: Math.min(minB.y, v.y), z: Math.min(minB.z, v.z) };
      maxB = { x: Math.max(maxB.x, v.x), y: Math.max(maxB.y, v.y), z: Math.max(maxB.z, v.z) };
    }
    return cx >= minB.x && cx <= maxB.x && cy >= minB.y && cy <= maxB.y && cz >= minB.z && cz <= maxB.z;
  };

  const remappedA = a.faces.map(f => ({ indices: f.indices.map(i => i + aOffset), materialIndex: f.materialIndex }));
  const remappedB = b.faces.map(f => ({ indices: f.indices.map(i => i + bOffset), materialIndex: f.materialIndex }));

  if (operation === "union") {
    // Keep A faces outside B, plus all B faces
    for (const f of remappedA) if (!centroidInsideB(f, result.vertices)) result.faces.push(f);
    for (const f of remappedB) result.faces.push(f);
  } else if (operation === "difference") {
    // Keep A faces outside B
    for (const f of remappedA) if (!centroidInsideB(f, result.vertices)) result.faces.push(f);
  } else if (operation === "intersect") {
    // Keep A faces inside B
    for (const f of remappedA) if (centroidInsideB(f, result.vertices)) result.faces.push(f);
  }
  return result;
}

// ---------- UV Unwrap (planar projection) ----------
export function planarUnwrap(mesh: MeshData, axis: "x" | "y" | "z" = "z"): {
  uvs: [number, number][];
  faceUVs: number[][];
} {
  // Project vertices onto the chosen axis plane and normalize to 0..1
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  const rawUVs: [number, number][] = mesh.vertices.map(v => {
    const u = axis === "x" ? v.y : v.x;
    const vv = axis === "z" ? v.y : v.z;
    minU = Math.min(minU, u); minV = Math.min(minV, vv);
    maxU = Math.max(maxU, u); maxV = Math.max(maxV, vv);
    return [u, vv];
  });
  const rangeU = Math.max(0.0001, maxU - minU);
  const rangeV = Math.max(0.0001, maxV - minV);
  const uvs = rawUVs.map(([u, v]) => [(u - minU) / rangeU, (v - minV) / rangeV] as [number, number]);
  const faceUVs = mesh.faces.map(f => f.indices.map(i => i));
  return { uvs, faceUVs };
}

// ---------- Sculpt Brushes ----------
export type SculptBrush = "grab" | "smooth" | "inflate" | "draw" | "drag-dot" | "flatten" | "pinch";

export function sculptStroke(
  mesh: MeshData,
  brush: SculptBrush,
  center: [number, number, number],
  radius: number,
  strength: number,
  delta: [number, number, number] = [0, 0, 0]
): MeshData {
  const result = clone(mesh);
  const [cx, cy, cz] = center;
  const r2 = radius * radius;
  for (let i = 0; i < result.vertices.length; i++) {
    const v = result.vertices[i];
    const dx = v.x - cx, dy = v.y - cy, dz = v.z - cz;
    const dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 > r2) continue;
    const falloff = 1 - Math.sqrt(dist2) / radius;
    const f = falloff * falloff * strength;
    switch (brush) {
      case "grab":
      case "drag-dot": {
        v.x += delta[0] * falloff;
        v.y += delta[1] * falloff;
        v.z += delta[2] * falloff;
        break;
      }
      case "smooth": {
        // Average with neighbors (just nudge toward centroid of all verts within radius)
        let sx = 0, sy = 0, sz = 0, count = 0;
        for (let j = 0; j < mesh.vertices.length; j++) {
          const nv = mesh.vertices[j];
          const ndx = nv.x - cx, ndy = nv.y - cy, ndz = nv.z - cz;
          if (ndx * ndx + ndy * ndy + ndz * ndz > r2) continue;
          sx += nv.x; sy += nv.y; sz += nv.z; count++;
        }
        if (count > 1) {
          sx /= count; sy /= count; sz /= count;
          v.x += (sx - v.x) * 0.5 * falloff;
          v.y += (sy - v.y) * 0.5 * falloff;
          v.z += (sz - v.z) * 0.5 * falloff;
        }
        break;
      }
      case "inflate": {
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        v.x += (dx / len) * f;
        v.y += (dy / len) * f;
        v.z += (dz / len) * f;
        break;
      }
      case "draw": {
        // Push along average face normal at this vertex (approximate: use +Z)
        v.z += f;
        break;
      }
      case "flatten": {
        // Flatten to average z within brush
        let avgZ = 0, count = 0;
        for (let j = 0; j < mesh.vertices.length; j++) {
          const nv = mesh.vertices[j];
          const ndx = nv.x - cx, ndy = nv.y - cy, ndz = nv.z - cz;
          if (ndx * ndx + ndy * ndy + ndz * ndz > r2) continue;
          avgZ += nv.z; count++;
        }
        if (count > 0) {
          avgZ /= count;
          v.z += (avgZ - v.z) * falloff * 0.5;
        }
        break;
      }
      case "pinch": {
        // Pull vertices toward brush center
        v.x -= dx * falloff * 0.3;
        v.y -= dy * falloff * 0.3;
        v.z -= dz * falloff * 0.3;
        break;
      }
    }
  }
  return result;
}

// ---------- Geometry Node Evaluator ----------
// Walks a node graph and produces a final mesh by composing primitive generators,
// transforms, arrays, and displace operations.
export function evaluateGeoNodeGraph(graph: GeoNodeGraph): MeshData | null {
  if (!graph.output) return null;
  const evaluated = new Map<string, MeshData>();
  const byId = new Map<string, GeoNode>(graph.nodes.map(n => [n.id, n]));
  const evaluate = (nodeId: string): MeshData | null => {
    if (evaluated.has(nodeId)) return evaluated.get(nodeId)!;
    const node = byId.get(nodeId);
    if (!node) return null;
    let result: MeshData | null = null;
    switch (node.type) {
      case "input-mesh":
        result = { vertices: [], edges: [], faces: [] }; // placeholder
        break;
      case "input-primitive": {
        const shape = (node.params.shape as string) || "cube";
        // Reuse generatePrimitiveMesh via dynamic import would be cleaner; for now inline simple shapes
        if (shape === "cube") {
          result = makeBox(
            (node.params.size as number) || 1,
            (node.params.size as number) || 1,
            (node.params.size as number) || 1
          );
        } else if (shape === "sphere") {
          result = makeSphere((node.params.size as number) || 1, 16, 12);
        } else {
          result = makeBox(1, 1, 1);
        }
        break;
      }
      case "transform": {
        const inputId = node.inputs["mesh"];
        const input = inputId ? evaluate(inputId) : null;
        if (!input) { result = null; break; }
        const tx = (node.params.x as number) || 0;
        const ty = (node.params.y as number) || 0;
        const tz = (node.params.z as number) || 0;
        const s = (node.params.scale as number) || 1;
        result = {
          vertices: input.vertices.map(v => ({ x: v.x * s + tx, y: v.y * s + ty, z: v.z * s + tz })),
          edges: input.edges,
          faces: input.faces,
        };
        break;
      }
      case "array-linear": {
        const inputId = node.inputs["mesh"];
        const input = inputId ? evaluate(inputId) : null;
        if (!input) { result = null; break; }
        const count = (node.params.count as number) || 3;
        const offset = (node.params.offset as number) || 2;
        const axis = (node.params.axis as string) || "x";
        const verts: Vertex[] = [];
        const faces: Face[] = [];
        for (let i = 0; i < count; i++) {
          const baseIdx = verts.length;
          const off = i * offset;
          for (const v of input.vertices) {
            verts.push({
              x: v.x + (axis === "x" ? off : 0),
              y: v.y + (axis === "y" ? off : 0),
              z: v.z + (axis === "z" ? off : 0),
            });
          }
          for (const f of input.faces) {
            faces.push({ indices: f.indices.map(j => j + baseIdx), materialIndex: f.materialIndex });
          }
        }
        result = { vertices: verts, edges: [], faces };
        break;
      }
      case "noise-displace": {
        const inputId = node.inputs["mesh"];
        const input = inputId ? evaluate(inputId) : null;
        if (!input) { result = null; break; }
        const strength = (node.params.strength as number) || 0.5;
        const scale = (node.params.scale as number) || 1;
        result = {
          vertices: input.vertices.map(v => ({
            x: v.x + Math.sin(v.y * scale * 3) * Math.cos(v.z * scale * 3) * strength,
            y: v.y + Math.sin(v.z * scale * 3) * Math.cos(v.x * scale * 3) * strength,
            z: v.z + Math.sin(v.x * scale * 3) * Math.cos(v.y * scale * 3) * strength,
          })),
          edges: input.edges,
          faces: input.faces,
        };
        break;
      }
      case "subdivision": {
        const inputId = node.inputs["mesh"];
        const input = inputId ? evaluate(inputId) : null;
        if (!input) { result = null; break; }
        let r = input;
        const levels = (node.params.levels as number) || 1;
        for (let i = 0; i < levels; i++) r = subdivideQuadMesh(r);
        result = r;
        break;
      }
      case "boolean": {
        const aId = node.inputs["a"];
        const bId = node.inputs["b"];
        const a = aId ? evaluate(aId) : null;
        const b = bId ? evaluate(bId) : null;
        if (!a || !b) { result = null; break; }
        result = booleanMesh(a, b, (node.params.operation as any) || "union");
        break;
      }
      case "output": {
        const inputId = node.inputs["mesh"];
        result = inputId ? evaluate(inputId) : null;
        break;
      }
      default:
        result = null;
    }
    if (result) evaluated.set(nodeId, result);
    return result;
  };
  return evaluate(graph.output);
}

function subdivideQuadMesh(mesh: MeshData): MeshData {
  // Reuse subdivideMesh logic from mesh-ops
  const verts = mesh.vertices.map(v => ({ ...v }));
  const newFaces: Face[] = [];
  for (const face of mesh.faces) {
    if (face.indices.length === 4) {
      const [a, b, c, d] = face.indices.map(i => verts[i]);
      const ab = mid(a, b); verts.push(ab);
      const bc = mid(b, c); verts.push(bc);
      const cd = mid(c, d); verts.push(cd);
      const da = mid(d, a); verts.push(da);
      const center = mid(mid(a, b), mid(c, d)); verts.push(center);
      const iab = verts.length - 5;
      const ibc = verts.length - 4;
      const icd = verts.length - 3;
      const ida = verts.length - 2;
      const ic = verts.length - 1;
      newFaces.push({ indices: [face.indices[0], iab, ic, ida], materialIndex: face.materialIndex });
      newFaces.push({ indices: [face.indices[1], ibc, ic, iab], materialIndex: face.materialIndex });
      newFaces.push({ indices: [face.indices[2], icd, ic, ibc], materialIndex: face.materialIndex });
      newFaces.push({ indices: [face.indices[3], ida, ic, icd], materialIndex: face.materialIndex });
    } else if (face.indices.length === 3) {
      const [a, b, c] = face.indices.map(i => verts[i]);
      const ab = mid(a, b); verts.push(ab);
      const bc = mid(b, c); verts.push(bc);
      const ca = mid(c, a); verts.push(ca);
      const iab = verts.length - 3;
      const ibc = verts.length - 2;
      const ica = verts.length - 1;
      newFaces.push({ indices: [face.indices[0], iab, ica], materialIndex: face.materialIndex });
      newFaces.push({ indices: [face.indices[1], ibc, iab], materialIndex: face.materialIndex });
      newFaces.push({ indices: [face.indices[2], ica, ibc], materialIndex: face.materialIndex });
      newFaces.push({ indices: [iab, ibc, ica], materialIndex: face.materialIndex });
    } else {
      newFaces.push(face);
    }
  }
  return { vertices: verts, edges: [], faces: newFaces };
}
function mid(a: Vertex, b: Vertex): Vertex { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }; }

function makeBox(w: number, h: number, d: number): MeshData {
  const v: Vertex[] = [
    { x: -w, y: -h, z: -d }, { x: w, y: -h, z: -d }, { x: w, y: h, z: -d }, { x: -w, y: h, z: -d },
    { x: -w, y: -h, z: d }, { x: w, y: -h, z: d }, { x: w, y: h, z: d }, { x: -w, y: h, z: d },
  ];
  const f: Face[] = [
    { indices: [0, 3, 2, 1], materialIndex: 0 },
    { indices: [4, 5, 6, 7], materialIndex: 0 },
    { indices: [0, 1, 5, 4], materialIndex: 0 },
    { indices: [3, 7, 6, 2], materialIndex: 0 },
    { indices: [0, 4, 7, 3], materialIndex: 0 },
    { indices: [1, 2, 6, 5], materialIndex: 0 },
  ];
  return { vertices: v, edges: [], faces: f };
}

function makeSphere(r: number, segs: number, rings: number): MeshData {
  const v: Vertex[] = [];
  for (let y = 0; y <= rings; y++) {
    const vr = (y / rings) * Math.PI;
    for (let x = 0; x <= segs; x++) {
      const u = (x / segs) * Math.PI * 2;
      v.push({ x: Math.cos(u) * Math.sin(vr) * r, y: Math.cos(vr) * r, z: Math.sin(u) * Math.sin(vr) * r });
    }
  }
  const f: Face[] = [];
  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segs; x++) {
      const a = y * (segs + 1) + x;
      const b = a + segs + 1;
      f.push({ indices: [a, b, a + 1, b + 1], materialIndex: 0 });
    }
  }
  return { vertices: v, edges: [], faces: f };
}

// ---------- IK Solver (simple CCD) ----------
export function solveIK(
  bones: { head: [number, number, number]; tail: [number, number, number] }[],
  target: [number, number, number],
  iterations: number = 10
): { head: [number, number, number]; tail: [number, number, number] }[] {
  // Cyclic Coordinate Descent IK — rotates each bone from the end toward the root
  // so the chain's tail reaches the target.
  const result = bones.map(b => ({ head: [...b.head] as [number, number, number], tail: [...b.tail] as [number, number, number] }));
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = result.length - 1; i >= 0; i--) {
      const bone = result[i];
      const endEffector = result[result.length - 1].tail;
      const toEnd: [number, number, number] = [
        endEffector[0] - bone.head[0],
        endEffector[1] - bone.head[1],
        endEffector[2] - bone.head[2],
      ];
      const toTarget: [number, number, number] = [
        target[0] - bone.head[0],
        target[1] - bone.head[1],
        target[2] - bone.head[2],
      ];
      const lenEnd = Math.hypot(...toEnd) || 1;
      const lenTgt = Math.hypot(...toTarget) || 1;
      const dot = (toEnd[0] * toTarget[0] + toEnd[1] * toTarget[1] + toEnd[2] * toTarget[2]) / (lenEnd * lenTgt);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      const axis: [number, number, number] = [
        toEnd[1] * toTarget[2] - toEnd[2] * toTarget[1],
        toEnd[2] * toTarget[0] - toEnd[0] * toTarget[2],
        toEnd[0] * toTarget[1] - toEnd[1] * toTarget[0],
      ];
      const axisLen = Math.hypot(...axis) || 1;
      if (axisLen < 1e-6) continue;
      const normAxis: [number, number, number] = [axis[0] / axisLen, axis[1] / axisLen, axis[2] / axisLen];
      const sinA = Math.sin(angle), cosA = Math.cos(angle);
      const rotate = (p: [number, number, number]): [number, number, number] => {
        const px = p[0] - bone.head[0], py = p[1] - bone.head[1], pz = p[2] - bone.head[2];
        // Rodrigues rotation
        const cross: [number, number, number] = [
          normAxis[1] * pz - normAxis[2] * py,
          normAxis[2] * px - normAxis[0] * pz,
          normAxis[0] * py - normAxis[1] * px,
        ];
        const dot2 = normAxis[0] * px + normAxis[1] * py + normAxis[2] * pz;
        return [
          bone.head[0] + px * cosA + cross[0] * sinA + normAxis[0] * dot2 * (1 - cosA),
          bone.head[1] + py * cosA + cross[1] * sinA + normAxis[1] * dot2 * (1 - cosA),
          bone.head[2] + pz * cosA + cross[2] * sinA + normAxis[2] * dot2 * (1 - cosA),
        ];
      };
      // Rotate this bone's tail and all downstream bones
      for (let j = i; j < result.length; j++) {
        if (j === i) {
          result[j].tail = rotate(result[j].tail);
        } else {
          result[j].head = rotate(result[j].head);
          result[j].tail = rotate(result[j].tail);
        }
      }
    }
  }
  return result;
}
