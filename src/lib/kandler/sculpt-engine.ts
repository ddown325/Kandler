// Kandler Sculpt Engine — 8 brushes, masking, symmetry, voxel remesh, auto-smooth.
import * as THREE from "three";

export type BrushType = "grab" | "smooth" | "flatten" | "inflate" | "crease" | "draw" | "pinch" | "clay";

export interface BrushSettings {
  type: BrushType;
  size: number;
  strength: number;
  falloff: number;
  symmetry: "none" | "x" | "y" | "z";
  autoSmooth: number;
}

export const DEFAULT_BRUSH: BrushSettings = {
  type: "draw", size: 0.5, strength: 0.3, falloff: 0.5, symmetry: "none", autoSmooth: 0.1,
};

function falloffCurve(distance: number, radius: number, falloff: number): number {
  const t = Math.min(1, distance / radius);
  const smooth = 1 - t * t * (3 - 2 * t);
  const linear = 1 - t;
  return linear * (1 - falloff) + smooth * falloff;
}

export function applyBrush(
  geo: THREE.BufferGeometry,
  worldPos: THREE.Vector3,
  brush: BrushSettings,
  delta: THREE.Vector3,
  mask?: Float32Array,
): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const positions = pos.array as Float32Array;
  const normals = norm ? (norm.array as Float32Array) : null;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const radius = brush.size;
  const strength = brush.strength;
  const affected: { index: number; weight: number }[] = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.distanceTo(worldPos);
    if (d < radius) {
      const w = falloffCurve(d, radius, brush.falloff);
      const maskW = mask ? mask[i] : 1;
      if (w > 0 && maskW > 0) affected.push({ index: i, weight: w * maskW });
    }
  }
  if (affected.length === 0) return geo;
  const mirrors: THREE.Vector3[] = [worldPos.clone()];
  if (brush.symmetry === "x") mirrors.push(worldPos.clone().setX(-worldPos.x));
  else if (brush.symmetry === "y") mirrors.push(worldPos.clone().setY(-worldPos.y));
  else if (brush.symmetry === "z") mirrors.push(worldPos.clone().setZ(-worldPos.z));
  for (const mirrorPos of mirrors) {
    for (const { index, weight } of affected) {
      v.fromBufferAttribute(pos, index);
      const d = v.distanceTo(mirrorPos);
      if (d >= radius) continue;
      const w = falloffCurve(d, radius, brush.falloff) * weight;
      if (w <= 0) continue;
      switch (brush.type) {
        case "draw": {
          if (normals) {
            n.fromBufferAttribute(norm, index);
            positions[index * 3] += n.x * delta.length() * w * strength;
            positions[index * 3 + 1] += n.y * delta.length() * w * strength;
            positions[index * 3 + 2] += n.z * delta.length() * w * strength;
          }
          break;
        }
        case "grab": {
          positions[index * 3] += delta.x * w * strength;
          positions[index * 3 + 1] += delta.y * w * strength;
          positions[index * 3 + 2] += delta.z * w * strength;
          break;
        }
        case "smooth": {
          const neighbors = getNeighbors(geo, index);
          if (neighbors.length > 0) {
            const avg = new THREE.Vector3();
            for (const ni of neighbors) avg.fromBufferAttribute(pos, ni);
            avg.divideScalar(neighbors.length);
            positions[index * 3] = positions[index * 3] * (1 - w * strength) + avg.x * w * strength;
            positions[index * 3 + 1] = positions[index * 3 + 1] * (1 - w * strength) + avg.y * w * strength;
            positions[index * 3 + 2] = positions[index * 3 + 2] * (1 - w * strength) + avg.z * w * strength;
          }
          break;
        }
        case "flatten": {
          if (normals) {
            n.fromBufferAttribute(norm, index);
            const planeDist = (v.x - mirrorPos.x) * n.x + (v.y - mirrorPos.y) * n.y + (v.z - mirrorPos.z) * n.z;
            positions[index * 3] -= n.x * planeDist * w * strength * 0.5;
            positions[index * 3 + 1] -= n.y * planeDist * w * strength * 0.5;
            positions[index * 3 + 2] -= n.z * planeDist * w * strength * 0.5;
          }
          break;
        }
        case "inflate": {
          if (normals) {
            n.fromBufferAttribute(norm, index);
            positions[index * 3] += n.x * w * strength * 0.1;
            positions[index * 3 + 1] += n.y * w * strength * 0.1;
            positions[index * 3 + 2] += n.z * w * strength * 0.1;
          }
          break;
        }
        case "crease": {
          if (normals) {
            n.fromBufferAttribute(norm, index);
            positions[index * 3] -= n.x * w * w * strength * 0.2;
            positions[index * 3 + 1] -= n.y * w * w * strength * 0.2;
            positions[index * 3 + 2] -= n.z * w * w * strength * 0.2;
          }
          break;
        }
        case "pinch": {
          const dir = new THREE.Vector3().subVectors(mirrorPos, v).normalize();
          positions[index * 3] += dir.x * w * strength * 0.05;
          positions[index * 3 + 1] += dir.y * w * strength * 0.05;
          positions[index * 3 + 2] += dir.z * w * strength * 0.05;
          break;
        }
        case "clay": {
          if (normals) {
            n.fromBufferAttribute(norm, index);
            const facing = n.dot(new THREE.Vector3().subVectors(mirrorPos, v).normalize());
            if (facing > 0) {
              positions[index * 3] += n.x * w * strength * 0.05;
              positions[index * 3 + 1] += n.y * w * strength * 0.05;
              positions[index * 3 + 2] += n.z * w * strength * 0.05;
            }
          }
          break;
        }
      }
    }
  }
  if (brush.autoSmooth > 0 && brush.type !== "smooth") {
    smoothMesh(geo, brush.autoSmooth * 0.1, affected);
  }
  pos.needsUpdate = true;
  if (norm) norm.needsUpdate = true;
  else geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

