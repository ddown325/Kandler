// Kandler LOD System — level of detail management for performance.
import * as THREE from "three";

export interface LODLevel {
  level: number;
  geometry: THREE.BufferGeometry;
  distance: number;
  screenRatio: number;
}

export class LODManager {
  levels: Map<string, LODLevel[]> = new Map();
  camera: THREE.Camera;
  screenPixelRatio: number = 1;
  enabled: boolean = true;
  distanceThresholds: number[] = [10, 30, 60, 120];
  screenRatioThresholds: number[] = [0.5, 0.2, 0.1, 0.05];

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  addLODLevel(objectId: string, level: number, geometry: THREE.BufferGeometry, distance: number, screenRatio: number = 0.1): void {
    if (!this.levels.has(objectId)) this.levels.set(objectId, []);
    const levels = this.levels.get(objectId)!;
    const lodLevel: LODLevel = { level, geometry, distance, screenRatio };
    levels.push(lodLevel);
    levels.sort((a, b) => a.distance - b.distance);
  }

  removeLODLevel(objectId: string, level: number): void {
    const levels = this.levels.get(objectId);
    if (levels) {
      this.levels.set(objectId, levels.filter(l => l.level !== level));
    }
  }

  getLODForDistance(objectId: string, distance: number): THREE.BufferGeometry | null {
    if (!this.enabled) return null;
    const levels = this.levels.get(objectId);
    if (!levels || levels.length === 0) return null;
    for (const level of levels) {
      if (distance < level.distance) return level.geometry;
    }
    return levels[levels.length - 1].geometry;
  }

  getLODForScreenRatio(objectId: string, screenSize: number): THREE.BufferGeometry | null {
    if (!this.enabled) return null;
    const levels = this.levels.get(objectId);
    if (!levels || levels.length === 0) return null;
    for (const level of levels) {
      if (screenSize > level.screenRatio) return level.geometry;
    }
    return levels[levels.length - 1].geometry;
  }

  computeScreenSize(object: THREE.Object3D, screenWidth: number, screenHeight: number): number {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return 0;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const distance = this.camera.position.distanceTo(center);
    if (distance < 0.001) return 1;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (this.camera as THREE.PerspectiveCamera).fov ?? 50;
    const screen_height_at_dist = 2 * distance * Math.tan((fov * Math.PI / 180) / 2);
    return maxDim / screen_height_at_dist;
  }

  selectLOD(object: THREE.Object3D, objectId: string, screenWidth: number, screenHeight: number): THREE.BufferGeometry | null {
    const distance = this.camera.position.distanceTo(object.position);
    const screenSize = this.computeScreenSize(object, screenWidth, screenHeight);
    const distLOD = this.getLODForDistance(objectId, distance);
    const screenLOD = this.getLODForScreenRatio(objectId, screenSize);
    if (distLOD && screenLOD) {
      const distLevels = this.levels.get(objectId)!;
      const distIdx = distLevels.findIndex(l => l.geometry === distLOD);
      const screenIdx = distLevels.findIndex(l => l.geometry === screenLOD);
      return distLevels[Math.max(distIdx, screenIdx)].geometry;
    }
    return distLOD ?? screenLOD;
  }

  generateLODLevels(geometry: THREE.BufferGeometry, levels: number = 4): THREE.BufferGeometry[] {
    const result: THREE.BufferGeometry[] = [geometry];
    let current = geometry;
    for (let i = 1; i < levels; i++) {
      const decimated = this.decimateGeometry(current, 1 / (i + 1));
      result.push(decimated);
      current = decimated;
    }
    return result;
  }

  decimateGeometry(geo: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry {
    if (!geo.index) return geo.clone();
    const indices = geo.index.array as Uint32Array;
    const targetTriCount = Math.floor((indices.length / 3) * ratio);
    if (targetTriCount >= indices.length / 3) return geo.clone();
    const keepEvery = Math.max(1, Math.floor((indices.length / 3) / targetTriCount));
    const newIndices: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      if ((i / 3) % keepEvery !== 0) {
        newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
      }
    }
    const result = geo.clone();
    result.setIndex(newIndices);
    result.computeVertexNormals();
    return result;
  }

  simplifyGeometry(geo: THREE.BufferGeometry, targetTriangles: number): THREE.BufferGeometry {
    if (!geo.index) return geo.clone();
    const currentTriangles = geo.index.count / 3;
    if (currentTriangles <= targetTriangles) return geo.clone();
    const ratio = targetTriangles / currentTriangles;
    return this.decimateGeometry(geo, ratio);
  }

  mergeVertices(geo: THREE.BufferGeometry, threshold: number = 0.0001): THREE.BufferGeometry {
    const pos = geo.attributes.position;
    const positions = pos.array as Float32Array;
    const indices = geo.index ? Array.from(geo.index.array as Uint32Array) : null;
    const merged = new Map<number, number>();
    const newPositions: number[] = [];
    let nextIdx = 0;
    const thresholdSq = threshold * threshold;
    for (let i = 0; i < pos.count; i++) {
      let found = -1;
      for (let j = 0; j < nextIdx; j++) {
        const dx = positions[i * 3] - newPositions[j * 3];
        const dy = positions[i * 3 + 1] - newPositions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - newPositions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < thresholdSq) { found = j; break; }
      }
      if (found >= 0) merged.set(i, found);
      else { merged.set(i, nextIdx); newPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]); nextIdx++; }
    }
    const newIndices = indices ? indices.map(i => merged.get(i) ?? i) : null;
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
    if (newIndices) result.setIndex(newIndices);
    result.computeVertexNormals();
    return result;
  }

  getLODInfo(objectId: string): { level: number; distance: number; screenRatio: number; triangles: number }[] {
    const levels = this.levels.get(objectId);
    if (!levels) return [];
    return levels.map(l => ({
      level: l.level,
      distance: l.distance,
      screenRatio: l.screenRatio,
      triangles: l.geometry.index ? l.geometry.index.count / 3 : l.geometry.attributes.position.count / 3,
    }));
  }

  clearLODLevels(objectId: string): void {
    this.levels.delete(objectId);
  }

  clearAll(): void {
    this.levels.clear();
  }

  update(deltaTime: number): void {
    void deltaTime;
  }
}

// Frustum culling manager
export class FrustumCuller {
  frustum: THREE.Frustum = new THREE.Frustum();
  enabled: boolean = true;
  culledCount: number = 0;
  totalCount: number = 0;

  updateFrustum(camera: THREE.Camera): void {
    this.frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
  }

  isVisible(object: THREE.Object3D): boolean {
    if (!this.enabled) return true;
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return false;
    return this.frustum.intersectsBox(box);
  }

  cullObjects(objects: THREE.Object3D[]): THREE.Object3D[] {
    if (!this.enabled) return objects;
    this.totalCount = objects.length;
    this.culledCount = 0;
    const visible: THREE.Object3D[] = [];
    for (const obj of objects) {
      if (this.isVisible(obj)) {
        visible.push(obj);
      } else {
        this.culledCount++;
      }
    }
    return visible;
  }

  getStats(): { total: number; culled: number; visible: number } {
    return {
      total: this.totalCount,
      culled: this.culledCount,
      visible: this.totalCount - this.culledCount,
    };
  }
}

// Instanced rendering manager
export class InstanceManager {
  instances: Map<string, THREE.InstancedMesh> = new Map();
  maxInstances: number = 1000;

  createInstancedMesh(id: string, geometry: THREE.BufferGeometry, material: THREE.Material, count: number): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.min(count, this.maxInstances));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.instances.set(id, mesh);
    return mesh;
  }

  setInstanceMatrix(id: string, index: number, matrix: THREE.Matrix4): void {
    const mesh = this.instances.get(id);
    if (mesh && index < mesh.count) {
      mesh.setMatrixAt(index, matrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  setInstanceColor(id: string, index: number, color: THREE.Color): void {
    const mesh = this.instances.get(id);
    if (mesh && index < mesh.count) {
      mesh.setColorAt(index, color);
      mesh.instanceColor.needsUpdate = true;
    }
  }

  removeInstanceMesh(id: string): void {
    const mesh = this.instances.get(id);
    if (mesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.instances.delete(id);
    }
  }

  getInstancedMesh(id: string): THREE.InstancedMesh | undefined {
    return this.instances.get(id);
  }

  clear(): void {
    this.instances.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.instances.clear();
  }
}

// Occlusion culling (basic - uses bounding boxes)
export class OcclusionCuller {
  enabled: boolean = true;
  occluders: THREE.Box3[] = [];
  occludees: Map<string, THREE.Box3> = new Map();

  addOccluder(box: THREE.Box3): void {
    this.occluders.push(box);
  }

  addOccludee(id: string, box: THREE.Box3): void {
    this.occludees.set(id, box);
  }

  removeOccluder(box: THREE.Box3): void {
    this.occluders = this.occluders.filter(b => b !== box);
  }

  removeOccludee(id: string): void {
    this.occludees.delete(id);
  }

  isOccluded(id: string, camera: THREE.Camera): boolean {
    if (!this.enabled) return false;
    const box = this.occludees.get(id);
    if (!box) return false;
    const center = box.getCenter(new THREE.Vector3());
    const cameraPos = camera.position;
    const dir = center.clone().sub(cameraPos).normalize();
    const dist = cameraPos.distanceTo(center);
    for (const occluder of this.occluders) {
      if (occluder.containsPoint(center)) return true;
      const occluderCenter = occluder.getCenter(new THREE.Vector3());
      const occluderDist = cameraPos.distanceTo(occluderCenter);
      if (occluderDist < dist) {
        const occluderSize = occluder.getSize(new THREE.Vector3());
        const maxDim = Math.max(occluderSize.x, occluderSize.y, occluderSize.z);
        const angleToOccluder = Math.atan2(maxDim / 2, occluderDist);
        const angleToOccludee = Math.atan2(0.1, dist);
        const dirToOccluder = occluderCenter.clone().sub(cameraPos).normalize();
        const angleBetween = Math.acos(Math.max(-1, Math.min(1, dir.dot(dirToOccluder))));
        if (angleBetween < angleToOccluder + angleToOccludee) return true;
      }
    }
    return false;
  }

  clear(): void {
    this.occluders = [];
    this.occludees.clear();
  }
}

// Performance monitor
export class PerformanceMonitor {
  fps: number = 0;
  frameTime: number = 0;
  drawCalls: number = 0;
  triangles: number = 0;
  points: number = 0;
  lines: number = 0;
  geometries: number = 0;
  textures: number = 0;
  programs: number = 0;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private history: number[] = [];
  maxHistory: number = 120;

  update(renderer?: THREE.WebGLRenderer): void {
    const now = performance.now();
    this.frameTime = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;
    this.fps = 1000 / this.frameTime;
    this.history.push(this.fps);
    if (this.history.length > this.maxHistory) this.history.shift();
    if (renderer) {
      const info = renderer.info;
      this.drawCalls = info.render.calls;
      this.triangles = info.render.triangles;
      this.points = info.render.points;
      this.lines = info.render.lines;
      this.geometries = info.memory.geometries;
      this.textures = info.memory.textures;
      this.programs = info.programs?.length ?? 0;
    }
  }

  getAverageFPS(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((a, b) => a + b, 0) / this.history.length;
  }

  getMinFPS(): number {
    return this.history.length > 0 ? Math.min(...this.history) : 0;
  }

  getMaxFPS(): number {
    return this.history.length > 0 ? Math.max(...this.history) : 0;
  }

  getStats(): { fps: number; avgFPS: number; minFPS: number; maxFPS: number; frameTime: number; drawCalls: number; triangles: number; geometries: number; textures: number } {
    return {
      fps: this.fps,
      avgFPS: this.getAverageFPS(),
      minFPS: this.getMinFPS(),
      maxFPS: this.getMaxFPS(),
      frameTime: this.frameTime,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      geometries: this.geometries,
      textures: this.textures,
    };
  }

  reset(): void {
    this.history = [];
    this.frameCount = 0;
  }
}
