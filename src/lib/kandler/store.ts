/**
 * Kandler — Global Scene Store (Zustand)
 * Holds the source-of-truth for the entire 3D scene, selection, modes,
 * timeline, modifiers, materials, render settings, and project metadata.
 *
 * Designed to mirror Blender's data hierarchy: Scene → Collections → Objects →
 * (Mesh Data: Vertices/Edges/Faces) + (Object Data: Transform, Modifiers, Materials).
 *
 * Made by Kantasu.
 */
import { create } from "zustand";

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type ObjectKind =
  | "mesh"
  | "light"
  | "camera"
  | "empty"
  | "curve"
  | "text"
  | "armature"
  | "group";

export type PrimitiveType =
  | "cube"
  | "sphere"
  | "cylinder"
  | "cone"
  | "torus"
  | "plane"
  | "circle"
  | "ico-sphere"
  | "uv-sphere"
  | "grid"
  | "tetrahedron"
  | "octahedron"
  | "dodecahedron"
  | "torus-knot";

export type LightType = "point" | "spot" | "sun" | "area";
export type ShadingMode = "wireframe" | "solid" | "material" | "rendered";
export type EditMode = "object" | "edit" | "sculpt" | "uv" | "texture-paint" | "weight-paint" | "vertex-paint" | "pose";
export type ComponentMode = "vertex" | "edge" | "face";
export type PivotMode = "median" | "individual" | "active" | "cursor" | "bounding-box";
export type TransformOrientation = "global" | "local" | "normal" | "view" | "cursor";
export type SnappingMode = "off" | "increment" | "vertex" | "edge" | "face" | "grid" | "volume";

export type ModifierType =
  | "subdivision"
  | "mirror"
  | "array"
  | "solidify"
  | "bevel"
  | "boolean"
  | "decimate"
  | "wireframe"
  | "screw"
  | "simple-deform"
  | "displace"
  | "wave"
  | "build"
  | "remesh";

export interface Modifier {
  id: string;
  type: ModifierType;
  name: string;
  enabled: boolean;
  expanded: boolean;
  params: Record<string, number | string | boolean>;
}

export interface MaterialSlot {
  id: string;
  name: string;
  baseColor: string;
  metallic: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  flatShading: boolean;
  doubleSided: boolean;
  clearcoat: number;
  clearcoatRoughness: number;
  ior: number;
  transmission: number;
  thickness: number;
  textureType: "none" | "checker" | "noise" | "brick" | "gradient";
  textureScale: number;
}

export interface Vertex { x: number; y: number; z: number; }
export interface Face { indices: number[]; materialIndex: number; }
export interface Edge { a: number; b: number; }

export interface MeshData {
  vertices: Vertex[];
  edges: Edge[];
  faces: Face[];
}

export interface LightParams {
  type: LightType;
  color: string;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  width: number;
  height: number;
  castShadow: boolean;
  shadowMapSize: number;
  shadowBias: number;
}

export interface CameraParams {
  fov: number;
  near: number;
  far: number;
  ortho: boolean;
  orthoSize: number;
}

export interface SceneObject {
  id: string;
  name: string;
  kind: ObjectKind;
  primitiveType?: PrimitiveType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  visibleInRender: boolean;
  visibleInViewport: boolean;
  locked: boolean;
  mesh?: MeshData;
  materialSlots: string[];
  activeMaterialIndex: number;
  modifiers: Modifier[];
  light?: LightParams;
  camera?: CameraParams;
  parentId?: string;
  collection?: string;
  displayAsBounds: boolean;
  displayAsWire: boolean;
  vertexCount?: number;
  faceCount?: number;
  // Extended features (optional)
  armature?: import("./types-extended").Armature;
  shapeKeys?: import("./types-extended").ShapeKey[];
  activeShapeKeyIndex?: number;
  physics?: import("./types-extended").PhysicsObject;
  uvMaps?: import("./types-extended").UVMap[];
  shaderGraph?: import("./types-extended").ShaderNodeGraph;
  geoNodeGraph?: import("./types-extended").GeoNodeGraph;
  // Texture paint canvas (per-object)
  textureCanvas?: { width: number; height: number; pixels: number[] }; // RGBA 0-255
}

export interface Collection {
  id: string;
  name: string;
  visible: boolean;
  selectable: boolean;
  color: string;
  objects: string[];
  expanded: boolean;
}

export interface Keyframe {
  frame: number;
  value: number;
  interpolation: "constant" | "linear" | "bezier";
}

export interface AnimationTrack {
  id: string;
  objectId: string;
  property: string;
  keyframes: Keyframe[];
}

export interface RenderSettings {
  engine: "eevee" | "cycles" | "workbench";
  resolutionX: number;
  resolutionY: number;
  samples: number;
  exposure: number;
  ambientColor: string;
  backgroundColor: string;
  fogEnabled: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  shadowEnabled: boolean;
  toneMapping: "none" | "aces" | "reinhard" | "cineon" | "linear";
  bloomEnabled: boolean;
  bloomStrength: number;
  ssaoEnabled: boolean;
}

export interface SceneCursor {
  position: Vec3;
  visible: boolean;
}

export interface ProjectMeta {
  name: string;
  author: string;
  created: number;
  modified: number;
  version: string;
  frameStart: number;
  frameEnd: number;
  fps: number;
  currentFrame: number;
  playing: boolean;
}

export interface SelectionSet {
  objects: string[];
  vertices: number[];
  edges: number[];
  faces: number[];
}

