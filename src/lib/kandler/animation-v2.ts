// Kandler Animation Engine — keyframes, interpolation, clips, NLA, shape keys, drivers, bones, IK.
import * as THREE from "three";
import type { AnimationTrack, AnimationKeyframe } from "./types";

export type InterpolationType = "constant" | "linear" | "bezier" | "hermite" | "step";

export interface KeyframeHandle {
  leftTime: number; leftValue: number;
  rightTime: number; rightValue: number;
}

export interface ExtendedKeyframe extends AnimationKeyframe {
  interpolation: InterpolationType;
  handles?: KeyframeHandle;
  easing?: string;
}

export function evaluateTrackAtTime(track: AnimationTrack, time: number): number | [number, number, number] {
  if (track.keyframes.length === 0) return 0;
  const kfs = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (time <= kfs[0].time) return kfs[0].value;
  if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].time < time) i++;
  const kf1 = kfs[i];
  const kf2 = kfs[i + 1];
  const t = (time - kf1.time) / (kf2.time - kf1.time);
  if (Array.isArray(kf1.value) && Array.isArray(kf2.value)) {
    const v1 = kf1.value as [number, number, number];
    const v2 = kf2.value as [number, number, number];
    return [v1[0] * (1 - t) + v2[0] * t, v1[1] * (1 - t) + v2[1] * t, v1[2] * (1 - t) + v2[2] * t];
  }
  const v1 = kf1.value as number;
  const v2 = kf2.value as number;
  return v1 * (1 - t) + v2 * t;
}

export function applyAnimation(tracks: AnimationTrack[], time: number, apply: (path: string, value: number | [number, number, number]) => void): void {
  for (const track of tracks) {
    const value = evaluateTrackAtTime(track, time);
    apply(`${track.path}.${track.component}`, value);
  }
}

export function autoKeyframe(tracks: AnimationTrack[], path: "position" | "rotation" | "scale", component: "x" | "y" | "z" | "all", time: number, value: number | [number, number, number]): AnimationTrack[] {
  let track = tracks.find(t => t.path === path && t.component === component);
  if (!track) { track = { path, component, keyframes: [] }; tracks.push(track); }
  const existing = track.keyframes.findIndex(k => Math.abs(k.time - time) < 0.01);
  if (existing >= 0) { track.keyframes[existing].value = value; }
  else { track.keyframes.push({ time, value }); track.keyframes.sort((a, b) => a.time - b.time); }
  return tracks;
}

export interface AnimationClip {
  id: string; name: string;
  tracks: AnimationTrack[];
  duration: number; start: number; end: number;
  blendMode: "normal" | "additive";
  loopMode: "once" | "repeat" | "ping-pong";
}

export class ClipManager {
  clips: Map<string, AnimationClip> = new Map();
  activeClipId: string | null = null;
  currentTime: number = 0;
  playing: boolean = false;
  speed: number = 1;
  loop: boolean = true;
  addClip(clip: AnimationClip): void { this.clips.set(clip.id, clip); }
  removeClip(id: string): void { this.clips.delete(id); }
  getClip(id: string): AnimationClip | undefined { return this.clips.get(id); }
  play(id?: string): void { if (id) this.activeClipId = id; this.playing = true; }
  pause(): void { this.playing = false; }
  stop(): void { this.playing = false; this.currentTime = 0; }
  seek(time: number): void { this.currentTime = time; }
  update(dt: number): void {
    if (!this.playing || !this.activeClipId) return;
    const clip = this.clips.get(this.activeClipId);
    if (!clip) return;
    this.currentTime += dt * this.speed;
    if (this.currentTime >= clip.duration) {
      if (this.loop) this.currentTime = this.currentTime % clip.duration;
      else { this.currentTime = clip.duration; this.playing = false; }
    }
  }
  evaluate(time?: number): Map<string, { path: string; component: string; value: number | [number, number, number] }> {
    const result = new Map<string, { path: string; component: string; value: number | [number, number, number] }>();
    if (!this.activeClipId) return result;
    const clip = this.clips.get(this.activeClipId);
    if (!clip) return result;
    const t = time ?? this.currentTime;
    for (const track of clip.tracks) {
      const value = evaluateTrackAtTime(track, t);
      result.set(`${track.path}.${track.component}`, { path: track.path, component: track.component, value });
    }
    return result;
  }
  listClips(): AnimationClip[] { return Array.from(this.clips.values()); }
}

