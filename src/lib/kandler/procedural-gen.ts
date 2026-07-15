// Kandler Procedural Generation — terrains, buildings, trees, rocks, clouds, cities, vehicles.
import * as THREE from "three";
import { perlinNoise3D, fbmNoise, ridgedNoise } from "./math-lib";

export function generateTerrain(width: number = 100, height: number = 100, resolution: number = 128, maxHeight: number = 10, seed: number = 0): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, resolution, resolution);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const offsetX = Math.sin(seed) * 1000;
  const offsetZ = Math.cos(seed) * 1000;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = (x / width) * 4 + offsetX;
    const nz = (z / height) * 4 + offsetZ;
    let h = fbmNoise(nx, 0, nz, 6, 0.5, 2);
    h = Math.pow(h, 1.5);
    const ridge = ridgedNoise(nx * 2, 0, nz * 2, 4);
    h = h * 0.7 + ridge * 0.3;
    pos.setY(i, h * maxHeight);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function generateBuilding(width: number = 10, height: number = 20, depth: number = 10, floors: number = 5, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const floorHeight = height / floors;
  for (let f = 0; f < floors; f++) {
    const y = f * floorHeight;
    const floor = new THREE.BoxGeometry(width, floorHeight * 0.9, depth);
    floor.translate(0, y + floorHeight / 2, 0);
    parts.push(floor);
    if (Math.sin(seed + f) > 0) {
      const ledge = new THREE.BoxGeometry(width + 0.3, 0.2, depth + 0.3);
      ledge.translate(0, y, 0);
      parts.push(ledge);
    }
  }
  const roof = new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5);
  roof.translate(0, height, 0);
  parts.push(roof);
  return mergeGeos(parts);
}

export function generateSkyscraper(width: number = 15, height: number = 80, depth: number = 15, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const segments = Math.floor(height / 10);
  const segHeight = height / segments;
  let cw = width, cd = depth;
  for (let s = 0; s < segments; s++) {
    const y = s * segHeight;
    const seg = new THREE.BoxGeometry(cw, segHeight, cd);
    seg.translate(0, y + segHeight / 2, 0);
    parts.push(seg);
    if (s > 0 && s % 3 === 0 && Math.sin(seed + s) > 0) { cw *= 0.95; cd *= 0.95; }
  }
  const roof = new THREE.ConeGeometry(cw * 0.3, 5, 4);
  roof.translate(0, height + 2.5, 0);
  parts.push(roof);
  return mergeGeos(parts);
}

export function generateCity(blockSize: number = 50, blocksX: number = 5, blocksZ: number = 5, roadWidth: number = 8, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const totalW = blocksX * blockSize + (blocksX - 1) * roadWidth;
  const totalD = blocksZ * blockSize + (blocksZ - 1) * roadWidth;
  for (let bx = 0; bx < blocksX; bx++) {
    for (let bz = 0; bz < blocksZ; bz++) {
      const bx2 = -totalW / 2 + bx * (blockSize + roadWidth) + blockSize / 2;
      const bz2 = -totalD / 2 + bz * (blockSize + roadWidth) + blockSize / 2;
      const count = 1 + Math.floor(Math.abs(Math.sin(seed + bx * 7 + bz * 13)) * 4);
      for (let b = 0; b < count; b++) {
        const bw = blockSize * 0.2 + Math.abs(Math.sin(seed + b * 100)) * blockSize * 0.2;
        const bh = 10 + Math.abs(Math.sin(seed + b * 200)) * 50;
        const bd = blockSize * 0.2 + Math.abs(Math.sin(seed + b * 300)) * blockSize * 0.2;
        const building = generateBuilding(bw, bh, bd, Math.floor(bh / 4), seed + b * 1000);
        building.translate(bx2 + Math.sin(seed + b) * blockSize / 4, 0, bz2 + Math.cos(seed + b) * blockSize / 4);
        parts.push(building);
      }
    }
  }
  return mergeGeos(parts);
}

export function generateTree(trunkRadius: number = 0.3, trunkHeight: number = 4, branchLevels: number = 4, branchAngle: number = 30, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  function branch(start: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, level: number) {
    if (level <= 0 || len < 0.05 || rad < 0.01) return;
    const end = start.clone().addScaledVector(dir, len);
    const seg = new THREE.CylinderGeometry(rad * 0.8, rad, len, 6, 1);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    seg.applyMatrix4(new THREE.Matrix4().compose(mid, quat, new THREE.Vector3(1, 1, 1)));
    parts.push(seg);
    const rad2 = (branchAngle * Math.PI) / 180;
    const d1 = dir.clone(); d1.applyAxisAngle(new THREE.Vector3(1, 0, 0), rad2); d1.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(seed + level) * Math.PI * 2);
    const d2 = dir.clone(); d2.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rad2); d2.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.cos(seed + level) * Math.PI * 2);
    branch(end, d1, len * 0.7, rad * 0.7, level - 1);
    branch(end, d2, len * 0.7, rad * 0.7, level - 1);
    if (level <= 1) {
      const leaf = new THREE.IcosahedronGeometry(0.3 + Math.sin(seed + level) * 0.2, 0);
      leaf.translate(end.x, end.y, end.z);
      parts.push(leaf);
    }
  }
  branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), trunkHeight, trunkRadius, branchLevels);
  return mergeGeos(parts);
}

