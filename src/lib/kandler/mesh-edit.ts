/**
 * Kandler — Edit Mode Mesh Operations (proper implementations)
 * Made by Kantasu.
 */
interface Vec3 { x: number; y: number; z: number; }
interface Face { indices: number[]; materialIndex: number; }
interface MeshData { vertices: Vec3[]; edges: any[]; faces: Face[]; }
function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }
function vSub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function vCross(a: Vec3, b: Vec3): Vec3 { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function vNorm(a: Vec3): Vec3 { const l = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z) || 1; return { x: a.x/l, y: a.y/l, z: a.z/l }; }
function vLerp(a: Vec3, b: Vec3, t: number): Vec3 { return { x: a.x*(1-t)+b.x*t, y: a.y*(1-t)+b.y*t, z: a.z*(1-t)+b.z*t }; }

function faceNormal(verts: Vec3[], face: Face): Vec3 {
  if (face.indices.length < 3) return { x: 0, y: 0, z: 1 };
  const a = verts[face.indices[0]], b = verts[face.indices[1]], c = verts[face.indices[2]];
  return vNorm(vCross(vSub(b, a), vSub(c, a)));
}
function faceCenter(verts: Vec3[], face: Face): Vec3 {
  let cx = 0, cy = 0, cz = 0;
  for (const i of face.indices) { cx += verts[i].x; cy += verts[i].y; cz += verts[i].z; }
  return { x: cx/face.indices.length, y: cy/face.indices.length, z: cz/face.indices.length };
}

export function extrudeFaces(mesh: MeshData, faceIndices: number[], distance: number = 0.5): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const face = result.faces[fIdx];
    if (!face || face.indices.length < 3) continue;
    const n = faceNormal(result.vertices, face);
    const startV = result.vertices.length;
    for (const vi of face.indices) {
      const v = result.vertices[vi];
      result.vertices.push({ x: v.x + n.x * distance, y: v.y + n.y * distance, z: v.z + n.z * distance });
    }
    newFaces.push({ indices: face.indices.map((_, i) => startV + i), materialIndex: face.materialIndex });
    for (let i = 0; i < face.indices.length; i++) {
      newFaces.push({ indices: [face.indices[i], face.indices[(i+1)%face.indices.length], startV+((i+1)%face.indices.length), startV+i], materialIndex: face.materialIndex });
    }
  }
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}

export function insetFaces(mesh: MeshData, faceIndices: number[], amount: number = 0.3): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const face = result.faces[fIdx];
    if (!face || face.indices.length < 3) continue;
    const center = faceCenter(result.vertices, face);
    const startV = result.vertices.length;
    for (const vi of face.indices) {
      const v = result.vertices[vi];
      result.vertices.push(vLerp(v, center, amount));
    }
    newFaces.push({ indices: face.indices.map((_, i) => startV + i), materialIndex: face.materialIndex });
    for (let i = 0; i < face.indices.length; i++) {
      newFaces.push({ indices: [face.indices[i], face.indices[(i+1)%face.indices.length], startV+((i+1)%face.indices.length), startV+i], materialIndex: face.materialIndex });
    }
  }
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}

export function subdivide(mesh: MeshData, _cuts: number = 1): MeshData {
  const verts = mesh.vertices.map(v => ({ ...v }));
  const newFaces: Face[] = [];
  for (const face of mesh.faces) {
    if (face.indices.length === 4) {
      const [a,b,c,d] = face.indices.map(i => verts[i]);
      const ab = {x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2};
      const bc = {x:(b.x+c.x)/2,y:(b.y+c.y)/2,z:(b.z+c.z)/2};
      const cd = {x:(c.x+d.x)/2,y:(c.y+d.y)/2,z:(c.z+d.z)/2};
      const da = {x:(d.x+a.x)/2,y:(d.y+a.y)/2,z:(d.z+a.z)/2};
      const center = {x:(a.x+b.x+c.x+d.x)/4,y:(a.y+b.y+c.y+d.y)/4,z:(a.z+b.z+c.z+d.z)/4};
      verts.push(ab,bc,cd,da,center);
      const iab=verts.length-5,ibc=verts.length-4,icd=verts.length-3,ida=verts.length-2,ic=verts.length-1;
      newFaces.push({indices:[face.indices[0],iab,ic,ida],materialIndex:face.materialIndex});
      newFaces.push({indices:[face.indices[1],ibc,ic,iab],materialIndex:face.materialIndex});
      newFaces.push({indices:[face.indices[2],icd,ic,ibc],materialIndex:face.materialIndex});
      newFaces.push({indices:[face.indices[3],ida,ic,icd],materialIndex:face.materialIndex});
    } else if (face.indices.length === 3) {
      const [a,b,c] = face.indices.map(i => verts[i]);
      const ab={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2};
      const bc={x:(b.x+c.x)/2,y:(b.y+c.y)/2,z:(b.z+c.z)/2};
      const ca={x:(c.x+a.x)/2,y:(c.y+a.y)/2,z:(c.z+a.z)/2};
      verts.push(ab,bc,ca);
      const iab=verts.length-3,ibc=verts.length-2,ica=verts.length-1;
      newFaces.push({indices:[face.indices[0],iab,ica],materialIndex:face.materialIndex});
      newFaces.push({indices:[face.indices[1],ibc,iab],materialIndex:face.materialIndex});
      newFaces.push({indices:[face.indices[2],ica,ibc],materialIndex:face.materialIndex});
      newFaces.push({indices:[iab,ibc,ica],materialIndex:face.materialIndex});
    } else { newFaces.push(face); }
  }
  return { vertices: verts, edges: [], faces: newFaces };
}

