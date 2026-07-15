// Kandler UV Engine — unwrap, project, pack, stitch, seam marking.
import * as THREE from "three";
import { mergeVertices } from "three-stdlib";

export function smartUVProject(geo: THREE.BufferGeometry, angleLimit: number = Math.PI / 6): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  const positions = pos.array as Float32Array;
  const count = indices ? indices.length : pos.count;
  const uvs = new Float32Array(pos.count * 2);

  const faces: number[][] = [];
  const faceNormals: THREE.Vector3[] = [];
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;
    faces.push([a, b, c]);
    const va = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
    const vb = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
    const vc = new THREE.Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
    const n = new THREE.Vector3().subVectors(vb, va).cross(new THREE.Vector3().subVectors(vc, va)).normalize();
    faceNormals.push(n);
  }

  const groups: { [key: string]: number[] } = { x: [], y: [], z: [] };
  for (let f = 0; f < faces.length; f++) {
    const n = faceNormals[f];
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    if (ax >= ay && ax >= az) groups.x.push(f);
    else if (ay >= az) groups.y.push(f);
    else groups.z.push(f);
  }

  let offsetU = 0;
  for (const [axis, faceIndices] of Object.entries(groups)) {
    if (faceIndices.length === 0) continue;
    let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
    const projected: { [vertex: number]: [number, number] } = {};
    for (const f of faceIndices) {
      const [a, b, c] = faces[f];
      for (const vi of [a, b, c]) {
        if (vi in projected) continue;
        const x = positions[vi * 3];
        const y = positions[vi * 3 + 1];
        const z = positions[vi * 3 + 2];
        let u: number, v: number;
        if (axis === "x") { u = y; v = z; }
        else if (axis === "y") { u = x; v = z; }
        else { u = x; v = y; }
        projected[vi] = [u, v];
        minU = Math.min(minU, u); minV = Math.min(minV, v);
        maxU = Math.max(maxU, u); maxV = Math.max(maxV, v);
      }
    }
    const sizeU = Math.max(0.001, maxU - minU);
    const sizeV = Math.max(0.001, maxV - minV);
    for (const [vi, [u, v]] of Object.entries(projected)) {
      uvs[Number(vi) * 2] = ((u - minU) / sizeU) * 0.9 + offsetU + 0.05;
      uvs[Number(vi) * 2 + 1] = ((v - minV) / sizeV) * 0.9 + 0.05;
    }
    offsetU += 1.0;
  }

  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  void angleLimit;
  return geo;
}

export function cubeUVProject(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    uvs[i * 2] = (x + 1) / 2;
    uvs[i * 2 + 1] = (z + 1) / 2;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

export function sphereUVProject(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const uvs = new Float32Array(pos.count * 2);
  const center = new THREE.Vector3();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  box.getCenter(center);
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3] - center.x;
    const y = positions[i * 3 + 1] - center.y;
    const z = positions[i * 3 + 2] - center.z;
    const r = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.atan2(z, x);
    const phi = Math.acos(y / (r || 1));
    uvs[i * 2] = (theta + Math.PI) / (2 * Math.PI);
    uvs[i * 2 + 1] = phi / Math.PI;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

export function cylinderUVProject(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const uvs = new Float32Array(pos.count * 2);
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const minY = box.min.y;
  const height = Math.max(0.001, box.max.y - minY);
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const theta = Math.atan2(z, x);
    uvs[i * 2] = (theta + Math.PI) / (2 * Math.PI);
    uvs[i * 2 + 1] = (y - minY) / height;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

export function angleUVProject(geo: THREE.BufferGeometry, angle: number = 45): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const uvs = new Float32Array(pos.count * 2);
  const indices = geo.index ? geo.index.array : null;
  const count = indices ? indices.length : pos.count;
  const faces: number[][] = [];
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;
    faces.push([a, b, c]);
  }
  const angleRad = (angle * Math.PI) / 180;
  let offsetU = 0;
  for (const [a, b, c] of faces) {
    const va = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
    const vb = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
    const vc = new THREE.Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
    const normal = new THREE.Vector3().subVectors(vb, va).cross(new THREE.Vector3().subVectors(vc, va)).normalize();
    const absX = Math.abs(normal.x), absY = Math.abs(normal.y), absZ = Math.abs(normal.z);
    let u: number, v: number;
    if (absX >= absY && absX >= absZ) { u = va.y; v = va.z; }
    else if (absY >= absZ) { u = va.x; v = va.z; }
    else { u = va.x; v = va.y; }
    uvs[a * 2] = u + offsetU; uvs[a * 2 + 1] = v;
    uvs[b * 2] = vb[["x", "y", "z"].indexOf(absX >= absY && absX >= absZ ? "y" : absY >= absZ ? "x" : "x")] || 0 + offsetU;
    uvs[b * 2 + 1] = 0;
    uvs[c * 2] = 0 + offsetU; uvs[c * 2 + 1] = 0;
    offsetU += 0.1;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

export function packUVs(geo: THREE.BufferGeometry, margin: number = 0.01): THREE.BufferGeometry {
  const uv = geo.attributes.uv;
  if (!uv) return geo;
  const uvs = uv.array as Float32Array;
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    const u = uvs[i * 2];
    const v = uvs[i * 2 + 1];
    minU = Math.min(minU, u); minV = Math.min(minV, v);
    maxU = Math.max(maxU, u); maxV = Math.max(maxV, v);
  }
  const sizeU = Math.max(0.001, maxU - minU);
  const sizeV = Math.max(0.001, maxV - minV);
  const scale = Math.max(sizeU, sizeV);
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] = (uvs[i * 2] - minU) / scale + margin;
    uvs[i * 2 + 1] = (uvs[i * 2 + 1] - minV) / scale + margin;
  }
  uv.needsUpdate = true;
  return geo;
}

