// Kandler Asset Library — preset meshes, materials, lights, HDRI, cameras.
// Kandler Theme System — 12+ preset themes + snapping + keymap.
// Kandler Crash Recovery — IndexedDB autosave + command history.
import * as THREE from "three";

// ====== ASSET PRESETS ======
export interface AssetPreset {
  id: string; name: string; category: string;
  type: "mesh" | "material" | "light" | "hdri" | "camera";
  data: any;
}

export const MESH_PRESETS: AssetPreset[] = [
  { id: "mesh-cube", name: "Cube", category: "Basic", type: "mesh", data: { kind: "cube", width: 2, height: 2, depth: 2 } },
  { id: "mesh-sphere", name: "UV Sphere", category: "Basic", type: "mesh", data: { kind: "sphere", radius: 1, segments: 32 } },
  { id: "mesh-cylinder", name: "Cylinder", category: "Basic", type: "mesh", data: { kind: "cylinder", radiusTop: 1, radiusBottom: 1, height: 2, radialSegments: 32 } },
  { id: "mesh-cone", name: "Cone", category: "Basic", type: "mesh", data: { kind: "cone", radius: 1, height: 2, radialSegments: 32 } },
  { id: "mesh-torus", name: "Torus", category: "Basic", type: "mesh", data: { kind: "torus", radius: 1, tube: 0.35, radialSegments: 16, tubularSegments: 64 } },
  { id: "mesh-torusknot", name: "Torus Knot", category: "Basic", type: "mesh", data: { kind: "torusknot", radius: 1, tube: 0.3, tubularSegments: 128, radialSegments: 16, p: 2, q: 3 } },
  { id: "mesh-suzanne", name: "Kitsune (Fox)", category: "Special", type: "mesh", data: { kind: "suzanne", radius: 1 } },
  { id: "mesh-icosahedron", name: "Icosahedron", category: "Polyhedra", type: "mesh", data: { kind: "icosahedron", radius: 1, detail: 0 } },
  { id: "mesh-dodecahedron", name: "Dodecahedron", category: "Polyhedra", type: "mesh", data: { kind: "dodecahedron", radius: 1, detail: 0 } },
  { id: "mesh-octahedron", name: "Octahedron", category: "Polyhedra", type: "mesh", data: { kind: "octahedron", radius: 1, detail: 0 } },
  { id: "mesh-tetrahedron", name: "Tetrahedron", category: "Polyhedra", type: "mesh", data: { kind: "tetrahedron", radius: 1, detail: 0 } },
  { id: "mesh-capsule", name: "Capsule", category: "Basic", type: "mesh", data: { kind: "capsule", radius: 0.6, height: 1.6, radialSegments: 16 } },
  { id: "mesh-helix", name: "Helix", category: "Curves", type: "mesh", data: { kind: "helix", radius: 0.5, tube: 0.1, tubularSegments: 64, radialSegments: 8 } },
  { id: "mesh-tube", name: "Tube", category: "Curves", type: "mesh", data: { kind: "tube", radius: 0.5, tube: 0.1, tubularSegments: 64, radialSegments: 12 } },
];

