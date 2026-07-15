"use client";

import * as THREE from "three";
import type { SceneState, SceneObject } from "../types";
import { buildGeometry, buildMaterial, applyModifiers } from "../three-engine";

// ---- Three.js export: serializable scene JSON using THREE.ObjectLoader format ----
export function exportThreeJS(scene: SceneState): string {
  // Build a real THREE.Scene from state, then use toJSON.
  const tScene = new THREE.Scene();
  tScene.name = scene.name;
  if (scene.environment.background) {
    tScene.background = new THREE.Color(
      scene.environment.background[0],
      scene.environment.background[1],
      scene.environment.background[2],
    );
  }
  if (scene.environment.fog) {
    tScene.fog = new THREE.Fog(
      new THREE.Color(
        scene.environment.fog.color[0],
        scene.environment.fog.color[1],
        scene.environment.fog.color[2],
      ),
      scene.environment.fog.near,
      scene.environment.fog.far,
    );
  }
  const amb = new THREE.AmbientLight(0xffffff, scene.environment.ambientIntensity);
  tScene.add(amb);

  for (const id of Object.keys(scene.objects)) {
    const o = scene.objects[id];
    if (o.kind === "mesh" && o.geometry) {
      const geo = applyModifiers(buildGeometry(o.geometry), o.modifiers, scene.objects);
      const matDef = o.materialId ? scene.materials[o.materialId] : undefined;
      const mat = matDef ? buildMaterial(matDef) : new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = o.name;
      mesh.position.set(...o.transform.position);
      mesh.rotation.set(...o.transform.rotation);
      mesh.scale.set(...o.transform.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tScene.add(mesh);
    } else if (o.kind === "light" && o.light) {
      let light: THREE.Light | null = null;
      switch (o.light.kind) {
        case "directional":
          light = new THREE.DirectionalLight(
            new THREE.Color(o.light.color[0], o.light.color[1], o.light.color[2]),
            o.light.intensity,
          );
          break;
        case "point":
          light = new THREE.PointLight(
            new THREE.Color(o.light.color[0], o.light.color[1], o.light.color[2]),
            o.light.intensity, o.light.distance ?? 0, o.light.decay ?? 2,
          );
          break;
        case "spot":
          light = new THREE.SpotLight(
            new THREE.Color(o.light.color[0], o.light.color[1], o.light.color[2]),
            o.light.intensity, o.light.distance ?? 0, o.light.angle ?? Math.PI / 6, o.light.penumbra ?? 0.2, o.light.decay ?? 2,
          );
          break;
        case "hemisphere":
          light = new THREE.HemisphereLight(
            new THREE.Color(o.light.color[0], o.light.color[1], o.light.color[2]),
            0x000000,
            o.light.intensity,
          );
          break;
        case "area":
          light = new THREE.RectAreaLight(
            new THREE.Color(o.light.color[0], o.light.color[1], o.light.color[2]),
            o.light.intensity, 4, 4,
          );
          break;
      }
      if (light) {
        light.name = o.name;
        light.position.set(...o.transform.position);
        light.rotation.set(...o.transform.rotation);
        tScene.add(light);
      }
    } else if (o.kind === "camera" && o.camera) {
      const cam = new THREE.PerspectiveCamera(o.camera.fov ?? 50, 16 / 9, o.camera.near ?? 0.1, o.camera.far ?? 1000);
      cam.name = o.name;
      cam.position.set(...o.transform.position);
      cam.rotation.set(...o.transform.rotation);
      tScene.add(cam);
    }
  }

  const json = tScene.toJSON();
  json.scene = json.scene || json.object;
  json.metadata = {
    ...(json.metadata || {}),
    generator: "Kandler 3D Editor",
    kandlerVersion: 1,
    engine: "three.js",
    format: "Three.js ObjectLoader JSON",
  };
  return JSON.stringify(json, null, 2);
}

// ---- GLTF export (GLTF 2.0) ----
export function exportGLTF(scene: SceneState, embed = true): string {
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const buffers: any[] = [];
  const meshes: any[] = [];
  const nodes: any[] = [];
  const materials: any[] = [];
  const images: any[] = [];
  const textures: any[] = [];
  let bufferData: number[] = [];
  let byteOffset = 0;

  function addBufferView(data: number[], target: number): number {
    const view = { buffer: 0, byteOffset, byteLength: data.length * 4, target };
    bufferViews.push(view);
    const arr = new Float32Array(data);
    for (let i = 0; i < arr.length; i++) bufferData.push(arr[i]);
    byteOffset += data.length * 4;
    return bufferViews.length - 1;
  }
  function addAccessorFloat3(data: number[], view: number): number {
    accessors.push({ bufferView: view, componentType: 5126, count: data.length / 3, type: "VEC3" });
    return accessors.length - 1;
  }
  function addAccessorUInt(data: number[], view: number): number {
    accessors.push({ bufferView: view, componentType: 5125, count: data.length, type: "SCALAR" });
    return accessors.length - 1;
  }

  // materials
  for (const matId of Object.keys(scene.materials)) {
    const m = scene.materials[matId];
    materials.push({
      name: m.name,
      pbrMetallicRoughness: {
        baseColorFactor: [...m.color, m.opacity],
        metallicFactor: m.metalness,
        roughnessFactor: m.roughness,
      },
      emissiveFactor: m.emissive.map((v) => v * m.emissiveIntensity),
      alphaMode: m.transparent ? "BLEND" : "OPAQUE",
      doubleSided: m.doubleSided,
    });
  }

  // meshes + nodes
  let nodeIndex = 0;
  let meshIndex = 0;
  for (const id of Object.keys(scene.objects)) {
    const o = scene.objects[id];
    if (o.kind !== "mesh" || !o.geometry) continue;
    const tmpGeo = applyModifiers(buildGeometry(o.geometry), o.modifiers, scene.objects);
    const pos = tmpGeo.attributes.position;
    const norm = tmpGeo.attributes.normal;
    const idx = tmpGeo.index;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j < pos.count; j++) positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    if (norm) for (let j = 0; j < norm.count; j++) normals.push(norm.getX(j), norm.getY(j), norm.getZ(j));
    if (idx) for (let j = 0; j < idx.count; j++) indices.push(idx.getX(j));

    const posView = addBufferView(positions, 34962);
    const normView = addBufferView(normals, 34962);
    const idxView = addBufferView(indices, 34963);
    const posAcc = addAccessorFloat3(positions, posView);
    const normAcc = addAccessorFloat3(normals, normView);
    const idxAcc = addAccessorUInt(indices, idxView);

    meshes.push({
      name: o.name,
      primitives: [
        {
          attributes: { POSITION: posAcc, NORMAL: normAcc },
          indices: idxAcc,
          material: o.materialId ? materials.findIndex((_, i) => Object.keys(scene.materials)[i] === o.materialId) : undefined,
        },
      ],
    });
    const t = o.transform;
    nodes.push({
      name: o.name,
      mesh: meshIndex,
      translation: t.position,
      rotation: eulerToQuat(t.rotation),
      scale: t.scale,
    });
    meshIndex++;
    nodeIndex++;
  }

  buffers.push({ byteLength: bufferData.length * 4 });
  const bin = new Uint8Array(new Float32Array(bufferData).buffer);
  let uri = "";
  if (embed) {
    uri = "data:application/octet-stream;base64," + btoa(String.fromCharCode(...bin));
    buffers[0].uri = uri;
  }

  void images; void textures;

  const json: any = {
    asset: { version: "2.0", generator: "Kandler 3D Editor", copyright: "Kandler" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    accessors,
    bufferViews,
    buffers,
    materials,
    extensionsUsed: [],
    extensionsRequired: [],
  };
  return JSON.stringify(json, null, 2);
}

function eulerToQuat(e: [number, number, number]): [number, number, number, number] {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0], e[1], e[2]));
  return [q.x, q.y, q.z, q.w];
}