export function stitchUVs(geo: THREE.BufferGeometry, vertices: number[]): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  let avgU = 0, avgV = 0;
  for (const v of vertices) { avgU += uvs[v * 2]; avgV += uvs[v * 2 + 1]; }
  avgU /= vertices.length; avgV /= vertices.length;
  for (const v of vertices) { uvs[v * 2] = avgU; uvs[v * 2 + 1] = avgV; }
  uv.needsUpdate = true;
  return geo;
}

export function markSeam(geo: THREE.BufferGeometry, edge: [number, number]): THREE.BufferGeometry {
  if (!geo.userData.seams) geo.userData.seams = new Set<string>();
  const key = edge[0] < edge[1] ? `${edge[0]}_${edge[1]}` : `${edge[1]}_${edge[0]}`;
  (geo.userData.seams as Set<string>).add(key);
  return geo;
}

export function clearSeam(geo: THREE.BufferGeometry, edge: [number, number]): THREE.BufferGeometry {
  if (geo.userData.seams) {
    const key = edge[0] < edge[1] ? `${edge[0]}_${edge[1]}` : `${edge[1]}_${edge[0]}`;
    (geo.userData.seams as Set<string>).delete(key);
  }
  return geo;
}

export function getSeams(geo: THREE.BufferGeometry): Set<string> {
  return (geo.userData.seams as Set<string>) ?? new Set();
}

export function weldUVVertices(geo: THREE.BufferGeometry, threshold: number = 0.001): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  const merged = new Map<number, number>();
  const newUVs: number[] = [];
  let nextIdx = 0;
  for (let i = 0; i < uv.count; i++) {
    const u = uvs[i * 2];
    const v = uvs[i * 2 + 1];
    let found = -1;
    for (let j = 0; j < nextIdx; j++) {
      const du = newUVs[j * 2] - u;
      const dv = newUVs[j * 2 + 1] - v;
      if (du * du + dv * dv < threshold * threshold) { found = j; break; }
    }
    if (found >= 0) merged.set(i, found);
    else { merged.set(i, nextIdx); newUVs.push(u, v); nextIdx++; }
  }
  const indices = geo.index ? Array.from(geo.index.array as Uint32Array) : null;
  if (indices) {
    const newIndices = indices.map(i => merged.get(i) ?? i);
    geo.setIndex(newIndices);
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(newUVs, 2));
  return geo;
}

