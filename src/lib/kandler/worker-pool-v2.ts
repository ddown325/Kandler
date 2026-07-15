// Kandler Worker Pool — offload heavy computation to Web Workers.
// Operations: voxel remesh, subdivision, laplacian smooth, merge vertices, compute normals, bounding box.

const WORKER_CODE = `
self.onmessage = function(e) {
  const msg = e.data;
  try {
    let result;
    switch (msg.type) {
      case "voxel-remesh": result = voxelRemesh(msg.payload.positions, msg.payload.indices, msg.payload.voxelSize); break;
      case "subdivide": result = subdivide(msg.payload.positions, msg.payload.indices, msg.payload.levels); break;
      case "laplacian-smooth": result = laplacianSmooth(msg.payload.positions, msg.payload.indices, msg.payload.iterations, msg.payload.lambda); break;
      case "merge-vertices": result = mergeVertices(msg.payload.positions, msg.payload.indices, msg.payload.distance); break;
      case "compute-normals": result = computeNormals(msg.payload.positions, msg.payload.indices); break;
      case "compute-bounding-box": result = computeBoundingBox(msg.payload.positions); break;
      case "compute-surface-area": result = computeSurfaceArea(msg.payload.positions, msg.payload.indices); break;
      case "compute-volume": result = computeVolume(msg.payload.positions, msg.payload.indices); break;
      case "decimate": result = decimate(msg.payload.positions, msg.payload.indices, msg.payload.ratio); break;
      case "flip-normals": result = flipNormals(msg.payload.indices); break;
      case "weld-vertices": result = weldVertices(msg.payload.positions, msg.payload.indices, msg.payload.threshold); break;
      case "calculate-edge-list": result = calculateEdgeList(msg.payload.indices, msg.payload.positionCount); break;
      case "calculate-face-list": result = calculateFaceList(msg.payload.indices, msg.payload.positionCount); break;
      case "find-boundary-edges": result = findBoundaryEdges(msg.payload.indices); break;
      case "check-manifold": result = checkManifold(msg.payload.indices); break;
      default: self.postMessage({ id: msg.id, type: msg.type, error: "Unknown type: " + msg.type }); return;
    }
    self.postMessage({ id: msg.id, type: msg.type, result: result });
  } catch (err) {
    self.postMessage({ id: msg.id, type: msg.type, error: err.message });
  }
};

function voxelRemesh(positions, indices, voxelSize) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i] < minX) minX = positions[i]; if (positions[i] > maxX) maxX = positions[i];
    if (positions[i+1] < minY) minY = positions[i+1]; if (positions[i+1] > maxY) maxY = positions[i+1];
    if (positions[i+2] < minZ) minZ = positions[i+2]; if (positions[i+2] > maxZ) maxZ = positions[i+2];
  }
  const sizeX = Math.max(1, Math.ceil((maxX - minX) / voxelSize));
  const sizeY = Math.max(1, Math.ceil((maxY - minY) / voxelSize));
  const sizeZ = Math.max(1, Math.ceil((maxZ - minZ) / voxelSize));
  const grid = new Uint8Array(sizeX * sizeY * sizeZ);
  const fillVoxel = (x, y, z) => {
    if (x < 0 || x >= sizeX || y < 0 || y >= sizeY || z < 0 || z >= sizeZ) return;
    grid[x * sizeY * sizeZ + y * sizeZ + z] = 1;
  };
  const count = indices ? indices.length : positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    const ax = positions[a*3], ay = positions[a*3+1], az = positions[a*3+2];
    const bx = positions[b*3], by = positions[b*3+1], bz = positions[b*3+2];
    const cx = positions[c*3], cy = positions[c*3+1], cz = positions[c*3+2];
    const tMinX = Math.floor((Math.min(ax, bx, cx) - minX) / voxelSize);
    const tMaxX = Math.ceil((Math.max(ax, bx, cx) - minX) / voxelSize);
    const tMinY = Math.floor((Math.min(ay, by, cy) - minY) / voxelSize);
    const tMaxY = Math.ceil((Math.max(ay, by, cy) - minY) / voxelSize);
    const tMinZ = Math.floor((Math.min(az, bz, cz) - minZ) / voxelSize);
    const tMaxZ = Math.ceil((Math.max(az, bz, cz) - minZ) / voxelSize);
    for (let x = tMinX; x <= tMaxX; x++)
      for (let y = tMinY; y <= tMaxY; y++)
        for (let z = tMinZ; z <= tMaxZ; z++)
          fillVoxel(x, y, z);
  }
  const newPositions = [];
  const newIndices = [];
  let offset = 0;
  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        if (!grid[x * sizeY * sizeZ + y * sizeZ + z]) continue;
        const isSurface =
          (x === 0 || !grid[(x-1) * sizeY * sizeZ + y * sizeZ + z]) ||
          (x === sizeX-1 || !grid[(x+1) * sizeY * sizeZ + y * sizeZ + z]) ||
          (y === 0 || !grid[x * sizeY * sizeZ + (y-1) * sizeZ + z]) ||
          (y === sizeY-1 || !grid[x * sizeY * sizeZ + (y+1) * sizeZ + z]) ||
          (z === 0 || !grid[x * sizeY * sizeZ + y * sizeZ + (z-1)]) ||
          (z === sizeZ-1 || !grid[x * sizeY * sizeZ + y * sizeZ + (z+1)]);
        if (!isSurface) continue;
        const px = minX + x * voxelSize;
        const py = minY + y * voxelSize;
        const pz = minZ + z * voxelSize;
        const s = voxelSize * 0.5;
        const corners = [
          [px-s, py-s, pz-s], [px+s, py-s, pz-s],
          [px+s, py+s, pz-s], [px-s, py+s, pz-s],
          [px-s, py-s, pz+s], [px+s, py-s, pz+s],
          [px+s, py+s, pz+s], [px-s, py+s, pz+s],
        ];
        for (const c of corners) newPositions.push(c[0], c[1], c[2]);
        const faces = [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[2,6,7],[2,7,3],[0,3,7],[0,7,4],[1,5,6],[1,6,2]];
        for (const f of faces) newIndices.push(f[0]+offset, f[1]+offset, f[2]+offset);
        offset += 8;
      }
    }
  }
  return { positions: new Float32Array(newPositions), indices: new Uint32Array(newIndices) };
}

function subdivide(positions, indices, levels) {
  let pos = Array.from(positions);
  let idx = indices ? Array.from(indices) : null;
  for (let level = 0; level < levels; level++) {
    const midCache = new Map();
    const getMid = (a, b) => {
      const key = a < b ? a + "_" + b : b + "_" + a;
      if (midCache.has(key)) return midCache.get(key);
      const mx = (pos[a*3] + pos[b*3]) / 2;
      const my = (pos[a*3+1] + pos[b*3+1]) / 2;
      const mz = (pos[a*3+2] + pos[b*3+2]) / 2;
      const idx2 = pos.length / 3;
      pos.push(mx, my, mz);
      midCache.set(key, idx2);
      return idx2;
    };
    const newIdx = [];
    const count = idx ? idx.length : pos.length / 3;
    for (let i = 0; i < count; i += 3) {
      const a = idx ? idx[i] : i;
      const b = idx ? idx[i+1] : i+1;
      const c = idx ? idx[i+2] : i+2;
      const ab = getMid(a, b);
      const bc = getMid(b, c);
      const ca = getMid(c, a);
      newIdx.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    idx = newIdx;
  }
  return { positions: new Float32Array(pos), indices: idx ? new Uint32Array(idx) : null };
}

function laplacianSmooth(positions, indices, iterations, lambda) {
  let pos = new Float32Array(positions);
  const count = indices ? indices.length : positions.length / 3;
  for (let iter = 0; iter < iterations; iter++) {
    const newPos = new Float32Array(pos);
    const neighborSum = new Map();
    const addN = (a, b) => {
      if (!neighborSum.has(a)) neighborSum.set(a, { x: 0, y: 0, z: 0, n: 0 });
      const e = neighborSum.get(a);
      e.x += pos[b*3]; e.y += pos[b*3+1]; e.z += pos[b*3+2]; e.n++;
    };
    for (let i = 0; i < count; i += 3) {
      const a = indices ? indices[i] : i;
      const b = indices ? indices[i+1] : i+1;
      const c = indices ? indices[i+2] : i+2;
      addN(a, b); addN(a, c); addN(b, a); addN(b, c); addN(c, a); addN(c, b);
    }
    for (const [v, s] of neighborSum) {
      if (s.n === 0) continue;
      const ax = s.x / s.n, ay = s.y / s.n, az = s.z / s.n;
      newPos[v*3] = pos[v*3] + (ax - pos[v*3]) * lambda;
      newPos[v*3+1] = pos[v*3+1] + (ay - pos[v*3+1]) * lambda;
      newPos[v*3+2] = pos[v*3+2] + (az - pos[v*3+2]) * lambda;
    }
    pos = newPos;
  }
  return { positions: pos };
}

function mergeVertices(positions, indices, distance) {
  const pos = Array.from(positions);
  const merged = new Array(pos.length / 3);
  const distSq = distance * distance;
  let nextIdx = 0;
  const newPositions = [];
  for (let i = 0; i < pos.length / 3; i++) {
    let found = -1;
    for (let j = 0; j < nextIdx; j++) {
      const dx = pos[i*3] - newPositions[j*3];
      const dy = pos[i*3+1] - newPositions[j*3+1];
      const dz = pos[i*3+2] - newPositions[j*3+2];
      if (dx*dx + dy*dy + dz*dz < distSq) { found = j; break; }
    }
    if (found >= 0) merged[i] = found;
    else { merged[i] = nextIdx; newPositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]); nextIdx++; }
  }
  const newIndices = indices ? indices.map(i => merged[i]) : null;
  return { positions: new Float32Array(newPositions), indices: newIndices ? new Uint32Array(newIndices) : null };
}

function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  const count = indices ? indices.length : positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    const e1x = positions[b*3] - positions[a*3];
    const e1y = positions[b*3+1] - positions[a*3+1];
    const e1z = positions[b*3+2] - positions[a*3+2];
    const e2x = positions[c*3] - positions[a*3];
    const e2y = positions[c*3+1] - positions[a*3+1];
    const e2z = positions[c*3+2] - positions[a*3+2];
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    nx /= len; ny /= len; nz /= len;
    normals[a*3] += nx; normals[a*3+1] += ny; normals[a*3+2] += nz;
    normals[b*3] += nx; normals[b*3+1] += ny; normals[b*3+2] += nz;
    normals[c*3] += nx; normals[c*3+1] += ny; normals[c*3+2] += nz;
  }
  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i], ny = normals[i+1], nz = normals[i+2];
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    normals[i] = nx/len; normals[i+1] = ny/len; normals[i+2] = nz/len;
  }
  return normals;
}

function computeBoundingBox(positions) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i] < minX) minX = positions[i]; if (positions[i] > maxX) maxX = positions[i];
    if (positions[i+1] < minY) minY = positions[i+1]; if (positions[i+1] > maxY) maxY = positions[i+1];
    if (positions[i+2] < minZ) minZ = positions[i+2]; if (positions[i+2] > maxZ) maxZ = positions[i+2];
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], size: [maxX-minX, maxY-minY, maxZ-minZ] };
}

function computeSurfaceArea(positions, indices) {
  let area = 0;
  const count = indices ? indices.length : positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    const e1x = positions[b*3] - positions[a*3];
    const e1y = positions[b*3+1] - positions[a*3+1];
    const e1z = positions[b*3+2] - positions[a*3+2];
    const e2x = positions[c*3] - positions[a*3];
    const e2y = positions[c*3+1] - positions[a*3+1];
    const e2z = positions[c*3+2] - positions[a*3+2];
    const cx = e1y * e2z - e1z * e2y;
    const cy = e1z * e2x - e1x * e2z;
    const cz = e1x * e2y - e1y * e2x;
    area += Math.sqrt(cx*cx + cy*cy + cz*cz) * 0.5;
  }
  return area;
}

function computeVolume(positions, indices) {
  let volume = 0;
  const count = indices ? indices.length : positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    const ax = positions[a*3], ay = positions[a*3+1], az = positions[a*3+2];
    const bx = positions[b*3], by = positions[b*3+1], bz = positions[b*3+2];
    const cx = positions[c*3], cy = positions[c*3+1], cz = positions[c*3+2];
    volume += (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
  }
  return Math.abs(volume);
}

function decimate(positions, indices, ratio) {
  if (!indices) return { positions, indices: null };
  const targetTriCount = Math.floor((indices.length / 3) * ratio);
  if (targetTriCount >= indices.length / 3) return { positions, indices };
  const keepEvery = Math.max(1, Math.floor((indices.length / 3) / targetTriCount));
  const newIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    if ((i / 3) % keepEvery !== 0) newIndices.push(indices[i], indices[i+1], indices[i+2]);
  }
  return { positions, indices: new Uint32Array(newIndices) };
}

function flipNormals(indices) {
  const newIndices = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i += 3) {
    newIndices[i] = indices[i];
    newIndices[i+1] = indices[i+2];
    newIndices[i+2] = indices[i+1];
  }
  return newIndices;
}

function weldVertices(positions, indices, threshold) {
  const pos = Array.from(positions);
  const merged = new Array(pos.length / 3);
  const distSq = threshold * threshold;
  let nextIdx = 0;
  const newPositions = [];
  for (let i = 0; i < pos.length / 3; i++) {
    let found = -1;
    for (let j = 0; j < nextIdx; j++) {
      const dx = pos[i*3] - newPositions[j*3];
      const dy = pos[i*3+1] - newPositions[j*3+1];
      const dz = pos[i*3+2] - newPositions[j*3+2];
      if (dx*dx + dy*dy + dz*dz < distSq) { found = j; break; }
    }
    if (found >= 0) merged[i] = found;
    else { merged[i] = nextIdx; newPositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]); nextIdx++; }
  }
  const newIndices = indices ? indices.map(i => merged[i]) : null;
  return { positions: new Float32Array(newPositions), indices: newIndices ? new Uint32Array(newIndices) : null };
}

function calculateEdgeList(indices, positionCount) {
  const edges = [];
  const seen = new Set();
  const count = indices ? indices.length : positionCount;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    const addEdge = (x, y) => {
      const key = x < y ? x + "_" + y : y + "_" + x;
      if (!seen.has(key)) { seen.add(key); edges.push(x < y ? [x, y] : [y, x]); }
    };
    addEdge(a, b); addEdge(b, c); addEdge(c, a);
  }
  return edges;
}

function calculateFaceList(indices, positionCount) {
  const faces = [];
  const count = indices ? indices.length : positionCount;
  for (let i = 0; i < count; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i+1] : i+1;
    const c = indices ? indices[i+2] : i+2;
    faces.push([a, b, c]);
  }
  return faces;
}

function findBoundaryEdges(indices) {
  const edgeCount = new Map();
  const count = indices.length;
  for (let i = 0; i < count; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2];
    const addEdge = (x, y) => {
      const key = x < y ? x + "_" + y : y + "_" + x;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    };
    addEdge(a, b); addEdge(b, c); addEdge(c, a);
  }
  const boundary = [];
  for (const [key, cnt] of edgeCount) {
    if (cnt === 1) {
      const [a, b] = key.split("_").map(Number);
      boundary.push([a, b]);
    }
  }
  return boundary;
}

function checkManifold(indices) {
  const edgeCount = new Map();
  const count = indices.length;
  for (let i = 0; i < count; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2];
    const addEdge = (x, y) => {
      const key = x < y ? x + "_" + y : y + "_" + x;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    };
    addEdge(a, b); addEdge(b, c); addEdge(c, a);
  }
  let nonManifold = 0;
  for (const [key, cnt] of edgeCount) {
    if (cnt !== 2) nonManifold++;
  }
  return { isManifold: nonManifold === 0, nonManifoldEdges: nonManifold, totalEdges: edgeCount.size };
}
`;