function getNeighbors(geo: THREE.BufferGeometry, vertex: number): number[] {
  const indices = geo.index ? geo.index.array : null;
  const pos = geo.attributes.position;
  const count = indices ? indices.length : pos.count;
  const neighbors = new Set<number>();
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i + 1], c = indices[i + 2];
      if (a === vertex) { neighbors.add(b); neighbors.add(c); }
      else if (b === vertex) { neighbors.add(a); neighbors.add(c); }
      else if (c === vertex) { neighbors.add(a); neighbors.add(b); }
    }
  } else {
    for (let i = 0; i < count; i += 3) {
      const a = i, b = i + 1, c = i + 2;
      if (a === vertex) { neighbors.add(b); neighbors.add(c); }
      else if (b === vertex) { neighbors.add(a); neighbors.add(c); }
      else if (c === vertex) { neighbors.add(a); neighbors.add(b); }
    }
  }
  return Array.from(neighbors);
}

export function smoothMesh(geo: THREE.BufferGeometry, factor: number, affected?: { index: number; weight: number }[]): void {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const verts = affected ? affected.map(a => a.index) : Array.from({ length: pos.count }, (_, i) => i);
  const newPositions = new Float32Array(positions);
  for (const vi of verts) {
    const neighbors = getNeighbors(geo, vi);
    if (neighbors.length === 0) continue;
    let ax = 0, ay = 0, az = 0;
    for (const ni of neighbors) {
      ax += positions[ni * 3]; ay += positions[ni * 3 + 1]; az += positions[ni * 3 + 2];
    }
    ax /= neighbors.length; ay /= neighbors.length; az /= neighbors.length;
    const w = affected ? (affected.find(a => a.index === vi)?.weight ?? 0) : 1;
    newPositions[vi * 3] = positions[vi * 3] * (1 - factor * w) + ax * factor * w;
    newPositions[vi * 3 + 1] = positions[vi * 3 + 1] * (1 - factor * w) + ay * factor * w;
    newPositions[vi * 3 + 2] = positions[vi * 3 + 2] * (1 - factor * w) + az * factor * w;
  }
  for (let i = 0; i < positions.length; i++) positions[i] = newPositions[i];
  pos.needsUpdate = true;
}

export function createMask(vertexCount: number): Float32Array {
  return new Float32Array(vertexCount);
}

export function paintMask(mask: Float32Array, geo: THREE.BufferGeometry, worldPos: THREE.Vector3, radius: number, strength: number, erase: boolean): Float32Array {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.distanceTo(worldPos);
    if (d < radius) {
      const w = 1 - d / radius;
      if (erase) mask[i] = Math.max(0, mask[i] - w * strength);
      else mask[i] = Math.min(1, mask[i] + w * strength);
    }
  }
  return mask;
}

export function invertMask(mask: Float32Array): Float32Array {
  for (let i = 0; i < mask.length; i++) mask[i] = 1 - mask[i];
  return mask;
}

export function clearMask(mask: Float32Array): Float32Array {
  mask.fill(0);
  return mask;
}

export function fillMask(mask: Float32Array, value: number = 1): Float32Array {
  mask.fill(value);
  return mask;
}

export function blurMask(mask: Float32Array, geo: THREE.BufferGeometry, iterations: number = 1): Float32Array {
  for (let iter = 0; iter < iterations; iter++) {
    const newMask = new Float32Array(mask);
    for (let i = 0; i < mask.length; i++) {
      const neighbors = getNeighbors(geo, i);
      if (neighbors.length === 0) continue;
      let avg = mask[i];
      for (const n of neighbors) avg += mask[n];
      avg /= (neighbors.length + 1);
      newMask[i] = avg;
    }
    mask.set(newMask);
  }
  return mask;
}