export function islandDetection(geo: THREE.BufferGeometry): number[][] {
  if (!geo.attributes.uv) return [];
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  const indices = geo.index ? geo.index.array : null;
  const count = indices ? indices.length : uv.count;
  const visited = new Set<number>();
  const islands: number[][] = [];
  const adjacency = new Map<number, number[]>();
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    if (!adjacency.has(c)) adjacency.set(c, []);
    adjacency.get(a)!.push(b, c);
    adjacency.get(b)!.push(a, c);
    adjacency.get(c)!.push(a, b);
  }
  for (let i = 0; i < uv.count; i++) {
    if (visited.has(i)) continue;
    const island: number[] = [];
    const queue = [i];
    while (queue.length > 0) {
      const v = queue.shift()!;
      if (visited.has(v)) continue;
      visited.add(v);
      island.push(v);
      const neighbors = adjacency.get(v);
      if (neighbors) {
        for (const n of neighbors) {
          if (!visited.has(n)) {
            const du = uvs[n * 2] - uvs[v * 2];
            const dv = uvs[n * 2 + 1] - uvs[v * 2 + 1];
            if (du * du + dv * dv < 0.01) queue.push(n);
          }
        }
      }
    }
    islands.push(island);
  }
  return islands;
}

export function packIslands(geo: THREE.BufferGeometry, margin: number = 0.01): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const islands = islandDetection(geo);
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  let offsetX = 0;
  let offsetY = 0;
  let rowHeight = 0;
  const maxSize = 1.0;
  for (const island of islands) {
    let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
    for (const v of island) {
      const u = uvs[v * 2];
      const vv = uvs[v * 2 + 1];
      minU = Math.min(minU, u); minV = Math.min(minV, vv);
      maxU = Math.max(maxU, u); maxV = Math.max(maxV, vv);
    }
    const sizeU = maxU - minU;
    const sizeV = maxV - minV;
    if (offsetX + sizeU > maxSize) { offsetX = 0; offsetY += rowHeight + margin; rowHeight = 0; }
    for (const v of island) {
      uvs[v * 2] = (uvs[v * 2] - minU) + offsetX + margin;
      uvs[v * 2 + 1] = (uvs[v * 2 + 1] - minV) + offsetY + margin;
    }
    offsetX += sizeU + margin;
    rowHeight = Math.max(rowHeight, sizeV);
  }
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    minU = Math.min(minU, uvs[i * 2]); minV = Math.min(minV, uvs[i * 2 + 1]);
    maxU = Math.max(maxU, uvs[i * 2]); maxV = Math.max(maxV, uvs[i * 2 + 1]);
  }
  const scaleU = Math.max(0.001, maxU - minU);
  const scaleV = Math.max(0.001, maxV - minV);
  const scale = Math.max(scaleU, scaleV);
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] = (uvs[i * 2] - minU) / scale;
    uvs[i * 2 + 1] = (uvs[i * 2 + 1] - minV) / scale;
  }
  uv.needsUpdate = true;
  return geo;
}

export function generateUV2(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const size = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    uvs[i * 2] = (x - box.min.x) / maxAxis;
    uvs[i * 2 + 1] = (y - box.min.y) / maxAxis;
  }
  geo.setAttribute("uv2", new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

export function copyUVToUV2(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  geo.setAttribute("uv2", uv.clone());
  return geo;
}

export function flipUVsU(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] = 1 - uvs[i * 2];
  }
  uv.needsUpdate = true;
  return geo;
}

export function flipUVsV(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2 + 1] = 1 - uvs[i * 2 + 1];
  }
  uv.needsUpdate = true;
  return geo;
}

export function rotateUVs(geo: THREE.BufferGeometry, angle: number): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let i = 0; i < uv.count; i++) {
    const u = uvs[i * 2] - 0.5;
    const v = uvs[i * 2 + 1] - 0.5;
    uvs[i * 2] = u * cos - v * sin + 0.5;
    uvs[i * 2 + 1] = u * sin + v * cos + 0.5;
  }
  uv.needsUpdate = true;
  return geo;
}

export function scaleUVs(geo: THREE.BufferGeometry, scaleU: number, scaleV: number): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] *= scaleU;
    uvs[i * 2 + 1] *= scaleV;
  }
  uv.needsUpdate = true;
  return geo;
}

export function translateUVs(geo: THREE.BufferGeometry, du: number, dv: number): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] += du;
    uvs[i * 2 + 1] += dv;
  }
  uv.needsUpdate = true;
  return geo;
}

