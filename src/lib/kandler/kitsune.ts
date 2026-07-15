// High-quality Kitsune (fox) head model — replaces Suzanne.
// A kitsune is a mythical Japanese fox spirit.
import * as THREE from "three";

export function buildKitsune(size: number = 1): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Main skull
  const skull = new THREE.IcosahedronGeometry(size * 0.6, 3);
  skull.scale(1.0, 0.85, 1.15);
  skull.translate(0, size * 0.1, size * 0.05);
  parts.push(skull);

  // Snout
  const snout = new THREE.CylinderGeometry(size * 0.12, size * 0.22, size * 0.7, 16, 4);
  snout.rotateX(Math.PI / 2);
  snout.translate(0, size * -0.05, size * 0.65);
  snout.scale(0.8, 0.6, 1.0);
  parts.push(snout);

  // Nose
  const nose = new THREE.ConeGeometry(size * 0.08, size * 0.12, 8);
  nose.rotateX(Math.PI / 2);
  nose.translate(0, size * -0.02, size * 1.0);
  parts.push(nose);

  // Left ear outer
  const earLOuter = new THREE.ConeGeometry(size * 0.12, size * 0.45, 4);
  earLOuter.scale(0.6, 1.0, 0.8);
  earLOuter.rotateZ(Math.PI / 12);
  earLOuter.translate(-size * 0.3, size * 0.55, -size * 0.05);
  parts.push(earLOuter);

  // Left ear inner
  const earLInner = new THREE.ConeGeometry(size * 0.06, size * 0.35, 4);
  earLInner.scale(0.5, 1.0, 0.7);
  earLInner.rotateZ(Math.PI / 12);
  earLInner.translate(-size * 0.3, size * 0.52, -size * 0.02);
  parts.push(earLInner);

  // Right ear outer
  const earROuter = new THREE.ConeGeometry(size * 0.12, size * 0.45, 4);
  earROuter.scale(0.6, 1.0, 0.8);
  earROuter.rotateZ(-Math.PI / 12);
  earROuter.translate(size * 0.3, size * 0.55, -size * 0.05);
  parts.push(earROuter);

  // Right ear inner
  const earRInner = new THREE.ConeGeometry(size * 0.06, size * 0.35, 4);
  earRInner.scale(0.5, 1.0, 0.7);
  earRInner.rotateZ(-Math.PI / 12);
  earRInner.translate(size * 0.3, size * 0.52, -size * 0.02);
  parts.push(earRInner);

  // Left eye
  const eyeL = new THREE.SphereGeometry(size * 0.1, 12, 8);
  eyeL.scale(1.3, 0.5, 0.4);
  eyeL.translate(-size * 0.22, size * 0.15, size * 0.42);
  parts.push(eyeL);

  // Right eye
  const eyeR = new THREE.SphereGeometry(size * 0.1, 12, 8);
  eyeR.scale(1.3, 0.5, 0.4);
  eyeR.translate(size * 0.22, size * 0.15, size * 0.42);
  parts.push(eyeR);

  // Eye sockets
  const socketL = new THREE.SphereGeometry(size * 0.13, 12, 8);
  socketL.scale(1.4, 0.6, 0.5);
  socketL.translate(-size * 0.22, size * 0.13, size * 0.38);
  parts.push(socketL);

  const socketR = new THREE.SphereGeometry(size * 0.13, 12, 8);
  socketR.scale(1.4, 0.6, 0.5);
  socketR.translate(size * 0.22, size * 0.13, size * 0.38);
  parts.push(socketR);

  // Cheek tufts
  const cheekL = new THREE.SphereGeometry(size * 0.15, 8, 6);
  cheekL.scale(1.0, 0.8, 0.6);
  cheekL.translate(-size * 0.35, size * -0.05, size * 0.2);
  parts.push(cheekL);

  const cheekR = new THREE.SphereGeometry(size * 0.15, 8, 6);
  cheekR.scale(1.0, 0.8, 0.6);
  cheekR.translate(size * 0.35, size * -0.05, size * 0.2);
  parts.push(cheekR);

  // Brow ridges
  const browL = new THREE.SphereGeometry(size * 0.08, 8, 6);
  browL.scale(1.5, 0.5, 0.5);
  browL.translate(-size * 0.2, size * 0.28, size * 0.35);
  parts.push(browL);

  const browR = new THREE.SphereGeometry(size * 0.08, 8, 6);
  browR.scale(1.5, 0.5, 0.5);
  browR.translate(size * 0.2, size * 0.28, size * 0.35);
  parts.push(browR);

  // Lower jaw
  const jaw = new THREE.CylinderGeometry(size * 0.1, size * 0.18, size * 0.5, 12, 3);
  jaw.rotateX(Math.PI / 2);
  jaw.scale(0.85, 0.5, 1.0);
  jaw.translate(0, size * -0.2, size * 0.5);
  parts.push(jaw);

  // Chin
  const chin = new THREE.SphereGeometry(size * 0.08, 8, 6);
  chin.scale(1.2, 0.6, 0.8);
  chin.translate(0, size * -0.3, size * 0.72);
  parts.push(chin);

  // Forehead marking
  const forehead = new THREE.SphereGeometry(size * 0.2, 8, 6);
  forehead.scale(0.8, 0.6, 0.5);
  forehead.translate(0, size * 0.4, size * 0.15);
  parts.push(forehead);

  return mergeKitsuneGeometries(parts);
}

function mergeKitsuneGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    const pos = nonIndexed.attributes.position;
    const norm = nonIndexed.attributes.normal;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i++) positions.push(arr[i]);
    if (norm) {
      const n = norm.array as Float32Array;
      for (let i = 0; i < n.length; i++) normals.push(n[i]);
    }
    for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    offset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  }
  out.setIndex(indices);
  out.computeVertexNormals();
  return out;
}

export const buildSuzanne = buildKitsune;
