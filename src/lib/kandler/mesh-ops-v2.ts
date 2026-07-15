// Kandler Mesh Operations — vertex/edge/face editing, selection, picking, analysis.
import * as THREE from "three";
import { mergeVertices } from "three-stdlib";

export interface MeshSelection {
  vertices: Set<number>;
  edges: Set<string>;
  faces: Set<number>;
}

export function createSelection(): MeshSelection {
  return { vertices: new Set(), edges: new Set(), faces: new Set() };
}

export function clearSelection(sel: MeshSelection): void {
  sel.vertices.clear(); sel.edges.clear(); sel.faces.clear();
}

export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function getEdges(geo: THREE.BufferGeometry): [number, number][] {
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const indices = geo.index ? geo.index.array : null;
  const pos = geo.attributes.position;
  const count = indices ? indices.length : pos.count;
  const addEdge = (a: number, b: number) => {
    const key = edgeKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(a < b ? [a, b] : [b, a]);
  };
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      addEdge(indices[i], indices[i + 1]);
      addEdge(indices[i + 1], indices[i + 2]);
      addEdge(indices[i + 2], indices[i]);
    }
  } else {
    for (let i = 0; i < count; i += 3) {
      addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i);
    }
  }
  return edges;
}

export function getFaces(geo: THREE.BufferGeometry): number[][] {
  const faces: number[][] = [];
  const indices = geo.index ? geo.index.array : null;
  const pos = geo.attributes.position;
  const count = indices ? indices.length : pos.count;
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) faces.push([indices[i], indices[i + 1], indices[i + 2]]);
  } else {
    for (let i = 0; i < count; i += 3) faces.push([i, i + 1, i + 2]);
  }
  return faces;
}

export function getVertexFaces(geo: THREE.BufferGeometry): Map<number, number[]> {
  const map = new Map<number, number[]>();
  const faces = getFaces(geo);
  for (let f = 0; f < faces.length; f++) {
    for (const v of faces[f]) {
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(f);
    }
  }
  return map;
}

export function getVertexEdges(geo: THREE.BufferGeometry): Map<number, [number, number][]> {
  const map = new Map<number, [number, number][]>();
  const edges = getEdges(geo);
  for (const [a, b] of edges) {
    if (!map.has(a)) map.set(a, []);
    if (!map.has(b)) map.set(b, []);
    map.get(a)!.push([a, b]);
    map.get(b)!.push([a, b]);
  }
  return map;
}