export const MATERIAL_PRESETS: AssetPreset[] = [
  { id: "mat-gold", name: "Gold", category: "Metal", type: "material", data: { type: "pbr", color: [1.0, 0.78, 0.35], metalness: 1.0, roughness: 0.2 } },
  { id: "mat-silver", name: "Silver", category: "Metal", type: "material", data: { type: "pbr", color: [0.95, 0.95, 0.95], metalness: 1.0, roughness: 0.1 } },
  { id: "mat-copper", name: "Copper", category: "Metal", type: "material", data: { type: "pbr", color: [0.95, 0.64, 0.54], metalness: 1.0, roughness: 0.3 } },
  { id: "mat-iron", name: "Iron", category: "Metal", type: "material", data: { type: "pbr", color: [0.56, 0.57, 0.58], metalness: 1.0, roughness: 0.5 } },
  { id: "mat-plastic-red", name: "Red Plastic", category: "Plastic", type: "material", data: { type: "pbr", color: [0.9, 0.1, 0.1], metalness: 0.0, roughness: 0.4 } },
  { id: "mat-plastic-blue", name: "Blue Plastic", category: "Plastic", type: "material", data: { type: "pbr", color: [0.1, 0.3, 0.9], metalness: 0.0, roughness: 0.4 } },
  { id: "mat-glass", name: "Glass", category: "Transparent", type: "material", data: { type: "pbr", color: [0.9, 0.95, 1.0], metalness: 0.0, roughness: 0.0, opacity: 0.3, transparent: true } },
  { id: "mat-water", name: "Water", category: "Transparent", type: "material", data: { type: "pbr", color: [0.1, 0.4, 0.8], metalness: 0.0, roughness: 0.05, opacity: 0.6, transparent: true } },
  { id: "mat-wood", name: "Wood", category: "Organic", type: "material", data: { type: "pbr", color: [0.55, 0.35, 0.15], metalness: 0.0, roughness: 0.8 } },
  { id: "mat-stone", name: "Stone", category: "Organic", type: "material", data: { type: "pbr", color: [0.5, 0.5, 0.48], metalness: 0.0, roughness: 0.9 } },
  { id: "mat-emissive-red", name: "Emissive Red", category: "Emissive", type: "material", data: { type: "pbr", color: [0.2, 0.05, 0.05], metalness: 0.0, roughness: 0.5, emissive: [1.0, 0.1, 0.1], emissiveIntensity: 2.0 } },
  { id: "mat-emissive-blue", name: "Emissive Blue", category: "Emissive", type: "material", data: { type: "pbr", color: [0.05, 0.05, 0.2], metalness: 0.0, roughness: 0.5, emissive: [0.1, 0.3, 1.0], emissiveIntensity: 2.0 } },
  { id: "mat-toon", name: "Toon", category: "Special", type: "material", data: { type: "toon", color: [0.8, 0.6, 0.9] } },
  { id: "mat-wireframe", name: "Wireframe", category: "Special", type: "material", data: { type: "wireframe", color: [0.66, 0.33, 0.93] } },
  { id: "mat-kandler-purple", name: "Kandler Purple", category: "Special", type: "material", data: { type: "pbr", color: [0.62, 0.32, 0.93], metalness: 0.1, roughness: 0.55 } },
];

export const LIGHT_PRESETS: AssetPreset[] = [
  { id: "light-sun", name: "Sun", category: "Natural", type: "light", data: { kind: "directional", color: [1, 1, 1], intensity: 2.5, castShadow: true } },
  { id: "light-point", name: "Point Light", category: "Artificial", type: "light", data: { kind: "point", color: [1, 1, 1], intensity: 25, distance: 0, decay: 2, castShadow: true } },
  { id: "light-spot", name: "Spotlight", category: "Artificial", type: "light", data: { kind: "spot", color: [1, 1, 1], intensity: 50, angle: Math.PI / 6, penumbra: 0.2, decay: 2, castShadow: true } },
  { id: "light-hemi", name: "Hemisphere", category: "Natural", type: "light", data: { kind: "hemisphere", color: [1, 1, 1], intensity: 0.6, castShadow: false } },
  { id: "light-area", name: "Area Light", category: "Artificial", type: "light", data: { kind: "area", color: [1, 1, 1], intensity: 5, castShadow: false } },
  { id: "light-candle", name: "Candle", category: "Atmospheric", type: "light", data: { kind: "point", color: [1.0, 0.6, 0.2], intensity: 10, distance: 5, decay: 2, castShadow: true } },
  { id: "light-neon-purple", name: "Neon Purple", category: "Atmospheric", type: "light", data: { kind: "point", color: [0.6, 0.2, 1.0], intensity: 30, distance: 10, decay: 2, castShadow: false } },
  { id: "light-neon-pink", name: "Neon Pink", category: "Atmospheric", type: "light", data: { kind: "point", color: [1.0, 0.2, 0.8], intensity: 30, distance: 10, decay: 2, castShadow: false } },
];

export const CAMERA_PRESETS: AssetPreset[] = [
  { id: "cam-perspective", name: "Perspective", category: "Standard", type: "camera", data: { kind: "perspective", fov: 50, near: 0.1, far: 1000 } },
  { id: "cam-ortho", name: "Orthographic", category: "Standard", type: "camera", data: { kind: "ortho", near: 0.1, far: 1000, orthoScale: 5 } },
  { id: "cam-wide", name: "Wide Angle", category: "Special", type: "camera", data: { kind: "perspective", fov: 90, near: 0.1, far: 1000 } },
  { id: "cam-telephoto", name: "Telephoto", category: "Special", type: "camera", data: { kind: "perspective", fov: 20, near: 0.1, far: 1000 } },
];