// ---- OBJ export ----
export function exportOBJ(scene: SceneState): string {
  let out = `# Kandler 3D Editor export\n# www.kandler.app\n\n`;
  let vcount = 1;
  for (const id of Object.keys(scene.objects)) {
    const o = scene.objects[id];
    if (o.kind !== "mesh" || !o.geometry) continue;
    out += `o ${o.name}\n`;
    const geo = applyModifiers(buildGeometry(o.geometry), o.modifiers, scene.objects);
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const idx = geo.index;
    const mat = o.materialId ? scene.materials[o.materialId] : null;
    if (mat) out += `usemtl ${mat.name}\n`;
    const verts: number[] = [];
    const norms: number[] = [];
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j) * o.transform.scale[0] + o.transform.position[0];
      const y = pos.getY(j) * o.transform.scale[1] + o.transform.position[1];
      const z = pos.getZ(j) * o.transform.scale[2] + o.transform.position[2];
      verts.push(x, y, z);
      out += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
    }
    if (norm) {
      for (let j = 0; j < norm.count; j++) {
        const nx = norm.getX(j);
        const ny = norm.getY(j);
        const nz = norm.getZ(j);
        norms.push(nx, ny, nz);
        out += `vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
      }
    }
    if (idx) {
      for (let j = 0; j < idx.count; j += 3) {
        const a = idx.getX(j) + vcount;
        const b = idx.getX(j + 1) + vcount;
        const c = idx.getX(j + 2) + vcount;
        out += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
      }
    } else {
      for (let j = 0; j < pos.count; j += 3) {
        const a = j + vcount, b = j + 1 + vcount, c = j + 2 + vcount;
        out += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
      }
    }
    vcount += pos.count;
    void verts;
  }
  return out;
}

// ---- STL export (ASCII) ----
export function exportSTL(scene: SceneState): string {
  let out = `solid kandler\n`;
  for (const id of Object.keys(scene.objects)) {
    const o = scene.objects[id];
    if (o.kind !== "mesh" || !o.geometry) continue;
    const geo = applyModifiers(buildGeometry(o.geometry), o.modifiers, scene.objects);
    const pos = geo.attributes.position;
    const idx = geo.index;
    const norm = geo.attributes.normal;
    const makeTri = (a: number, b: number, c: number) => {
      const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
      const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
      const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);
      const ex = bx - ax, ey = by - ay, ez = bz - az;
      const fx = cx - ax, fy = cy - ay, fz = cz - az;
      let nx = ey * fz - ez * fy;
      let ny = ez * fx - ex * fz;
      let nz = ex * fy - ey * fx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      out += `  facet normal ${nx} ${ny} ${nz}\n    outer loop\n`;
      out += `      vertex ${ax} ${ay} ${az}\n`;
      out += `      vertex ${bx} ${by} ${bz}\n`;
      out += `      vertex ${cx} ${cy} ${cz}\n`;
      out += `    endloop\n  endfacet\n`;
      void norm;
    };
    if (idx) {
      for (let j = 0; j < idx.count; j += 3) makeTri(idx.getX(j), idx.getX(j + 1), idx.getX(j + 2));
    } else {
      for (let j = 0; j < pos.count; j += 3) makeTri(j, j + 1, j + 2);
    }
  }
  out += `endsolid kandler\n`;
  return out;
}

// ---- Kandler native .kndl save ----
export function exportKandler(scene: SceneState): string {
  return JSON.stringify({
    metadata: { generator: "Kandler 3D Editor", version: 1, format: "kandler" },
    scene,
  }, null, 2);
}

function arr(v: number[]): number[] {
  return v.slice();
}