export function generatePineTree(height: number = 8, baseRadius: number = 2, levels: number = 5, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunkH = height * 0.3;
  const trunk = new THREE.CylinderGeometry(0.15, 0.25, trunkH, 8);
  trunk.translate(0, trunkH / 2, 0);
  parts.push(trunk);
  const coneH = (height - trunkH) / levels;
  for (let i = 0; i < levels; i++) {
    const r = baseRadius * (1 - i / levels);
    const cone = new THREE.ConeGeometry(r, coneH * 1.5, 8);
    cone.translate(0, trunkH + i * coneH + coneH * 0.5, 0);
    parts.push(cone);
  }
  void seed;
  return mergeGeos(parts);
}

export function generateBush(radius: number = 0.5, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const numLobes = 3 + Math.floor(Math.abs(Math.sin(seed)) * 4);
  for (let i = 0; i < numLobes; i++) {
    const r = radius * (0.4 + Math.abs(Math.sin(seed + i)) * 0.4);
    const angle = (i / numLobes) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.3;
    const z = Math.sin(angle) * radius * 0.3;
    const y = Math.abs(Math.sin(seed + i * 2)) * radius * 0.3;
    const lobe = new THREE.IcosahedronGeometry(r, 1);
    lobe.translate(x, y, z);
    parts.push(lobe);
  }
  return mergeGeos(parts);
}

export function generateRock(radius: number = 1, noiseScale: number = 0.3, frequency: number = 3, seed: number = 0): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = perlinNoise3D(v.x * frequency + seed, v.y * frequency + seed, v.z * frequency + seed);
    const displacement = (n - 0.5) * 2 * noiseScale * radius;
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len > 0) {
      const scale = (radius + displacement) / len;
      pos.setXYZ(i, v.x * scale, v.y * scale, v.z * scale);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function generateCloud(radius: number = 2, lobes: number = 8, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < lobes; i++) {
    const r = radius * (0.3 + Math.abs(Math.sin(seed + i)) * 0.5);
    const angle = (i / lobes) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.5;
    const y = Math.sin(seed + i * 3) * radius * 0.2;
    const z = Math.sin(angle) * radius * 0.5;
    const lobe = new THREE.SphereGeometry(r, 12, 8);
    lobe.translate(x, y, z);
    parts.push(lobe);
  }
  return mergeGeos(parts);
}

export function generateWaterPlane(width: number = 50, depth: number = 50, segments: number = 32, waveHeight: number = 0.1, seed: number = 0): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const offsetX = Math.sin(seed) * 100;
  const offsetZ = Math.cos(seed) * 100;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const wave = Math.sin(x * 0.5 + offsetX) * Math.cos(z * 0.5 + offsetZ) * waveHeight;
    pos.setY(i, wave);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function generateStaircase(steps: number = 10, stepWidth: number = 1.5, stepHeight: number = 0.2, stepDepth: number = 0.3): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < steps; i++) {
    const step = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
    step.translate(0, i * stepHeight + stepHeight / 2, i * stepDepth);
    parts.push(step);
  }
  return mergeGeos(parts);
}

export function generateSpiralStaircase(steps: number = 20, radius: number = 1.5, stepHeight: number = 0.2, stepDepth: number = 0.3): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 4;
    const x = Math.cos(angle) * radius * 0.5;
    const z = Math.sin(angle) * radius * 0.5;
    const y = i * stepHeight;
    const step = new THREE.BoxGeometry(radius, stepHeight, stepDepth);
    step.translate(x, y + stepHeight / 2, z);
    step.rotateY(-angle + Math.PI / 2);
    parts.push(step);
  }
  const pole = new THREE.CylinderGeometry(0.1, 0.1, steps * stepHeight, 8);
  parts.push(pole);
  return mergeGeos(parts);
}

export function generateTable(width: number = 1.5, depth: number = 0.8, height: number = 0.75, legSize: number = 0.06): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const top = new THREE.BoxGeometry(width, 0.04, depth);
  top.translate(0, height - 0.02, 0);
  parts.push(top);
  const legs = [[width/2-legSize, -depth/2+legSize], [-width/2+legSize, -depth/2+legSize], [width/2-legSize, depth/2-legSize], [-width/2+legSize, depth/2-legSize]];
  for (const [x, z] of legs) {
    const leg = new THREE.BoxGeometry(legSize, height - 0.04, legSize);
    leg.translate(x, (height - 0.04) / 2, z);
    parts.push(leg);
  }
  return mergeGeos(parts);
}