export function mergeVertices(mesh: MeshData, vertIndices: number[]): MeshData {
  if (vertIndices.length < 2) return mesh;
  const result = clone(mesh);
  let cx=0,cy=0,cz=0;
  for (const vi of vertIndices) { cx+=result.vertices[vi].x; cy+=result.vertices[vi].y; cz+=result.vertices[vi].z; }
  cx/=vertIndices.length; cy/=vertIndices.length; cz/=vertIndices.length;
  const firstIdx = vertIndices[0];
  result.vertices[firstIdx] = { x: cx, y: cy, z: cz };
  const remap: Record<number, number> = {};
  for (const vi of vertIndices.slice(1)) remap[vi] = firstIdx;
  const remove = new Set(vertIndices.slice(1));
  result.vertices = result.vertices.filter((_, i) => !remove.has(i));
  const indexMap: number[] = [];
  let counter = 0;
  for (let i = 0; i < mesh.vertices.length; i++) {
    if (remove.has(i)) indexMap[i] = -1; else indexMap[i] = counter++;
  }
  result.faces = result.faces.map(f => ({
    indices: f.indices.map(i => { const r = remap[i]!==undefined ? remap[i] : i; return indexMap[r]!==undefined ? indexMap[r] : r; }).filter(i => i >= 0),
    materialIndex: f.materialIndex,
  })).filter(f => f.indices.length >= 3);
  return result;
}

export function fillFaces(mesh: MeshData, vertIndices: number[]): MeshData {
  if (vertIndices.length < 3) return mesh;
  const result = clone(mesh);
  result.faces.push({ indices: [...vertIndices], materialIndex: 0 });
  return result;
}

export function deleteVertices(mesh: MeshData, vertIndices: number[]): MeshData {
  const result = clone(mesh);
  const remove = new Set(vertIndices);
  result.vertices = result.vertices.filter((_, i) => !remove.has(i));
  const indexMap: number[] = [];
  let counter = 0;
  for (let i = 0; i < mesh.vertices.length; i++) { if (remove.has(i)) indexMap[i] = -1; else indexMap[i] = counter++; }
  result.faces = result.faces.map(f => ({ indices: f.indices.map(i => indexMap[i]).filter(i => i >= 0), materialIndex: f.materialIndex })).filter(f => f.indices.length >= 3);
  return result;
}

export function deleteFaces(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  const used = new Set<number>();
  for (const f of result.faces) for (const i of f.indices) used.add(i);
  const indexMap: number[] = [];
  let counter = 0;
  const newVerts: Vec3[] = [];
  for (let i = 0; i < result.vertices.length; i++) { if (used.has(i)) { indexMap[i] = counter++; newVerts.push(result.vertices[i]); } else indexMap[i] = -1; }
  result.vertices = newVerts;
  result.faces = result.faces.map(f => ({ indices: f.indices.map(i => indexMap[i]).filter(i => i >= 0), materialIndex: f.materialIndex })).filter(f => f.indices.length >= 3);
  return result;
}

export function flipNormals(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  for (const fIdx of faceIndices) { if (result.faces[fIdx]) result.faces[fIdx].indices.reverse(); }
  return result;
}

export function triangulateFaces(mesh: MeshData, faceIndices: number[]): MeshData {
  const result = clone(mesh);
  const newFaces: Face[] = [];
  for (const fIdx of faceIndices) {
    const face = result.faces[fIdx]; if (!face) continue;
    for (let i = 1; i < face.indices.length - 1; i++) newFaces.push({ indices: [face.indices[0], face.indices[i], face.indices[i+1]], materialIndex: face.materialIndex });
  }
  result.faces = result.faces.filter((_, i) => !faceIndices.includes(i));
  result.faces.push(...newFaces);
  return result;
}