export function getEdgeFaces(geo: THREE.BufferGeometry): Map<string, number[]> {
  const map = new Map<string, number[]>();
  const faces = getFaces(geo);
  for (let f = 0; f < faces.length; f++) {
    const [a, b, c] = faces[f];
    for (const [e1, e2] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = edgeKey(e1, e2);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
  }
  return map;
}

export function getBoundaryEdges(geo: THREE.BufferGeometry): [number, number][] {
  const edgeFaces = getEdgeFaces(geo);
  const boundary: [number, number][] = [];
  for (const [key, faces] of edgeFaces) {
    if (faces.length === 1) {
      const [a, b] = key.split("_").map(Number);
      boundary.push([a, b]);
    }
  }
  return boundary;
}

export function selectEdgeLoop(geo: THREE.BufferGeometry, startEdge: [number, number]): [number, number][] {
  const edges = getEdges(geo);
  const edgeSet = new Set(edges.map(([a, b]) => edgeKey(a, b)));
  const faces = getFaces(geo);
  const edgeFaces = getEdgeFaces(geo);
  const loop: [number, number][] = [startEdge];
  const visited = new Set<string>();
  visited.add(edgeKey(startEdge[0], startEdge[1]));
  for (const direction of [0, 1]) {
    let current = startEdge;
    while (true) {
      const [a, b] = current;
      const key = edgeKey(a, b);
      const faceList = edgeFaces.get(key);
      if (!faceList || faceList.length === 0) break;
      const face = faces[faceList[0]];
      if (!face) break;
      const opposite = face.find(v => v !== a && v !== b);
      if (opposite === undefined) break;
      const candidates: [number, number][] = [[opposite, a], [opposite, b]];
      let nextEdge: [number, number] | null = null;
      for (const [e1, e2] of candidates) {
        const eKey = edgeKey(e1, e2);
        if (!visited.has(eKey) && edgeSet.has(eKey)) {
          nextEdge = [e1, e2]; visited.add(eKey); break;
        }
      }
      if (!nextEdge) break;
      loop.push(nextEdge);
      current = nextEdge;
      if (loop.length > 10000) break;
    }
    if (direction === 0) { loop.reverse(); loop.push(startEdge); }
  }
  return loop;
}

export function extrudeFaces(geo: THREE.BufferGeometry, sel: MeshSelection, offset: THREE.Vector3): THREE.BufferGeometry {
  if (sel.faces.size === 0) return geo;
  const pos = geo.attributes.position;
  const indices = geo.index ? Array.from(geo.index.array) : null;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const faceList = getFacesFromIndices(indices, positions);
  const selectedVerts = new Set<number>();
  for (const f of sel.faces) {
    if (faceList[f]) { selectedVerts.add(faceList[f][0]); selectedVerts.add(faceList[f][1]); selectedVerts.add(faceList[f][2]); }
  }
  const vertMap = new Map<number, number>();
  const newPositions = [...positions];
  const newNormals = [...normals];
  for (const v of selectedVerts) {
    const ni = newPositions.length / 3;
    newPositions.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
    if (hasNormal) newNormals.push(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]);
    vertMap.set(v, ni);
  }
  const newIndices: number[] = [];
  if (indices) {
    for (let i = 0, f = 0; i < indices.length; i += 3, f++) {
      if (!sel.faces.has(f)) newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
    }
  } else {
    for (let i = 0, f = 0; i < positions.length; i += 9, f++) {
      if (!sel.faces.has(f)) newIndices.push(i / 3, i / 3 + 1, i / 3 + 2);
    }
  }
  for (const f of sel.faces) {
    if (!faceList[f]) continue;
    const [a, b, c] = faceList[f];
    const na = vertMap.get(a)!, nb = vertMap.get(b)!, nc = vertMap.get(c)!;
    newPositions[na * 3] += offset.x; newPositions[na * 3 + 1] += offset.y; newPositions[na * 3 + 2] += offset.z;
    newPositions[nb * 3] += offset.x; newPositions[nb * 3 + 1] += offset.y; newPositions[nb * 3 + 2] += offset.z;
    newPositions[nc * 3] += offset.x; newPositions[nc * 3 + 1] += offset.y; newPositions[nc * 3 + 2] += offset.z;
    newIndices.push(na, nb, nc);
  }
  const edgeFaces = new Map<string, number[]>();
  for (const f of sel.faces) {
    if (!faceList[f]) continue;
    const [a, b, c] = faceList[f];
    for (const [e1, e2] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = edgeKey(e1, e2);
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key)!.push(f);
    }
  }
  for (const [key, fs] of edgeFaces) {
    if (fs.length !== 1) continue;
    const [a, b] = key.split("_").map(Number);
    const na = vertMap.get(a)!, nb = vertMap.get(b)!;
    newIndices.push(a, b, nb); newIndices.push(a, nb, na);
  }
  return makeGeo(newPositions, newNormals, newIndices, hasNormal);
}

export function insetFaces(geo: THREE.BufferGeometry, sel: MeshSelection, thickness: number, depth: number): THREE.BufferGeometry {
  if (sel.faces.size === 0) return geo;
  const pos = geo.attributes.position;
  const indices = geo.index ? Array.from(geo.index.array) : null;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const faceList = getFacesFromIndices(indices, positions);
  const selectedVerts = new Set<number>();
  for (const f of sel.faces) {
    if (faceList[f]) { selectedVerts.add(faceList[f][0]); selectedVerts.add(faceList[f][1]); selectedVerts.add(faceList[f][2]); }
  }
  const vertMap = new Map<number, number>();
  const newPositions = [...positions];
  const newNormals = [...normals];
  for (const v of selectedVerts) {
    const ni = newPositions.length / 3;
    newPositions.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
    if (hasNormal) newNormals.push(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]);
    vertMap.set(v, ni);
  }
  for (const v of selectedVerts) {
    const nv = vertMap.get(v)!;
    const f0 = sel.faces.values().next().value;
    if (f0 === undefined) continue;
    const [a, b, c] = faceList[f0];
    const centroid = new THREE.Vector3(
      (positions[a * 3] + positions[b * 3] + positions[c * 3]) / 3,
      (positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1]) / 3,
      (positions[a * 3 + 2] + positions[b * 3 + 2] + positions[c * 3 + 2]) / 3,
    );
    const dir = new THREE.Vector3(centroid.x - positions[v * 3], centroid.y - positions[v * 3 + 1], centroid.z - positions[v * 3 + 2]).normalize();
    newPositions[nv * 3] += dir.x * thickness;
    newPositions[nv * 3 + 1] += dir.y * thickness;
    newPositions[nv * 3 + 2] += dir.z * thickness;
  }
  const newIndices: number[] = [];
  if (indices) {
    for (let i = 0, f = 0; i < indices.length; i += 3, f++) {
      if (!sel.faces.has(f)) newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
    }
  } else {
    for (let i = 0, f = 0; i < positions.length; i += 9, f++) {
      if (!sel.faces.has(f)) newIndices.push(i / 3, i / 3 + 1, i / 3 + 2);
    }
  }
  for (const f of sel.faces) {
    if (!faceList[f]) continue;
    const [a, b, c] = faceList[f];
    newIndices.push(vertMap.get(a)!, vertMap.get(b)!, vertMap.get(c)!);
  }
  const edgeFaces = new Map<string, number[]>();
  for (const f of sel.faces) {
    if (!faceList[f]) continue;
    const [a, b, c] = faceList[f];
    for (const [e1, e2] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = edgeKey(e1, e2);
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key)!.push(f);
    }
  }
  for (const [key, fs] of edgeFaces) {
    if (fs.length !== 1) continue;
    const [a, b] = key.split("_").map(Number);
    const na = vertMap.get(a)!, nb = vertMap.get(b)!;
    newIndices.push(a, b, nb); newIndices.push(a, nb, na);
  }
  return makeGeo(newPositions, newNormals, newIndices, hasNormal);
}

