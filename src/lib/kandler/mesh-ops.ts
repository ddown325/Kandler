/**
 * Kandler — Mesh Edit Operations
 * Provides the standard Blender mesh-edit operations on MeshData:
 * extrude, inset, bevel, subdivide, merge, delete, fill, knife, loop cut.
 *
 * Made by Kantasu.
 */
import { MeshData, Vertex, Face } from "./store";

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

function faceNormal(verts: Vertex[], face: Face): [number, number, number] {
  if (face.indices.length < 3) return [0, 0, 1];
  const a = verts[face.indices[0]];
  const b = verts[face.indices[1]];
  const c = verts[face.indices[2]];
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
  return [n.x / len, n.y / len, n.z / len];
}

export function extrudeFaces(mesh: MeshData, faceIndices: number[], offset: number = 0): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const face = result.faces[fIdx];
    if (!face) continue;
    const n = faceNormal(result.vertices, face);
    const startV = result.vertices.length;
    // Create new vertices offset along normal
    for (const vi of face.indices) {
      const v = result.vertices[vi];
      result.vertices.push({ x: v.x + n[0] * offset, y: v.y + n[1] * offset, z: v.z + n[2] * offset });
    }
    // New top face
    newFaces.push({ indices: face.indices.map((_, i) => startV + i), materialIndex: face.materialIndex });
    // Side faces
    for (let i = 0; i < face.indices.length; i++) {
      const a = face.indices[i];
      const b = face.indices[(i + 1) % face.indices.length];
      newFaces.push({
        indices: [a, b, startV + ((i + 1) % face.indices.length), startV + i],
        materialIndex: face.materialIndex,
      });
    }
  }
  // Remove original faces
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}

export function extrudeVertices(mesh: MeshData, vertIndices: number[], offset: [number, number, number] = [0, 0, 0]): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const vi of vertIndices) {
    const v = result.vertices[vi];
    const newV = { x: v.x + offset[0], y: v.y + offset[1], z: v.z + offset[2] };
    result.vertices.push(newV);
  }
  return result;
}

export function insetFaces(mesh: MeshData, faceIndices: number[], inset: number = 0.1): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const face = result.faces[fIdx];
    if (!face || face.indices.length < 3) continue;
    // Compute face center
    const center = { x: 0, y: 0, z: 0 };
    for (const vi of face.indices) {
      center.x += result.vertices[vi].x;
      center.y += result.vertices[vi].y;
      center.z += result.vertices[vi].z;
    }
    center.x /= face.indices.length;
    center.y /= face.indices.length;
    center.z /= face.indices.length;
    // Inset vertices
    const startV = result.vertices.length;
    for (const vi of face.indices) {
      const v = result.vertices[vi];
      result.vertices.push({
        x: v.x + (center.x - v.x) * inset,
        y: v.y + (center.y - v.y) * inset,
        z: v.z + (center.z - v.z) * inset,
      });
    }
    // Inner face
    newFaces.push({ indices: face.indices.map((_, i) => startV + i), materialIndex: face.materialIndex });
    // Quad rings
    for (let i = 0; i < face.indices.length; i++) {
      const a = face.indices[i];
      const b = face.indices[(i + 1) % face.indices.length];
      newFaces.push({
        indices: [a, b, startV + ((i + 1) % face.indices.length), startV + i],
        materialIndex: face.materialIndex,
      });
    }
  }
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}

export function bevelEdges(mesh: MeshData, edgeIndices: number[], width: number = 0.05, _segments: number = 1): MeshData {
  // Simple bevel: for each selected edge, split it into two and add a small face
  // This is a simplification; real bevel is much more complex.
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const eIdx of edgeIndices) {
    const e = result.edges[eIdx];
    if (!e) continue;
    const a = result.vertices[e.a];
    const b = result.vertices[e.b];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    const nx = dx / len * width, ny = dy / len * width, nz = dz / len * width;
    const v1 = { x: a.x + nx, y: a.y + ny, z: a.z + nz };
    const v2 = { x: b.x - nx, y: b.y - ny, z: b.z - nz };
    result.vertices.push(v1, v2);
    const i1 = result.vertices.length - 2;
    const i2 = result.vertices.length - 1;
    newFaces.push({ indices: [e.a, i1, i2, e.b], materialIndex: 0 });
  }
  result.faces.push(...newFaces);
  return result;
}

