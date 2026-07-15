// Kandler Import Library — GLB, GLTF, OBJ, STL, PLY, FBX import with full geometry.
import * as THREE from "three";
import { GLTFLoader, OBJLoader, STLLoader, PLYLoader } from "three-stdlib";

export interface ImportedMesh {
  name: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  children?: ImportedMesh[];
}

export interface ImportResult {
  meshes: ImportedMesh[];
  animations: any[];
  images: any[];
  materials: THREE.Material[];
}

export async function importGLBFile(buffer: ArrayBuffer): Promise<ImportResult> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(buffer, "", (gltf) => {
      const meshes: ImportedMesh[] = [];
      const materials: THREE.Material[] = [];
      gltf.scene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const pos = mesh.position;
          const euler = new THREE.Euler().setFromQuaternion(mesh.quaternion);
          const scl = mesh.scale;
          meshes.push({
            name: mesh.name || `Imported_${meshes.length + 1}`,
            geometry: mesh.geometry.clone(),
            material: Array.isArray(mesh.material)
              ? mesh.material.map(m => m.clone())
              : mesh.material.clone(),
            position: [pos.x, pos.y, pos.z],
            rotation: [euler.x, euler.y, euler.z],
            scale: [scl.x, scl.y, scl.z],
          });
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => { if (!materials.includes(m)) materials.push(m.clone()); });
        }
      });
      resolve({
        meshes,
        animations: gltf.animations || [],
        images: [],
        materials,
      });
    }, reject);
  });
}

export async function importGLTFFile(json: string | object): Promise<ImportResult> {
  const loader = new GLTFLoader();
  const data = typeof json === "string" ? json : JSON.stringify(json);
  return new Promise((resolve, reject) => {
    loader.parse(data, "", (gltf) => {
      const meshes: ImportedMesh[] = [];
      const materials: THREE.Material[] = [];
      gltf.scene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const pos = mesh.position;
          const euler = new THREE.Euler().setFromQuaternion(mesh.quaternion);
          const scl = mesh.scale;
          meshes.push({
            name: mesh.name || `Imported_${meshes.length + 1}`,
            geometry: mesh.geometry.clone(),
            material: Array.isArray(mesh.material)
              ? mesh.material.map(m => m.clone())
              : mesh.material.clone(),
            position: [pos.x, pos.y, pos.z],
            rotation: [euler.x, euler.y, euler.z],
            scale: [scl.x, scl.y, scl.z],
          });
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => { if (!materials.includes(m)) materials.push(m.clone()); });
        }
      });
      resolve({ meshes, animations: gltf.animations || [], images: [], materials });
    }, reject);
  });
}

export function importSTLFile(buffer: ArrayBuffer): ImportResult {
  const loader = new STLLoader();
  const geo = loader.parse(buffer);
  geo.computeVertexNormals();
  return {
    meshes: [{
      name: "STL_Import",
      geometry: geo,
      material: new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }],
    animations: [],
    images: [],
    materials: [],
  };
}

export function importPLYFile(buffer: ArrayBuffer): ImportResult {
  const loader = new PLYLoader();
  const geo = loader.parse(buffer);
  geo.computeVertexNormals();
  return {
    meshes: [{
      name: "PLY_Import",
      geometry: geo,
      material: new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        vertexColors: geo.attributes.color !== undefined,
      }),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }],
    animations: [],
    images: [],
    materials: [],
  };
}

export function importOBJFile(text: string): ImportResult {
  const loader = new OBJLoader();
  const group = loader.parse(text);
  const meshes: ImportedMesh[] = [];
  const materials: THREE.Material[] = [];
  group.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      meshes.push({
        name: mesh.name || `OBJ_${meshes.length + 1}`,
        geometry: mesh.geometry.clone(),
        material: mesh.material
          ? (Array.isArray(mesh.material) ? mesh.material.map(m => m.clone()) : mesh.material.clone())
          : new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }),
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      });
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(m => { if (!materials.includes(m)) materials.push(m.clone()); });
      }
    }
  });
  return { meshes, animations: [], images: [], materials };
}

export function importSTLASCII(text: string): ImportResult {
  const geo = parseSTLASCII(text);
  geo.computeVertexNormals();
  return {
    meshes: [{
      name: "STL_ASCII_Import",
      geometry: geo,
      material: new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }],
    animations: [],
    images: [],
    materials: [],
  };
}

function parseSTLASCII(text: string): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const lines = text.split("\n");
  let vertCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("vertex")) {
      const parts = line.split(/\s+/);
      positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      vertCount++;
      if (vertCount % 3 === 0) {
        indices.push(vertCount - 3, vertCount - 2, vertCount - 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

export function importPLYASCII(text: string): ImportResult {
  const geo = parsePLYASCII(text);
  geo.computeVertexNormals();
  return {
    meshes: [{
      name: "PLY_ASCII_Import",
      geometry: geo,
      material: new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }],
    animations: [],
    images: [],
    materials: [],
  };
}

function parsePLYASCII(text: string): THREE.BufferGeometry {
  const lines = text.split("\n");
  let headerEnd = 0;
  let vertexCount = 0;
  let faceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("element vertex")) vertexCount = parseInt(line.split(/\s+/)[2]);
    if (line.startsWith("element face")) faceCount = parseInt(line.split(/\s+/)[2]);
    if (line === "end_header") { headerEnd = i + 1; break; }
  }
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = headerEnd; i < headerEnd + vertexCount && i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
  }
  for (let i = headerEnd + vertexCount; i < headerEnd + vertexCount + faceCount && i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    const count = parseInt(parts[0]);
    for (let j = 0; j < count - 2; j++) {
      indices.push(parseInt(parts[1]), parseInt(parts[j + 2]), parseInt(parts[j + 3]));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

export function importOBJASCII(text: string): ImportResult {
  return importOBJFile(text);
}

export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();
  switch (ext) {
    case "glb": return await importGLBFile(buffer);
    case "gltf": {
      const text = new TextDecoder().decode(buffer);
      return await importGLTFFile(text);
    }
    case "stl": {
      const isBinary = buffer.byteLength > 84 && new Uint8Array(buffer, 80, 4)[0] !== 0;
      if (isBinary) return importSTLFile(buffer);
      else return importSTLASCII(new TextDecoder().decode(buffer));
    }
    case "ply": {
      const text = new TextDecoder().decode(buffer);
      if (text.trimStart().startsWith("ply")) return importPLYASCII(text);
      return importPLYFile(buffer);
    }
    case "obj": return importOBJFile(new TextDecoder().decode(buffer));
    default: throw new Error(`Unsupported file format: .${ext}`);
  }
}

export function getSupportedImportFormats(): string[] {
  return [".glb", ".gltf", ".stl", ".ply", ".obj"];
}

export function getImportFormatDescription(ext: string): string {
  switch (ext.toLowerCase()) {
    case "glb": return "Binary glTF 2.0 — recommended for web";
    case "gltf": return "glTF 2.0 JSON — human-readable";
    case "stl": return "STL — 3D printing format";
    case "ply": return "PLY — Stanford Polygon Library";
    case "obj": return "Wavefront OBJ — widely supported";
    default: return "Unknown format";
  }
}
