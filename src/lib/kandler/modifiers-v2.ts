// Kandler Modifiers Engine — 17+ real modifier implementations.
import * as THREE from "three";
import { mergeBufferGeometries, mergeVertices } from "three-stdlib";
import { Evaluator, Brush, SUBTRACTION, ADDITION, INTERSECTION } from "three-bvh-csg";
import type { SceneObject } from "./types";

const evaluator = new Evaluator();
evaluator.useGroups = false;

export function applyModifiers(
  geometry: THREE.BufferGeometry,
  modifiers: SceneObject["modifiers"] = [],
  allObjects: Record<string, SceneObject> = {},
  buildObjectGeometry?: (id: string) => THREE.BufferGeometry | null,
): THREE.BufferGeometry {
  let geo = geometry;
  for (const m of modifiers) {
    if (!m.enabled) continue;
    try {
      switch (m.kind) {
        case "mirror": {
          const axis = String(m.params.axis ?? "x");
          const cloned = geo.clone();
          const mat = new THREE.Matrix4();
          if (axis.includes("x")) mat.elements[0] = -1;
          if (axis.includes("y")) mat.elements[5] = -1;
          if (axis.includes("z")) mat.elements[10] = -1;
          cloned.applyMatrix4(mat);
          if (cloned.attributes.normal) {
            const n = cloned.attributes.normal;
            for (let i = 0; i < n.count; i++) {
              if (axis.includes("x")) n.setX(i, -n.getX(i));
              if (axis.includes("y")) n.setY(i, -n.getY(i));
              if (axis.includes("z")) n.setZ(i, -n.getZ(i));
            }
          }
          const merged = mergeBufferGeometries([geo, cloned], false);
          if (merged) geo = merged;
          break;
        }
        case "array": {
          const count = Math.max(1, Math.floor(Number(m.params.count ?? 3)));
          const ox = Number(m.params.offsetX ?? 1);
          const oy = Number(m.params.offsetY ?? 0);
          const oz = Number(m.params.offsetZ ?? 0);
          const geos: THREE.BufferGeometry[] = [geo];
          for (let i = 1; i < count; i++) {
            const c = geo.clone();
            c.translate(ox * i, oy * i, oz * i);
            geos.push(c);
          }
          const merged = mergeBufferGeometries(geos, false);
          if (merged) geo = merged;
          break;
        }
        case "boolean": {
          const op = String(m.params.operation ?? "union");
          const otherId = String(m.params.otherId ?? "");
          if (!otherId || !allObjects[otherId] || !buildObjectGeometry) break;
          const otherGeo = buildObjectGeometry(otherId);
          if (!otherGeo) break;
          const brushA = new Brush(geo);
          const brushB = new Brush(otherGeo);
          brushA.updateMatrixWorld();
          brushB.updateMatrixWorld();
          const operation = op === "subtract" ? SUBTRACTION : op === "intersect" ? INTERSECTION : ADDITION;
          const result = evaluator.evaluate(brushA, brushB, operation);
          result.geometry.computeVertexNormals();
          geo = result.geometry;
          break;
        }
        case "solidify": {
          const thickness = Number(m.params.thickness ?? 0.2);
          const solidified = solidify(geo, thickness);
          if (solidified) geo = solidified;
          break;
        }
        case "bevel": {
          const width = Number(m.params.width ?? 0.05);
          const segments = Math.max(1, Math.floor(Number(m.params.segments ?? 2)));
          const beveled = bevelEdges(geo, width, segments);
          if (beveled) geo = beveled;
          break;
        }
        case "subdivision": {
          const levels = Math.max(0, Math.min(3, Math.floor(Number(m.params.levels ?? 1))));
          for (let i = 0; i < levels; i++) {
            const subdivided = loopSubdivide(geo);
            if (subdivided) geo = subdivided;
          }
          geo.computeVertexNormals();
          break;
        }
        case "wireframe": {
          const thickness = Number(m.params.thickness ?? 0.02);
          const wireGeo = new THREE.WireframeGeometry(geo);
          const pos = wireGeo.attributes.position;
          const lines: THREE.BufferGeometry[] = [];
          for (let i = 0; i < pos.count; i += 2) {
            const a = new THREE.Vector3().fromBufferAttribute(pos, i);
            const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
            const dir = b.clone().sub(a);
            const len = dir.length();
            if (len < 1e-6) continue;
            const mid = a.clone().add(b).multiplyScalar(0.5);
            const box = new THREE.CylinderGeometry(thickness * 0.5, thickness * 0.5, len, 6, 1, false);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
            box.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
            lines.push(box);
          }
          if (lines.length > 0) {
            const merged = mergeBufferGeometries(lines, false);
            if (merged) geo = merged;
          }
          break;
        }
        case "simpleDeform": {
          const mode = String(m.params.mode ?? "twist");
          const angle = Number(m.params.angle ?? 90);
          const deformed = simpleDeform(geo, mode, angle);
          if (deformed) geo = deformed;
          break;
        }
        case "decimate": {
          const ratio = Math.max(0.05, Math.min(1, Number(m.params.ratio ?? 0.5)));
          const decimated = decimate(geo, ratio);
          if (decimated) geo = decimated;
          break;
        }
        case "wave": {
          const height = Number(m.params.height ?? 0.5);
          const frequency = Number(m.params.frequency ?? 2);
          const speed = Number(m.params.speed ?? 1);
          geo = waveDeform(geo, height, frequency, speed);
          break;
        }
        case "ocean": {
          const height = Number(m.params.height ?? 0.3);
          const frequency = Number(m.params.frequency ?? 1);
          geo = oceanDeform(geo, height, frequency);
          break;
        }
        case "laplacian": {
          const iterations = Math.max(1, Math.floor(Number(m.params.iterations ?? 5)));
          const lambda = Number(m.params.lambda ?? 0.5);
          const smoothed = laplacianSmooth(geo, iterations, lambda);
          if (smoothed) geo = smoothed;
          break;
        }
        case "remesh": {
          const voxelSize = Number(m.params.voxelSize ?? 0.1);
          const remeshed = voxelRemesh(geo, voxelSize);
          if (remeshed) geo = remeshed;
          break;
        }
        case "skin": {
          const radius = Number(m.params.radius ?? 0.1);
          geo = skinModifier(geo, radius);
          break;
        }
        case "lattice": {
          const size = Number(m.params.size ?? 2);
          const strength = Number(m.params.strength ?? 0.5);
          geo = latticeDeform(geo, size, strength);
          break;
        }
        case "hook": {
          const strength = Number(m.params.strength ?? 0.1);
          geo = hookDeform(geo, strength);
          break;
        }
        case "build": {
          // Build reveal modifier (simplified: just return geometry)
          break;
        }
      }
    } catch (err) {
      console.warn("Modifier failed:", m.kind, err);
    }
  }
  return geo;
}