export class WorkerPool {
  private workers: Worker[] = [];
  private blobUrl: string;
  private maxWorkers: number;
  private pending: Map<string, { resolve: (v: any) => void; reject: (e: any) => void }> = new Map();

  constructor(maxWorkers: number = Math.min(navigator.hardwareConcurrency || 4, 8)) {
    this.maxWorkers = maxWorkers;
    const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
    this.blobUrl = URL.createObjectURL(blob);
    for (let i = 0; i < maxWorkers; i++) {
      const worker = new Worker(this.blobUrl);
      worker.onmessage = (e: MessageEvent) => {
        const response = e.data;
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id);
          if (response.error) pending.reject(new Error(response.error));
          else pending.resolve(response.result);
        }
      };
      worker.onerror = (e) => { console.error("Worker error:", e); };
      this.workers.push(worker);
    }
  }

  execute(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.pending.set(id, { resolve, reject });
      const workerIdx = Math.floor(Math.random() * this.workers.length);
      this.workers[workerIdx].postMessage({ id, type, payload });
    });
  }

  voxelRemesh(positions: Float32Array, indices: Uint32Array | null, voxelSize: number): Promise<{ positions: Float32Array; indices: Uint32Array }> {
    return this.execute("voxel-remesh", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, voxelSize });
  }

  subdivide(positions: Float32Array, indices: Uint32Array | null, levels: number): Promise<{ positions: Float32Array; indices: Uint32Array | null }> {
    return this.execute("subdivide", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, levels });
  }

  laplacianSmooth(positions: Float32Array, indices: Uint32Array | null, iterations: number, lambda: number): Promise<{ positions: Float32Array }> {
    return this.execute("laplacian-smooth", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, iterations, lambda });
  }

  mergeVertices(positions: Float32Array, indices: Uint32Array | null, distance: number): Promise<{ positions: Float32Array; indices: Uint32Array | null }> {
    return this.execute("merge-vertices", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, distance });
  }

  computeNormals(positions: Float32Array, indices: Uint32Array | null): Promise<Float32Array> {
    return this.execute("compute-normals", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null });
  }

  computeBoundingBox(positions: Float32Array): Promise<{ min: number[]; max: number[]; size: number[] }> {
    return this.execute("compute-bounding-box", { positions: Array.from(positions) });
  }

  computeSurfaceArea(positions: Float32Array, indices: Uint32Array | null): Promise<number> {
    return this.execute("compute-surface-area", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null });
  }

  computeVolume(positions: Float32Array, indices: Uint32Array | null): Promise<number> {
    return this.execute("compute-volume", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null });
  }

  decimate(positions: Float32Array, indices: Uint32Array | null, ratio: number): Promise<{ positions: Float32Array; indices: Uint32Array | null }> {
    return this.execute("decimate", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, ratio });
  }

  flipNormals(indices: Uint32Array): Promise<Uint32Array> {
    return this.execute("flip-normals", { indices: Array.from(indices) });
  }

  weldVertices(positions: Float32Array, indices: Uint32Array | null, threshold: number): Promise<{ positions: Float32Array; indices: Uint32Array | null }> {
    return this.execute("weld-vertices", { positions: Array.from(positions), indices: indices ? Array.from(indices) : null, threshold });
  }

  calculateEdgeList(indices: Uint32Array | null, positionCount: number): Promise<number[][]> {
    return this.execute("calculate-edge-list", { indices: indices ? Array.from(indices) : null, positionCount });
  }

  calculateFaceList(indices: Uint32Array | null, positionCount: number): Promise<number[][]> {
    return this.execute("calculate-face-list", { indices: indices ? Array.from(indices) : null, positionCount });
  }

  findBoundaryEdges(indices: Uint32Array): Promise<number[][]> {
    return this.execute("find-boundary-edges", { indices: Array.from(indices) });
  }

  checkManifold(indices: Uint32Array): Promise<{ isManifold: boolean; nonManifoldEdges: number; totalEdges: number }> {
    return this.execute("check-manifold", { indices: Array.from(indices) });
  }

  dispose(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    URL.revokeObjectURL(this.blobUrl);
    this.pending.clear();
  }
}

let workerPool: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
  if (!workerPool) workerPool = new WorkerPool();
  return workerPool;
}

export function disposeWorkerPool(): void {
  if (workerPool) { workerPool.dispose(); workerPool = null; }
}
