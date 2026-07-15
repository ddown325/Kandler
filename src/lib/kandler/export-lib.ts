// Kandler Export Library — GLTF, GLB, OBJ, STL, PLY, Collada, X3D, VRML, 3MF, Three.js JSON, Kandler native.
import * as THREE from "three";
import type { SceneState, SceneObject } from "./types";
import { buildGeometry } from "./three-engine";
import { applyModifiers } from "./modifiers-v2";

function getSceneGeometry(scene: SceneState): { o: SceneObject; geo: THREE.BufferGeometry }[] {
  const result: { o: SceneObject; geo: THREE.BufferGeometry }[] = [];
  for (const id of Object.keys(scene.objects)) {
    const o = scene.objects[id];
    if (o.kind !== "mesh" || !o.geometry) continue;
    const geo = applyModifiers(buildGeometry(o.geometry), o.modifiers ?? [], scene.objects, () => null);
    result.push({ o, geo });
  }
  return result;
}

export function exportGLTF(scene: SceneState, embed: boolean = true): string {
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const buffers: any[] = [];
  const meshes: any[] = [];
  const nodes: any[] = [];
  const materials: any[] = [];
  let bufferData: number[] = [];
  let byteOffset = 0;

  function addBufferView(data: number[], target: number): number {
    bufferViews.push({ buffer: 0, byteOffset, byteLength: data.length * 4, target });
    const arr = new Float32Array(data);
    for (let i = 0; i < arr.length; i++) bufferData.push(arr[i]);
    byteOffset += data.length * 4;
    return bufferViews.length - 1;
  }
  function addAccessor(data: number[], view: number, type: string): number {
    accessors.push({ bufferView: view, componentType: 5126, count: data.length / (type === "VEC3" ? 3 : 1), type });
    return accessors.length - 1;
  }

  const matIndex = new Map<string, number>();
  let mi = 0;
  for (const matId of Object.keys(scene.materials)) {
    const m = scene.materials[matId];
    matIndex.set(matId, mi);
    materials.push({
      name: m.name,
      pbrMetallicRoughness: { baseColorFactor: [...m.color, m.opacity], metallicFactor: m.metalness ?? 0, roughnessFactor: m.roughness ?? 0.5 },
      emissiveFactor: (m.emissive ?? [0, 0, 0]).map((v: number) => v * (m.emissiveIntensity ?? 0)),
      alphaMode: m.transparent ? "BLEND" : "OPAQUE",
      doubleSided: m.doubleSided ?? false,
    });
    mi++;
  }

  const geos = getSceneGeometry(scene);
  let nodeIdx = 0;
  let meshIdx = 0;
  for (const { o, geo } of geos) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const idx = geo.index;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j < pos.count; j++) positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    if (norm) for (let j = 0; j < norm.count; j++) normals.push(norm.getX(j), norm.getY(j), norm.getZ(j));
    if (idx) for (let j = 0; j < idx.count; j++) indices.push(idx.getX(j));
    const posView = addBufferView(positions, 34962);
    const normView = addBufferView(normals, 34962);
    const idxView = addBufferView(indices, 34963);
    const posAcc = addAccessor(positions, posView, "VEC3");
    const normAcc = addAccessor(normals, normView, "VEC3");
    const idxAcc = accessors.length;
    accessors.push({ bufferView: idxView, componentType: 5125, count: indices.length, type: "SCALAR" });
    meshes.push({
      name: o.name,
      primitives: [{ attributes: { POSITION: posAcc, NORMAL: normAcc }, indices: idxAcc, material: o.materialId ? matIndex.get(o.materialId) : undefined }],
    });
    const t = o.transform;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(t.rotation[0], t.rotation[1], t.rotation[2]));
    nodes.push({ name: o.name, mesh: meshIdx, translation: t.position, rotation: [q.x, q.y, q.z, q.w], scale: t.scale });
    meshIdx++; nodeIdx++;
  }

  buffers.push({ byteLength: bufferData.length * 4 });
  if (embed) {
    const bin = new Uint8Array(new Float32Array(bufferData).buffer);
    let binary = "";
    for (let i = 0; i < bin.length; i++) binary += String.fromCharCode(bin[i]);
    buffers[0].uri = "data:application/octet-stream;base64," + btoa(binary);
  }

  return JSON.stringify({
    asset: { version: "2.0", generator: "Kandler 3D Editor by KANTASU", copyright: "KANTASU" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes, meshes, accessors, bufferViews, buffers, materials,
  }, null, 2);
}