export function generateChair(width: number = 0.5, depth: number = 0.5, height: number = 0.9, seatHeight: number = 0.45): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const seat = new THREE.BoxGeometry(width, 0.04, depth);
  seat.translate(0, seatHeight, 0);
  parts.push(seat);
  const back = new THREE.BoxGeometry(width, height - seatHeight, 0.04);
  back.translate(0, seatHeight + (height - seatHeight) / 2, -depth / 2);
  parts.push(back);
  const legs = [[width/2-0.03, -depth/2+0.03], [-width/2+0.03, -depth/2+0.03], [width/2-0.03, depth/2-0.03], [-width/2+0.03, depth/2-0.03]];
  for (const [x, z] of legs) {
    const leg = new THREE.BoxGeometry(0.04, seatHeight, 0.04);
    leg.translate(x, seatHeight / 2, z);
    parts.push(leg);
  }
  return mergeGeos(parts);
}

export function generateCar(bodyLength: number = 4, bodyWidth: number = 1.8, bodyHeight: number = 1.2, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(bodyWidth, bodyHeight * 0.5, bodyLength);
  body.translate(0, bodyHeight * 0.4, 0);
  parts.push(body);
  const cabin = new THREE.BoxGeometry(bodyWidth * 0.85, bodyHeight * 0.4, bodyLength * 0.5);
  cabin.translate(0, bodyHeight * 0.85, -bodyLength * 0.05);
  parts.push(cabin);
  const wheelRadius = bodyHeight * 0.3;
  const wheelPositions = [[bodyWidth/2, wheelRadius, bodyLength*0.3], [-bodyWidth/2, wheelRadius, bodyLength*0.3], [bodyWidth/2, wheelRadius, -bodyLength*0.3], [-bodyWidth/2, wheelRadius, -bodyLength*0.3]];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.2, 16);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, y, z);
    parts.push(wheel);
  }
  void seed;
  return mergeGeos(parts);
}

export function generateSpaceship(size: number = 3, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const fuselage = new THREE.CylinderGeometry(size * 0.2, size * 0.15, size * 2, 8);
  fuselage.rotateX(Math.PI / 2);
  parts.push(fuselage);
  const nose = new THREE.ConeGeometry(size * 0.2, size * 0.5, 8);
  nose.rotateX(-Math.PI / 2);
  nose.translate(0, 0, size * 1.25);
  parts.push(nose);
  const wing1 = new THREE.BoxGeometry(size * 0.8, 0.05, size * 0.6);
  wing1.translate(size * 0.4, 0, -size * 0.2);
  parts.push(wing1);
  const wing2 = new THREE.BoxGeometry(size * 0.8, 0.05, size * 0.6);
  wing2.translate(-size * 0.4, 0, -size * 0.2);
  parts.push(wing2);
  const engine = new THREE.CylinderGeometry(size * 0.12, size * 0.18, size * 0.3, 8);
  engine.rotateX(Math.PI / 2);
  engine.translate(0, 0, -size * 1.15);
  parts.push(engine);
  void seed;
  return mergeGeos(parts);
}

export function generateCrystalCluster(size: number = 1, crystalCount: number = 5, seed: number = 0): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(size * 0.4, size * 0.5, size * 0.2, 8);
  parts.push(base);
  for (let i = 0; i < crystalCount; i++) {
    const angle = (i / crystalCount) * Math.PI * 2 + Math.sin(seed + i) * 0.3;
    const dist = Math.abs(Math.sin(seed + i * 2)) * size * 0.2 + size * 0.1;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const h = size * (0.5 + Math.abs(Math.sin(seed + i * 3)) * 0.7);
    const w = size * (0.05 + Math.abs(Math.sin(seed + i * 5)) * 0.07);
    const crystal = new THREE.ConeGeometry(w, h, 6);
    crystal.translate(x, h / 2 + size * 0.1, z);
    crystal.rotateZ(Math.sin(seed + i) * 0.2);
    crystal.rotateX(Math.cos(seed + i) * 0.2);
    parts.push(crystal);
  }
  return mergeGeos(parts);
}

function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const geo of geos) {
    const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
    const pos = nonIndexed.attributes.position;
    if (!pos) continue;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i++) positions.push(arr[i]);
    if (nonIndexed.attributes.normal) {
      const n = nonIndexed.attributes.normal.array as Float32Array;
      for (let i = 0; i < n.length; i++) normals.push(n[i]);
    }
    for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    offset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  else out.computeVertexNormals();
  out.setIndex(indices);
  return out;
}