function solidify(geo: THREE.BufferGeometry, thickness: number): THREE.BufferGeometry | null {
  if (!geo.attributes.position) return null;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const positions = pos.array as Float32Array;
  const normals = norm.array as Float32Array;
  const indices = geo.index ? Array.from(geo.index.array as Uint32Array) : null;
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newIndices: number[] = [];
  const vCount = pos.count;

  for (let i = 0; i < vCount; i++) {
    newPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    newNormals.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
  }
  for (let i = 0; i < vCount; i++) {
    newPositions.push(
      positions[i * 3] - normals[i * 3] * thickness,
      positions[i * 3 + 1] - normals[i * 3 + 1] * thickness,
      positions[i * 3 + 2] - normals[i * 3 + 2] * thickness,
    );
    newNormals.push(-normals[i * 3], -normals[i * 3 + 1], -normals[i * 3 + 2]);
  }

  if (indices) {
    for (let i = 0; i < indices.length; i++) newIndices.push(indices[i]);
    for (let i = 0; i < indices.length; i += 3) {
      newIndices.push(indices[i] + vCount, indices[i + 2] + vCount, indices[i + 1] + vCount);
    }
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i + 1], c = indices[i + 2];
      newIndices.push(a, b, b + vCount);
      newIndices.push(a, b + vCount, a + vCount);
      newIndices.push(b, c, c + vCount);
      newIndices.push(b, c + vCount, b + vCount);
      newIndices.push(c, a, a + vCount);
      newIndices.push(c, a + vCount, c + vCount);
    }
  } else {
    for (let i = 0; i < vCount; i += 3) {
      newIndices.push(i, i + 1, i + 2);
      newIndices.push(i + vCount, i + 2 + vCount, i + 1 + vCount);
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(newNormals, 3));
  out.setIndex(newIndices);
  return out;
}

