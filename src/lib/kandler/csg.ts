/**
 * Kandler — CSG Boolean Operations (simplified)
 * Made by Kantasu.
 */
interface Vec3 { x: number; y: number; z: number; }
function meshToPolys(mesh: any): any[] {
  const polys: any[] = [];
  for (const face of mesh.faces) {
    for (let i = 1; i < face.indices.length - 1; i++) {
      polys.push({ vertices: [mesh.vertices[face.indices[0]], mesh.vertices[face.indices[i]], mesh.vertices[face.indices[i+1]]], materialIndex: face.materialIndex });
    }
  }
  return polys;
}
function pointInMesh(point: Vec3, polys: any[]): boolean {
  let count = 0; const EPS = 1e-6;
  for (const poly of polys) {
    if (poly.vertices.length < 3) continue;
    const a = poly.vertices[0], b = poly.vertices[1], c = poly.vertices[2];
    const e1 = {x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
    const e2 = {x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
    const h = {x:1*e2.z-0*e2.y,y:0*e2.x-1*e2.z,z:1*e2.y-0*e2.x};
    const det = e1.x*h.x+e1.y*h.y+e1.z*h.z;
    if (det > -EPS && det < EPS) continue;
    const f = 1/det;
    const s = {x:point.x-a.x,y:point.y-a.y,z:point.z-a.z};
    const u = f*(s.x*h.x+s.y*h.y+s.z*h.z);
    if (u < 0 || u > 1) continue;
    const q = {x:s.y*e1.z-s.z*e1.y,y:s.z*e1.x-s.x*e1.z,z:s.x*e1.y-s.y*e1.x};
    const v = f*(0*q.x+1*q.y+0*q.z);
    if (v < 0 || u+v > 1) continue;
    const t = f*(e2.x*q.x+e2.y*q.y+e2.z*q.z);
    if (t > EPS) count++;
  }
  return count % 2 === 1;
}
function polysToMesh(polys: any[]): any {
  const vertMap = new Map<string, number>();
  const vertices: Vec3[] = [];
  const faces: any[] = [];
  for (const poly of polys) {
    const indices: number[] = [];
    for (const v of poly.vertices) {
      const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
      let idx = vertMap.get(key);
      if (idx === undefined) { idx = vertices.length; vertices.push({x:v.x,y:v.y,z:v.z}); vertMap.set(key, idx); }
      indices.push(idx);
    }
    faces.push({ indices, materialIndex: poly.materialIndex });
  }
  return { vertices, edges: [], faces };
}
export function csgBoolean(a: any, b: any, operation: "union"|"difference"|"intersect"): any {
  const polysA = meshToPolys(a);
  const polysB = meshToPolys(b);
  const insideA = polysA.filter(p => { const c = {x:0,y:0,z:0}; for (const v of p.vertices) {c.x+=v.x;c.y+=v.y;c.z+=v.z;} c.x/=3;c.y/=3;c.z/=3; return pointInMesh(c, polysB); });
  const outsideA = polysA.filter(p => { const c = {x:0,y:0,z:0}; for (const v of p.vertices) {c.x+=v.x;c.y+=v.y;c.z+=v.z;} c.x/=3;c.y/=3;c.z/=3; return !pointInMesh(c, polysB); });
  const outsideB = polysB.filter(p => { const c = {x:0,y:0,z:0}; for (const v of p.vertices) {c.x+=v.x;c.y+=v.y;c.z+=v.z;} c.x/=3;c.y/=3;c.z/=3; return !pointInMesh(c, polysA); });
  const insideB = polysB.filter(p => { const c = {x:0,y:0,z:0}; for (const v of p.vertices) {c.x+=v.x;c.y+=v.y;c.z+=v.z;} c.x/=3;c.y/=3;c.z/=3; return pointInMesh(c, polysA); });
  let result: any[] = [];
  if (operation === "union") result = [...outsideA, ...outsideB];
  else if (operation === "difference") result = [...outsideA];
  else if (operation === "intersect") result = [...insideA, ...insideB];
  return polysToMesh(result);
}
export function computeSmoothNormals(mesh: any): Vec3[] {
  const normals: Vec3[] = mesh.vertices.map(() => ({x:0,y:0,z:0}));
  for (const face of mesh.faces) {
    if (face.indices.length < 3) continue;
    const a = mesh.vertices[face.indices[0]], b = mesh.vertices[face.indices[1]], c = mesh.vertices[face.indices[2]];
    const ab = {x:b.x-a.x,y:b.y-a.y,z:b.z-a.z}, ac = {x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
    const n = {x:ab.y*ac.z-ab.z*ac.y,y:ab.z*ac.x-ab.x*ac.z,z:ab.x*ac.y-ab.y*ac.x};
    for (const idx of face.indices) { normals[idx].x+=n.x; normals[idx].y+=n.y; normals[idx].z+=n.z; }
  }
  return normals.map(n => { const l = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z)||1; return {x:n.x/l,y:n.y/l,z:n.z/l}; });
}