export function mergeAtCenter(geo: THREE.BufferGeometry, sel: MeshSelection): THREE.BufferGeometry {
  if (sel.vertices.size === 0) return geo;
  const pos = geo.attributes.position;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  let cx = 0, cy = 0, cz = 0;
  for (const v of sel.vertices) { cx += positions[v * 3]; cy += positions[v * 3 + 1]; cz += positions[v * 3 + 2]; }
  const n = sel.vertices.size; cx /= n; cy /= n; cz /= n;
  const target = sel.vertices.values().next().value;
  positions[target * 3] = cx; positions[target * 3 + 1] = cy; positions[target * 3 + 2] = cz;
  const remap = new Map<number, number>();
  for (const v of sel.vertices) if (v !== target) remap.set(v, target);
  const indices = geo.index ? Array.from(geo.index.array) : null;
  let newIndices: number[] | null = null;
  if (indices) {
    newIndices = indices.map(i => remap.get(i) ?? i);
    newIndices = newIndices.filter((_, i) => {
      if (i % 3 !== 0) return true;
      const a = newIndices![i], b = newIndices![i + 1], c = newIndices![i + 2];
      return a !== b && b !== c && a !== c;
    });
  }
  return makeGeo(positions, normals, newIndices, hasNormal);
}

export function mergeByDistance(geo: THREE.BufferGeometry, distance: number): THREE.BufferGeometry {
  const merged = mergeVertices(geo, distance);
  merged.computeVertexNormals();
  return merged;
}

export function subdivideMesh(geo: THREE.BufferGeometry, cuts: number): THREE.BufferGeometry {
  let result = geo;
  for (let i = 0; i < cuts; i++) result = subdivideOnce(result);
  result.computeVertexNormals();
  return result;
}

function subdivideOnce(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  let work = geo.index ? geo : geo.toNonIndexed();
  const pos = work.attributes.position;
  const indices = work.index!.array as Uint32Array | Uint16Array;
  const positions = pos.array as Float32Array;
  const midCache = new Map<string, number>();
  const newPositions: number[] = [];
  for (let i = 0; i < pos.count; i++) newPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
  function getMid(a: number, b: number): number {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const cached = midCache.get(key);
    if (cached !== undefined) return cached;
    const mx = (positions[a * 3] + positions[b * 3]) / 2;
    const my = (positions[a * 3 + 1] + positions[b * 3 + 1]) / 2;
    const mz = (positions[a * 3 + 2] + positions[b * 3 + 2]) / 2;
    newPositions.push(mx, my, mz);
    const idx = newPositions.length / 3 - 1;
    midCache.set(key, idx);
    return idx;
  }
  const newIndices: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i + 1], c = indices[i + 2];
    const ab = getMid(a, b), bc = getMid(b, c), ca = getMid(c, a);
    newIndices.push(a, ab, ca); newIndices.push(b, bc, ab); newIndices.push(c, ca, bc); newIndices.push(ab, bc, ca);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  out.setIndex(newIndices);
  return out;
}

export function deleteFaces(geo: THREE.BufferGeometry, sel: MeshSelection): THREE.BufferGeometry {
  if (sel.faces.size === 0) return geo;
  const faceList = getFaces(geo);
  const pos = geo.attributes.position;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const newIndices: number[] = [];
  for (let f = 0; f < faceList.length; f++) {
    if (!sel.faces.has(f)) { const [a, b, c] = faceList[f]; newIndices.push(a, b, c); }
  }
  return makeGeo(positions, normals, newIndices, hasNormal);
}