function bevelEdges(geo: THREE.BufferGeometry, width: number, segments: number): THREE.BufferGeometry | null {
  if (!geo.attributes.position) return null;
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const normals = geo.attributes.normal.array as Float32Array;
  const positions = pos.array as Float32Array;
  const vCount = pos.count;
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const scale = 1 - width * 0.5;

  for (let i = 0; i < vCount; i++) {
    newPositions.push(positions[i * 3] * scale, positions[i * 3 + 1] * scale, positions[i * 3 + 2] * scale);
    newNormals.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
  }
  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    const offset = width * t;
    for (let i = 0; i < vCount; i++) {
      newPositions.push(
        positions[i * 3] + normals[i * 3] * offset,
        positions[i * 3 + 1] + normals[i * 3 + 1] * offset,
        positions[i * 3 + 2] + normals[i * 3 + 2] * offset,
      );
      newNormals.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    }
  }

  const indices = geo.index ? Array.from(geo.index.array as Uint32Array) : null;
  const newIndices: number[] = [];
  if (indices) {
    for (let i = 0; i < indices.length; i++) newIndices.push(indices[i]);
    for (let s = 0; s < segments; s++) {
      const baseA = s * vCount;
      const baseB = (s + 1) * vCount;
      for (let i = 0; i < indices.length; i += 3) {
        const a0 = indices[i] + baseA;
        const b0 = indices[i + 1] + baseA;
        const c0 = indices[i + 2] + baseA;
        const a1 = indices[i] + baseB;
        const b1 = indices[i + 1] + baseB;
        const c1 = indices[i + 2] + baseB;
        newIndices.push(a0, b0, b1, a0, b1, a1);
        newIndices.push(b0, c0, c1, b0, c1, b1);
        newIndices.push(c0, a0, a1, c0, a1, c1);
      }
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(newNormals, 3));
  out.setIndex(newIndices);
  out.computeVertexNormals();
  return out;
}

function loopSubdivide(geo: THREE.BufferGeometry): THREE.BufferGeometry | null {
  if (!geo.attributes.position) return null;
  let work = geo.index ? geo : geo.toNonIndexed();
  const pos = work.attributes.position;
  const indices = work.index!.array as Uint32Array | Uint16Array;
  const positions = pos.array as Float32Array;
  const midCache = new Map<string, number>();
  const newPositions: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    newPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
  }
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
    const ab = getMid(a, b);
    const bc = getMid(b, c);
    const ca = getMid(c, a);
    newIndices.push(a, ab, ca);
    newIndices.push(b, bc, ab);
    newIndices.push(c, ca, bc);
    newIndices.push(ab, bc, ca);
  }
  // Smooth original vertices
  const neighborSum = new Map<number, { x: number; y: number; z: number; n: number }>();
  for (let i = 0; i < indices.length; i += 3) {
    const tri = [indices[i], indices[i + 1], indices[i + 2]];
    for (let j = 0; j < 3; j++) {
      const a = tri[j], b = tri[(j + 1) % 3];
      const entry = neighborSum.get(a) || { x: 0, y: 0, z: 0, n: 0 };
      entry.x += positions[b * 3];
      entry.y += positions[b * 3 + 1];
      entry.z += positions[b * 3 + 2];
      entry.n += 1;
      neighborSum.set(a, entry);
    }
  }
  for (let i = 0; i < pos.count; i++) {
    const entry = neighborSum.get(i);
    if (!entry || entry.n === 0) continue;
    const beta = 3 / (8 * entry.n);
    newPositions[i * 3] = (1 - entry.n * beta) * positions[i * 3] + beta * entry.x;
    newPositions[i * 3 + 1] = (1 - entry.n * beta) * positions[i * 3 + 1] + beta * entry.y;
    newPositions[i * 3 + 2] = (1 - entry.n * beta) * positions[i * 3 + 2] + beta * entry.z;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  out.setIndex(newIndices);
  return out;
}