export interface NLAStrip {
  id: string; clipId: string; name: string;
  start: number; end: number;
  blendIn: number; blendOut: number;
  scale: number; repeat: number;
  blendMode: "replace" | "add" | "mix" | "subtract";
  influence: number; enabled: boolean; color: string;
}

export interface NLATrack {
  id: string; name: string;
  strips: NLAStrip[];
  locked: boolean; muted: boolean; solo: boolean;
}

export class NLAEditor {
  tracks: NLATrack[] = [];
  clips: Map<string, AnimationClip> = new Map();
  currentTime: number = 0;
  playing: boolean = false;
  addTrack(name: string): NLATrack {
    const track: NLATrack = { id: `nla_${Date.now()}`, name, strips: [], locked: false, muted: false, solo: false };
    this.tracks.push(track);
    return track;
  }
  removeTrack(id: string): void { this.tracks = this.tracks.filter(t => t.id !== id); }
  addStrip(trackId: string, clipId: string, start: number, end: number): NLAStrip | null {
    const track = this.tracks.find(t => t.id === trackId);
    const clip = this.clips.get(clipId);
    if (!track || !clip) return null;
    const strip: NLAStrip = {
      id: `strip_${Date.now()}`, clipId, name: clip.name, start, end,
      blendIn: 0.2, blendOut: 0.2, scale: 1, repeat: 1,
      blendMode: "replace", influence: 1, enabled: true, color: "#a855f7",
    };
    track.strips.push(strip);
    return strip;
  }
  removeStrip(trackId: string, stripId: string): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) track.strips = track.strips.filter(s => s.id !== stripId);
  }
  moveStrip(trackId: string, stripId: string, newStart: number): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;
    const strip = track.strips.find(s => s.id === stripId);
    if (!strip) return;
    const dur = strip.end - strip.start;
    strip.start = newStart;
    strip.end = newStart + dur;
  }
  evaluate(time: number): Map<string, Map<string, number | [number, number, number]>> {
    const result = new Map<string, Map<string, number | [number, number, number]>>();
    for (const track of this.tracks) {
      if (track.muted) continue;
      for (const strip of track.strips) {
        if (!strip.enabled) continue;
        if (time < strip.start || time > strip.end) continue;
        const clip = this.clips.get(strip.clipId);
        if (!clip) continue;
        const localTime = ((time - strip.start) / (strip.end - strip.start)) * clip.duration * strip.scale;
        let influence = strip.influence;
        if (time - strip.start < strip.blendIn) influence *= (time - strip.start) / strip.blendIn;
        if (strip.end - time < strip.blendOut) influence *= (strip.end - time) / strip.blendOut;
        for (const animTrack of clip.tracks) {
          const value = evaluateTrackAtTime(animTrack, localTime);
          const key = `${animTrack.path}.${animTrack.component}`;
          if (!result.has(key)) result.set(key, new Map());
          const objMap = result.get(key)!;
          if (strip.blendMode === "replace" || !objMap.has("value")) {
            objMap.set("value", value);
            objMap.set("influence", influence);
          } else if (strip.blendMode === "add") {
            const old = objMap.get("value");
            if (typeof old === "number" && typeof value === "number") objMap.set("value", old + value * influence);
          }
        }
      }
    }
    return result;
  }
  update(dt: number): void { if (this.playing) this.currentTime += dt; }
}

export interface ShapeKey {
  id: string; name: string; value: number;
  min: number; max: number;
  vertices: Float32Array;
  baseVertices: Float32Array;
}