export function fillHoles(geo: THREE.BufferGeometry, _sel: MeshSelection): THREE.BufferGeometry {
  const boundary = getBoundaryEdges(geo);
  if (boundary.length < 3) return geo;
  const pos = geo.attributes.position;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const indices = geo.index ? Array.from(geo.index.array) : null;
  const newIndices: number[] = indices ? [...indices] : [];
  const verts = new Set<number>();
  for (const [a, b] of boundary) { verts.add(a); verts.add(b); }
  const vertList = Array.from(verts);
  for (let i = 1; i < vertList.length - 1; i++) {
    newIndices.push(vertList[0], vertList[i], vertList[i + 1]);
  }
  return makeGeo(positions, normals, newIndices, hasNormal);
}

export function pokeFaces(geo: THREE.BufferGeometry, sel: MeshSelection): THREE.BufferGeometry {
  if (sel.faces.size === 0) return geo;
  const pos = geo.attributes.position;
  const positions = Array.from(pos.array as Float32Array);
  const hasNormal = !!geo.attributes.normal;
  const normals = hasNormal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const faceList = getFaces(geo);
  const newPositions = [...positions];
  const newNormals = [...normals];
  const newIndices: number[] = [];
  for (let f = 0; f < faceList.length; f++) {
    const [a, b, c] = faceList[f];
    if (sel.faces.has(f)) {
      const cx = (positions[a * 3] + positions[b * 3] + positions[c * 3]) / 3;
      const cy = (positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1]) / 3;
      const cz = (positions[a * 3 + 2] + positions[b * 3 + 2] + positions[c * 3 + 2]) / 3;
      const idx = newPositions.length / 3;
      newPositions.push(cx, cy, cz);
      if (hasNormal) {
        const nx = (normals[a * 3] + normals[b * 3] + normals[c * 3]) / 3;
        const ny = (normals[a * 3 + 1] + normals[b * 3 + 1] + normals[c * 3 + 1]) / 3;
        const nz = (normals[a * 3 + 2] + normals[b * 3 + 2] + normals[c * 3 + 2]) / 3;
        newNormals.push(nx, ny, nz);
      }
      newIndices.push(a, b, idx); newIndices.push(b, c, idx); newIndices.push(c, a, idx);
    } else {
      newIndices.push(a, b, c);
    }
  }
  return makeGeo(newPositions, newNormals, newIndices, hasNormal);
}

export function pickVertex(geo: THREE.BufferGeometry, ray: THREE.Ray, threshold: number): number | null {
  const pos = geo.attributes.position;
  let nearest = -1;
  let nearestDist = threshold;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = ray.distanceToPoint(v);
    if (d < nearestDist) { nearestDist = d; nearest = i; }
  }
  return nearest >= 0 ? nearest : null;
}

export function pickFace(geo: THREE.BufferGeometry, ray: THREE.Ray): number | null {
  const indices = geo.index ? geo.index.array : null;
  const pos = geo.attributes.position;
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  let nearest = -1;
  let nearestT = Infinity;
  const count = indices ? indices.length : pos.count;
  for (let i = 0, f = 0; i < count; i += 3, f++) {
    if (indices) {
      va.fromBufferAttribute(pos, indices[i]);
      vb.fromBufferAttribute(pos, indices[i + 1]);
      vc.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      va.fromBufferAttribute(pos, i);
      vb.fromBufferAttribute(pos, i + 1);
      vc.fromBufferAttribute(pos, i + 2);
    }
    const hit = ray.intersectTriangle(va, vb, vc, false, new THREE.Vector3());
    if (hit) {
      const t = ray.origin.distanceTo(hit);
      if (t < nearestT) { nearestT = t; nearest = f; }
    }
  }
  return nearest >= 0 ? nearest : null;
}

export function pickEdge(geo: THREE.BufferGeometry, ray: THREE.Ray, threshold: number): [number, number] | null {
  const edges = getEdges(geo);
  const pos = geo.attributes.position;
  let nearest: [number, number] | null = null;
  let nearestDist = threshold;
  const va = new THREE.Vector3(), vb = new THREE.Vector3();
  for (const [a, b] of edges) {
    va.fromBufferAttribute(pos, a);
    vb.fromBufferAttribute(pos, b);
    const d = ray.distanceSqToSegment(va, vb);
    if (d < nearestDist) { nearestDist = d; nearest = [a, b]; }
  }
  return nearest;
}

