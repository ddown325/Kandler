/**
 * Kandler — Extended Scene Data Types
 * Type definitions for armatures, shape keys, grease pencil strokes,
 * physics objects, geometry nodes, UV maps, and shader node graphs.
 *
 * Made by Kantasu.
 */

// ---------- Armature / Rigging ----------
export interface Bone {
  id: string;
  name: string;
  head: [number, number, number];
  tail: [number, number, number];
  parent?: string; // parent bone id
  roll: number;
  useConnect: boolean; // head connected to parent's tail
  // IK
  useIk: boolean;
  ikChainLength: number;
  ikTarget?: string; // empty/bone id that drives this chain
  // Constraints
  constraints: BoneConstraint[];
}

export interface BoneConstraint {
  id: string;
  type: "copy-location" | "copy-rotation" | "limit-distance" | "track-to" | "ik";
  name: string;
  target?: string; // bone or object id
  influence: number; // 0..1
  params: Record<string, number | string | boolean>;
}

export interface Armature {
  bones: Bone[];
  // vertex → bone weights (index maps to bones array)
  vertexGroups: Record<string, number[]>; // boneName → array of vertex indices it influences
  weights: Record<string, Record<number, number>>; // boneName → {vertexIndex: weight}
}

// ---------- Shape Keys ----------
export interface ShapeKey {
  id: string;
  name: string;
  // Per-vertex deltas (only included verts differ from basis)
  deltas: Record<number, [number, number, number]>;
  value: number; // 0..1 current blend
  isBasis: boolean;
}

// ---------- Grease Pencil ----------
export interface GPStrokePoint {
  position: [number, number, number];
  pressure: number;
  color: string;
}

export interface GPStroke {
  id: string;
  points: GPStrokePoint[];
  layer: string;
  width: number;
}

export interface GPLayer {
  id: string;
  name: string;
  color: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

// ---------- Physics ----------
export type PhysicsType = "rigid-body" | "cloth" | "soft-body" | "fluid" | "smoke" | "particle";

export interface PhysicsObject {
  id: string;
  type: PhysicsType;
  enabled: boolean;
  // Rigid body
  mass: number;
  friction: number;
  bounce: number; // restitution
  isStatic: boolean;
  // Cloth
  stiffness: number;
  damping: number;
  // Fluid
  viscosity: number;
  density: number;
  // Simulation state
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  // Particle
  particleCount: number;
  particleLifetime: number;
}

// ---------- Geometry Nodes ----------
export type GeoNodeType =
  | "input-mesh"
  | "input-primitive"
  | "transform"
  | "instance-on-points"
  | "subdivision"
  | "boolean"
  | "array-linear"
  | "scatter"
  | "noise-displace"
  | "math"
  | "output";

export interface GeoNode {
  id: string;
  type: GeoNodeType;
  name: string;
  position: { x: number; y: number };
  params: Record<string, number | string | boolean>;
  inputs: Record<string, string>; // inputName → connected node output (or empty)
}

export interface GeoNodeGraph {
  nodes: GeoNode[];
  output: string | null;
}

// ---------- UV Map ----------
export interface UVMap {
  // Per-vertex UV coordinates
  uvs: [number, number][]; // index aligns with mesh vertex indices
  // For face-vertex (seam-aware) UVs, we use per-face-vertex indexing:
  faceUVs: number[][]; // face index → array of UV indices into `uvs`
  // Seams (edges marked as UV seams)
  seams: Array<[number, number]>; // [vertA, vertB]
}

// ---------- Shader Node Graph ----------
export type ShaderNodeType =
  | "output"
  | "pbr"
  | "diffuse"
  | "emission"
  | "mix-shader"
  | "color-ramp"
  | "tex-coord"
  | "tex-noise"
  | "tex-checker"
  | "tex-brick"
  | "tex-gradient"
  | "math"
  | "vector-math"
  | "value"
  | "color"
  | "normal-map"
  | "bump";

export interface ShaderNode {
  id: string;
  type: ShaderNodeType;
  name: string;
  position: { x: number; y: number };
  params: Record<string, number | string | boolean>;
  // Connections: inputName → { nodeId, outputName }
  inputs: Record<string, { nodeId: string; outputName: string } | null>;
}

export interface ShaderNodeGraph {
  nodes: ShaderNode[];
  output: string | null; // node id of output node
}