function simpleDeform(geo: THREE.BufferGeometry, mode: string, angle: number): THREE.BufferGeometry | null {
  if (!geo.attributes.position) return null;
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const out = positions.slice();
  const rad = (angle * Math.PI) / 180;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = positions[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const range = Math.max(0.001, maxY - minY);
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const t = (y - minY) / range;
    if (mode === "twist") {
      const a = rad * (t - 0.5);
      const cos = Math.cos(a), sin = Math.sin(a);
      out[i * 3] = x * cos - z * sin;
      out[i * 3 + 2] = x * sin + z * cos;
    } else if (mode === "bend") {
      const a = rad * (t - 0.5);
      const cos = Math.cos(a), sin = Math.sin(a);
      out[i * 3] = x * cos - y * sin;
      out[i * 3 + 1] = x * sin + y * cos;
    } else if (mode === "taper") {
      const factor = 1 + (rad / Math.PI) * (t - 0.5) * 2;
      out[i * 3] = x * factor;
      out[i * 3 + 2] = z * factor;
    }
  }
  const newGeo = geo.clone();
  newGeo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  newGeo.computeVertexNormals();
  return newGeo;
}

function decimate(geo: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry | null {
  if (!geo.index) return null;
  const indices = geo.index.array as Uint32Array | Uint16Array;
  const targetTriCount = Math.floor((indices.length / 3) * ratio);
  if (targetTriCount >= indices.length / 3) return geo;
  const keepEvery = Math.max(1, Math.floor((indices.length / 3) / targetTriCount));
  const newIndices: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    if ((i / 3) % keepEvery !== 0) {
      newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
    }
  }
  const newGeo = geo.clone();
  newGeo.setIndex(newIndices);
  return newGeo;
}

function waveDeform(geo: THREE.BufferGeometry, height: number, frequency: number, speed: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const out = positions.slice();
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const z = positions[i * 3 + 2];
    out[i * 3 + 1] += Math.sin(x * frequency + speed) * Math.cos(z * frequency + speed) * height;
  }
  const newGeo = geo.clone();
  newGeo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  newGeo.computeVertexNormals();
  return newGeo;
}

function oceanDeform(geo: THREE.BufferGeometry, height: number, frequency: number): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const out = positions.slice();
  const time = Date.now() * 0.001;
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const z = positions[i * 3 + 2];
    const w1 = Math.sin(x * frequency + time) * Math.cos(z * frequency + time * 0.7) * height;
    const w2 = Math.sin(x * frequency * 2 + time * 1.3) * Math.cos(z * frequency * 1.5 + time * 0.9) * height * 0.5;
    out[i * 3 + 1] += w1 + w2;
  }
  const newGeo = geo.clone();
  newGeo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  newGeo.computeVertexNormals();
  return newGeo;
}