export function getAllPresets(): AssetPreset[] {
  return [...MESH_PRESETS, ...MATERIAL_PRESETS, ...LIGHT_PRESETS, ...CAMERA_PRESETS];
}

export function getPresetsByType(type: AssetPreset["type"]): AssetPreset[] {
  return getAllPresets().filter(p => p.type === type);
}

// ====== THEMES ======
export interface Theme {
  id: string; name: string;
  colors: {
    primary: string; accent: string;
    background: string; panel: string; panelLight: string;
    text: string; textMuted: string; border: string;
    grid: string; gridAccent: string;
    selection: string;
    gizmoX: string; gizmoY: string; gizmoZ: string;
    cursor: string;
  };
}

export const THEMES: Theme[] = [
  { id: "kandler-purple", name: "Kandler Purple", colors: { primary: "#a855f7", accent: "#ec4899", background: "#0a0614", panel: "#150b25", panelLight: "#1a0e2e", text: "#e9d5ff", textMuted: "#a78bfa", border: "#7c3aed40", grid: "#8b5cf6", gridAccent: "#4c1d95", selection: "#a855f7", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#ff3355" } },
  { id: "blender-dark", name: "Blender Dark", colors: { primary: "#4772b3", accent: "#e87d0d", background: "#1d1d1d", panel: "#232323", panelLight: "#2b2b2b", text: "#e6e6e6", textMuted: "#a0a0a0", border: "#3a3a3a", grid: "#5a5a5a", gridAccent: "#404040", selection: "#4772b3", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#ff3355" } },
  { id: "midnight-blue", name: "Midnight Blue", colors: { primary: "#3b82f6", accent: "#06b6d4", background: "#0a0e1a", panel: "#0f172a", panelLight: "#1e293b", text: "#e0e7ff", textMuted: "#94a3b8", border: "#3b82f640", grid: "#3b82f6", gridAccent: "#1e3a5f", selection: "#3b82f6", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#06b6d4" } },
  { id: "forest-green", name: "Forest Green", colors: { primary: "#22c55e", accent: "#84cc16", background: "#0a1410", panel: "#0f1f17", panelLight: "#1a2e22", text: "#d4f4dd", textMuted: "#86c99e", border: "#22c55e40", grid: "#22c55e", gridAccent: "#14532d", selection: "#22c55e", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#22c55e" } },
  { id: "sunset-orange", name: "Sunset Orange", colors: { primary: "#f97316", accent: "#ef4444", background: "#1a0a06", panel: "#2a1208", panelLight: "#3a1a0c", text: "#fef3e2", textMuted: "#d4a574", border: "#f9731640", grid: "#f97316", gridAccent: "#7c2d12", selection: "#f97316", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#f97316" } },
  { id: "cyber-pink", name: "Cyber Pink", colors: { primary: "#ec4899", accent: "#8b5cf6", background: "#0d0612", panel: "#1a0d1f", panelLight: "#241030", text: "#fce7f3", textMuted: "#c084a8", border: "#ec489940", grid: "#ec4899", gridAccent: "#581c44", selection: "#ec4899", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#ec4899" } },
  { id: "monochrome", name: "Monochrome", colors: { primary: "#a3a3a3", accent: "#737373", background: "#0a0a0a", panel: "#141414", panelLight: "#1f1f1f", text: "#f5f5f5", textMuted: "#737373", border: "#404040", grid: "#525252", gridAccent: "#262626", selection: "#d4d4d4", gizmoX: "#ff3355", gizmoY: "#33ff77", gizmoZ: "#3399ff", cursor: "#ffffff" } },
  { id: "dracula", name: "Dracula", colors: { primary: "#bd93f9", accent: "#ff79c6", background: "#21222c", panel: "#282a36", panelLight: "#343746", text: "#f8f8f2", textMuted: "#8b8fa3", border: "#44475a", grid: "#6272a4", gridAccent: "#44475a", selection: "#bd93f9", gizmoX: "#ff5555", gizmoY: "#50fa7b", gizmoZ: "#8be9fd", cursor: "#ff79c6" } },
  { id: "nord", name: "Nord", colors: { primary: "#88c0d0", accent: "#bf616a", background: "#2e3440", panel: "#3b4252", panelLight: "#434c5e", text: "#e5e9f0", textMuted: "#8b949e", border: "#4c566a", grid: "#81a1c1", gridAccent: "#3b4252", selection: "#88c0d0", gizmoX: "#bf616a", gizmoY: "#a3be8c", gizmoZ: "#81a1c1", cursor: "#d08770" } },
  { id: "solarized-dark", name: "Solarized Dark", colors: { primary: "#268bd2", accent: "#cb4b16", background: "#002b36", panel: "#073642", panelLight: "#0e4a58", text: "#93a1a1", textMuted: "#586e75", border: "#073642", grid: "#2aa198", gridAccent: "#073642", selection: "#268bd2", gizmoX: "#dc322f", gizmoY: "#859900", gizmoZ: "#268bd2", cursor: "#cb4b16" } },
  { id: "gruvbox", name: "Gruvbox", colors: { primary: "#fabd2f", accent: "#fb4934", background: "#1d2021", panel: "#282828", panelLight: "#3c3836", text: "#ebdbb2", textMuted: "#928374", border: "#504945", grid: "#b8bb26", gridAccent: "#3c3836", selection: "#fabd2f", gizmoX: "#fb4934", gizmoY: "#b8bb26", gizmoZ: "#83a598", cursor: "#fe8019" } },
  { id: "tokyo-night", name: "Tokyo Night", colors: { primary: "#7aa2f7", accent: "#bb9af7", background: "#16161e", panel: "#1a1b26", panelLight: "#24283b", text: "#c0caf5", textMuted: "#565f89", border: "#2a2e42", grid: "#7aa2f7", gridAccent: "#1a1b26", selection: "#7aa2f7", gizmoX: "#f7768e", gizmoY: "#9ece6a", gizmoZ: "#7aa2f7", cursor: "#e0af68" } },
];

export function getThemeById(id: string): Theme | undefined { return THEMES.find(t => t.id === id); }

// ====== SNAPPING ======
export type SnapMode = "grid" | "vertex" | "edge" | "face" | "increment" | "volume";

export interface SnapSettings {
  enabled: boolean; mode: SnapMode;
  translateSnap: number; rotateSnap: number; scaleSnap: number;
  snapToGrid: boolean; snapToVertices: boolean; snapToEdges: boolean; snapToFaces: boolean;
}

export const DEFAULT_SNAP: SnapSettings = {
  enabled: false, mode: "grid",
  translateSnap: 0.5, rotateSnap: 15, scaleSnap: 0.1,
  snapToGrid: true, snapToVertices: false, snapToEdges: false, snapToFaces: false,
};

export function snapValue(value: number, snap: number, enabled: boolean): number {
  if (!enabled || snap <= 0) return value;
  return Math.round(value / snap) * snap;
}

// ====== KEYMAP ======
export interface KeyBinding {
  action: string; key: string;
  ctrl: boolean; shift: boolean; alt: boolean;
  description: string;
}

export const DEFAULT_KEYMAP: KeyBinding[] = [
  { action: "move", key: "w", ctrl: false, shift: false, alt: false, description: "Move tool" },
  { action: "rotate", key: "e", ctrl: false, shift: false, alt: false, description: "Rotate tool" },
  { action: "scale", key: "r", ctrl: false, shift: false, alt: false, description: "Scale tool" },
  { action: "edit-mode", key: "Tab", ctrl: false, shift: false, alt: false, description: "Toggle Edit Mode" },
  { action: "duplicate", key: "d", ctrl: false, shift: true, alt: false, description: "Duplicate selected" },
  { action: "delete", key: "Delete", ctrl: false, shift: false, alt: false, description: "Delete selected" },
  { action: "undo", key: "z", ctrl: true, shift: false, alt: false, description: "Undo" },
  { action: "redo", key: "z", ctrl: true, shift: true, alt: false, description: "Redo" },
  { action: "command-palette", key: "p", ctrl: true, shift: false, alt: false, description: "Command palette" },
  { action: "shortcuts", key: "?", ctrl: false, shift: false, alt: false, description: "Keyboard shortcuts overlay" },
  { action: "select-all", key: "a", ctrl: false, shift: false, alt: false, description: "Select all" },
  { action: "wireframe-toggle", key: "z", ctrl: false, shift: false, alt: false, description: "Toggle wireframe" },
  { action: "view-front", key: "1", ctrl: false, shift: false, alt: false, description: "Front view (Numpad)" },
  { action: "view-right", key: "3", ctrl: false, shift: false, alt: false, description: "Right view (Numpad)" },
  { action: "view-top", key: "7", ctrl: false, shift: false, alt: false, description: "Top view (Numpad)" },
  { action: "view-persp", key: "0", ctrl: false, shift: false, alt: false, description: "Perspective view (Numpad)" },
  { action: "frame-selected", key: ".", ctrl: false, shift: false, alt: false, description: "Frame selected (Numpad)" },
  { action: "save", key: "s", ctrl: true, shift: false, alt: false, description: "Save scene" },
  { action: "open", key: "o", ctrl: true, shift: false, alt: false, description: "Open scene" },
  { action: "new", key: "n", ctrl: true, shift: false, alt: false, description: "New scene" },
];

export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join("+");
}

export function loadKeymap(): KeyBinding[] {
  try { const raw = localStorage.getItem("kandler:keymap"); if (raw) return JSON.parse(raw); } catch {}
  return DEFAULT_KEYMAP;
}

export function saveKeymap(keymap: KeyBinding[]): void {
  try { localStorage.setItem("kandler:keymap", JSON.stringify(keymap)); } catch {}
}

// ====== CRASH RECOVERY (IndexedDB) ======
const DB_NAME = "kandler";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(scene: any, name: string = "autosave"): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: name, timestamp: Date.now(), scene, name, size: JSON.stringify(scene).length });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    try { localStorage.setItem("kandler:autosave", JSON.stringify({ timestamp: Date.now(), scene })); } catch {}
  }
}

export async function loadSession(name: string = "autosave"): Promise<any | null> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(name);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => { db.close(); resolve(req.result?.scene ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    try { const raw = localStorage.getItem("kandler:autosave"); if (raw) { const parsed = JSON.parse(raw); return parsed.scene; } } catch {}
    return null;
  }
}

export async function listSessions(): Promise<{ id: string; name: string; timestamp: number; size: number }[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        db.close();
        const sessions = (req.result as any[]).sort((a, b) => b.timestamp - a.timestamp).map(s => ({ id: s.id, name: s.name, timestamp: s.timestamp, size: s.size }));
        resolve(sessions);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch { return []; }
}

export async function deleteSession(name: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], "readwrite");
    tx.objectStore(STORE_NAME).delete(name);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {}
}

// ====== COMMAND HISTORY ======
export interface Command {
  id: string; description: string;
  execute: () => void; undo: () => void;
}

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxSteps: number = 100;
  onChange?: () => void;

  setMaxSteps(n: number): void { this.maxSteps = n; while (this.undoStack.length > n) this.undoStack.shift(); }

  execute(cmd: Command): void {
    cmd.execute();
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxSteps) this.undoStack.shift();
    this.redoStack = [];
    this.onChange?.();
  }

  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this.redoStack.push(cmd);
    this.onChange?.();
    return true;
  }

  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this.undoStack.push(cmd);
    this.onChange?.();
    return true;
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  clear(): void { this.undoStack = []; this.redoStack = []; this.onChange?.(); }
}

// ====== PREFERENCES ======
export interface Preferences {
  theme: { primary: string; accent: string; background: string; panel: string; text: string };
  viewport: { gridSize: number; gridDivisions: number; fov: number; nearClip: number; farClip: number; antiAliasing: boolean; shadows: boolean };
  keymap: Record<string, string>;
  undoSteps: number;
  autoSaveInterval: number;
  language: "en" | "es" | "fr" | "de" | "ja" | "zh";
}

export const DEFAULT_PREFS: Preferences = {
  theme: { primary: "#a855f7", accent: "#ec4899", background: "#0a0614", panel: "#150b25", text: "#e9d5ff" },
  viewport: { gridSize: 40, gridDivisions: 40, fov: 50, nearClip: 0.05, farClip: 5000, antiAliasing: true, shadows: true },
  keymap: { "move": "w", "rotate": "e", "scale": "r", "edit-mode": "Tab", "duplicate": "Shift+D", "delete": "Delete" },
  undoSteps: 100,
  autoSaveInterval: 30,
  language: "en",
};

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem("kandler:prefs");
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function savePreferences(prefs: Preferences): void {
  try { localStorage.setItem("kandler:prefs", JSON.stringify(prefs)); } catch {}
}
