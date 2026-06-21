/**
 * Kandler — Three.js Viewport Engine
 * Bridges the Kandler store with Three.js. Handles rendering meshes, lights,
 * cameras, gizmos, selection highlighting, grid, axes, transform manipulators,
 * edit-mode overlays, and per-frame sync.
 *
 * Made by Kantasu.
 */
import * as THREE from "three";
import { generatePrimitiveMesh, MaterialSlot, Modifier, SceneObject, useStore } from "./store";

export interface ViewportHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbit: OrbitState;
  dispose: () => void;
  render: () => void;
  resize: (w: number, h: number) => void;
  setViewportMode: (m: ViewportMode) => void;
  screenToWorld: (x: number, y: number) => THREE.Vector3 | null;
  pickObject: (x: number, y: number) => string | null;
  focusSelected: () => void;
  frameAll: () => void;
  setActiveCamera: (id: string | null) => void;
  // Transform helpers
  worldToScreen: (p: THREE.Vector3) => { x: number; y: number; visible: boolean };
  getRaycaster: (x: number, y: number) => THREE.Raycaster;
  getCameraForward: () => THREE.Vector3;
  getCanvasRect: () => DOMRect | null;
}

export type ViewportMode = "free" | "top" | "front" | "side" | "camera";
export type ViewportShading = "wireframe" | "solid" | "material" | "rendered";

export interface OrbitState {
  target: THREE.Vector3;
  distance: number;
  azimuth: number;
  polar: number;
}

interface ObjectView {
  object3D: THREE.Object3D;
  outline?: THREE.LineSegments;
  wireOverlay?: THREE.LineSegments;
  editOverlay?: THREE.Object3D;
  objectId: string;
  materials: THREE.Material[];
}