export interface KandlerState {
  project: ProjectMeta;
  objects: Record<string, SceneObject>;
  objectOrder: string[];
  collections: Collection[];
  selection: SelectionSet;
  activeObjectId: string | null;
  editMode: EditMode;
  componentMode: ComponentMode;
  shadingMode: ShadingMode;
  pivotMode: PivotMode;
  transformOrientation: TransformOrientation;
  snappingMode: SnappingMode;
  snapIncrement: number;
  cursor: SceneCursor;
  activeTool: string;
  materials: Record<string, MaterialSlot>;
  tracks: AnimationTrack[];
  render: RenderSettings;
  // Grease Pencil (2D-in-3D drawing)
  gpLayers: import("./types-extended").GPLayer[];
  gpStrokes: import("./types-extended").GPStroke[];
  activeGpLayer: string | null;
  // Physics simulation
  physicsPlaying: boolean;
  physicsTime: number;
  // Scripting console history
  consoleHistory: { type: "input" | "output" | "error"; text: string }[];
  showGrid: boolean;
  showAxes: boolean;
  showStats: boolean;
  showOutline: boolean;
  gizmoSize: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  showOutliner: boolean;
  showProperties: boolean;
  showTimeline: boolean;
  showToolbar: boolean;
  fps: number;
  drawCalls: number;
  history: any[];
  historyIndex: number;
  toast: { message: string; type: "info" | "success" | "warning" | "error" } | null;

  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => string | null;
  updateObject: (id: string, patch: Partial<SceneObject>) => void;
  updateMesh: (id: string, fn: (mesh: MeshData) => MeshData) => void;
  setObjectTransform: (id: string, position?: Vec3, rotation?: Vec3, scale?: Vec3) => void;
  selectObject: (id: string, additive?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
  setActive: (id: string | null) => void;
  setEditMode: (m: EditMode) => void;
  setComponentMode: (m: ComponentMode) => void;
  setShadingMode: (m: ShadingMode) => void;
  setPivotMode: (m: PivotMode) => void;
  setTransformOrientation: (m: TransformOrientation) => void;
  setSnappingMode: (m: SnappingMode) => void;
  setSnapIncrement: (v: number) => void;
  setActiveTool: (t: string) => void;
  setCursor: (p: Vec3) => void;
  addMaterial: (m: MaterialSlot) => void;
  updateMaterial: (id: string, patch: Partial<MaterialSlot>) => void;
  assignMaterialToObject: (objectId: string, materialId: string) => void;
  addModifier: (objectId: string, mod: Modifier) => void;
  updateModifier: (objectId: string, modId: string, patch: Partial<Modifier>) => void;
  removeModifier: (objectId: string, modId: string) => void;
  moveModifier: (objectId: string, modId: string, dir: -1 | 1) => void;
  addCollection: (c: Collection) => void;
  setCurrentFrame: (f: number) => void;
  setPlaying: (p: boolean) => void;
  setFrameRange: (start: number, end: number) => void;
  selectVertex: (idx: number, additive?: boolean) => void;
  selectEdge: (idx: number, additive?: boolean) => void;
  selectFace: (idx: number, additive?: boolean) => void;
  clearComponentSelection: () => void;
  updateRender: (patch: Partial<RenderSettings>) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleStats: () => void;
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  setBottomPanelHeight: (h: number) => void;
  togglePanel: (p: "outliner" | "properties" | "timeline" | "toolbar") => void;
  setFPS: (f: number) => void;
  setDrawCalls: (c: number) => void;
  showToast: (message: string, type?: "info" | "success" | "warning" | "error") => void;
  clearToast: () => void;
  loadScene: (data: any) => void;
  exportScene: () => any;
  exportThreeScene: () => any;
  exportGLTF: () => any;
  exportOBJ: () => any;
  newScene: () => void;
  // Grease Pencil
  addGpLayer: (name: string) => void;
  addGpStroke: (stroke: import("./types-extended").GPStroke) => void;
  clearGpStrokes: () => void;
  setActiveGpLayer: (id: string | null) => void;
  // Physics
  setPhysicsPlaying: (playing: boolean) => void;
  stepPhysics: (dt: number) => void;
  // Console
  pushConsole: (entry: { type: "input" | "output" | "error"; text: string }) => void;
  clearConsole: () => void;
  // Extended object operations
  addShapeKey: (objectId: string, name: string) => void;
  setShapeKeyValue: (objectId: string, keyId: string, value: number) => void;
  addBone: (objectId: string, bone: import("./types-extended").Bone) => void;
  updateBone: (objectId: string, boneId: string, patch: Partial<import("./types-extended").Bone>) => void;
  setShaderGraph: (objectId: string, graph: import("./types-extended").ShaderNodeGraph) => void;
  setGeoNodeGraph: (objectId: string, graph: import("./types-extended").GeoNodeGraph) => void;
  setUvMaps: (objectId: string, maps: import("./types-extended").UVMap[]) => void;
  setTextureCanvas: (objectId: string, canvas: { width: number; height: number; pixels: number[] }) => void;
  paintTextureAt: (objectId: string, u: number, v: number, color: [number, number, number, number], brushSize: number) => void;
}

let _idCounter = 0;
export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`;

// Hex (#rrggbb) → [r, g, b, a] in 0..1 range for GLTF exports
export function hexToRgba(hex: string, alpha = 1): [number, number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [1, 1, 1, alpha];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255, alpha];
}

export const defaultMaterial = (name = "Material"): MaterialSlot => ({
  id: uid("mat"),
  name,
  baseColor: "#b0b0b0",
  metallic: 0,
  roughness: 0.5,
  emissive: "#000000",
  emissiveIntensity: 1,
  opacity: 1,
  transparent: false,
  wireframe: false,
  flatShading: false,
  doubleSided: true,
  clearcoat: 0,
  clearcoatRoughness: 0,
  ior: 1.5,
  transmission: 0,
  thickness: 0,
  textureType: "none",
  textureScale: 1,
});

export function generatePrimitiveMesh(type: PrimitiveType): MeshData {
  switch (type) {
    case "cube": {
      const v: Vertex[] = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
      ];
      // Outward-facing winding (counter-clockwise when viewed from outside)
      const f: Face[] = [
        { indices: [0, 3, 2, 1], materialIndex: 0 }, // back (-Z), normal points -Z
        { indices: [4, 5, 6, 7], materialIndex: 0 }, // front (+Z), normal points +Z
        { indices: [0, 1, 5, 4], materialIndex: 0 }, // bottom (-Y), normal points -Y
        { indices: [3, 7, 6, 2], materialIndex: 0 }, // top (+Y), normal points +Y
        { indices: [0, 4, 7, 3], materialIndex: 0 }, // left (-X), normal points -X
        { indices: [1, 2, 6, 5], materialIndex: 0 }, // right (+X), normal points +X
      ];
      return { vertices: v, edges: [], faces: f };
    }
    case "plane": {
      const v: Vertex[] = [
        { x: -1, y: -1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 },
      ];
      return { vertices: v, edges: [], faces: [{ indices: [0, 1, 2, 3], materialIndex: 0 }] };
    }
    case "circle": {
      const segments = 32;
      const v: Vertex[] = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        v.push({ x: Math.cos(a), y: Math.sin(a), z: 0 });
      }
      const indices: number[] = [];
      for (let i = 0; i < segments; i++) indices.push(i);
      return { vertices: v, edges: [], faces: [{ indices, materialIndex: 0 }] };
    }
    case "grid": {
      const size = 2;
      const div = 10;
      const v: Vertex[] = [];
      for (let i = 0; i <= div; i++) for (let j = 0; j <= div; j++) {
        v.push({ x: -size + (i / div) * size * 2, y: -size + (j / div) * size * 2, z: 0 });
      }
      const f: Face[] = [];
      for (let i = 0; i < div; i++) for (let j = 0; j < div; j++) {
        const a = i * (div + 1) + j;
        const b = a + 1;
        const c = a + (div + 1);
        const d = c + 1;
        f.push({ indices: [a, b, d, c], materialIndex: 0 });
      }
      return { vertices: v, edges: [], faces: f };
    }
    case "uv-sphere":
    case "sphere": {
      const segments = 24, rings = 16;
      const v: Vertex[] = [];
      for (let y = 0; y <= rings; y++) {
        const vRing = (y / rings) * Math.PI;
        for (let x = 0; x <= segments; x++) {
          const u = (x / segments) * Math.PI * 2;
          v.push({
            x: Math.cos(u) * Math.sin(vRing),
            y: Math.cos(vRing),
            z: Math.sin(u) * Math.sin(vRing),
          });
        }
      }
      const f: Face[] = [];
      for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x;
        const b = a + segments + 1;
        f.push({ indices: [a, b, a + 1, b + 1], materialIndex: 0 });
      }
      return { vertices: v, edges: [], faces: f };
    }
    case "ico-sphere": {
      const t = (1 + Math.sqrt(5)) / 2;
      const verts: Vertex[] = [
        { x: -1, y: t, z: 0 }, { x: 1, y: t, z: 0 }, { x: -1, y: -t, z: 0 }, { x: 1, y: -t, z: 0 },
        { x: 0, y: -1, z: t }, { x: 0, y: 1, z: t }, { x: 0, y: -1, z: -t }, { x: 0, y: 1, z: -t },
        { x: t, y: 0, z: -1 }, { x: t, y: 0, z: 1 }, { x: -t, y: 0, z: -1 }, { x: -t, y: 0, z: 1 },
      ].map(p => { const l = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z); return { x: p.x/l, y: p.y/l, z: p.z/l }; });
      const facesIdx: number[][] = [
        [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
        [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
        [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
        [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
      ];
      return { vertices: verts, edges: [], faces: facesIdx.map(i => ({ indices: i, materialIndex: 0 })) };
    }
    case "cylinder": {
      const segments = 24;
      const v: Vertex[] = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        v.push({ x: Math.cos(a), y: -1, z: Math.sin(a) });
      }
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        v.push({ x: Math.cos(a), y: 1, z: Math.sin(a) });
      }
      const f: Face[] = [];
      const bottom: number[] = []; for (let i = 0; i < segments; i++) bottom.push(i); f.push({ indices: bottom, materialIndex: 0 });
      const top: number[] = []; for (let i = 0; i < segments; i++) top.push(segments + i); f.push({ indices: top.reverse(), materialIndex: 0 });
      for (let i = 0; i < segments; i++) {
        const n = (i + 1) % segments;
        f.push({ indices: [i, n, segments + n, segments + i], materialIndex: 0 });
      }
      return { vertices: v, edges: [], faces: f };
    }
    case "cone": {
      const segments = 24;
      const v: Vertex[] = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        v.push({ x: Math.cos(a), y: -1, z: Math.sin(a) });
      }
      v.push({ x: 0, y: 1, z: 0 });
      const f: Face[] = [];
      const bottom: number[] = []; for (let i = 0; i < segments; i++) bottom.push(i); f.push({ indices: bottom, materialIndex: 0 });
      for (let i = 0; i < segments; i++) {
        const n = (i + 1) % segments;
        f.push({ indices: [i, n, segments], materialIndex: 0 });
      }
      return { vertices: v, edges: [], faces: f };
    }
    case "torus": {
      const segments = 32, sides = 16, R = 1, r = 0.3;
      const v: Vertex[] = [];
      for (let i = 0; i <= segments; i++) {
        const u = (i / segments) * Math.PI * 2;
        for (let j = 0; j <= sides; j++) {
          const vv = (j / sides) * Math.PI * 2;
          v.push({
            x: (R + r * Math.cos(vv)) * Math.cos(u),
            y: r * Math.sin(vv),
            z: (R + r * Math.cos(vv)) * Math.sin(u),
          });
        }
      }
      const f: Face[] = [];
      for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j;
        const b = a + sides + 1;
        f.push({ indices: [a, b, a + 1, b + 1], materialIndex: 0 });
      }
      return { vertices: v, edges: [], faces: f };
    }
    case "torus-knot": {
      const segs = 128, p = 2, q = 3, R = 1, r = 0.3;
      const v: Vertex[] = [];
      for (let i = 0; i <= segs; i++) {
        const u = (i / segs) * Math.PI * 2;
        const cu = Math.cos(p * u), su = Math.sin(p * u);
        const cv = Math.cos(q * u), sv = Math.sin(q * u);
        v.push({
          x: (R + r * cv) * cu,
          y: (R + r * cv) * su,
          z: r * sv,
        });
      }
      const edges: Edge[] = [];
      for (let i = 0; i < segs; i++) edges.push({ a: i, b: i + 1 });
      return { vertices: v, edges, faces: [] };
    }
    case "tetrahedron": {
      const v: Vertex[] = [
        { x: 1, y: 1, z: 1 }, { x: -1, y: -1, z: 1 }, { x: -1, y: 1, z: -1 }, { x: 1, y: -1, z: -1 },
      ];
      const f: Face[] = [
        { indices: [0, 1, 2], materialIndex: 0 }, { indices: [0, 3, 1], materialIndex: 0 },
        { indices: [0, 2, 3], materialIndex: 0 }, { indices: [1, 3, 2], materialIndex: 0 },
      ];
      return { vertices: v, edges: [], faces: f };
    }
    case "octahedron": {
      const v: Vertex[] = [
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
      ];
      const f: Face[] = [
        { indices: [0, 2, 4], materialIndex: 0 }, { indices: [0, 4, 3], materialIndex: 0 },
        { indices: [0, 3, 5], materialIndex: 0 }, { indices: [0, 5, 2], materialIndex: 0 },
        { indices: [1, 4, 2], materialIndex: 0 }, { indices: [1, 3, 4], materialIndex: 0 },
        { indices: [1, 5, 3], materialIndex: 0 }, { indices: [1, 2, 5], materialIndex: 0 },
      ];
      return { vertices: v, edges: [], faces: f };
    }
    case "dodecahedron": {
      // Use icosphere as fallback for stability
      return generatePrimitiveMesh("ico-sphere");
    }
    default:
      return generatePrimitiveMesh("cube");
  }
}

export function countMeshStats(mesh: MeshData): { verts: number; faces: number } {
  return { verts: mesh.vertices.length, faces: mesh.faces.length };
}

const defaultProject: ProjectMeta = {
  name: "Untitled",
  author: "Kantasu",
  created: Date.now(),
  modified: Date.now(),
  version: "1.0.0",
  frameStart: 1,
  frameEnd: 250,
  fps: 24,
  currentFrame: 1,
  playing: false,
};

const defaultRender: RenderSettings = {
  engine: "eevee",
  resolutionX: 1920,
  resolutionY: 1080,
  samples: 64,
  exposure: 1,
  ambientColor: "#404040",
  backgroundColor: "#1a1626",
  fogEnabled: false,
  fogColor: "#1a1626",
  fogNear: 5,
  fogFar: 50,
  shadowEnabled: true,
  toneMapping: "aces",
  bloomEnabled: false,
  bloomStrength: 0.5,
  ssaoEnabled: true,
};

const defaultCube = (): SceneObject => {
  const mesh = generatePrimitiveMesh("cube");
  const mat = defaultMaterial("Material");
  return {
    id: uid("obj"),
    name: "Cube",
    kind: "mesh",
    primitiveType: "cube",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    visibleInRender: true,
    visibleInViewport: true,
    locked: false,
    mesh,
    materialSlots: [mat.id],
    activeMaterialIndex: 0,
    modifiers: [],
    collection: "Scene Collection",
    displayAsBounds: false,
    displayAsWire: false,
    vertexCount: mesh.vertices.length,
    faceCount: mesh.faces.length,
  };
};

const defaultLight = (): SceneObject => {
  const obj = defaultCube();
  obj.id = uid("obj");
  obj.name = "Sun";
  obj.kind = "light";
  obj.position = [5, 5, 5];
  obj.mesh = undefined;
  obj.materialSlots = [];
  obj.light = {
    type: "sun",
    color: "#ffffff",
    intensity: 2,
    distance: 0,
    angle: Math.PI / 6,
    penumbra: 0.2,
    width: 1,
    height: 1,
    castShadow: true,
    shadowMapSize: 1024,
    shadowBias: -0.0005,
  };
  return obj;
};

const defaultCamera = (): SceneObject => {
  const obj = defaultCube();
  obj.id = uid("obj");
  obj.name = "Camera";
  obj.kind = "camera";
  obj.position = [7, -5, 5];
  obj.rotation = [Math.PI / 2, 0, Math.PI / 4];
  obj.mesh = undefined;
  obj.materialSlots = [];
  obj.camera = { fov: 50, near: 0.1, far: 1000, ortho: false, orthoSize: 5 };
  return obj;
};

// Build initial scene
const initCube = defaultCube();
const initLight = defaultLight();
const initCam = defaultCamera();
const initMat = defaultMaterial();
initCube.materialSlots = [initMat.id];

const initObjects: Record<string, SceneObject> = {
  [initCube.id]: initCube,
  [initLight.id]: initLight,
  [initCam.id]: initCam,
};
const initObjectOrder = [initCube.id, initLight.id, initCam.id];
const initMaterials = { [initMat.id]: initMat };
const initCollections: Collection[] = [
  { id: uid("col"), name: "Scene Collection", visible: true, selectable: true, color: "#b388ff", objects: [initCube.id, initLight.id, initCam.id], expanded: true },
];

export const useStore = create<KandlerState>((set, get) => ({
  project: defaultProject,
  objects: initObjects,
  objectOrder: initObjectOrder,
  collections: initCollections,
  selection: { objects: [], vertices: [], edges: [], faces: [] },
  activeObjectId: null,
  editMode: "object",
  componentMode: "vertex",
  shadingMode: "solid",
  pivotMode: "median",
  transformOrientation: "global",
  snappingMode: "off",
  snapIncrement: 0.1,
  cursor: { position: [0, 0, 0], visible: true },
  activeTool: "select",
  materials: initMaterials,
  tracks: [],
  render: defaultRender,
  // Grease Pencil initial layer
  gpLayers: [{ id: uid("gp"), name: "Layer 1", color: "#b388ff", opacity: 1, visible: true, locked: false }],
  gpStrokes: [],
  activeGpLayer: null,
  physicsPlaying: false,
  physicsTime: 0,
  consoleHistory: [],
  showGrid: true,
  showAxes: true,
  showStats: true,
  showOutline: true,
  gizmoSize: 1,
  leftPanelWidth: 260,
  rightPanelWidth: 320,
  bottomPanelHeight: 180,
  showOutliner: true,
  showProperties: true,
  showTimeline: true,
  showToolbar: true,
  fps: 60,
  drawCalls: 0,
  history: [],
  historyIndex: -1,
  toast: null,

  addObject: (obj) => set((s) => {
    const objects = { ...s.objects, [obj.id]: obj };
    const objectOrder = [...(s.objectOrder.length ? s.objectOrder : Object.keys(s.objects)), obj.id];
    const materials = { ...s.materials };
    for (const mId of obj.materialSlots) if (!materials[mId]) materials[mId] = defaultMaterial();
    const collections = s.collections.map(c => c.name === (obj.collection || "Scene Collection")
      ? { ...c, objects: [...c.objects, obj.id] } : c);
    return { objects, objectOrder, materials, collections };
  }),

  removeObject: (id) => set((s) => {
    const objects = { ...s.objects };
    delete objects[id];
    const objectOrder = s.objectOrder.filter(x => x !== id);
    const collections = s.collections.map(c => ({ ...c, objects: c.objects.filter(x => x !== id) }));
    const selection = {
      ...s.selection,
      objects: s.selection.objects.filter(x => x !== id),
    };
    const activeObjectId = s.activeObjectId === id ? null : s.activeObjectId;
    return { objects, objectOrder, collections, selection, activeObjectId };
  }),

  duplicateObject: (id) => {
    const src = get().objects[id];
    if (!src) return null;
    const newId = uid("obj");
    const copy: SceneObject = JSON.parse(JSON.stringify(src));
    copy.id = newId;
    copy.name = src.name + ".001";
    copy.position = [src.position[0] + 1, src.position[1] + 1, src.position[2]];
    get().addObject(copy);
    get().selectObject(newId);
    return newId;
  },

  updateObject: (id, patch) => set((s) => {
    const obj = s.objects[id];
    if (!obj) return {};
    const next = { ...obj, ...patch };
    if (next.mesh) {
      const stats = countMeshStats(next.mesh);
      next.vertexCount = stats.verts;
      next.faceCount = stats.faces;
    }
    return { objects: { ...s.objects, [id]: next } };
  }),

  updateMesh: (id, fn) => set((s) => {
    const obj = s.objects[id];
    if (!obj || !obj.mesh) return {};
    const mesh = fn(obj.mesh);
    const stats = countMeshStats(mesh);
    return {
      objects: {
        ...s.objects,
        [id]: { ...obj, mesh, vertexCount: stats.verts, faceCount: stats.faces },
      },
    };
  }),

  setObjectTransform: (id, position, rotation, scale) => set((s) => {
    const obj = s.objects[id];
    if (!obj) return {};
    return {
      objects: {
        ...s.objects,
        [id]: {
          ...obj,
          position: position ?? obj.position,
          rotation: rotation ?? obj.rotation,
          scale: scale ?? obj.scale,
        },
      },
    };
  }),

  selectObject: (id, additive) => set((s) => {
    if (additive) {
      const has = s.selection.objects.includes(id);
      return {
        selection: {
          ...s.selection,
          objects: has ? s.selection.objects.filter(x => x !== id) : [...s.selection.objects, id],
        },
        activeObjectId: id,
      };
    }
    return {
      selection: { ...s.selection, objects: [id], vertices: [], edges: [], faces: [] },
      activeObjectId: id,
    };
  }),

  selectAll: () => set((s) => ({
    selection: { ...s.selection, objects: Object.keys(s.objects).filter(id => s.objects[id].visible) },
  })),

  deselectAll: () => set((s) => ({
    selection: { objects: [], vertices: [], edges: [], faces: [] },
    activeObjectId: null,
  })),

  invertSelection: () => set((s) => {
    const all = Object.keys(s.objects);
    return { selection: { ...s.selection, objects: all.filter(id => !s.selection.objects.includes(id)) } };
  }),

  setActive: (id) => set({ activeObjectId: id }),

  setEditMode: (m) => set({ editMode: m }),
  setComponentMode: (m) => set({ componentMode: m }),
  setShadingMode: (m) => set({ shadingMode: m }),
  setPivotMode: (m) => set({ pivotMode: m }),
  setTransformOrientation: (m) => set({ transformOrientation: m }),
  setSnappingMode: (m) => set({ snappingMode: m }),
  setSnapIncrement: (v) => set({ snapIncrement: v }),
  setActiveTool: (t) => set({ activeTool: t }),
  setCursor: (p) => set((s) => ({ cursor: { ...s.cursor, position: p } })),

  addMaterial: (m) => set((s) => ({ materials: { ...s.materials, [m.id]: m } })),
  updateMaterial: (id, patch) => set((s) => {
    const m = s.materials[id]; if (!m) return {};
    return { materials: { ...s.materials, [id]: { ...m, ...patch } } };
  }),
  assignMaterialToObject: (objectId, materialId) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    if (obj.materialSlots.includes(materialId)) return {};
    return {
      objects: { ...s.objects, [objectId]: { ...obj, materialSlots: [...obj.materialSlots, materialId] } },
    };
  }),

  addModifier: (objectId, mod) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, modifiers: [...obj.modifiers, mod] } } };
  }),
  updateModifier: (objectId, modId, patch) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return {
      objects: {
        ...s.objects,
        [objectId]: { ...obj, modifiers: obj.modifiers.map(m => m.id === modId ? { ...m, ...patch } : m) },
      },
    };
  }),
  removeModifier: (objectId, modId) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, modifiers: obj.modifiers.filter(m => m.id !== modId) } } };
  }),
  moveModifier: (objectId, modId, dir) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    const idx = obj.modifiers.findIndex(m => m.id === modId);
    if (idx < 0) return {};
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= obj.modifiers.length) return {};
    const mods = [...obj.modifiers];
    [mods[idx], mods[newIdx]] = [mods[newIdx], mods[idx]];
    return { objects: { ...s.objects, [objectId]: { ...obj, modifiers: mods } } };
  }),

  addCollection: (c) => set((s) => ({ collections: [...s.collections, c] })),

  setCurrentFrame: (f) => set((s) => ({ project: { ...s.project, currentFrame: Math.max(s.project.frameStart, Math.min(s.project.frameEnd, f)) } })),
  setPlaying: (p) => set((s) => ({ project: { ...s.project, playing: p } })),
  setFrameRange: (start, end) => set((s) => ({ project: { ...s.project, frameStart: start, frameEnd: end } })),

  selectVertex: (idx, additive) => set((s) => {
    if (additive) {
      const has = s.selection.vertices.includes(idx);
      return { selection: { ...s.selection, vertices: has ? s.selection.vertices.filter(x => x !== idx) : [...s.selection.vertices, idx] } };
    }
    return { selection: { ...s.selection, vertices: [idx] } };
  }),
  selectEdge: (idx, additive) => set((s) => {
    if (additive) {
      const has = s.selection.edges.includes(idx);
      return { selection: { ...s.selection, edges: has ? s.selection.edges.filter(x => x !== idx) : [...s.selection.edges, idx] } };
    }
    return { selection: { ...s.selection, edges: [idx] } };
  }),
  selectFace: (idx, additive) => set((s) => {
    if (additive) {
      const has = s.selection.faces.includes(idx);
      return { selection: { ...s.selection, faces: has ? s.selection.faces.filter(x => x !== idx) : [...s.selection.faces, idx] } };
    }
    return { selection: { ...s.selection, faces: [idx] } };
  }),
  clearComponentSelection: () => set((s) => ({ selection: { ...s.selection, vertices: [], edges: [], faces: [] } })),

  updateRender: (patch) => set((s) => ({ render: { ...s.render, ...patch } })),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),

  pushHistory: (label) => set((s) => {
    const snapshot = {
      objects: JSON.parse(JSON.stringify(s.objects)),
      objectOrder: [...s.objectOrder],
      label,
      ts: Date.now(),
    };
    const truncated = s.history.slice(0, s.historyIndex + 1);
    truncated.push(snapshot);
    return { history: truncated.slice(-50), historyIndex: truncated.length - 1 };
  }),
  undo: () => set((s) => {
    if (s.historyIndex < 0) return {};
    const snap = s.history[s.historyIndex];
    if (!snap) return {};
    return { objects: JSON.parse(JSON.stringify(snap.objects)), objectOrder: [...snap.objectOrder], historyIndex: s.historyIndex - 1 };
  }),
  redo: () => set((s) => {
    if (s.historyIndex >= s.history.length - 1) return {};
    const idx = s.historyIndex + 1;
    const snap = s.history[idx];
    if (!snap) return {};
    return { objects: JSON.parse(JSON.stringify(snap.objects)), objectOrder: [...snap.objectOrder], historyIndex: idx };
  }),

  setLeftPanelWidth: (w) => set({ leftPanelWidth: Math.max(180, Math.min(500, w)) }),
  setRightPanelWidth: (w) => set({ rightPanelWidth: Math.max(220, Math.min(560, w)) }),
  setBottomPanelHeight: (h) => set({ bottomPanelHeight: Math.max(80, Math.min(400, h)) }),
  togglePanel: (p) => set((s) => {
    if (p === "outliner") return { showOutliner: !s.showOutliner };
    if (p === "properties") return { showProperties: !s.showProperties };
    if (p === "timeline") return { showTimeline: !s.showTimeline };
    if (p === "toolbar") return { showToolbar: !s.showToolbar };
    return {};
  }),
  setFPS: (f) => set({ fps: f }),
  setDrawCalls: (c) => set({ drawCalls: c }),

  showToast: (message, type = "info") => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),

  loadScene: (data) => set(() => ({
    project: data.project ?? defaultProject,
    objects: data.objects ?? {},
    objectOrder: data.objectOrder ?? Object.keys(data.objects ?? {}),
    collections: data.collections ?? [],
    materials: data.materials ?? {},
    tracks: data.tracks ?? [],
    render: data.render ?? defaultRender,
    selection: { objects: [], vertices: [], edges: [], faces: [] },
    activeObjectId: null,
  })),

  exportScene: () => {
    const s = get();
    return {
      project: s.project,
      objects: s.objects,
      objectOrder: s.objectOrder.length ? s.objectOrder : Object.keys(s.objects),
      collections: s.collections,
      materials: s.materials,
      tracks: s.tracks,
      render: s.render,
      __kandler: true,
      __version: "1.0.0",
    };
  },

  exportThreeScene: () => {
    // Export scene as a Three.js Scene JSON (loadable via THREE.SceneLoader / ObjectLoader)
    const s = get();
    const threeScene: any = {
      metadata: { version: 4.5, type: "Object", generator: "Kandler" },
      object: {
        type: "Scene",
        name: s.project.name,
        children: Object.values(s.objects).map(obj => {
          const child: any = {
            type: obj.kind === "light" ? (obj.light?.type === "sun" ? "DirectionalLight" : obj.light?.type === "spot" ? "SpotLight" : obj.light?.type === "area" ? "RectAreaLight" : "PointLight") : obj.kind === "camera" ? "PerspectiveCamera" : "Mesh",
            name: obj.name,
            position: obj.position,
            rotation: obj.rotation,
            scale: obj.scale,
            visible: obj.visible,
            uuid: obj.id,
          };
          if (obj.kind === "mesh" && obj.mesh) {
            child.geometry = {
              type: "BufferGeometry",
              data: {
                attributes: {
                  position: obj.mesh.vertices.flatMap(v => [v.x, v.y, v.z]),
                  // UVs and normals would be added here
                },
                index: obj.mesh.faces.flatMap(f => {
                  const tris: number[] = [];
                  for (let i = 1; i < f.indices.length - 1; i++) tris.push(f.indices[0], f.indices[i], f.indices[i + 1]);
                  return tris;
                }),
              },
            };
            child.material = obj.materialSlots.map(mId => {
              const m = s.materials[mId];
              if (!m) return { type: "MeshStandardMaterial", color: 0xb0b0b0 };
              return {
                type: "MeshPhysicalMaterial",
                color: m.baseColor,
                metalness: m.metallic,
                roughness: m.roughness,
                emissive: m.emissive,
                emissiveIntensity: m.emissiveIntensity,
                opacity: m.opacity,
                transparent: m.transparent,
                wireframe: m.wireframe,
              };
            });
          }
          if (obj.kind === "light" && obj.light) {
            child.color = obj.light.color;
            child.intensity = obj.light.intensity;
            if (obj.light.castShadow !== undefined) child.castShadow = obj.light.castShadow;
          }
          if (obj.kind === "camera" && obj.camera) {
            child.fov = obj.camera.fov;
            child.near = obj.camera.near;
            child.far = obj.camera.far;
          }
          return child;
        }),
      },
    };
    return threeScene;
  },

  exportGLTF: () => {
    // Generate a minimal GLTF 2.0 JSON structure
    const s = get();
    const meshes: any[] = [];
    const nodes: any[] = [];
    const materials: any[] = [];
    const materialIndexMap: Record<string, number> = {};
    Object.values(s.objects).forEach((obj, idx) => {
      if (obj.kind === "mesh" && obj.mesh) {
        const positions = obj.mesh.vertices.flatMap(v => [v.x, v.y, v.z]);
        const indices: number[] = [];
        for (const f of obj.mesh.faces) {
          for (let i = 1; i < f.indices.length - 1; i++) {
            indices.push(f.indices[0], f.indices[i], f.indices[i + 1]);
          }
        }
        const bufferIdx = meshes.length * 2;
        meshes.push({
          primitives: [{
            attributes: { POSITION: bufferIdx },
            indices: bufferIdx + 1,
            material: obj.materialSlots[0] ? (materialIndexMap[obj.materialSlots[0]] ?? 0) : 0,
          }],
        });
        if (obj.materialSlots[0] && !(obj.materialSlots[0] in materialIndexMap)) {
          const m = s.materials[obj.materialSlots[0]];
          if (m) {
            const matIdx = materials.length;
            materialIndexMap[obj.materialSlots[0]] = matIdx;
            materials.push({
              name: m.name,
              pbrMetallicRoughness: {
                baseColorFactor: hexToRgba(m.baseColor, m.opacity),
                metallicFactor: m.metallic,
                roughnessFactor: m.roughness,
              },
            });
          }
        }
        nodes.push({
          name: obj.name,
          mesh: meshes.length - 1,
          translation: obj.position,
          rotation: [0, 0, 0, 1], // identity quaternion (euler→quat omitted for simplicity)
          scale: obj.scale,
        });
      } else {
        nodes.push({ name: obj.name, translation: obj.position });
      }
      void idx;
    });
    return {
      asset: { version: "2.0", generator: "Kandler by Kantasu" },
      scene: 0,
      scenes: [{ nodes: nodes.map((_, i) => i) }],
      nodes,
      meshes,
      materials: materials.length ? materials : undefined,
    };
  },

  exportOBJ: () => {
    const s = get();
    const lines: string[] = ["# Kandler OBJ export — by Kantasu"];
    let vOffset = 0;
    for (const obj of Object.values(s.objects)) {
      if (obj.kind !== "mesh" || !obj.mesh) continue;
      lines.push(`o ${obj.name}`);
      for (const v of obj.mesh.vertices) {
        lines.push(`v ${v.x} ${v.y} ${v.z}`);
      }
      for (const f of obj.mesh.faces) {
        const indices = f.indices.map(i => i + 1 + vOffset);
        lines.push(`f ${indices.join(" ")}`);
      }
      vOffset += obj.mesh.vertices.length;
    }
    return lines.join("\n");
  },

  newScene: () => set(() => {
    const cube = defaultCube();
    const light = defaultLight();
    const cam = defaultCamera();
    const mat = defaultMaterial();
    cube.materialSlots = [mat.id];
    const obj: Record<string, SceneObject> = {};
    obj[cube.id] = cube; obj[light.id] = light; obj[cam.id] = cam;
    return {
      project: { ...defaultProject, created: Date.now(), modified: Date.now() },
      objects: obj,
      objectOrder: [cube.id, light.id, cam.id],
      collections: [{ id: uid("col"), name: "Scene Collection", visible: true, selectable: true, color: "#b388ff", objects: [cube.id, light.id, cam.id], expanded: true }],
      selection: { objects: [], vertices: [], edges: [], faces: [] },
      activeObjectId: null,
      materials: { [mat.id]: mat },
      tracks: [],
      render: defaultRender,
      gpLayers: [{ id: uid("gp"), name: "Layer 1", color: "#b388ff", opacity: 1, visible: true, locked: false }],
      gpStrokes: [],
      activeGpLayer: null,
      physicsPlaying: false,
      physicsTime: 0,
      consoleHistory: [],
    };
  }),

  // ---------- Grease Pencil ----------
  addGpLayer: (name) => set((s) => ({
    gpLayers: [...s.gpLayers, { id: uid("gp"), name, color: "#b388ff", opacity: 1, visible: true, locked: false }],
  })),
  addGpStroke: (stroke) => set((s) => ({ gpStrokes: [...s.gpStrokes, stroke] })),
  clearGpStrokes: () => set({ gpStrokes: [] }),
  setActiveGpLayer: (id) => set({ activeGpLayer: id }),

  // ---------- Physics ----------
  setPhysicsPlaying: (playing) => set({ physicsPlaying: playing }),
  stepPhysics: (dt) => set((s) => {
    // Simple gravity + collision with ground plane (z=0)
    const newObjects = { ...s.objects };
    for (const id of Object.keys(newObjects)) {
      const obj = newObjects[id];
      if (!obj.physics || !obj.physics.enabled || obj.physics.isStatic) continue;
      const p = obj.physics;
      if (p.type === "rigid-body") {
        // Apply gravity
        const newVel: [number, number, number] = [
          p.velocity[0],
          p.velocity[1],
          p.velocity[2] - 9.81 * dt,
        ];
        let newPos: [number, number, number] = [
          obj.position[0] + newVel[0] * dt,
          obj.position[1] + newVel[1] * dt,
          obj.position[2] + newVel[2] * dt,
        ];
        // Ground collision (object bounding sphere ~1 unit)
        if (newPos[2] < 1) {
          newPos[2] = 1;
          newVel[2] = -newVel[2] * p.bounce;
          newVel[0] *= 1 - p.friction * dt;
          newVel[1] *= 1 - p.friction * dt;
        }
        newObjects[id] = {
          ...obj,
          position: newPos,
          physics: { ...p, velocity: newVel },
        };
      } else if (p.type === "cloth" || p.type === "soft-body") {
        // Simple per-vertex displacement based on velocity field — full cloth sim would need edge springs
        // Approximate: oscillate the mesh vertices
        if (obj.mesh) {
          const newMesh = { ...obj.mesh, vertices: obj.mesh.vertices.map((v, i) => ({
            ...v,
            z: v.z + Math.sin((s.physicsTime + i) * 5) * 0.02 * p.stiffness,
          })) };
          newObjects[id] = { ...obj, mesh: newMesh };
        }
      } else if (p.type === "fluid") {
        // Simple particle drift
        const newVel = [...p.velocity] as [number, number, number];
        newVel[0] += (Math.random() - 0.5) * p.viscosity;
        newVel[1] += (Math.random() - 0.5) * p.viscosity;
        newVel[2] += (Math.random() - 0.5) * p.viscosity;
        newObjects[id] = {
          ...obj,
          position: [obj.position[0] + newVel[0] * dt, obj.position[1] + newVel[1] * dt, obj.position[2] + newVel[2] * dt],
          physics: { ...p, velocity: newVel },
        };
      }
    }
    return { objects: newObjects, physicsTime: s.physicsTime + dt };
  }),

  // ---------- Console ----------
  pushConsole: (entry) => set((s) => ({ consoleHistory: [...s.consoleHistory, entry].slice(-200) })),
  clearConsole: () => set({ consoleHistory: [] }),

  // ---------- Extended Object Operations ----------
  addShapeKey: (objectId, name) => set((s) => {
    const obj = s.objects[objectId]; if (!obj || !obj.mesh) return {};
    const shapeKeys = obj.shapeKeys || [];
    // If no basis exists, create one
    if (shapeKeys.length === 0) {
      shapeKeys.push({ id: uid("sk"), name: "Basis", deltas: {}, value: 1, isBasis: true });
    }
    shapeKeys.push({ id: uid("sk"), name, deltas: {}, value: 0, isBasis: false });
    return { objects: { ...s.objects, [objectId]: { ...obj, shapeKeys } } };
  }),
  setShapeKeyValue: (objectId, keyId, value) => set((s) => {
    const obj = s.objects[objectId]; if (!obj || !obj.shapeKeys) return {};
    return {
      objects: {
        ...s.objects,
        [objectId]: {
          ...obj,
          shapeKeys: obj.shapeKeys.map(sk => sk.id === keyId ? { ...sk, value } : sk),
        },
      },
    };
  }),
  addBone: (objectId, bone) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    const armature = obj.armature || { bones: [], vertexGroups: {}, weights: {} };
    armature.bones.push(bone);
    return { objects: { ...s.objects, [objectId]: { ...obj, kind: "armature", armature } } };
  }),
  updateBone: (objectId, boneId, patch) => set((s) => {
    const obj = s.objects[objectId]; if (!obj || !obj.armature) return {};
    return {
      objects: {
        ...s.objects,
        [objectId]: {
          ...obj,
          armature: {
            ...obj.armature,
            bones: obj.armature.bones.map(b => b.id === boneId ? { ...b, ...patch } : b),
          },
        },
      },
    };
  }),
  setShaderGraph: (objectId, graph) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, shaderGraph: graph } } };
  }),
  setGeoNodeGraph: (objectId, graph) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, geoNodeGraph: graph } } };
  }),
  setUvMaps: (objectId, maps) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, uvMaps: maps } } };
  }),
  setTextureCanvas: (objectId, canvas) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    return { objects: { ...s.objects, [objectId]: { ...obj, textureCanvas: canvas } } };
  }),
  paintTextureAt: (objectId, u, v, color, brushSize) => set((s) => {
    const obj = s.objects[objectId]; if (!obj) return {};
    // Default 512x512 canvas if none exists
    const W = obj.textureCanvas?.width || 512;
    const H = obj.textureCanvas?.height || 512;
    const pixels = obj.textureCanvas?.pixels ? [...obj.textureCanvas.pixels] : new Array(W * H * 4).fill(40);
    const cx = Math.floor(u * W);
    const cy = Math.floor((1 - v) * H);
    const r2 = brushSize * brushSize;
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const idx = (y * W + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }
    return { objects: { ...s.objects, [objectId]: { ...obj, textureCanvas: { width: W, height: H, pixels } } } };
  }),
}));