export class ShapeKeyManager {
  shapeKeys: Map<string, ShapeKey> = new Map();
  baseGeometry: THREE.BufferGeometry | null = null;
  setBase(geo: THREE.BufferGeometry): void {
    this.baseGeometry = geo.clone();
    const pos = geo.attributes.position;
    const verts = new Float32Array(pos.array as Float32Array);
    this.shapeKeys.set("base", { id: "base", name: "Basis", value: 0, min: 0, max: 1, vertices: verts, baseVertices: verts.slice() });
  }
  addShapeKey(name: string, vertices?: Float32Array): string {
    if (!this.baseGeometry) return "";
    const id = `sk_${Date.now()}`;
    const pos = this.baseGeometry.attributes.position;
    const verts = vertices ?? new Float32Array(pos.array as Float32Array);
    this.shapeKeys.set(id, { id, name, value: 0, min: 0, max: 1, vertices: verts, baseVertices: new Float32Array(pos.array as Float32Array) });
    return id;
  }
  createFromOffset(name: string, offset: THREE.Vector3): string {
    if (!this.baseGeometry) return "";
    const pos = this.baseGeometry.attributes.position;
    const verts = new Float32Array(pos.array as Float32Array);
    for (let i = 0; i < verts.length; i += 3) { verts[i] += offset.x; verts[i + 1] += offset.y; verts[i + 2] += offset.z; }
    return this.addShapeKey(name, verts);
  }
  setValue(id: string, value: number): void {
    const sk = this.shapeKeys.get(id);
    if (sk) sk.value = Math.max(sk.min, Math.min(sk.max, value));
  }
  applyToGeometry(geo: THREE.BufferGeometry): void {
    if (!this.baseGeometry) return;
    const pos = geo.attributes.position;
    const base = this.baseGeometry.attributes.position;
    const positions = pos.array as Float32Array;
    const basePositions = base.array as Float32Array;
    for (let i = 0; i < positions.length; i++) positions[i] = basePositions[i];
    this.shapeKeys.forEach((sk) => {
      if (sk.id === "base" || sk.value === 0) return;
      for (let i = 0; i < positions.length && i < sk.vertices.length; i++)
        positions[i] += (sk.vertices[i] - sk.baseVertices[i]) * sk.value;
    });
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  remove(id: string): void { if (id !== "base") this.shapeKeys.delete(id); }
  list(): ShapeKey[] { return Array.from(this.shapeKeys.values()); }
}

export interface Driver {
  id: string; name: string; expression: string;
  targetType: "location" | "rotation" | "scale" | "custom";
  targetComponent: "x" | "y" | "z" | "all";
  targetObjectId: string;
  variables: { name: string; sourceObjectId: string; sourcePath: string }[];
  enabled: boolean;
}

export class DriverSystem {
  drivers: Driver[] = [];
  addDriver(driver: Driver): void { this.drivers.push(driver); }
  removeDriver(id: string): void { this.drivers = this.drivers.filter(d => d.id !== id); }
  evaluateDriver(driver: Driver, getValue: (id: string, path: string) => number): number {
    if (!driver.enabled) return 0;
    let expr = driver.expression;
    for (const v of driver.variables) {
      const val = getValue(v.sourceObjectId, v.sourcePath);
      expr = expr.replace(new RegExp(`\\b${v.name}\\b`, "g"), String(val));
    }
    try {
      expr = expr.replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos").replace(/\btan\b/g, "Math.tan")
        .replace(/\babs\b/g, "Math.abs").replace(/\bsqrt\b/g, "Math.sqrt").replace(/\bpow\b/g, "Math.pow")
        .replace(/\bmin\b/g, "Math.min").replace(/\bmax\b/g, "Math.max").replace(/\bfloor\b/g, "Math.floor")
        .replace(/\bceil\b/g, "Math.ceil").replace(/\bround\b/g, "Math.round").replace(/\bPI\b/g, "Math.PI");
      const fn = new Function(`return ${expr}`);
      return fn();
    } catch { return 0; }
  }
  evaluateAll(getValue: (id: string, path: string) => number): Map<string, { driver: Driver; value: number }[]> {
    const result = new Map<string, { driver: Driver; value: number }[]>();
    for (const d of this.drivers) {
      const val = this.evaluateDriver(d, getValue);
      if (!result.has(d.targetObjectId)) result.set(d.targetObjectId, []);
      result.get(d.targetObjectId)!.push({ driver: d, value: val });
    }
    return result;
  }
}

export interface Bone {
  id: string; name: string;
  head: THREE.Vector3; tail: THREE.Vector3;
  parent: string | null; children: string[];
  rotation: THREE.Euler; scale: THREE.Vector3;
  roll: number;
}

export class Armature {
  id: string; name: string;
  bones: Map<string, Bone> = new Map();
  rootBones: string[] = [];
  poseMode: boolean = false;
  constructor(id: string, name: string) { this.id = id; this.name = name; }
  addBone(bone: Bone): void {
    this.bones.set(bone.id, bone);
    if (bone.parent && this.bones.has(bone.parent)) {
      this.bones.get(bone.parent)!.children.push(bone.id);
    } else { this.rootBones.push(bone.id); }
  }
  removeBone(id: string): void {
    const bone = this.bones.get(id);
    if (!bone) return;
    if (bone.parent && this.bones.has(bone.parent)) {
      this.bones.get(bone.parent)!.children = this.bones.get(bone.parent)!.children.filter(c => c !== id);
    } else { this.rootBones = this.rootBones.filter(r => r !== id); }
    for (const childId of [...bone.children]) this.removeBone(childId);
    this.bones.delete(id);
  }
  getBoneWorldMatrix(boneId: string): THREE.Matrix4 {
    const bone = this.bones.get(boneId);
    if (!bone) return new THREE.Matrix4();
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(bone.rotation);
    mat.compose(bone.head, q, bone.scale);
    if (bone.parent) mat.premultiply(this.getBoneWorldMatrix(bone.parent));
    return mat;
  }
  solveIK(chain: string[], target: THREE.Vector3, iterations: number = 10, tolerance: number = 0.001): void {
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = chain.length - 1; i >= 0; i--) {
        const bone = this.bones.get(chain[i]);
        if (!bone) continue;
        if (i === chain.length - 1) bone.tail.copy(target);
        else { const child = this.bones.get(chain[i + 1]); if (child) bone.tail.copy(child.head); }
      }
      for (let i = 0; i < chain.length; i++) {
        const bone = this.bones.get(chain[i]);
        if (!bone) continue;
        if (i > 0) {
          const parent = this.bones.get(chain[i - 1]);
          if (parent) {
            const len = bone.tail.distanceTo(bone.head);
            const dir = bone.head.clone().sub(parent.tail).normalize();
            bone.head.copy(parent.tail);
            bone.tail.copy(bone.head).add(dir.multiplyScalar(len));
          }
        }
      }
      const endBone = this.bones.get(chain[chain.length - 1]);
      if (endBone && endBone.tail.distanceTo(target) < tolerance) break;
    }
  }
  listBones(): Bone[] { return Array.from(this.bones.values()); }
}