export function getNonManifoldEdges(geo: THREE.BufferGeometry): [number, number][] {
  const edgeFaces = getEdgeFaces(geo);
  const nonManifold: [number, number][] = [];
  for (const [key, faces] of edgeFaces) {
    if (faces.length !== 2) {
      const [a, b] = key.split("_").map(Number);
      nonManifold.push([a, b]);
    }
  }
  return nonManifold;
}

export function getDegenerateFaces(geo: THREE.BufferGeometry, threshold: number = 0.0001): number[] {
  const faces = getFaces(geo);
  const pos = geo.attributes.position;
  const degenerate: number[] = [];
  for (let f = 0; f < faces.length; f++) {
    const [a, b, c] = faces[f];
    const va = new THREE.Vector3().fromBufferAttribute(pos, a);
    const vb = new THREE.Vector3().fromBufferAttribute(pos, b);
    const vc = new THREE.Vector3().fromBufferAttribute(pos, c);
    const ab = new THREE.Vector3().subVectors(vb, va);
    const ac = new THREE.Vector3().subVectors(vc, va);
    const area = ab.cross(ac).length() * 0.5;
    if (area < threshold) degenerate.push(f);
  }
  return degenerate;
}

export function validateMesh(geo: THREE.BufferGeometry): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const nonManifold = getNonManifoldEdges(geo);
  if (nonManifold.length > 0) issues.push(`${nonManifold.length} non-manifold edges`);
  const degenerate = getDegenerateFaces(geo);
  if (degenerate.length > 0) issues.push(`${degenerate.length} degenerate faces`);
  return { valid: issues.length === 0, issues };
}

export function getSurfaceArea(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  let area = 0;
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const count = indices ? indices.length : pos.count;
  for (let i = 0; i < count; i += 3) {
    if (indices) {
      va.fromBufferAttribute(pos, indices[i]);
      vb.fromBufferAttribute(pos, indices[i + 1]);
      vc.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      va.fromBufferAttribute(pos, i);
      vb.fromBufferAttribute(pos, i + 1);
      vc.fromBufferAttribute(pos, i + 2);
    }
    const ab = new THREE.Vector3().subVectors(vb, va);
    const ac = new THREE.Vector3().subVectors(vc, va);
    area += ab.cross(ac).length() * 0.5;
  }
  return area;
}

export function getVolume(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  let volume = 0;
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const count = indices ? indices.length : pos.count;
  for (let i = 0; i < count; i += 3) {
    if (indices) {
      va.fromBufferAttribute(pos, indices[i]);
      vb.fromBufferAttribute(pos, indices[i + 1]);
      vc.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      va.fromBufferAttribute(pos, i);
      vb.fromBufferAttribute(pos, i + 1);
      vc.fromBufferAttribute(pos, i + 2);
    }
    volume += va.dot(vb.clone().cross(vc)) / 6;
  }
  return Math.abs(volume);
}

export function smoothVertices(geo: THREE.BufferGeometry, iterations: number, factor: number): THREE.BufferGeometry {
  let result = geo;
  for (let i = 0; i < iterations; i++) result = smoothOnce(result, factor);
  result.computeVertexNormals();
  return result;
}

function smoothOnce(geo: THREE.BufferGeometry, factor: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const vertEdges = getVertexEdges(geo);
  const newPositions = new Float32Array(positions);
  for (const [v, edges] of vertEdges) {
    if (edges.length === 0) continue;
    let ax = 0, ay = 0, az = 0;
    for (const [a, b] of edges) {
      const neighbor = a === v ? b : a;
      ax += positions[neighbor * 3];
      ay += positions[neighbor * 3 + 1];
      az += positions[neighbor * 3 + 2];
    }
    ax /= edges.length; ay /= edges.length; az /= edges.length;
    newPositions[v * 3] = positions[v * 3] * (1 - factor) + ax * factor;
    newPositions[v * 3 + 1] = positions[v * 3 + 1] * (1 - factor) + ay * factor;
    newPositions[v * 3 + 2] = positions[v * 3 + 2] * (1 - factor) + az * factor;
  }
  const result = geo.clone();
  result.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  return result;
}

function getFacesFromIndices(indices: number[] | null, positions: number[]): number[][] {
  const faces: number[][] = [];
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) faces.push([indices[i], indices[i + 1], indices[i + 2]]);
  } else {
    const count = positions.length / 3;
    for (let i = 0; i < count; i += 3) faces.push([i, i + 1, i + 2]);
  }
  return faces;
}

function makeGeo(positions: number[], normals: number[], indices: number[] | null, hasNormal: boolean): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (hasNormal && normals.length === positions.length) geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  if (indices && indices.length > 0) geo.setIndex(indices);
  if (!hasNormal) geo.computeVertexNormals();
  return geo;
}