export function exportOBJ(scene: SceneState): string {
  let out = `# Kandler 3D Editor export\n# Created by KANTASU\n# https://ddown325.github.io/Kandler/\n\n`;
  let vcount = 1;
  for (const { o, geo } of getSceneGeometry(scene)) {
    out += `o ${o.name}\n`;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const idx = geo.index;
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j) * o.transform.scale[0] + o.transform.position[0];
      const y = pos.getY(j) * o.transform.scale[1] + o.transform.position[1];
      const z = pos.getZ(j) * o.transform.scale[2] + o.transform.position[2];
      out += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
    }
    if (norm) {
      for (let j = 0; j < norm.count; j++) out += `vn ${norm.getX(j).toFixed(6)} ${norm.getY(j).toFixed(6)} ${norm.getZ(j).toFixed(6)}\n`;
    }
    const mat = o.materialId ? scene.materials[o.materialId] : null;
    if (mat) out += `usemtl ${mat.name}\n`;
    if (idx) {
      for (let j = 0; j < idx.count; j += 3) {
        const a = idx.getX(j) + vcount, b = idx.getX(j + 1) + vcount, c = idx.getX(j + 2) + vcount;
        out += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
      }
    } else {
      for (let j = 0; j < pos.count; j += 3) {
        const a = j + vcount, b = j + 1 + vcount, c = j + 2 + vcount;
        out += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
      }
    }
    vcount += pos.count;
  }
  out += `\n# Material library\n`;
  for (const mat of Object.values(scene.materials)) {
    out += `newmtl ${mat.name}\n`;
    out += `Kd ${mat.color[0].toFixed(4)} ${mat.color[1].toFixed(4)} ${mat.color[2].toFixed(4)}\n`;
    out += `Ka 0.0000 0.0000 0.0000\n`;
    if (mat.type === "pbr") { out += `Pr ${mat.roughness.toFixed(4)}\n`; out += `Pm ${mat.metalness.toFixed(4)}\n`; }
    if (mat.emissive && (mat.emissive[0] > 0 || mat.emissive[1] > 0 || mat.emissive[2] > 0))
      out += `Ke ${mat.emissive[0].toFixed(4)} ${mat.emissive[1].toFixed(4)} ${mat.emissive[2].toFixed(4)}\n`;
    out += `d ${mat.opacity.toFixed(4)}\nillum 2\n\n`;
  }
  return out;
}

export function exportSTLBinary(scene: SceneState): ArrayBuffer {
  let triCount = 0;
  const geos = getSceneGeometry(scene);
  for (const { geo } of geos) {
    const idx = geo.index;
    triCount += (idx ? idx.count : geo.attributes.position.count) / 3;
  }
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  const header = "Kandler STL Export by KANTASU";
  for (let i = 0; i < 80; i++) view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  view.setUint32(80, triCount, true);
  let offset = 84;
  for (const { geo, o } of geos) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    const count = idx ? idx.count : pos.count;
    for (let i = 0; i < count; i += 3) {
      const a = idx ? idx.getX(i) : i;
      const b = idx ? idx.getX(i + 1) : i + 1;
      const c = idx ? idx.getX(i + 2) : i + 2;
      const ax = pos.getX(a) * o.transform.scale[0] + o.transform.position[0];
      const ay = pos.getY(a) * o.transform.scale[1] + o.transform.position[1];
      const az = pos.getZ(a) * o.transform.scale[2] + o.transform.position[2];
      const bx = pos.getX(b) * o.transform.scale[0] + o.transform.position[0];
      const by = pos.getY(b) * o.transform.scale[1] + o.transform.position[1];
      const bz = pos.getZ(b) * o.transform.scale[2] + o.transform.position[2];
      const cx = pos.getX(c) * o.transform.scale[0] + o.transform.position[0];
      const cy = pos.getY(c) * o.transform.scale[1] + o.transform.position[1];
      const cz = pos.getZ(c) * o.transform.scale[2] + o.transform.position[2];
      const ex = bx - ax, ey = by - ay, ez = bz - az;
      const fx = cx - ax, fy = cy - ay, fz = cz - az;
      let nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      view.setFloat32(offset, nx, true); view.setFloat32(offset + 4, ny, true); view.setFloat32(offset + 8, nz, true); offset += 12;
      view.setFloat32(offset, ax, true); view.setFloat32(offset + 4, ay, true); view.setFloat32(offset + 8, az, true); offset += 12;
      view.setFloat32(offset, bx, true); view.setFloat32(offset + 4, by, true); view.setFloat32(offset + 8, bz, true); offset += 12;
      view.setFloat32(offset, cx, true); view.setFloat32(offset + 4, cy, true); view.setFloat32(offset + 8, cz, true); offset += 12;
      view.setUint16(offset, 0, true); offset += 2;
    }
  }
  return buffer;
}