export type ConstraintType = "track-to" | "copy-location" | "copy-rotation" | "copy-scale" | "limit-distance" | "limit-location" | "limit-rotation" | "limit-scale" | "child-of" | "floor" | "follow-path" | "shrinkwrap" | "damped-track";

export interface Constraint {
  id: string; name: string; type: ConstraintType;
  targetId: string; influence: number;
  enabled: boolean; mute: boolean;
  params: Record<string, any>;
}

export class ConstraintSystem {
  constraints: Constraint[] = [];
  addConstraint(c: Constraint): void { this.constraints.push(c); }
  removeConstraint(id: string): void { this.constraints = this.constraints.filter(c => c.id !== id); }
  applyConstraints(objectId: string, transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }, getTransform: (id: string) => { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } | null): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
    let pos = transform.position.clone();
    let rot = transform.rotation.clone();
    let scl = transform.scale.clone();
    for (const c of this.constraints) {
      if (!c.enabled || c.mute || c.targetId !== objectId) continue;
      const target = getTransform(c.params.sourceId || "");
      const influence = c.influence;
      switch (c.type) {
        case "copy-location": if (target) pos.lerp(target.position, influence); break;
        case "copy-rotation": if (target) { rot.x = rot.x * (1 - influence) + target.rotation.x * influence; rot.y = rot.y * (1 - influence) + target.rotation.y * influence; rot.z = rot.z * (1 - influence) + target.rotation.z * influence; } break;
        case "copy-scale": if (target) scl.lerp(target.scale, influence); break;
        case "limit-distance": { if (!target) break; const dist = pos.distanceTo(target.position); const maxDist = c.params.maxDistance ?? 5; if (dist > maxDist) { const dir = pos.clone().sub(target.position).normalize(); pos.copy(target.position).add(dir.multiplyScalar(maxDist)); } break; }
        case "track-to": case "damped-track": { if (!target) break; const m = new THREE.Matrix4().lookAt(pos, target.position, new THREE.Vector3(0, 1, 0)); const q = new THREE.Quaternion().setFromRotationMatrix(m); const e = new THREE.Euler().setFromQuaternion(q); rot.x = rot.x * (1 - influence) + e.x * influence; rot.y = rot.y * (1 - influence) + e.y * influence; rot.z = rot.z * (1 - influence) + e.z * influence; break; }
        case "floor": { if (!target) break; if (pos.y < target.position.y) pos.y = target.position.y * influence + pos.y * (1 - influence); break; }
      }
    }
    return { position: pos, rotation: rot, scale: scl };
  }
  list(): Constraint[] { return this.constraints; }
}