export function subdivideMesh(mesh: MeshData, _cuts: number = 1): MeshData {
  // Simple edge-midpoint subdivision
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

export function mergeVertices(mesh: MeshData, vertIndices: number[]): MeshData {
  // Merge selected vertices to their median
  if (vertIndices.length < 2) return mesh;
  const result = clone(mesh);
  let cx = 0, cy = 0, cz = 0;
  for (const vi of vertIndices) {
    cx += result.vertices[vi].x;
    cy += result.vertices[vi].y;
    cz += result.vertices[vi].z;
  }
  cx /= vertIndices.length; cy /= vertIndices.length; cz /= vertIndices.length;
  const firstIdx = vertIndices[0];
  result.vertices[firstIdx] = { x: cx, y: cy, z: cz };
  // Remap references
  const remap: Record<number, number> = {};
  for (const vi of vertIndices.slice(1)) remap[vi] = firstIdx;
  // Remove merged
  const remove = new Set(vertIndices.slice(1));
  result.vertices = result.vertices.filter((_, i) => !remove.has(i));
  // Build index map
  const indexMap: number[] = [];
  let counter = 0;
  for (let i = 0; i < mesh.vertices.length; i++) {
    if (remove.has(i)) indexMap[i] = -1;
    else indexMap[i] = counter++;
  }
  // Remap faces
  result.faces = result.faces.map(f => ({
    indices: f.indices.map(i => indexMap[remap[i] !== undefined ? remap[i] : i]).filter(i => i >= 0),
    materialIndex: f.materialIndex,
  })).filter(f => f.indices.length >= 3);
  return result;
}

export function deleteVertices(mesh: MeshData, vertIndices: number[]): MeshData {
  const result = clone(mesh);
  const remove = new Set(vertIndices);
  result.vertices = result.vertices.filter((_, i) => !remove.has(i));
  const indexMap: number[] = [];
  let counter = 0;
  for (let i = 0; i < mesh.vertices.length; i++) {
    if (remove.has(i)) indexMap[i] = -1;
    else indexMap[i] = counter++;
  }
  result.faces = result.faces.map(f => ({
    indices: f.indices.map(i => indexMap[i]).filter(i => i >= 0),
    materialIndex: f.materialIndex,
  })).filter(f => f.indices.length >= 3);
  return result;
}

export function deleteFaces(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  // Remove orphan vertices
  const used = new Set<number>();
  for (const f of result.faces) for (const i of f.indices) used.add(i);
  const indexMap: number[] = [];
  let counter = 0;
  const newVerts: Vertex[] = [];
  for (let i = 0; i < result.vertices.length; i++) {
    if (used.has(i)) {
      indexMap[i] = counter++;
      newVerts.push(result.vertices[i]);
    } else {
      indexMap[i] = -1;
    }
  }
  result.vertices = newVerts;
  result.faces = result.faces.map(f => ({
    indices: f.indices.map(i => indexMap[i]).filter(i => i >= 0),
    materialIndex: f.materialIndex,
  })).filter(f => f.indices.length >= 3);
  return result;
}

export function fillFaces(mesh: MeshData, vertIndices: number[]): MeshData {
  if (vertIndices.length < 3) return mesh;
  const result = clone(mesh);
  result.faces.push({ indices: [...vertIndices], materialIndex: 0 });
  return result;
}

export function loopCut(mesh: MeshData, _cuts: number = 1): MeshData {
  // Simple midpoint loop — for now just subdivide as approximation
  return subdivideMesh(mesh, _cuts);
}

export function scaleSelectedVertices(mesh: MeshData, vertIndices: number[], factor: number): MeshData {
  const result = clone(mesh);
  if (vertIndices.length === 0) return result;
  let cx = 0, cy = 0, cz = 0;
  for (const vi of vertIndices) {
    cx += result.vertices[vi].x;
    cy += result.vertices[vi].y;
    cz += result.vertices[vi].z;
  }
  cx /= vertIndices.length; cy /= vertIndices.length; cz /= vertIndices.length;
  for (const vi of vertIndices) {
    const v = result.vertices[vi];
    v.x = cx + (v.x - cx) * factor;
    v.y = cy + (v.y - cy) * factor;
    v.z = cz + (v.z - cz) * factor;
  }
  return result;
}

export function moveSelectedVertices(mesh: MeshData, vertIndices: number[], offset: [number, number, number]): MeshData {
  const result = clone(mesh);
  for (const vi of vertIndices) {
    const v = result.vertices[vi];
    v.x += offset[0]; v.y += offset[1]; v.z += offset[2];
  }
  return result;
}

export function flipNormals(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  for (const fIdx of faceIndices) {
    const f = result.faces[fIdx];
    if (f) f.indices.reverse();
  }
  return result;
}

export function recalcNormals(mesh: MeshData): MeshData {
  // No-op: normals are computed in viewport. Provided for parity with Blender.
  return mesh;
}

export function triangulateFaces(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const f = result.faces[fIdx];
    if (!f) continue;
    for (let i = 1; i < f.indices.length - 1; i++) {
      newFaces.push({ indices: [f.indices[0], f.indices[i], f.indices[i + 1]], materialIndex: f.materialIndex });
    }
  }
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}