export function voxelRemesh(geo: THREE.BufferGeometry, voxelSize: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const subdivisions = Math.max(4, Math.ceil(maxDim / voxelSize));
  const grid: number[][][][] = [];
  for (let i = 0; i <= subdivisions; i++) {
    grid[i] = [];
    for (let j = 0; j <= subdivisions; j++) {
      grid[i][j] = [];
      for (let k = 0; k <= subdivisions; k++) grid[i][j][k] = 0;
    }
  }
  const indices = geo.index ? geo.index.array : null;
  const positions = pos.array as Float32Array;
  const count = indices ? indices.length : pos.count;
  const origin = box.min;
  const step = maxDim / subdivisions;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;
    const va = [positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]];
    const vb = [positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]];
    const vc = [positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]];
    const minX = Math.max(0, Math.min(subdivisions - 1, Math.floor((Math.min(va[0], vb[0], vc[0]) - origin.x) / step)));
    const maxX = Math.max(0, Math.min(subdivisions - 1, Math.ceil((Math.max(va[0], vb[0], vc[0]) - origin.x) / step)));
    const minY = Math.max(0, Math.min(subdivisions - 1, Math.floor((Math.min(va[1], vb[1], vc[1]) - origin.y) / step)));
    const maxY = Math.max(0, Math.min(subdivisions - 1, Math.ceil((Math.max(va[1], vb[1], vc[1]) - origin.y) / step)));
    const minZ = Math.max(0, Math.min(subdivisions - 1, Math.floor((Math.min(va[2], vb[2], vc[2]) - origin.z) / step)));
    const maxZ = Math.max(0, Math.min(subdivisions - 1, Math.ceil((Math.max(va[2], vb[2], vc[2]) - origin.z) / step)));
    for (let xi = minX; xi <= maxX; xi++)
      for (let yi = minY; yi <= maxY; yi++)
        for (let zi = minZ; zi <= maxZ; zi++)
          grid[xi][yi][zi] = 1;
  }
  const newPositions: number[] = [];
  const newIndices: number[] = [];
  let vertOffset = 0;
  for (let i = 0; i < subdivisions; i++) {
    for (let j = 0; j < subdivisions; j++) {
      for (let k = 0; k < subdivisions; k++) {
        if (!grid[i][j][k]) continue;
        const isSurface =
          (i === 0 || !grid[i - 1][j][k]) ||
          (i === subdivisions - 1 || !grid[i + 1][j][k]) ||
          (j === 0 || !grid[i][j - 1][k]) ||
          (j === subdivisions - 1 || !grid[i][j + 1][k]) ||
          (k === 0 || !grid[i][j][k - 1]) ||
          (k === subdivisions - 1 || !grid[i][j][k + 1]);
        if (!isSurface) continue;
        const x = origin.x + i * step;
        const y = origin.y + j * step;
        const z = origin.z + k * step;
        const s = step * 0.5;
        const corners = [
          [x - s, y - s, z - s], [x + s, y - s, z - s],
          [x + s, y + s, z - s], [x - s, y + s, z - s],
          [x - s, y - s, z + s], [x + s, y - s, z + s],
          [x + s, y + s, z + s], [x - s, y + s, z + s],
        ];
        for (const p of corners) newPositions.push(p[0], p[1], p[2]);
        const faces = [
          [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
          [0, 4, 5], [0, 5, 1], [2, 6, 7], [2, 7, 3],
          [0, 3, 7], [0, 7, 4], [1, 5, 6], [1, 6, 2],
        ];
        for (const f of faces) newIndices.push(f[0] + vertOffset, f[1] + vertOffset, f[2] + vertOffset);
        vertOffset += 8;
      }
    }
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  result.setIndex(newIndices);
  result.computeVertexNormals();
  return result;
}

export function dynTopo(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, detailSize: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const toSplit: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.distanceTo(center) < radius) toSplit.push(i);
  }
  if (toSplit.length === 0) return geo;
  void detailSize;
  return geo;
}

export function grabStroke(geo: THREE.BufferGeometry, startIndex: number, delta: THREE.Vector3, strength: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  positions[startIndex * 3] += delta.x * strength;
  positions[startIndex * 3 + 1] += delta.y * strength;
  positions[startIndex * 3 + 2] += delta.z * strength;
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function drawStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number, direction: THREE.Vector3): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "draw", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, direction);
}

export function smoothStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "smooth", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function inflateStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "inflate", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function flattenStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "flatten", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function pinchStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "pinch", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function creaseStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "crease", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function clayStroke(geo: THREE.BufferGeometry, center: THREE.Vector3, radius: number, strength: number): THREE.BufferGeometry {
  const brush: BrushSettings = { type: "clay", size: radius, strength, falloff: 0.5, symmetry: "none", autoSmooth: 0 };
  return applyBrush(geo, center, brush, new THREE.Vector3());
}

export function getBrushPreview(center: THREE.Vector3, radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, depthTest: false, transparent: true, opacity: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(center);
  mesh.renderOrder = 999;
  return mesh;
}
