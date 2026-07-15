// Kandler Geometry Library — comprehensive primitive and shape generation.
// Every function returns a THREE.BufferGeometry with computed normals.
import * as THREE from "three";

// ====== BASIC PRIMITIVES ======
export function createBox(
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  widthSegments: number = 1,
  heightSegments: number = 1,
  depthSegments: number = 1,
): THREE.BufferGeometry {
  const w = Math.max(0.001, width);
  const h = Math.max(0.001, height);
  const d = Math.max(0.001, depth);
  const ws = Math.max(1, Math.floor(widthSegments));
  const hs = Math.max(1, Math.floor(heightSegments));
  const ds = Math.max(1, Math.floor(depthSegments));
  const geo = new THREE.BoxGeometry(w, h, d, ws, hs, ds);
  geo.computeVertexNormals();
  return geo;
}

export function createSphere(
  radius: number = 0.5,
  widthSegments: number = 32,
  heightSegments: number = 16,
  phiStart: number = 0,
  phiLength: number = Math.PI * 2,
  thetaStart: number = 0,
  thetaLength: number = Math.PI,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const ws = Math.max(3, Math.floor(widthSegments));
  const hs = Math.max(2, Math.floor(heightSegments));
  const geo = new THREE.SphereGeometry(r, ws, hs, phiStart, phiLength, thetaStart, thetaLength);
  geo.computeVertexNormals();
  return geo;
}

export function createCylinder(
  radiusTop: number = 0.5,
  radiusBottom: number = 0.5,
  height: number = 1,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2,
): THREE.BufferGeometry {
  const rt = Math.max(0, radiusTop);
  const rb = Math.max(0, radiusBottom);
  const h = Math.max(0.001, height);
  const rs = Math.max(3, Math.floor(radialSegments));
  const hs = Math.max(1, Math.floor(heightSegments));
  const geo = new THREE.CylinderGeometry(rt, rb, h, rs, hs, openEnded, thetaStart, thetaLength);
  geo.computeVertexNormals();
  return geo;
}

export function createCone(
  radius: number = 0.5,
  height: number = 1,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const h = Math.max(0.001, height);
  const rs = Math.max(3, Math.floor(radialSegments));
  const hs = Math.max(1, Math.floor(heightSegments));
  const geo = new THREE.ConeGeometry(r, h, rs, hs, openEnded, thetaStart, thetaLength);
  geo.computeVertexNormals();
  return geo;
}

export function createTorus(
  radius: number = 1,
  tube: number = 0.4,
  radialSegments: number = 12,
  tubularSegments: number = 48,
  arc: number = Math.PI * 2,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const t = Math.max(0.001, tube);
  const rs = Math.max(3, Math.floor(radialSegments));
  const ts = Math.max(3, Math.floor(tubularSegments));
  const geo = new THREE.TorusGeometry(r, t, rs, ts, arc);
  geo.computeVertexNormals();
  return geo;
}

export function createTorusKnot(
  radius: number = 1,
  tube: number = 0.4,
  tubularSegments: number = 64,
  radialSegments: number = 8,
  p: number = 2,
  q: number = 3,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const t = Math.max(0.001, tube);
  const ts = Math.max(3, Math.floor(tubularSegments));
  const rs = Math.max(3, Math.floor(radialSegments));
  const geo = new THREE.TorusKnotGeometry(r, t, ts, rs, Math.max(1, p), Math.max(1, q));
  geo.computeVertexNormals();
  return geo;
}

export function createPlane(
  width: number = 1,
  height: number = 1,
  widthSegments: number = 1,
  heightSegments: number = 1,
): THREE.BufferGeometry {
  const w = Math.max(0.001, width);
  const h = Math.max(0.001, height);
  const ws = Math.max(1, Math.floor(widthSegments));
  const hs = Math.max(1, Math.floor(heightSegments));
  const geo = new THREE.PlaneGeometry(w, h, ws, hs);
  geo.computeVertexNormals();
  return geo;
}

