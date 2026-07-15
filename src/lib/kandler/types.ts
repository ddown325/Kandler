// Kandler scene model — pure Three.js, serializable
// Created by KANTASU

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number]; // quaternion xyzw OR color rgba
export type RGB = [number, number, number]; // 0..1

export type PrimitiveKind =
  | "cube"
  | "sphere"
  | "cylinder"
  | "cone"
  | "torus"
  | "torusknot"
  | "plane"
  | "dodecahedron"
  | "icosahedron"
  | "octahedron"
  | "tetrahedron"
  | "circle"
  | "capsule"
  | "teapot";

export type LightKind = "point" | "directional" | "spot" | "hemisphere" | "area";
export type CameraKind = "perspective" | "ortho";

export type ObjectKind = "mesh" | "light" | "camera" | "group" | "empty" | "curve";

export interface Transform {
  position: Vec3;
  rotation: Vec3; // euler XYZ in radians
  scale: Vec3;
}

export interface MaterialDef {
  id: string;
  name: string;
  type: "pbr" | "standard" | "basic" | "wireframe" | "normal" | "toon";
  color: RGB;
  emissive: RGB;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  flatShading: boolean;
  doubleSided: boolean;
  map?: string | null;
  normalMap?: string | null;
  roughnessMap?: string | null;
  toonSteps?: number;
}

export type ModifierKind =
  | "bevel"
  | "subdivision"
  | "mirror"
  | "array"
  | "boolean"
  | "simpleDeform"
  | "wireframe"
  | "solidify"
  | "decimate";

export interface ModifierDef {
  id: string;
  kind: ModifierKind;
  enabled: boolean;
  name: string;
  params: Record<string, number | string | boolean>;
}

export interface GeometryParams {
  kind: PrimitiveKind;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  segments?: number;
  radialSegments?: number;
  heightSegments?: number;
  tube?: number;
  tubularSegments?: number;
  arc?: number;
  p?: number;
  q?: number;
  detail?: number;
  thetaStart?: number;
  thetaLength?: number;
}

export interface AnimationKeyframe {
  time: number;
  value: number | Vec3;
}

export interface AnimationTrack {
  path: "position" | "rotation" | "scale";
  component: "x" | "y" | "z" | "all";
  keyframes: AnimationKeyframe[];
}

export interface SceneObject {
  id: string;
  name: string;
  kind: ObjectKind;
  visible: boolean;
  locked: boolean;
  transform: Transform;
  geometry?: GeometryParams;
  materialId?: string;
  modifiers?: ModifierDef[];
  light?: {
    kind: LightKind;
    color: RGB;
    intensity: number;
    distance?: number;
    angle?: number;
    penumbra?: number;
    decay?: number;
    castShadow: boolean;
  };
  camera?: {
    kind: CameraKind;
    fov?: number;
    near?: number;
    far?: number;
    orthoScale?: number;
  };
  tracks?: AnimationTrack[];
  parentId?: string | null;
  children?: string[];
}

export interface SceneEnvironment {
  background: RGB | null;
  ambientIntensity: number;
  fog: { enabled: boolean; color: RGB; near: number; far: number } | null;
  gridVisible: boolean;
  gridColor: RGB;
  gridDivisions: number;
  shadowMapEnabled: boolean;
  toneMapping: "none" | "aces" | "reinhard" | "cineon";
  exposure: number;
}

export interface SceneAnimation {
  fps: number;
  duration: number;
  currentTime: number;
  playing: boolean;
}

export interface SceneUI {
  transformMode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  snapTranslate: number;
  snapRotate: number;
  snapScale: number;
  showStats: boolean;
  wireframeMode: "off" | "all" | "selected";
  shadingMode: "wireframe" | "solid" | "material" | "rendered";
  editMode: boolean;
  selectionMode: "object" | "vertex" | "edge" | "face";
  selectTool: "default" | "box" | "lasso" | "cursor" | "measure";
  cursor: Vec3;
  quadView: boolean;
  showOverlay: boolean;
  showNormals: boolean;
  envMapEnabled: boolean;
  sculptMode: boolean;
}

export interface SceneState {
  version: number;
  name: string;
  objects: Record<string, SceneObject>;
  rootOrder: string[];
  materials: Record<string, MaterialDef>;
  activeCameraId: string | null;
  environment: SceneEnvironment;
  animation: SceneAnimation;
  ui: SceneUI;
}

export const DEFAULT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};