export function exportSTLASCII(scene: SceneState): string {
  let out = `solid kandler\n`;
  for (const { geo, o } of getSceneGeometry(scene)) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    const count = idx ? idx.count : pos.count;
    for (let i = 0; i < count; i += 3) {
      const a = idx ? idx.getX(i) : i;
      const b = idx ? idx.getX(i + 1) : i + 1;
      const c = idx ? idx.getX(i + 2) : i + 2;
      const ax = pos.getX(a) * o.transform.scale[0] + o.transform.position[0];
      const ay = pos.getY(a) * o.transform.scale[1] + o.transform.position[1];
      const az = pos.getZ(a) * o.transform.scale[2] + o.transform.position[2];
      const bx = pos.getX(b) * o.transform.scale[0] + o.transform.position[0];
      const by = pos.getY(b) * o.transform.scale[1] + o.transform.position[1];
      const bz = pos.getZ(b) * o.transform.scale[2] + o.transform.position[2];
      const cx = pos.getX(c) * o.transform.scale[0] + o.transform.position[0];
      const cy = pos.getY(c) * o.transform.scale[1] + o.transform.position[1];
      const cz = pos.getZ(c) * o.transform.scale[2] + o.transform.position[2];
      const ex = bx - ax, ey = by - ay, ez = bz - az;
      const fx = cx - ax, fy = cy - ay, fz = cz - az;
      let nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      out += `  facet normal ${nx} ${ny} ${nz}\n    outer loop\n`;
      out += `      vertex ${ax} ${ay} ${az}\n`;
      out += `      vertex ${bx} ${by} ${bz}\n`;
      out += `      vertex ${cx} ${cy} ${cz}\n`;
      out += `    endloop\n  endfacet\n`;
    }
  }
  out += `endsolid kandler\n`;
  return out;
}

export function exportPLY(scene: SceneState): string {
  let vertCount = 0;
  let faceCount = 0;
  const geos = getSceneGeometry(scene);
  for (const { geo } of geos) {
    vertCount += geo.attributes.position.count;
    const idx = geo.index;
    faceCount += (idx ? idx.count : geo.attributes.position.count) / 3;
  }
  let out = `ply\nformat ascii 1.0\nelement vertex ${vertCount}\n`;
  out += `property float x\nproperty float y\nproperty float z\nproperty float nx\nproperty float ny\nproperty float nz\n`;
  out += `element face ${faceCount}\nproperty list uchar int vertex_indices\nend_header\n`;
  let vOffset = 0;
  for (const { geo, o } of geos) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * o.transform.scale[0] + o.transform.position[0];
      const y = pos.getY(i) * o.transform.scale[1] + o.transform.position[1];
      const z = pos.getZ(i) * o.transform.scale[2] + o.transform.position[2];
      const nx = norm ? norm.getX(i) : 0;
      const ny = norm ? norm.getY(i) : 0;
      const nz = norm ? norm.getZ(i) : 0;
      out += `${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)} ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
    }
    const idx = geo.index;
    const count = idx ? idx.count : pos.count;
    for (let i = 0; i < count; i += 3) {
      const a = (idx ? idx.getX(i) : i) + vOffset;
      const b = (idx ? idx.getX(i + 1) : i + 1) + vOffset;
      const c = (idx ? idx.getX(i + 2) : i + 2) + vOffset;
      out += `3 ${a} ${b} ${c}\n`;
    }
    vOffset += pos.count;
  }
  return out;
}

export function exportX3D(scene: SceneState): string {
  let shapes = "";
  for (const { o, geo } of getSceneGeometry(scene)) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j < pos.count; j++) positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    if (idx) for (let j = 0; j < idx.count; j++) indices.push(idx.getX(j));
    else for (let j = 0; j < pos.count; j++) indices.push(j);
    const mat = o.materialId ? scene.materials[o.materialId] : null;
    const color = mat ? mat.color : [0.8, 0.8, 0.8];
    shapes += `
    <Transform translation="${o.transform.position.join(" ")}" scale="${o.transform.scale.join(" ")}">
      <Shape>
        <Appearance><Material diffuseColor="${color[0]} ${color[1]} ${color[2]}" /></Appearance>
        <IndexedFaceSet coordIndex="${indices.join(" ")}">
          <Coordinate point="${positions.join(" ")}" />
        </IndexedFaceSet>
      </Shape>
    </Transform>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<X3D version="3.2" profile="Interchange">
  <head>
    <meta name="title" content="Kandler 3D Export"/>
    <meta name="creator" content="KANTASU"/>
    <meta name="generator" content="Kandler 3D Editor"/>
  </head>
  <Scene>${shapes}</Scene>
</X3D>`;
}

export function exportVRML(scene: SceneState): string {
  let shapes = "";
  for (const { o, geo } of getSceneGeometry(scene)) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j < pos.count; j++) positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    if (idx) for (let j = 0; j < idx.count; j++) indices.push(idx.getX(j));
    else for (let j = 0; j < pos.count; j++) indices.push(j);
    const mat = o.materialId ? scene.materials[o.materialId] : null;
    const color = mat ? mat.color : [0.8, 0.8, 0.8];
    const coordIndex = indices.map((v, j) => j % 3 === 2 ? `${v} -1` : v).join(" ");
    shapes += `
  Transform {
    translation ${o.transform.position.join(" ")}
    scale ${o.transform.scale.join(" ")}
    children [
      Shape {
        appearance Appearance { material Material { diffuseColor ${color[0]} ${color[1]} ${color[2]} } }
        geometry IndexedFaceSet {
          coord Coordinate { point [${positions.join(", ")}] }
          coordIndex [${coordIndex}]
        }
      }
    ]
  }`;
  }
  return `#VRML V2.0 utf8\n# Kandler 3D Editor export by KANTASU\n${shapes}`;
}