export function normalizeUVs(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    minU = Math.min(minU, uvs[i * 2]); minV = Math.min(minV, uvs[i * 2 + 1]);
    maxU = Math.max(maxU, uvs[i * 2]); maxV = Math.max(maxV, uvs[i * 2 + 1]);
  }
  const sizeU = Math.max(0.001, maxU - minU);
  const sizeV = Math.max(0.001, maxV - minV);
  for (let i = 0; i < uv.count; i++) {
    uvs[i * 2] = (uvs[i * 2] - minU) / sizeU;
    uvs[i * 2 + 1] = (uvs[i * 2 + 1] - minV) / sizeV;
  }
  uv.needsUpdate = true;
  return geo;
}

export function pinUV(geo: THREE.BufferGeometry, vertex: number): THREE.BufferGeometry {
  if (!geo.userData.pinnedUVs) geo.userData.pinnedUVs = new Set<number>();
  (geo.userData.pinnedUVs as Set<number>).add(vertex);
  return geo;
}

export function unpinUV(geo: THREE.BufferGeometry, vertex: number): THREE.BufferGeometry {
  if (geo.userData.pinnedUVs) (geo.userData.pinnedUVs as Set<number>).delete(vertex);
  return geo;
}

export function getPinnedUVs(geo: THREE.BufferGeometry): Set<number> {
  return (geo.userData.pinnedUVs as Set<number>) ?? new Set();
}

export function relaxUVs(geo: THREE.BufferGeometry, iterations: number = 5): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const uv = geo.attributes.uv;
  const indices = geo.index ? geo.index.array : null;
  const count = indices ? indices.length : uv.count;
  const pinned = getPinnedUVs(geo);
  for (let iter = 0; iter < iterations; iter++) {
    const uvs = new Float32Array(uv.array as Float32Array);
    const neighborSum = new Map<number, { u: number; v: number; n: number }>();
    for (let i = 0; i < count; i += 3) {
      const a = indices ? indices[i] : i;
      const b = indices ? indices[i + 1] : i + 1;
      const c = indices ? indices[i + 2] : i + 2;
      for (const [v1, v2] of [[a, b], [b, c], [c, a]] as [number, number][]) {
        if (pinned.has(v1)) continue;
        if (!neighborSum.has(v1)) neighborSum.set(v1, { u: 0, v: 0, n: 0 });
        const e = neighborSum.get(v1)!;
        e.u += uvs[v2 * 2]; e.v += uvs[v2 * 2 + 1]; e.n++;
      }
    }
    for (const [v, s] of neighborSum) {
      if (s.n === 0) continue;
      uvs[v * 2] = s.u / s.n;
      uvs[v * 2 + 1] = s.v / s.n;
    }
    uv.array.set(uvs);
    uv.needsUpdate = true;
  }
  return geo;
}

export function minifyUVs(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.uv) return geo;
  const result = mergeVertices(geo, 0.001);
  return result;
}

export function getUVBounds(geo: THREE.BufferGeometry): { minU: number; minV: number; maxU: number; maxV: number } {
  if (!geo.attributes.uv) return { minU: 0, minV: 0, maxU: 1, maxV: 1 };
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    minU = Math.min(minU, uvs[i * 2]); minV = Math.min(minV, uvs[i * 2 + 1]);
    maxU = Math.max(maxU, uvs[i * 2]); maxV = Math.max(maxV, uvs[i * 2 + 1]);
  }
  return { minU, minV, maxU, maxV };
}

export function getUVIslandCount(geo: THREE.BufferGeometry): number {
  return islandDetection(geo).length;
}

export function validateUVs(geo: THREE.BufferGeometry): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!geo.attributes.uv) { issues.push("No UV coordinates"); return { valid: false, issues }; }
  const uv = geo.attributes.uv;
  const uvs = uv.array as Float32Array;
  for (let i = 0; i < uv.count; i++) {
    if (isNaN(uvs[i * 2]) || isNaN(uvs[i * 2 + 1])) { issues.push("NaN UV values detected"); break; }
    if (!isFinite(uvs[i * 2]) || !isFinite(uvs[i * 2 + 1])) { issues.push("Infinite UV values detected"); break; }
  }
  const islands = islandDetection(geo);
  if (islands.length > 100) issues.push(`${islands.length} UV islands (may be too many)`);
  return { valid: issues.length === 0, issues };
}