export function createCircle(
  radius: number = 0.5,
  segments: number = 32,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const s = Math.max(3, Math.floor(segments));
  const geo = new THREE.CircleGeometry(r, s, thetaStart, thetaLength);
  geo.computeVertexNormals();
  return geo;
}

export function createRing(
  innerRadius: number = 0.5,
  outerRadius: number = 1,
  thetaSegments: number = 32,
  phiSegments: number = 1,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2,
): THREE.BufferGeometry {
  const ir = Math.max(0.001, innerRadius);
  const or = Math.max(ir + 0.001, outerRadius);
  const ts = Math.max(3, Math.floor(thetaSegments));
  const ps = Math.max(1, Math.floor(phiSegments));
  const geo = new THREE.RingGeometry(ir, or, ts, ps, thetaStart, thetaLength);
  geo.computeVertexNormals();
  return geo;
}

export function createCapsule(
  radius: number = 0.5,
  length: number = 1,
  capSegments: number = 4,
  radialSegments: number = 8,
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const l = Math.max(0.001, length);
  const cs = Math.max(2, Math.floor(capSegments));
  const rs = Math.max(3, Math.floor(radialSegments));
  const geo = new THREE.CapsuleGeometry(r, l, cs, rs);
  geo.computeVertexNormals();
  return geo;
}

export function createDodecahedron(radius: number = 1, detail: number = 0): THREE.BufferGeometry {
  const geo = new THREE.DodecahedronGeometry(Math.max(0.001, radius), Math.max(0, Math.floor(detail)));
  geo.computeVertexNormals();
  return geo;
}

export function createIcosahedron(radius: number = 1, detail: number = 0): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(Math.max(0.001, radius), Math.max(0, Math.floor(detail)));
  geo.computeVertexNormals();
  return geo;
}

export function createOctahedron(radius: number = 1, detail: number = 0): THREE.BufferGeometry {
  const geo = new THREE.OctahedronGeometry(Math.max(0.001, radius), Math.max(0, Math.floor(detail)));
  geo.computeVertexNormals();
  return geo;
}

export function createTetrahedron(radius: number = 1, detail: number = 0): THREE.BufferGeometry {
  const geo = new THREE.TetrahedronGeometry(Math.max(0.001, radius), Math.max(0, Math.floor(detail)));
  geo.computeVertexNormals();
  return geo;
}