export class PlaybackController {
  clipManager: ClipManager;
  playing: boolean = false;
  currentTime: number = 0;
  speed: number = 1;
  loop: "none" | "repeat" | "ping-pong" = "repeat";
  startFrame: number = 0;
  endFrame: number = 120;
  fps: number = 24;
  pingPongDirection: number = 1;
  constructor(clipManager: ClipManager) { this.clipManager = clipManager; }
  play(): void { this.playing = true; }
  pause(): void { this.playing = false; }
  stop(): void { this.playing = false; this.currentTime = 0; this.pingPongDirection = 1; }
  seek(time: number): void { this.currentTime = Math.max(this.startFrame / this.fps, Math.min(this.endFrame / this.fps, time)); }
  get currentFrame(): number { return Math.round(this.currentTime * this.fps); }
  set currentFrame(frame: number) { this.seek(frame / this.fps); }
  get totalFrames(): number { return this.endFrame - this.startFrame; }
  get duration(): number { return this.totalFrames / this.fps; }
  update(dt: number): void {
    if (!this.playing) return;
    this.currentTime += dt * this.speed * this.pingPongDirection;
    const startTime = this.startFrame / this.fps;
    const endTime = this.endFrame / this.fps;
    if (this.currentTime >= endTime) {
      if (this.loop === "repeat") this.currentTime = startTime + (this.currentTime - endTime) % (endTime - startTime);
      else if (this.loop === "ping-pong") { this.pingPongDirection = -1; this.currentTime = endTime - (this.currentTime - endTime); }
      else { this.currentTime = endTime; this.playing = false; }
    } else if (this.currentTime <= startTime) {
      if (this.loop === "ping-pong") { this.pingPongDirection = 1; this.currentTime = startTime + (startTime - this.currentTime); }
      else this.currentTime = startTime;
    }
    this.clipManager.seek(this.currentTime);
    this.clipManager.update(dt * this.speed * this.pingPongDirection);
  }
}