export function export3MF(scene: SceneState): string {
  let objects = "";
  let i = 1;
  for (const { o, geo } of getSceneGeometry(scene)) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j < pos.count; j++) positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    if (idx) for (let j = 0; j < idx.count; j++) indices.push(idx.getX(j));
    else for (let j = 0; j < pos.count; j++) indices.push(j);
    let verts = "";
    for (let j = 0; j < positions.length; j += 3) verts += `<vertex x="${positions[j]}" y="${positions[j+1]}" z="${positions[j+2]}"/>`;
    let tris = "";
    for (let j = 0; j < indices.length; j += 3) tris += `<triangle v1="${indices[j]}" v2="${indices[j+1]}" v3="${indices[j+2]}"/>`;
    objects += `<object id="${i}" type="model" name="${o.name}"><mesh><vertices>${verts}</vertices><triangles>${tris}</triangles></mesh></object>`;
    i++;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">Kandler 3D Export</metadata>
  <metadata name="Designer">KANTASU</metadata>
  <metadata name="Application">Kandler 3D Editor</metadata>
  <resources>${objects}</resources>
  <build><item objectid="1"/></build>
</model>`;
}

export function exportThreeJSJSON(scene: SceneState): string {
  const tScene = new THREE.Scene();
  tScene.name = scene.name;
  if (scene.environment.background) tScene.background = new THREE.Color(...scene.environment.background);
  const amb = new THREE.AmbientLight(0xffffff, scene.environment.ambientIntensity);
  tScene.add(amb);
  for (const { o, geo } of getSceneGeometry(scene)) {
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
    mesh.name = o.name;
    mesh.position.set(...o.transform.position);
    mesh.rotation.set(...o.transform.rotation);
    mesh.scale.set(...o.transform.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    tScene.add(mesh);
  }
  const json = tScene.toJSON();
  json.metadata = { ...(json.metadata || {}), generator: "Kandler 3D Editor by KANTASU", kandlerVersion: 1, format: "Three.js ObjectLoader JSON" };
  return JSON.stringify(json, null, 2);
}

export function exportKandler(scene: SceneState): string {
  return JSON.stringify({ metadata: { generator: "Kandler 3D Editor by KANTASU", version: 1, format: "kandler" }, scene }, null, 2);
}

export function downloadText(filename: string, content: string, mime: string = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function downloadBinary(filename: string, data: ArrayBuffer, mime: string = "application/octet-stream"): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