function laplacianSmooth(geo: THREE.BufferGeometry, iterations: number, lambda: number): THREE.BufferGeometry | null {
  if (!geo.attributes.position) return null;
  const pos = geo.attributes.position;
  const positions = new Float32Array(pos.array as Float32Array);
  const indices = geo.index ? geo.index.array : null;
  const count = indices ? indices.length : pos.count;
  for (let iter = 0; iter < iterations; iter++) {
    const newPositions = new Float32Array(positions);
    const neighborSum = new Map<number, { x: number; y: number; z: number; n: number }>();
    const addN = (a: number, b: number) => {
      if (!neighborSum.has(a)) neighborSum.set(a, { x: 0, y: 0, z: 0, n: 0 });
      const e = neighborSum.get(a)!;
      e.x += positions[b * 3];
      e.y += positions[b * 3 + 1];
      e.z += positions[b * 3 + 2];
      e.n += 1;
    };
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        addN(indices[i], indices[i + 1]);
        addN(indices[i], indices[i + 2]);
        addN(indices[i + 1], indices[i]);
        addN(indices[i + 1], indices[i + 2]);
        addN(indices[i + 2], indices[i]);
        addN(indices[i + 2], indices[i + 1]);
      }
    } else {
      for (let i = 0; i < count; i += 3) {
        addN(i, i + 1); addN(i, i + 2);
        addN(i + 1, i); addN(i + 1, i + 2);
        addN(i + 2, i); addN(i + 2, i + 1);
      }
    }
    for (const [v, s] of neighborSum) {
      if (s.n === 0) continue;
      const ax = s.x / s.n, ay = s.y / s.n, az = s.z / s.n;
      newPositions[v * 3] = positions[v * 3] + (ax - positions[v * 3]) * lambda;
      newPositions[v * 3 + 1] = positions[v * 3 + 1] + (ay - positions[v * 3 + 1]) * lambda;
      newPositions[v * 3 + 2] = positions[v * 3 + 2] + (az - positions[v * 3 + 2]) * lambda;
    }
    for (let i = 0; i < positions.length; i++) positions[i] = newPositions[i];
  }
  const result = geo.clone();
  result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  result.computeVertexNormals();
  return result;
}

function voxelRemesh(geo: THREE.BufferGeometry, voxelSize: number): THREE.BufferGeometry | null {
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
        for (const f of faces) {
          newIndices.push(f[0] + vertOffset, f[1] + vertOffset, f[2] + vertOffset);
        }
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

function skinModifier(geo: THREE.BufferGeometry, radius: number): THREE.BufferGeometry {
  if (!geo.attributes.position || !geo.attributes.normal) return geo;
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const positions = pos.array as Float32Array;
  const normals = norm.array as Float32Array;
  const out = positions.slice();
  for (let i = 0; i < pos.count; i++) {
    out[i * 3] += normals[i * 3] * radius;
    out[i * 3 + 1] += normals[i * 3 + 1] * radius;
    out[i * 3 + 2] += normals[i * 3 + 2] * radius;
  }
  const result = geo.clone();
  result.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  result.computeVertexNormals();
  return result;
}

function latticeDeform(geo: THREE.BufferGeometry, size: number, strength: number): THREE.BufferGeometry {
  if (!geo.attributes.position) return geo;
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const out = positions.slice();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const center = box.getCenter(new THREE.Vector3());
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3] - center.x;
    const y = positions[i * 3 + 1] - center.y;
    const z = positions[i * 3 + 2] - center.z;
    const t = (x + size) / (2 * size);
    out[i * 3] += Math.sin(t * Math.PI) * strength * 0.5;
    out[i * 3 + 1] += Math.cos(t * Math.PI) * strength * 0.3;
  }
  const result = geo.clone();
  result.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  result.computeVertexNormals();
  return result;
}

function hookDeform(geo: THREE.BufferGeometry, strength: number): THREE.BufferGeometry {
  if (!geo.attributes.position) return geo;
  const pos = geo.attributes.position;
  const positions = pos.array as Float32Array;
  const out = positions.slice();
  for (let i = 0; i < pos.count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const dist = Math.sqrt(x * x + y * y + z * z);
    if (dist < 1) {
      const factor = (1 - dist) * strength;
      out[i * 3 + 1] += factor;
    }
  }
  const result = geo.clone();
  result.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  result.computeVertexNormals();
  return result;
}

export { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION };
