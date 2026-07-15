// Kandler Curves & Collections — bezier, NURBS, text, collections, grease pencil.
import * as THREE from "three";

// ====== BEZIER CURVE ======
export interface BezierPoint {
  position: THREE.Vector3;
  handleIn: THREE.Vector3;
  handleOut: THREE.Vector3;
}

export class BezierCurve {
  points: BezierPoint[] = [];
  closed: boolean = false;

  addPoint(pos: THREE.Vector3, handleIn?: THREE.Vector3, handleOut?: THREE.Vector3): void {
    this.points.push({
      position: pos.clone(),
      handleIn: handleIn ?? new THREE.Vector3(-0.5, 0, 0),
      handleOut: handleOut ?? new THREE.Vector3(0.5, 0, 0),
    });
  }

  evaluate(t: number): THREE.Vector3 {
    if (this.points.length < 2) return new THREE.Vector3();
    const segments = this.closed ? this.points.length : this.points.length - 1;
    const segT = t * segments;
    const seg = Math.min(Math.floor(segT), segments - 1);
    const localT = segT - seg;
    const p0 = this.points[seg];
    const p1 = this.points[(seg + 1) % this.points.length];
    return cubicBezier3(
      p0.position,
      p0.position.clone().add(p0.handleOut),
      p1.position.clone().add(p1.handleIn),
      p1.position,
      localT,
    );
  }

  toPoints(segments: number = 32): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) pts.push(this.evaluate(i / segments));
    return pts;
  }

  toGeometry(segments: number = 32, tubeRadius: number = 0.05, radialSegments: number = 8): THREE.BufferGeometry {
    const pts = this.toPoints(segments);
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, segments, tubeRadius, radialSegments, this.closed);
  }

  toLineGeometry(segments: number = 64): THREE.BufferGeometry {
    const pts = this.toPoints(segments);
    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }

  length(segments: number = 64): number {
    const pts = this.toPoints(segments);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    return len;
  }

  getTangent(t: number): THREE.Vector3 {
    const eps = 0.001;
    const p1 = this.evaluate(Math.max(0, t - eps));
    const p2 = this.evaluate(Math.min(1, t + eps));
    return p2.clone().sub(p1).normalize();
  }

  getNormal(t: number): THREE.Vector3 {
    const tangent = this.getTangent(t);
    const up = Math.abs(tangent.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3().crossVectors(tangent, up).normalize();
  }

  getBinormal(t: number): THREE.Vector3 {
    return new THREE.Vector3().crossVectors(this.getTangent(t), this.getNormal(t)).normalize();
  }

  getFrenetFrame(t: number): { tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 } {
    return { tangent: this.getTangent(t), normal: this.getNormal(t), binormal: this.getBinormal(t) };
  }
}

function cubicBezier3(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number): THREE.Vector3 {
  const u = 1 - t;
  return p0.clone().multiplyScalar(u * u * u)
    .add(p1.clone().multiplyScalar(3 * u * u * t))
    .add(p2.clone().multiplyScalar(3 * u * t * t))
    .add(p3.clone().multiplyScalar(t * t * t));
}

// ====== NURBS CURVE ======
export class NURBSCurve {
  controlPoints: THREE.Vector3[] = [];
  knots: number[] = [];
  degree: number = 3;
  weights: number[] = [];

  constructor(controlPoints: THREE.Vector3[], degree: number = 3) {
    this.controlPoints = controlPoints.map(p => p.clone());
    this.degree = degree;
    this.weights = controlPoints.map(() => 1);
    this.generateKnots();
  }

  private generateKnots(): void {
    const n = this.controlPoints.length;
    const p = this.degree;
    const m = n + p + 1;
    this.knots = [];
    for (let i = 0; i <= p; i++) this.knots.push(0);
    for (let i = 1; i <= n - p - 1; i++) this.knots.push(i / (n - p));
    for (let i = 0; i <= p; i++) this.knots.push(n - p);
    void m;
  }

  basis(i: number, p: number, t: number): number {
    if (p === 0) return (this.knots[i] <= t && t < this.knots[i + 1]) ? 1 : 0;
    let c1 = 0, c2 = 0;
    const d1 = this.knots[i + p] - this.knots[i];
    const d2 = this.knots[i + p + 1] - this.knots[i + 1];
    if (d1 > 0) c1 = (t - this.knots[i]) / d1 * this.basis(i, p - 1, t);
    if (d2 > 0) c2 = (this.knots[i + p + 1] - t) / d2 * this.basis(i + 1, p - 1, t);
    return c1 + c2;
  }

  evaluate(t: number): THREE.Vector3 {
    const result = new THREE.Vector3();
    let totalW = 0;
    for (let i = 0; i < this.controlPoints.length; i++) {
      const b = this.basis(i, this.degree, t);
      const w = this.weights[i] * b;
      result.add(this.controlPoints[i].clone().multiplyScalar(w));
      totalW += w;
    }
    if (totalW > 0) result.divideScalar(totalW);
    return result;
  }

  toPoints(segments: number = 32): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) pts.push(this.evaluate(i / segments));
    return pts;
  }

  toGeometry(segments: number = 32, tubeRadius: number = 0.05): THREE.BufferGeometry {
    const pts = this.toPoints(segments);
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, segments, tubeRadius, 8, false);
  }
}

// ====== TEXT OBJECT ======
export function createTextGeometry(text: string, options: { size?: number; height?: number; bevelEnabled?: boolean; bevelSize?: number; bevelThickness?: number; curveSegments?: number } = {}): THREE.BufferGeometry {
  const size = options.size ?? 1;
  const height = options.height ?? 0.2;
  const geo = new THREE.BoxGeometry(text.length * size * 0.6, size, height);
  geo.computeVertexNormals();
  return geo;
}

export function createTextMesh(text: string, color: number = 0xffffff): THREE.Mesh {
  const geo = createTextGeometry(text);
  const mat = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

// ====== COLLECTIONS ======
export interface Collection {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  selectable: boolean;
  objectIds: string[];
  children: string[];
  parentId: string | null;
}

export class CollectionManager {
  collections: Map<string, Collection> = new Map();
  rootOrder: string[] = [];

  create(name: string, parentId: string | null = null): string {
    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const col: Collection = {
      id, name, color: "#a855f7", visible: true, selectable: true,
      objectIds: [], children: [], parentId,
    };
    this.collections.set(id, col);
    if (parentId && this.collections.has(parentId)) {
      this.collections.get(parentId)!.children.push(id);
    } else {
      this.rootOrder.push(id);
    }
    return id;
  }

  delete(id: string): void {
    const col = this.collections.get(id);
    if (!col) return;
    if (col.parentId && this.collections.has(col.parentId)) {
      this.collections.get(col.parentId)!.children = this.collections.get(col.parentId)!.children.filter(c => c !== id);
    } else {
      this.rootOrder = this.rootOrder.filter(c => c !== id);
    }
    for (const childId of [...col.children]) this.delete(childId);
    this.collections.delete(id);
  }

  addObject(collectionId: string, objectId: string): void {
    const col = this.collections.get(collectionId);
    if (col && !col.objectIds.includes(objectId)) col.objectIds.push(objectId);
  }

  removeObject(collectionId: string, objectId: string): void {
    const col = this.collections.get(collectionId);
    if (col) col.objectIds = col.objectIds.filter(o => o !== objectId);
  }

  moveObject(objectId: string, fromCol: string | null, toCol: string): void {
    if (fromCol) this.removeObject(fromCol, objectId);
    this.addObject(toCol, objectId);
  }

  setVisibility(id: string, visible: boolean): void {
    const col = this.collections.get(id);
    if (col) {
      col.visible = visible;
      for (const childId of col.children) this.setVisibility(childId, visible);
    }
  }

  setSelectable(id: string, selectable: boolean): void {
    const col = this.collections.get(id);
    if (col) col.selectable = selectable;
  }

  rename(id: string, name: string): void {
    const col = this.collections.get(id);
    if (col) col.name = name;
  }

  setColor(id: string, color: string): void {
    const col = this.collections.get(id);
    if (col) col.color = color;
  }

  getObjectsInCollection(id: string): string[] {
    return this.collections.get(id)?.objectIds ?? [];
  }

  getAllObjects(): string[] {
    const all: string[] = [];
    this.collections.forEach(col => all.push(...col.objectIds));
    return all;
  }

  getCollectionForObject(objectId: string): string | null {
    for (const [id, col] of this.collections) {
      if (col.objectIds.includes(objectId)) return id;
    }
    return null;
  }

  list(): Collection[] {
    return Array.from(this.collections.values());
  }

  listRoot(): Collection[] {
    return this.rootOrder.map(id => this.collections.get(id)!).filter(Boolean);
  }

  toJSON(): { collections: Collection[]; rootOrder: string[] } {
    return { collections: Array.from(this.collections.values()), rootOrder: this.rootOrder };
  }

  fromJSON(data: { collections: Collection[]; rootOrder: string[] }): void {
    this.collections.clear();
    this.rootOrder = data.rootOrder;
    for (const col of data.collections) this.collections.set(col.id, col);
  }
}

// ====== GREASE PENCIL / ANNOTATION ======
export interface GreasePencilStroke {
  id: string;
  points: THREE.Vector3[];
  color: string;
  width: number;
  layer: string;
}

export class GreasePencil {
  strokes: GreasePencilStroke[] = [];
  currentStroke: GreasePencilStroke | null = null;
  color: string = "#ff3355";
  width: number = 2;
  layer: string = "default";
  layers: string[] = ["default"];
  activeLayer: string = "default";

  beginStroke(point: THREE.Vector3): void {
    this.currentStroke = {
      id: `stroke_${Date.now()}`,
      points: [point.clone()],
      color: this.color,
      width: this.width,
      layer: this.activeLayer,
    };
  }

  addPoint(point: THREE.Vector3): void {
    if (this.currentStroke) this.currentStroke.points.push(point.clone());
  }

  endStroke(): void {
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = null;
  }

  clearLayer(layer: string): void {
    this.strokes = this.strokes.filter(s => s.layer !== layer);
  }

  addLayer(name: string): void {
    if (!this.layers.includes(name)) {
      this.layers.push(name);
      this.activeLayer = name;
    }
  }

  removeLayer(name: string): void {
    if (name === "default") return;
    this.layers = this.layers.filter(l => l !== name);
    this.strokes = this.strokes.filter(s => s.layer !== name);
    if (this.activeLayer === name) this.activeLayer = "default";
  }

  setActiveLayer(name: string): void {
    if (this.layers.includes(name)) this.activeLayer = name;
  }

  setColor(color: string): void {
    this.color = color;
  }

  setWidth(width: number): void {
    this.width = width;
  }

  toLineObjects(): THREE.Line[] {
    const lines: THREE.Line[] = [];
    for (const stroke of this.strokes) {
      if (stroke.points.length < 2) continue;
      const positions = new Float32Array(stroke.points.length * 3);
      stroke.points.forEach((p, i) => {
        positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(stroke.color),
        linewidth: stroke.width,
        depthTest: false,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 998;
      lines.push(line);
    }
    return lines;
  }

  getStrokeCount(): number {
    return this.strokes.length;
  }

  getPointCount(): number {
    return this.strokes.reduce((sum, s) => sum + s.points.length, 0);
  }

  toJSON(): { strokes: GreasePencilStroke[]; layers: string[]; activeLayer: string } {
    return {
      strokes: this.strokes.map(s => ({
        ...s,
        points: s.points.map(p => [p.x, p.y, p.z] as any),
      })),
      layers: this.layers,
      activeLayer: this.activeLayer,
    };
  }

  fromJSON(data: { strokes: GreasePencilStroke[]; layers: string[]; activeLayer: string }): void {
    this.strokes = data.strokes.map(s => ({
      ...s,
      points: (s.points as any).map((p: number[]) => new THREE.Vector3(p[0], p[1], p[2])),
    }));
    this.layers = data.layers;
    this.activeLayer = data.activeLayer;
  }
}

// ====== METABALLS ======
export interface Metaball {
  position: THREE.Vector3;
  radius: number;
  strength: number;
  negative: boolean;
}

export class MetaballSystem {
  metaballs: Metaball[] = [];
  resolution: number = 32;
  threshold: number = 1.0;

  addMetaball(position: THREE.Vector3, radius: number = 1, strength: number = 1, negative: boolean = false): void {
    this.metaballs.push({ position: position.clone(), radius, strength, negative });
  }

  removeMetaball(index: number): void {
    this.metaballs.splice(index, 1);
  }

  clear(): void {
    this.metaballs = [];
  }

  evaluate(point: THREE.Vector3): number {
    let sum = 0;
    for (const mb of this.metaballs) {
      const dist = point.distanceTo(mb.position);
      const r = mb.radius;
      if (dist < r) {
        const value = mb.strength * (1 - dist / r) * (1 - dist / r);
        sum += mb.negative ? -value : value;
      }
    }
    return sum;
  }

  toGeometry(): THREE.BufferGeometry {
    if (this.metaballs.length === 0) return new THREE.BufferGeometry();
    const box = new THREE.Box3();
    for (const mb of this.metaballs) {
      box.expandByPoint(mb.position.clone().subScalar(mb.radius));
      box.expandByPoint(mb.position.clone().addScalar(mb.radius));
    }
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 2);
    const N = this.resolution;
    const step = maxDim / N;
    const origin = box.min;
    const grid: number[][][][] = [];
    for (let i = 0; i <= N; i++) {
      grid[i] = [];
      for (let j = 0; j <= N; j++) {
        grid[i][j] = [];
        for (let k = 0; k <= N; k++) {
          const p = new THREE.Vector3(
            origin.x + i * step,
            origin.y + j * step,
            origin.z + k * step,
          );
          grid[i][j][k] = this.evaluate(p);
        }
      }
    }
    const positions: number[] = [];
    const indices: number[] = [];
    let vertOffset = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        for (let k = 0; k < N; k++) {
          const v000 = grid[i][j][k];
          const v100 = grid[i + 1][j][k];
          const v010 = grid[i][j + 1][k];
          const v110 = grid[i + 1][j + 1][k];
          const v001 = grid[i][j][k + 1];
          const v101 = grid[i + 1][j][k + 1];
          const v011 = grid[i][j + 1][k + 1];
          const v111 = grid[i + 1][j + 1][k + 1];
          const isInside = v000 > this.threshold || v100 > this.threshold || v010 > this.threshold ||
            v110 > this.threshold || v001 > this.threshold || v101 > this.threshold ||
            v011 > this.threshold || v111 > this.threshold;
          if (!isInside) continue;
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
          for (const p of corners) positions.push(p[0], p[1], p[2]);
          const faces = [
            [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
            [0, 4, 5], [0, 5, 1], [2, 6, 7], [2, 7, 3],
            [0, 3, 7], [0, 7, 4], [1, 5, 6], [1, 6, 2],
          ];
          for (const f of faces) indices.push(f[0] + vertOffset, f[1] + vertOffset, f[2] + vertOffset);
          vertOffset += 8;
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
}

// ====== LATTICE DEFORM ======
export interface LatticePoint {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
}

export class LatticeDeform {
  points: LatticePoint[][][] = [];
  width: number = 2;
  height: number = 2;
  depth: number = 2;
  size: THREE.Vector3;
  origin: THREE.Vector3;

  constructor(width: number = 2, height: number = 2, depth: number = 2, size: THREE.Vector3 = new THREE.Vector3(2, 2, 2), origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.size = size;
    this.origin = origin;
    this.generatePoints();
  }

  private generatePoints(): void {
    this.points = [];
    for (let i = 0; i <= this.width; i++) {
      this.points[i] = [];
      for (let j = 0; j <= this.height; j++) {
        this.points[i][j] = [];
        for (let k = 0; k <= this.depth; k++) {
          const pos = new THREE.Vector3(
            this.origin.x + (i / this.width - 0.5) * this.size.x,
            this.origin.y + (j / this.height - 0.5) * this.size.y,
            this.origin.z + (k / this.depth - 0.5) * this.size.z,
          );
          this.points[i][j][k] = { position: pos.clone(), originalPosition: pos.clone() };
        }
      }
    }
  }

  movePoint(i: number, j: number, k: number, delta: THREE.Vector3): void {
    if (this.points[i] && this.points[i][j] && this.points[i][j][k]) {
      this.points[i][j][k].position.add(delta);
    }
  }

  resetPoint(i: number, j: number, k: number): void {
    if (this.points[i] && this.points[i][j] && this.points[i][j][k]) {
      this.points[i][j][k].position.copy(this.points[i][j][k].originalPosition);
    }
  }

  resetAll(): void {
    for (let i = 0; i <= this.width; i++)
      for (let j = 0; j <= this.height; j++)
        for (let k = 0; k <= this.depth; k++)
          this.points[i][j][k].position.copy(this.points[i][j][k].originalPosition);
  }

  evaluate(point: THREE.Vector3): THREE.Vector3 {
    const localX = (point.x - this.origin.x) / this.size.x + 0.5;
    const localY = (point.y - this.origin.y) / this.size.y + 0.5;
    const localZ = (point.z - this.origin.z) / this.size.z + 0.5;
    if (localX < 0 || localX > 1 || localY < 0 || localY > 1 || localZ < 0 || localZ > 1) return point;
    const fi = localX * this.width;
    const fj = localY * this.height;
    const fk = localZ * this.depth;
    const i0 = Math.floor(fi), i1 = Math.min(i0 + 1, this.width);
    const j0 = Math.floor(fj), j1 = Math.min(j0 + 1, this.height);
    const k0 = Math.floor(fk), k1 = Math.min(k0 + 1, this.depth);
    const ti = fi - i0, tj = fj - j0, tk = fk - k0;
    const lerp = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
    const c000 = this.points[i0][j0][k0].position;
    const c100 = this.points[i1][j0][k0].position;
    const c010 = this.points[i0][j1][k0].position;
    const c110 = this.points[i1][j1][k0].position;
    const c001 = this.points[i0][j0][k1].position;
    const c101 = this.points[i1][j0][k1].position;
    const c011 = this.points[i0][j1][k1].position;
    const c111 = this.points[i1][j1][k1].position;
    const c00 = lerp(c000, c100, ti);
    const c10 = lerp(c010, c110, ti);
    const c01 = lerp(c001, c101, ti);
    const c11 = lerp(c011, c111, ti);
    const c0 = lerp(c00, c10, tj);
    const c1 = lerp(c01, c11, tj);
    return lerp(c0, c1, tk);
  }

  applyToGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
    const pos = geo.attributes.position;
    const positions = pos.array as Float32Array;
    const newPositions = new Float32Array(positions);
    for (let i = 0; i < pos.count; i++) {
      const p = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const newP = this.evaluate(p);
      newPositions[i * 3] = newP.x;
      newPositions[i * 3 + 1] = newP.y;
      newPositions[i * 3 + 2] = newP.z;
    }
    const result = geo.clone();
    result.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
    result.computeVertexNormals();
    return result;
  }

  toGeometry(): THREE.BufferGeometry {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= this.width; i++)
      for (let j = 0; j <= this.height; j++)
        for (let k = 0; k <= this.depth; k++) {
          const p = this.points[i][j][k].position;
          positions.push(p.x, p.y, p.z);
        }
    for (let i = 0; i < this.width; i++)
      for (let j = 0; j < this.height; j++)
        for (let k = 0; k < this.depth; k++) {
          const idx = (i * (this.height + 1) + j) * (this.depth + 1) + k;
          const idx2 = ((i + 1) * (this.height + 1) + j) * (this.depth + 1) + k;
          const idx3 = (i * (this.height + 1) + (j + 1)) * (this.depth + 1) + k;
          const idx4 = ((i + 1) * (this.height + 1) + (j + 1)) * (this.depth + 1) + k;
          indices.push(idx, idx2, idx3, idx2, idx4, idx3);
        }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }
}