// ====== ADVANCED SHAPES ======
export function createGear(
  outerRadius: number = 1,
  innerRadius: number = 0.8,
  teeth: number = 12,
  height: number = 0.3,
  bevel: number = 0.05,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const toothAngle = (Math.PI * 2) / teeth;
  const halfTooth = toothAngle / 4;
  for (let i = 0; i < teeth; i++) {
    const angle = i * toothAngle;
    const tipAngle1 = angle - halfTooth * 0.5;
    const tipAngle2 = angle + halfTooth * 0.5;
    const valleyAngle1 = angle + halfTooth;
    const valleyAngle2 = angle + toothAngle - halfTooth;
    if (i === 0) {
      shape.moveTo(Math.cos(tipAngle1) * outerRadius, Math.sin(tipAngle1) * outerRadius);
    } else {
      shape.lineTo(Math.cos(tipAngle1) * outerRadius, Math.sin(tipAngle1) * outerRadius);
    }
    shape.lineTo(Math.cos(tipAngle2) * outerRadius, Math.sin(tipAngle2) * outerRadius);
    shape.lineTo(Math.cos(valleyAngle1) * innerRadius, Math.sin(valleyAngle1) * innerRadius);
    shape.lineTo(Math.cos(valleyAngle2) * innerRadius, Math.sin(valleyAngle2) * innerRadius);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius * 0.4, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function createStar(
  outerRadius: number = 1,
  innerRadius: number = 0.5,
  points: number = 5,
  depth: number = 0.2,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.15,
    bevelSize: depth * 0.08,
    bevelSegments: 2,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function createHeart(size: number = 1, depth: number = 0.3): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const s = size * 0.5;
  shape.moveTo(0, -s * 0.5);
  shape.bezierCurveTo(0, -s * 0.6, -s * 0.5, -s, -s, -s * 0.3);
  shape.bezierCurveTo(-s * 1.5, s * 0.3, -s * 0.5, s * 0.8, 0, s);
  shape.bezierCurveTo(s * 0.5, s * 0.8, s * 1.5, s * 0.3, s, -s * 0.3);
  shape.bezierCurveTo(s * 0.5, -s, 0, -s * 0.6, 0, -s * 0.5);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.2,
    bevelSize: depth * 0.1,
    bevelSegments: 3,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function createSpring(
  radius: number = 0.5,
  height: number = 2,
  turns: number = 5,
  tubeRadius: number = 0.05,
  segments: number = 128,
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const seg = Math.max(8, segments);
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const angle = t * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius;
    const y = t * height - height / 2;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, seg, Math.max(0.001, tubeRadius), 8, false);
  geo.computeVertexNormals();
  return geo;
}

export function createArrow(
  length: number = 2,
  shaftRadius: number = 0.08,
  headLength: number = 0.4,
  headRadius: number = 0.2,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const shaft = createCylinder(shaftRadius, shaftRadius, length - headLength, 16);
  shaft.translate(0, -(headLength / 2), 0);
  parts.push(shaft);
  const head = createCone(headRadius, headLength, 16);
  head.translate(0, (length - headLength) / 2, 0);
  parts.push(head);
  return mergeGeometries(parts);
}

export function createPipe(
  outerRadius: number = 1,
  innerRadius: number = 0.8,
  height: number = 2,
  segments: number = 32,
): THREE.BufferGeometry {
  const outer = createCylinder(outerRadius, outerRadius, height, segments, 1, true);
  const inner = createCylinder(innerRadius, innerRadius, height, segments, 1, true);
  inner.scale(-1, 1, 1);
  const topRing = createRing(innerRadius, outerRadius, segments, 1);
  topRing.rotateX(-Math.PI / 2);
  topRing.translate(0, height / 2, 0);
  const bottomRing = createRing(innerRadius, outerRadius, segments, 1);
  bottomRing.rotateX(Math.PI / 2);
  bottomRing.translate(0, -height / 2, 0);
  return mergeGeometries([outer, inner, topRing, bottomRing]);
}

export function createQuadSphere(radius: number = 1, subdivisions: number = 3): THREE.BufferGeometry {
  const geo = createBox(1, 1, 1, subdivisions, subdivisions, subdivisions);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.normalize().multiplyScalar(radius);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function createTerrain(
  size: number = 10,
  resolution: number = 64,
  heightScale: number = 1,
  seed: number = 0,
): THREE.BufferGeometry {
  const geo = createPlane(size, size, resolution, resolution);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const rand = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  };
  const noise = (x: number, y: number) => {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < 4; i++) {
      total += rand(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maxValue;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = noise(x * 0.3, z * 0.3) * heightScale;
    pos.setY(i, h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function createMobiusStrip(
  radius: number = 1,
  width: number = 0.3,
  twists: number = 1,
  segments: number = 64,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const segU = Math.max(4, segments);
  const segV = Math.max(2, Math.floor(segments / 4));
  for (let i = 0; i <= segU; i++) {
    const u = (i / segU) * Math.PI * 2;
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1;
      const r = radius + v * width * 0.5 * Math.cos((twists * u) / 2);
      const x = r * Math.cos(u);
      const y = v * width * 0.5 * Math.sin((twists * u) / 2);
      const z = r * Math.sin(u);
      positions.push(x, y, z);
      uvs.push(i / segU, j / segV);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + segV + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createCrystal(radius: number = 1, facets: number = 6, height: number = 2): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const topIdx = 0;
  positions.push(0, height / 2, 0);
  const bottomIdx = 1;
  positions.push(0, -height / 2, 0);
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }
  for (let i = 0; i < facets; i++) {
    indices.push(topIdx, 2 + i, 2 + ((i + 1) % facets));
    indices.push(bottomIdx, 2 + ((i + 1) % facets), 2 + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createTree(
  trunkRadius: number = 0.2,
  trunkHeight: number = 2,
  branchLevels: number = 3,
  branchAngle: number = 30,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  function branch(start: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, level: number) {
    if (level <= 0 || len < 0.05 || rad < 0.01) return;
    const end = start.clone().addScaledVector(dir, len);
    const seg = createCylinder(rad, rad * 0.8, len, 6, 1);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    seg.applyMatrix4(new THREE.Matrix4().compose(mid, quat, new THREE.Vector3(1, 1, 1)));
    parts.push(seg);
    const rad2 = (branchAngle * Math.PI) / 180;
    const d1 = dir.clone();
    d1.applyAxisAngle(new THREE.Vector3(1, 0, 0), rad2);
    d1.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    const d2 = dir.clone();
    d2.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rad2);
    d2.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    branch(end, d1, len * 0.7, rad * 0.7, level - 1);
    branch(end, d2, len * 0.7, rad * 0.7, level - 1);
  }
  branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), trunkHeight, trunkRadius, branchLevels);
  return mergeGeometries(parts);
}

export function createRock(radius: number = 1, noiseScale: number = 0.3, frequency: number = 3, seed: number = 0): THREE.BufferGeometry {
  const geo = createIcosahedron(radius, 2);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * frequency + seed) * Math.cos(v.y * frequency + seed) * Math.sin(v.z * frequency + seed);
    const noise = n * noiseScale;
    v.normalize().multiplyScalar(radius + noise);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ====== UTILITY FUNCTIONS ======
export function mergeGeometries(geos: THREE.BufferGeometry[], useGroups: boolean = false): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  let hasNormals = true;
  let hasUVs = true;
  for (const geo of geos) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const pos = nonIndexed.attributes.position;
    if (!pos) continue;
    if (!nonIndexed.attributes.normal) hasNormals = false;
    if (!nonIndexed.attributes.uv) hasUVs = false;
    const posArr = pos.array as Float32Array;
    for (let i = 0; i < posArr.length; i++) positions.push(posArr[i]);
    if (hasNormals && nonIndexed.attributes.normal) {
      const nArr = nonIndexed.attributes.normal.array as Float32Array;
      for (let i = 0; i < nArr.length; i++) normals.push(nArr[i]);
    }
    if (hasUVs && nonIndexed.attributes.uv) {
      const uvArr = nonIndexed.attributes.uv.array as Float32Array;
      for (let i = 0; i < uvArr.length; i++) uvs.push(uvArr[i]);
    }
    for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    offset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (hasNormals && normals.length === positions.length) {
    out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  } else {
    out.computeVertexNormals();
  }
  if (hasUVs && uvs.length === (positions.length / 3) * 2) {
    out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  }
  out.setIndex(indices);
  void useGroups;
  return out;
}

export function subdivideGeometry(geo: THREE.BufferGeometry, levels: number = 1): THREE.BufferGeometry {
  let result = geo;
  for (let i = 0; i < levels; i++) {
    result = subdivideOnce(result);
  }
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
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  out.setIndex(newIndices);
  return out;
}

export function getSurfaceArea(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  let area = 0;
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
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
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
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

export function getVertexCount(geo: THREE.BufferGeometry): number {
  return geo.attributes.position.count;
}

export function getTriangleCount(geo: THREE.BufferGeometry): number {
  if (geo.index) return geo.index.count / 3;
  return geo.attributes.position.count / 3;
}