const tmpV1 = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export function createViewport(container: HTMLElement): ViewportHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1a1d23");

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 5000);
  camera.position.set(7, -5, 5);
  camera.up.set(0, 0, 1); // Z-up like Blender
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  // Grid
  const gridGroup = new THREE.Group();
  const grid = new THREE.GridHelper(40, 40, 0x4a4a52, 0x2a2a30);
  grid.rotation.x = Math.PI / 2; // Z-up
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.5;
  gridGroup.add(grid);
  // Sub grid (smaller, denser)
  const subGrid = new THREE.GridHelper(4, 40, 0x6a6a72, 0x3a3a40);
  subGrid.rotation.x = Math.PI / 2;
  (subGrid.material as THREE.Material).transparent = true;
  (subGrid.material as THREE.Material).opacity = 0.6;
  gridGroup.add(subGrid);
  scene.add(gridGroup);

  // Axes (X red, Y green, Z blue)
  const axesGroup = new THREE.Group();
  const makeAxisLine = (color: number, dir: THREE.Vector3) => {
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir]);
    return new THREE.Line(geo, mat);
  };
  axesGroup.add(makeAxisLine(0xe08a3c, new THREE.Vector3(2, 0, 0)));
  axesGroup.add(makeAxisLine(0x4caf50, new THREE.Vector3(0, 2, 0)));
  axesGroup.add(makeAxisLine(0x5b9bd5, new THREE.Vector3(0, 0, 2)));
  scene.add(axesGroup);

  // Cursor (3D)
  const cursorGroup = new THREE.Group();
  const cursorGeom = new THREE.BufferGeometry();
  const cursorPts: number[] = [];
  const s = 0.25;
  for (const [dx, dy] of [[-s, 0], [s, 0], [0, -s], [0, s], [0, 0], [0, 0]]) {
    // lines via separate vertices — skip; use simpler cross
  }
  cursorGeom.setFromPoints([
    new THREE.Vector3(-s, 0, 0), new THREE.Vector3(s, 0, 0),
    new THREE.Vector3(0, -s, 0), new THREE.Vector3(0, s, 0),
    new THREE.Vector3(0, 0, -s), new THREE.Vector3(0, 0, s),
  ]);
  const cursorMat = new THREE.LineBasicMaterial({ color: 0xe08a3c, linewidth: 2 });
  const cursorLines = new THREE.LineSegments(cursorGeom, cursorMat);
  cursorGroup.add(cursorLines);
  scene.add(cursorGroup);

  // Ambient + sun by default (the engine baseline)
  const ambient = new THREE.AmbientLight(0x404040, 0.7);
  scene.add(ambient);
  const sunHemisphere = new THREE.HemisphereLight(0xffffff, 0x303040, 0.4);
  scene.add(sunHemisphere);

  // Object views
  const objectViews = new Map<string, ObjectView>();
  const pickingMeshes: THREE.Mesh[] = [];

  // Raycaster for picking
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  // Orbit state
  const orbit: OrbitState = {
    target: new THREE.Vector3(0, 0, 0),
    distance: 12,
    azimuth: Math.PI / 4,
    polar: Math.PI / 3,
  };

  function applyOrbit() {
    const x = orbit.target.x + orbit.distance * Math.sin(orbit.polar) * Math.cos(orbit.azimuth);
    const y = orbit.target.y + orbit.distance * Math.sin(orbit.polar) * Math.sin(orbit.azimuth);
    const z = orbit.target.z + orbit.distance * Math.cos(orbit.polar);
    camera.position.set(x, y, z);
    camera.lookAt(orbit.target);
  }
  applyOrbit();

  let viewportMode: ViewportMode = "free";
  let activeCameraId: string | null = null;

  // ----- Material creation -----
  function createMaterial(slot: MaterialSlot): THREE.Material {
    const params: THREE.MeshPhysicalMaterialParameters = {
      color: new THREE.Color(slot.baseColor),
      metalness: slot.metallic,
      roughness: slot.roughness,
      emissive: new THREE.Color(slot.emissive),
      emissiveIntensity: slot.emissiveIntensity,
      transparent: slot.transparent || slot.opacity < 1,
      opacity: slot.opacity,
      wireframe: slot.wireframe,
      flatShading: slot.flatShading,
      side: slot.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      clearcoat: slot.clearcoat,
      clearcoatRoughness: slot.clearcoatRoughness,
      ior: slot.ior,
      transmission: slot.transmission,
      thickness: slot.thickness,
    };
    return new THREE.MeshPhysicalMaterial(params);
  }

  // ----- Mesh building -----
  function buildGeometryFromMeshData(mesh: { vertices: { x: number; y: number; z: number }[]; faces: { indices: number[] }[] }): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const vIndexMap: number[] = [];
    let vCounter = 0;

    // Build triangulated, with flat normals per face
    for (const face of mesh.faces) {
      const faceV = face.indices.map(i => mesh.vertices[i]).filter(Boolean);
      if (faceV.length < 3) continue;
      const startIdx = vCounter;
      for (const v of faceV) {
        positions.push(v.x, v.y, v.z);
        vIndexMap.push(0);
        vCounter++;
      }
      // compute normal
      const a = new THREE.Vector3(faceV[0].x, faceV[0].y, faceV[0].z);
      const b = new THREE.Vector3(faceV[1].x, faceV[1].y, faceV[1].z);
      const c = new THREE.Vector3(faceV[2].x, faceV[2].y, faceV[2].z);
      const ab = new THREE.Vector3().subVectors(b, a);
      const ac = new THREE.Vector3().subVectors(c, a);
      const n = new THREE.Vector3().crossVectors(ab, ac).normalize();
      for (let i = 0; i < faceV.length; i++) normals.push(n.x, n.y, n.z);
      // triangulate
      for (let i = 1; i < faceV.length - 1; i++) {
        indices.push(startIdx, startIdx + i, startIdx + i + 1);
      }
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    if (positions.length === 0) {
      // empty mesh — make a tiny placeholder
      geom.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.001, 0, 0, 0, 0.001, 0], 3));
      geom.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      geom.setIndex([0, 1, 2]);
    }
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    return geom;
  }

  function buildPrimitiveGeometry(obj: SceneObject): THREE.BufferGeometry {
    // generate from mesh data (apply modifiers handled separately)
    let working = obj.mesh ? JSON.parse(JSON.stringify(obj.mesh)) : generatePrimitiveMesh("cube");
    working = applyModifiers(working, obj.modifiers || []);
    return buildGeometryFromMeshData(working);
  }

  function applyModifiers(mesh: any, modifiers: Modifier[]): any {
    let result = mesh;
    for (const mod of modifiers) {
      if (!mod.enabled) continue;
      switch (mod.type) {
        case "subdivision": {
          const levels = (mod.params.levels as number) || 1;
          for (let i = 0; i < levels; i++) result = subdivideMesh(result);
          break;
        }
        case "mirror": {
          const axis = (mod.params.axis as string) || "x";
          result = mirrorMesh(result, axis);
          break;
        }
        case "array": {
          const count = (mod.params.count as number) || 2;
          const offset = (mod.params.offset as number) || 2;
          const axis = (mod.params.axis as string) || "x";
          result = arrayMesh(result, count, offset, axis);
          break;
        }
        case "solidify": {
          const thickness = (mod.params.thickness as number) || 0.1;
          result = solidifyMesh(result, thickness);
          break;
        }
        case "bevel": {
          const width = (mod.params.width as number) || 0.1;
          const segments = (mod.params.segments as number) || 1;
          result = bevelMesh(result, width, segments);
          break;
        }
        case "wireframe": {
          result = wireframeMesh(result);
          break;
        }
        case "decimate": {
          const ratio = (mod.params.ratio as number) || 0.5;
          result = decimateMesh(result, ratio);
          break;
        }
        case "simple-deform": {
          const mode = (mod.params.mode as string) || "bend";
          const angle = (mod.params.angle as number) || 45;
          const axis = (mod.params.axis as string) || "z";
          result = simpleDeformMesh(result, mode, angle * Math.PI / 180, axis);
          break;
        }
        case "displace": {
          const strength = (mod.params.strength as number) || 1;
          const texture = (mod.params.texture as string) || "noise";
          result = displaceMesh(result, strength, texture);
          break;
        }
        case "wave": {
          const amplitude = (mod.params.amplitude as number) || 0.5;
          const frequency = (mod.params.frequency as number) || 1;
          result = waveMesh(result, amplitude, frequency);
          break;
        }
        case "screw": {
          const angle = (mod.params.angle as number) || 360;
          const steps = (mod.params.steps as number) || 16;
          const iterations = (mod.params.iterations as number) || 1;
          result = screwMesh(result, angle * Math.PI / 180, steps, iterations);
          break;
        }
        default:
          // Unsupported modifiers — pass through
          break;
      }
    }
    return result;
  }

  // --- Simple Deform: bend / twist / taper / stretch ---
  function simpleDeformMesh(mesh: any, mode: string, angleRad: number, axis: string): any {
    const verts = mesh.vertices.map((v: any) => ({ ...v }));
    // Compute bounds for deformation
    let minB = { x: Infinity, y: Infinity, z: Infinity };
    let maxB = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const v of verts) {
      minB = { x: Math.min(minB.x, v.x), y: Math.min(minB.y, v.y), z: Math.min(minB.z, v.z) };
      maxB = { x: Math.max(maxB.x, v.x), y: Math.max(maxB.y, v.y), z: Math.max(maxB.z, v.z) };
    }
    const range = axis === "x" ? (maxB.x - minB.x) || 1
                : axis === "y" ? (maxB.y - minB.y) || 1
                : (maxB.z - minB.z) || 1;
    const minA = axis === "x" ? minB.x : axis === "y" ? minB.y : minB.z;
    for (const v of verts) {
      const av = axis === "x" ? v.x : axis === "y" ? v.y : v.z;
      const t = (av - minA) / range; // 0..1 along axis
      if (mode === "bend") {
        // Bend: rotate points around an axis perpendicular to the bend axis
        const theta = (t - 0.5) * angleRad;
        const cos = Math.cos(theta), sin = Math.sin(theta);
        if (axis === "z") {
          const nx = v.x, ny = v.y;
          v.x = nx * cos - ny * sin;
          v.y = nx * sin + ny * cos;
        } else if (axis === "x") {
          const ny = v.y, nz = v.z;
          v.y = ny * cos - nz * sin;
          v.z = ny * sin + nz * cos;
        } else {
          const nx = v.x, nz = v.z;
          v.x = nx * cos - nz * sin;
          v.z = nx * sin + nz * cos;
        }
      } else if (mode === "twist") {
        // Twist: rotate points around the axis proportional to position along it
        const theta = t * angleRad;
        const cos = Math.cos(theta), sin = Math.sin(theta);
        if (axis === "z") {
          const nx = v.x, ny = v.y;
          v.x = nx * cos - ny * sin;
          v.y = nx * sin + ny * cos;
        } else if (axis === "x") {
          const ny = v.y, nz = v.z;
          v.y = ny * cos - nz * sin;
          v.z = ny * sin + nz * cos;
        } else {
          const nx = v.x, nz = v.z;
          v.x = nx * cos - nz * sin;
          v.z = nx * sin + nz * cos;
        }
      } else if (mode === "taper") {
        // Taper: scale perpendicular axes by a factor based on position along axis
        const factor = 1 + (t - 0.5) * angleRad / Math.PI;
        if (axis === "z") { v.x *= factor; v.y *= factor; }
        else if (axis === "x") { v.y *= factor; v.z *= factor; }
        else { v.x *= factor; v.z *= factor; }
      } else if (mode === "stretch") {
        // Stretch: scale along axis, compress perpendicular
        const stretchFactor = 1 + (angleRad / Math.PI) * 0.5;
        const perpFactor = 1 / Math.sqrt(stretchFactor);
        if (axis === "z") {
          v.z = (v.z - minA) * stretchFactor + minA;
          v.x *= perpFactor; v.y *= perpFactor;
        } else if (axis === "x") {
          v.x = (v.x - minA) * stretchFactor + minA;
          v.y *= perpFactor; v.z *= perpFactor;
        } else {
          v.y = (v.y - minA) * stretchFactor + minA;
          v.x *= perpFactor; v.z *= perpFactor;
        }
      }
    }
    return { vertices: verts, edges: mesh.edges, faces: mesh.faces };
  }

  function displaceMesh(mesh: any, strength: number, texture: string): any {
    const verts = mesh.vertices.map((v: any) => ({ ...v }));
    for (const v of verts) {
      let disp = 0;
      if (texture === "noise") {
        // Pseudo-noise via sin combination
        disp = Math.sin(v.x * 3) * Math.cos(v.y * 3) * Math.sin(v.z * 3);
      } else if (texture === "checker") {
        disp = ((Math.floor(v.x * 2) + Math.floor(v.y * 2) + Math.floor(v.z * 2)) % 2) * 0.5;
      } else if (texture === "brick") {
        disp = (Math.floor(v.x * 3) * 7 + Math.floor(v.y * 3) * 13 + Math.floor(v.z * 3) * 19) % 5 / 5;
      } else {
        disp = v.y;
      }
      // Displace along Y (object local up) — approximate
      v.y += disp * strength;
    }
    return { vertices: verts, edges: mesh.edges, faces: mesh.faces };
  }

  function waveMesh(mesh: any, amplitude: number, frequency: number): any {
    const verts = mesh.vertices.map((v: any) => ({ ...v }));
    for (const v of verts) {
      v.z += Math.sin(v.x * frequency * Math.PI) * amplitude;
    }
    return { vertices: verts, edges: mesh.edges, faces: mesh.faces };
  }

  function screwMesh(mesh: any, anglePerStep: number, steps: number, iterations: number): any {
    // Revolve the mesh profile around the Z axis
    const verts: any[] = [];
    const faces: any[] = [];
    for (let iter = 0; iter < iterations; iter++) {
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * anglePerStep * iter;
        const cos = Math.cos(theta), sin = Math.sin(theta);
        const baseIdx = verts.length;
        for (const v of mesh.vertices) {
          verts.push({
            x: v.x * cos - v.y * sin,
            y: v.x * sin + v.y * cos,
            z: v.z + s * 0.1,
          });
        }
        if (s > 0) {
          const prevBase = baseIdx - mesh.vertices.length;
          for (const f of mesh.faces) {
            faces.push({
              indices: f.indices.map((i: number) => i + baseIdx),
              materialIndex: f.materialIndex,
            });
          }
          // Stitching
          for (let i = 0; i < mesh.vertices.length; i++) {
            const next = (i + 1) % mesh.vertices.length;
            faces.push({
              indices: [prevBase + i, prevBase + next, baseIdx + next, baseIdx + i],
              materialIndex: 0,
            });
          }
        }
      }
    }
    return { vertices: verts, edges: [], faces };
  }

  // --- Modifier implementations (simplified, geometric) ---
  function subdivideMesh(mesh: any): any {
    // Simple edge-midpoint subdivision for triangle/quads
    const verts = mesh.vertices.map((v: any) => ({ ...v }));
    const newFaces: any[] = [];
    for (const face of mesh.faces) {
      if (face.indices.length === 3) {
        // triangle: 4 sub-triangles
        const [a, b, c] = face.indices.map((i: number) => verts[i]);
        const ab = mid(a, b); verts.push(ab);
        const bc = mid(b, c); verts.push(bc);
        const ca = mid(c, a); verts.push(ca);
        const iab = verts.length - 3;
        const ibc = verts.length - 2;
        const ica = verts.length - 1;
        newFaces.push({ indices: [face.indices[0], iab, ica], materialIndex: face.materialIndex });
        newFaces.push({ indices: [face.indices[1], ibc, iab], materialIndex: face.materialIndex });
        newFaces.push({ indices: [face.indices[2], ica, ibc], materialIndex: face.materialIndex });
        newFaces.push({ indices: [iab, ibc, ica], materialIndex: face.materialIndex });
      } else if (face.indices.length === 4) {
        // quad: 4 sub-quads via midpoints + center
        const [a, b, c, d] = face.indices.map((i: number) => verts[i]);
        const ab = mid(a, b); verts.push(ab);
        const bc = mid(b, c); verts.push(bc);
        const cd = mid(c, d); verts.push(cd);
        const da = mid(d, a); verts.push(da);
        const center = mid(mid(a, b), mid(c, d)); verts.push(center);
        const iab = verts.length - 5;
        const ibc = verts.length - 4;
        const icd = verts.length - 3;
        const ida = verts.length - 2;
        const ic = verts.length - 1;
        newFaces.push({ indices: [face.indices[0], iab, ic, ida], materialIndex: face.materialIndex });
        newFaces.push({ indices: [face.indices[1], ibc, ic, iab], materialIndex: face.materialIndex });
        newFaces.push({ indices: [face.indices[2], icd, ic, ibc], materialIndex: face.materialIndex });
        newFaces.push({ indices: [face.indices[3], ida, ic, icd], materialIndex: face.materialIndex });
      } else {
        newFaces.push(face);
      }
    }
    return { vertices: verts, edges: [], faces: newFaces };
  }
  function mid(a: any, b: any) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }; }

  function mirrorMesh(mesh: any, axis: string): any {
    const verts = [...mesh.vertices];
    const mirrored = mesh.vertices.map((v: any) => ({
      x: axis === "x" ? -v.x : v.x,
      y: axis === "y" ? -v.y : v.y,
      z: axis === "z" ? -v.z : v.z,
    }));
    const offset = verts.length;
    verts.push(...mirrored);
    const faces = [
      ...mesh.faces,
      ...mesh.faces.map((f: any) => ({
        indices: f.indices.map((i: number) => i + offset).reverse(),
        materialIndex: f.materialIndex,
      })),
    ];
    return { vertices: verts, edges: [], faces };
  }

  function arrayMesh(mesh: any, count: number, offset: number, axis: string): any {
    const verts: any[] = [];
    const faces: any[] = [];
    for (let i = 0; i < count; i++) {
      const baseIdx = verts.length;
      const off = i * offset;
      for (const v of mesh.vertices) {
        verts.push({
          x: v.x + (axis === "x" ? off : 0),
          y: v.y + (axis === "y" ? off : 0),
          z: v.z + (axis === "z" ? off : 0),
        });
      }
      for (const f of mesh.faces) {
        faces.push({ indices: f.indices.map((idx: number) => idx + baseIdx), materialIndex: f.materialIndex });
      }
    }
    return { vertices: verts, edges: [], faces };
  }

  function solidifyMesh(mesh: any, thickness: number): any {
    // Simple extrude-along-normal
    const origCount = mesh.vertices.length;
    const verts = [...mesh.vertices];
    const faces: any[] = [];
    // compute vertex normals
    const normals = mesh.vertices.map(() => ({ x: 0, y: 0, z: 0 }));
    for (const f of mesh.faces) {
      if (f.indices.length < 3) continue;
      const a = mesh.vertices[f.indices[0]];
      const b = mesh.vertices[f.indices[1]];
      const c = mesh.vertices[f.indices[2]];
      const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
      const n = {
        x: ab.y * ac.z - ab.z * ac.y,
        y: ab.z * ac.x - ab.x * ac.z,
        z: ab.x * ac.y - ab.y * ac.x,
      };
      const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
      n.x /= len; n.y /= len; n.z /= len;
      for (const idx of f.indices) {
        normals[idx].x += n.x; normals[idx].y += n.y; normals[idx].z += n.z;
      }
    }
    for (const n of normals) {
      const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
      n.x /= len; n.y /= len; n.z /= len;
    }
    // extruded verts
    for (let i = 0; i < origCount; i++) {
      verts.push({
        x: mesh.vertices[i].x + normals[i].x * thickness,
        y: mesh.vertices[i].y + normals[i].y * thickness,
        z: mesh.vertices[i].z + normals[i].z * thickness,
      });
    }
    // top faces (reversed) and bottom faces
    for (const f of mesh.faces) {
      faces.push({ indices: [...f.indices].reverse(), materialIndex: f.materialIndex });
      faces.push({ indices: f.indices.map((i: number) => i + origCount), materialIndex: f.materialIndex });
    }
    // side walls
    for (const f of mesh.faces) {
      for (let i = 0; i < f.indices.length; i++) {
        const a = f.indices[i];
        const b = f.indices[(i + 1) % f.indices.length];
        faces.push({ indices: [a, b, b + origCount, a + origCount], materialIndex: f.materialIndex });
      }
    }
    return { vertices: verts, edges: [], faces };
  }

  function bevelMesh(mesh: any, width: number, _segments: number): any {
    // Simple offset — push each face inward by width
    return mesh; // Real bevel is complex; pass-through for stability
  }

  function wireframeMesh(mesh: any): any {
    // Convert to thin tubes (simplified: just edges)
    const edges: any[] = [];
    for (const f of mesh.faces) {
      for (let i = 0; i < f.indices.length; i++) {
        const a = f.indices[i];
        const b = f.indices[(i + 1) % f.indices.length];
        if (a < b) edges.push({ a, b });
      }
    }
    return { vertices: mesh.vertices, edges, faces: [] };
  }

  function decimateMesh(mesh: any, ratio: number): any {
    // Simple — drop every Nth face
    const keep = Math.floor(mesh.faces.length * Math.max(0.1, ratio));
    const faces = mesh.faces.slice(0, keep);
    return { vertices: mesh.vertices, edges: [], faces };
  }

  // --- Object sync ---
  function syncObject(obj: SceneObject) {
    let view = objectViews.get(obj.id);
    if (!view) {
      // Create
      if (obj.kind === "mesh") {
        const geom = buildPrimitiveGeometry(obj);
        const mat = (obj.materialSlots.length && materialsRef[obj.materialSlots[0]])
          ? createMaterial(materialsRef[obj.materialSlots[0]])
          : new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.6 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        // wireframe overlay (for wireframe shading mode toggling)
        const wireMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        const wireGeom = new THREE.WireframeGeometry(geom);
        const wire = new THREE.LineSegments(wireGeom, wireMat);
        wire.visible = false;
        scene.add(wire);
        // outline
        const outlineGeom = new THREE.EdgesGeometry(geom);
        const outlineMat = new THREE.LineBasicMaterial({ color: 0xe08a3c, linewidth: 2 });
        const outline = new THREE.LineSegments(outlineGeom, outlineMat);
        outline.visible = false;
        scene.add(outline);
        view = { object3D: mesh, outline, wireOverlay: wire, objectId: obj.id, materials: [mat] };
        pickingMeshes.push(mesh);
      } else if (obj.kind === "light" && obj.light) {
        const light = createLightObject(obj.light);
        scene.add(light);
        view = { object3D: light, objectId: obj.id, materials: [] };
      } else if (obj.kind === "camera" && obj.camera) {
        const camHelper = createCameraHelper();
        scene.add(camHelper);
        view = { object3D: camHelper, objectId: obj.id, materials: [] };
      } else {
        // empty
        const helper = new THREE.AxesHelper(0.5);
        scene.add(helper);
        view = { object3D: helper, objectId: obj.id, materials: [] };
      }
      objectViews.set(obj.id, view);
    }

    // Update transform
    view.object3D.position.set(obj.position[0], obj.position[1], obj.position[2]);
    view.object3D.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    view.object3D.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
    view.object3D.visible = obj.visible && obj.visibleInViewport;

    // Update selection outline
    const isSelected = selectionRef.objects.includes(obj.id);
    if (view.outline) view.outline.visible = isSelected && showOutlineRef;
    if (view.wireOverlay) {
      view.wireOverlay.position.copy(view.object3D.position);
      view.wireOverlay.rotation.copy(view.object3D.rotation);
      view.wireOverlay.scale.copy(view.object3D.scale);
      view.wireOverlay.visible = shadingRef === "wireframe";
    }
    if (view.outline) {
      view.outline.position.copy(view.object3D.position);
      view.outline.rotation.copy(view.object3D.rotation);
      view.outline.scale.copy(view.object3D.scale);
    }

    // Rebuild geometry if mesh changed (we use a version check via object identity)
    if (obj.kind === "mesh" && (view.object3D as THREE.Mesh).geometry) {
      const mesh = view.object3D as THREE.Mesh;
      const newGeom = buildPrimitiveGeometry(obj);
      // dispose old
      mesh.geometry.dispose();
      mesh.geometry = newGeom;
      // update wireframe & outline geometry
      if (view.wireOverlay) {
        view.wireOverlay.geometry.dispose();
        view.wireOverlay.geometry = new THREE.WireframeGeometry(newGeom);
      }
      if (view.outline) {
        view.outline.geometry.dispose();
        view.outline.geometry = new THREE.EdgesGeometry(newGeom);
      }
      // update material if shading mode changed
      applyShadingToMesh(view, obj);
    }
  }

  function applyShadingToMesh(view: ObjectView, obj: SceneObject) {
    const mesh = view.object3D as THREE.Mesh;
    if (!mesh.material) return;
    const matSlots = obj.materialSlots.map(id => materialsRef[id]).filter(Boolean) as MaterialSlot[];
    if (matSlots.length === 0) {
      // default
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
      else mesh.material.dispose();
      mesh.material = makeDefaultForShading(shadingRef);
      view.materials = [mesh.material as THREE.Material];
      return;
    }
    if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
    const newMats = matSlots.map(m => {
      if (shadingRef === "wireframe") return new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      if (shadingRef === "solid") return new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.7, metalness: 0, flatShading: false });
      return createMaterial(m);
    });
    mesh.material = newMats.length === 1 ? newMats[0] : newMats;
    view.materials = newMats;
  }

  function makeDefaultForShading(mode: ViewportShading): THREE.Material {
    if (mode === "wireframe") return new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    if (mode === "solid") return new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.7 });
    return new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.7 });
  }

  function createLightObject(p: any): THREE.Light {
    let light: THREE.Light;
    switch (p.type) {
      case "point":
        light = new THREE.PointLight(new THREE.Color(p.color), p.intensity, p.distance || 0);
        break;
      case "spot":
        light = new THREE.SpotLight(new THREE.Color(p.color), p.intensity, p.distance || 0, p.angle, p.penumbra);
        break;
      case "sun":
        light = new THREE.DirectionalLight(new THREE.Color(p.color), p.intensity);
        break;
      case "area":
        light = new THREE.RectAreaLight(new THREE.Color(p.color), p.intensity, p.width, p.height);
        break;
      default:
        light = new THREE.PointLight(new THREE.Color(p.color), p.intensity);
    }
    if ("castShadow" in light) {
      (light as any).castShadow = p.castShadow;
    }
    // Add a small helper sphere to visualize the light
    const helper = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color), wireframe: false })
    );
    helper.userData.isLightHelper = true;
    light.add(helper);
    return light;
  }

  function createCameraHelper(): THREE.Object3D {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    group.add(body);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16),
      new THREE.MeshBasicMaterial({ color: 0x5b9bd5 })
    );
    lens.rotation.z = Math.PI / 2;
    lens.position.x = 0.4;
    group.add(lens);
    return group;
  }

  function removeObjectView(id: string) {
    const view = objectViews.get(id);
    if (!view) return;
    scene.remove(view.object3D);
    if (view.outline) scene.remove(view.outline);
    if (view.wireOverlay) scene.remove(view.wireOverlay);
    if (view.editOverlay) scene.remove(view.editOverlay);
    // dispose
    if ((view.object3D as THREE.Mesh).geometry) {
      ((view.object3D as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
    }
    view.materials.forEach(m => m.dispose());
    const pi = pickingMeshes.indexOf(view.object3D as THREE.Mesh);
    if (pi >= 0) pickingMeshes.splice(pi, 1);
    objectViews.delete(id);
  }

  // ----- References for state (avoid re-running sync on every state change) -----
  let selectionRef: { objects: string[] } = { objects: [] };
  let materialsRef: Record<string, MaterialSlot> = {};
  let shadingRef: ViewportShading = "solid";
  let showOutlineRef = true;
  let showGridRef = true;
  let showAxesRef = true;
  let cursorRef: [number, number, number] = [0, 0, 0];

  function syncAll() {
    const state = useStore.getState();
    selectionRef = state.selection;
    materialsRef = state.materials;
    shadingRef = state.shadingMode as ViewportShading;
    showOutlineRef = state.showOutline;
    showGridRef = state.showGrid;
    showAxesRef = state.showAxes;
    cursorRef = state.cursor.position;

    // If we're in camera view, continuously update from the scene camera
    // so the user sees live updates when they move/rotate the camera object.
    if (viewportMode === "camera") {
      applyCameraView();
    }

    // Remove deleted objects
    for (const id of [...objectViews.keys()]) {
      if (!state.objects[id]) removeObjectView(id);
    }
    // Add or update
    for (const id of Object.keys(state.objects)) {
      syncObject(state.objects[id]);
    }
    // Background + fog
    if (scene.background instanceof THREE.Color) {
      (scene.background as THREE.Color).set(state.render.backgroundColor);
    } else {
      scene.background = new THREE.Color(state.render.backgroundColor);
    }
    if (state.render.fogEnabled) {
      scene.fog = new THREE.Fog(new THREE.Color(state.render.fogColor), state.render.fogNear, state.render.fogFar);
    } else {
      scene.fog = null;
    }
    gridGroup.visible = state.showGrid;
    axesGroup.visible = state.showAxes;
    cursorGroup.position.set(cursorRef[0], cursorRef[1], cursorRef[2]);
    cursorGroup.visible = state.cursor.visible;
    // Tone mapping
    renderer.toneMappingExposure = state.render.exposure;
    switch (state.render.toneMapping) {
      case "aces": renderer.toneMapping = THREE.ACESFilmicToneMapping; break;
      case "reinhard": renderer.toneMapping = THREE.ReinhardToneMapping; break;
      case "cineon": renderer.toneMapping = THREE.CineonToneMapping; break;
      case "linear": renderer.toneMapping = THREE.LinearToneMapping; break;
      default: renderer.toneMapping = THREE.NoToneMapping;
    }
    renderer.shadowMap.enabled = state.render.shadowEnabled;
  }

  // ----- Camera controls (orbit/pan/zoom) -----
  let isMouseDown = false;
  let mouseButton = -1;
  let lastX = 0, lastY = 0;
  let isPanning = false;
  let isOrbiting = false;

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    orbit.distance = Math.max(0.5, Math.min(500, orbit.distance * scale));
    applyOrbit();
    render();
  }
  function onMouseDown(e: MouseEvent) {
    isMouseDown = true;
    mouseButton = e.button;
    lastX = e.clientX; lastY = e.clientY;
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning = true; isOrbiting = false;
    } else if (e.button === 2 || (e.button === 0 && e.altKey)) {
      isPanning = false; isOrbiting = true;
    } else if (e.button === 0) {
      // could be pick or orbit
      isOrbiting = false; isPanning = false;
    }
  }
  function onMouseMove(e: MouseEvent) {
    if (!isMouseDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (isPanning) {
      const factor = orbit.distance * 0.0015;
      const right = new THREE.Vector3();
      camera.getWorldDirection(right);
      const up = camera.up.clone();
      const r = new THREE.Vector3().crossVectors(right, up).normalize();
      const u = new THREE.Vector3().crossVectors(r, right).normalize();
      orbit.target.addScaledVector(r, -dx * factor);
      orbit.target.addScaledVector(u, dy * factor);
      applyOrbit();
      render();
    } else if (isOrbiting) {
      orbit.azimuth -= dx * 0.005;
      orbit.polar = Math.max(0.05, Math.min(Math.PI - 0.05, orbit.polar - dy * 0.005));
      applyOrbit();
      render();
    }
  }
  function onMouseUp(_e: MouseEvent) {
    isMouseDown = false;
    isPanning = false;
    isOrbiting = false;
    mouseButton = -1;
  }
  function onContextMenu(e: Event) { e.preventDefault(); }

  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
  renderer.domElement.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  renderer.domElement.addEventListener("contextmenu", onContextMenu);

  // ----- Picking -----
  function pickObject(x: number, y: number): string | null {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((x - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((y - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickingMeshes, false);
    if (hits.length === 0) return null;
    let target: THREE.Object3D | null = hits[0].object;
    while (target && !target.userData.objectId) {
      // find which objectView
      const found = [...objectViews.values()].find(v => v.object3D === target);
      if (found) return found.objectId;
      target = target.parent;
    }
    // fallback: directly match by object3D
    const found = [...objectViews.values()].find(v => v.object3D === hits[0].object);
    return found ? found.objectId : null;
  }

  function screenToWorld(x: number, y: number): THREE.Vector3 | null {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((x - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((y - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    // intersect with XY plane at z=0 (Blender default ground)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hit)) return hit;
    return null;
  }

  function focusSelected() {
    const sel = selectionRef.objects;
    if (sel.length === 0) return;
    const box = new THREE.Box3();
    for (const id of sel) {
      const v = objectViews.get(id);
      if (v) {
        const b = new THREE.Box3().setFromObject(v.object3D);
        box.union(b);
      }
    }
    if (box.isEmpty()) return;
    box.getCenter(orbit.target);
    const size = box.getSize(new THREE.Vector3()).length();
    orbit.distance = Math.max(2, size * 1.8);
    applyOrbit();
    render();
  }

  function frameAll() {
    const box = new THREE.Box3();
    for (const v of objectViews.values()) {
      const b = new THREE.Box3().setFromObject(v.object3D);
      box.union(b);
    }
    if (box.isEmpty()) {
      orbit.target.set(0, 0, 0);
      orbit.distance = 12;
    } else {
      box.getCenter(orbit.target);
      const size = box.getSize(new THREE.Vector3()).length();
      orbit.distance = Math.max(2, size * 1.8);
    }
    applyOrbit();
    render();
  }

  function setViewportMode(m: ViewportMode) {
    viewportMode = m;
    if (m === "top") {
      camera.position.set(0, 0, 15);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      orbit.azimuth = 0; orbit.polar = 0.01; orbit.target.set(0, 0, 0); orbit.distance = 15;
    } else if (m === "front") {
      camera.position.set(0, -15, 0);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
      orbit.azimuth = -Math.PI / 2; orbit.polar = Math.PI / 2; orbit.target.set(0, 0, 0); orbit.distance = 15;
    } else if (m === "side") {
      camera.position.set(15, 0, 0);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
      orbit.azimuth = 0; orbit.polar = Math.PI / 2; orbit.target.set(0, 0, 0); orbit.distance = 15;
    } else if (m === "camera") {
      // Pick the active camera, or the first camera in the scene
      const s = useStore.getState();
      let camId = activeCameraId;
      if (!camId) {
        const cams = Object.values(s.objects).filter(o => o.kind === "camera" && o.visible);
        if (cams.length > 0) camId = cams[0].id;
      }
      if (camId) {
        activeCameraId = camId;
        applyCameraView();
      } else {
        // No camera — fall back to free orbit
        camera.up.set(0, 0, 1);
        applyOrbit();
        useStore.getState().showToast("No camera in scene — add one via Add → Camera", "warning");
      }
    } else {
      camera.up.set(0, 0, 1);
      applyOrbit();
    }
    render();
  }

  function applyCameraView() {
    if (!activeCameraId) return;
    const obj = useStore.getState().objects[activeCameraId];
    if (!obj || !obj.camera) return;
    // Position
    camera.position.set(obj.position[0], obj.position[1], obj.position[2]);
    // Euler rotation (Z-up convention)
    camera.up.set(0, 0, 1);
    camera.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2], "ZYX");
    // FOV
    camera.fov = obj.camera.fov;
    camera.near = obj.camera.near;
    camera.far = obj.camera.far;
    if (obj.camera.ortho) {
      camera.toOrthographic?.();
    } else {
      // PerspectiveCamera is the default
    }
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
  }

  function setActiveCamera(id: string | null) {
    activeCameraId = id;
    if (id && viewportMode === "camera") applyCameraView();
  }

  function resize(w: number, h: number) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ----- Animation loop -----
  let rafId = 0;
  let lastTime = performance.now();
  let frameCount = 0;
  let lastFpsTime = performance.now();
  function loop() {
    rafId = requestAnimationFrame(loop);
    syncAll();
    renderer.render(scene, camera);
    // FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime > 500) {
      const fps = (frameCount * 1000) / (now - lastFpsTime);
      useStore.getState().setFPS(Math.round(fps));
      useStore.getState().setDrawCalls(renderer.info.render.calls);
      frameCount = 0;
      lastFpsTime = now;
    }
    lastTime = now;
  }
  loop();

  function render() {
    syncAll();
    renderer.render(scene, camera);
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    renderer.domElement.removeEventListener("wheel", onWheel);
    renderer.domElement.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    renderer.domElement.removeEventListener("contextmenu", onContextMenu);
    for (const id of [...objectViews.keys()]) removeObjectView(id);
    renderer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  }

  // ----- Transform helpers (used by TransformGizmo) -----
  function worldToScreen(p: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const rect = renderer.domElement.getBoundingClientRect();
    const v = p.clone().project(camera);
    return {
      x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
      visible: v.z < 1 && v.z > -1,
    };
  }

  function getRaycaster(x: number, y: number): THREE.Raycaster {
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc2 = new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc2, camera);
    return rc;
  }

  function getCameraForward(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    return dir;
  }

  function getCanvasRect(): DOMRect | null {
    return renderer.domElement.getBoundingClientRect();
  }

  return {
    scene,
    camera,
    renderer,
    orbit,
    dispose,
    render,
    resize,
    setViewportMode,
    screenToWorld,
    pickObject,
    focusSelected,
    frameAll,
    setActiveCamera,
    worldToScreen,
    getRaycaster,
    getCameraForward,
    getCanvasRect,
  };
}
