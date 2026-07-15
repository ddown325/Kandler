// Kandler Complete Asset Browser — browse, search, filter, favorite presets.
// Kandler Complete Preferences — theme editor, keymap, viewport, language, import/export.
// Kandler Complete Snapping — vertex, edge, face, grid, increment, volume snapping.
import * as THREE from "three";

// ====== ASSET BROWSER ======
export interface AssetItem {
  id: string;
  name: string;
  category: string;
  type: "mesh" | "material" | "light" | "hdri" | "camera" | "texture" | "modifier" | "shader";
  thumbnail?: string;
  data: any;
  tags: string[];
  favorite: boolean;
  custom: boolean;
}

export class AssetBrowser {
  items: Map<string, AssetItem> = new Map();
  categories: Map<string, string[]> = new Map();
  favorites: Set<string> = new Set();
  customItems: Map<string, AssetItem> = new Map();
  recentItems: string[] = [];
  maxRecent: number = 20;

  addItem(item: AssetItem): void {
    this.items.set(item.id, item);
    if (!this.categories.has(item.type)) this.categories.set(item.type, []);
    if (!this.categories.get(item.type)!.includes(item.category)) {
      this.categories.get(item.type)!.push(item.category);
    }
  }

  removeItem(id: string): void {
    this.items.delete(id);
    this.favorites.delete(id);
    this.customItems.delete(id);
    this.recentItems = this.recentItems.filter(r => r !== id);
  }

  getItem(id: string): AssetItem | undefined {
    return this.items.get(id) ?? this.customItems.get(id);
  }

  getAllItems(): AssetItem[] {
    return [...Array.from(this.items.values()), ...Array.from(this.customItems.values())];
  }

  getItemsByType(type: AssetItem["type"]): AssetItem[] {
    return this.getAllItems().filter(i => i.type === type);
  }

  getItemsByCategory(type: AssetItem["type"], category: string): AssetItem[] {
    return this.getItemsByType(type).filter(i => i.category === category);
  }

  getCategories(type: AssetItem["type"]): string[] {
    return this.categories.get(type) ?? [];
  }

  getTypes(): AssetItem["type"][] {
    return Array.from(this.categories.keys()) as AssetItem["type"][];
  }

  search(query: string): AssetItem[] {
    const q = query.toLowerCase();
    return this.getAllItems().filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  toggleFavorite(id: string): void {
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
  }

  getFavorites(): AssetItem[] {
    return this.getAllItems().filter(i => this.favorites.has(i.id));
  }

  addCustomItem(item: AssetItem): void {
    item.custom = true;
    this.customItems.set(item.id, item);
  }

  addRecent(id: string): void {
    this.recentItems = [id, ...this.recentItems.filter(r => r !== id)].slice(0, this.maxRecent);
  }

  getRecent(): AssetItem[] {
    return this.recentItems.map(id => this.getItem(id)).filter(Boolean) as AssetItem[];
  }

  exportLibrary(): string {
    return JSON.stringify({
      items: Array.from(this.items.values()),
      customItems: Array.from(this.customItems.values()),
      favorites: Array.from(this.favorites),
      categories: Array.from(this.categories.entries()),
    }, null, 2);
  }

  importLibrary(json: string): void {
    try {
      const data = JSON.parse(json);
      this.items.clear();
      this.customItems.clear();
      this.favorites.clear();
      this.categories.clear();
      for (const item of data.items ?? []) this.items.set(item.id, item);
      for (const item of data.customItems ?? []) this.customItems.set(item.id, item);
      for (const fav of data.favorites ?? []) this.favorites.add(fav);
      for (const [type, cats] of data.categories ?? []) this.categories.set(type, cats);
    } catch {}
  }

  clear(): void {
    this.items.clear();
    this.customItems.clear();
    this.favorites.clear();
    this.categories.clear();
    this.recentItems = [];
  }
}

// ====== PREFERENCES SYSTEM ======
export interface Preferences {
  theme: {
    primary: string;
    accent: string;
    background: string;
    panel: string;
    panelLight: string;
    text: string;
    textMuted: string;
    border: string;
  };
  viewport: {
    gridSize: number;
    gridDivisions: number;
    fov: number;
    nearClip: number;
    farClip: number;
    antiAliasing: boolean;
    shadows: boolean;
    shadowMapSize: number;
    toneMapping: string;
    exposure: number;
  };
  keymap: Record<string, string>;
  undoSteps: number;
  autoSaveInterval: number;
  language: "en" | "es" | "fr" | "de" | "ja" | "zh";
  showStats: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showOverlay: boolean;
  defaultMaterial: {
    type: string;
    color: [number, number, number];
    metalness: number;
    roughness: number;
  };
  render: {
    width: number;
    height: number;
    format: string;
    quality: number;
    samples: number;
  };
  sculpt: {
    defaultBrush: string;
    defaultSize: number;
    defaultStrength: number;
    defaultFalloff: number;
  };
  animation: {
    fps: number;
    defaultDuration: number;
    autoKey: boolean;
  };
}

export const DEFAULT_PREFS: Preferences = {
  theme: { primary: "#a855f7", accent: "#ec4899", background: "#0a0614", panel: "#150b25", panelLight: "#1a0e2e", text: "#e9d5ff", textMuted: "#a78bfa", border: "#7c3aed40" },
  viewport: { gridSize: 40, gridDivisions: 40, fov: 50, nearClip: 0.05, farClip: 5000, antiAliasing: true, shadows: true, shadowMapSize: 2048, toneMapping: "aces", exposure: 1.0 },
  keymap: { "move": "w", "rotate": "e", "scale": "r", "edit-mode": "Tab", "duplicate": "Shift+D", "delete": "Delete", "undo": "Ctrl+Z", "redo": "Ctrl+Shift+Z", "command-palette": "Ctrl+P", "shortcuts": "?", "select-all": "a", "wireframe-toggle": "z", "save": "Ctrl+S", "open": "Ctrl+O", "new": "Ctrl+N" },
  undoSteps: 100,
  autoSaveInterval: 30,
  language: "en",
  showStats: true,
  showGrid: true,
  showAxes: true,
  showOverlay: true,
  defaultMaterial: { type: "pbr", color: [0.62, 0.32, 0.93], metalness: 0.1, roughness: 0.55 },
  render: { width: 1920, height: 1080, format: "png", quality: 90, samples: 4 },
  sculpt: { defaultBrush: "draw", defaultSize: 0.5, defaultStrength: 0.3, defaultFalloff: 0.5 },
  animation: { fps: 24, defaultDuration: 5, autoKey: true },
};

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem("kandler:prefs");
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        ...DEFAULT_PREFS,
        ...saved,
        theme: { ...DEFAULT_PREFS.theme, ...saved.theme },
        viewport: { ...DEFAULT_PREFS.viewport, ...saved.viewport },
        keymap: { ...DEFAULT_PREFS.keymap, ...saved.keymap },
        defaultMaterial: { ...DEFAULT_PREFS.defaultMaterial, ...saved.defaultMaterial },
        render: { ...DEFAULT_PREFS.render, ...saved.render },
        sculpt: { ...DEFAULT_PREFS.sculpt, ...saved.sculpt },
        animation: { ...DEFAULT_PREFS.animation, ...saved.animation },
      };
    }
  } catch {}
  return DEFAULT_PREFS;
}

export function savePreferences(prefs: Preferences): void {
  try { localStorage.setItem("kandler:prefs", JSON.stringify(prefs)); } catch {}
}

export function resetPreferences(): Preferences {
  localStorage.removeItem("kandler:prefs");
  return DEFAULT_PREFS;
}

export function exportPreferences(prefs: Preferences): string {
  return JSON.stringify(prefs, null, 2);
}

export function importPreferences(json: string): Preferences {
  try {
    const parsed = JSON.parse(json);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch { return DEFAULT_PREFS; }
}

// ====== SNAPPING SYSTEM ======
export type SnapTarget = "grid" | "vertex" | "edge" | "face" | "increment" | "volume" | "none";
export type SnapElement = "closest" | "center" | "median" | "active";

export interface SnapSettings {
  enabled: boolean;
  target: SnapTarget;
  element: SnapElement;
  translateSnap: number;
  rotateSnap: number;
  scaleSnap: number;
  absoluteGrid: boolean;
  projectOnto: "ground" | "object" | "none";
  snapRotate: boolean;
  snapScale: boolean;
  snapTranslate: boolean;
  snapMixed: boolean;
  affect: "origin" | "center" | "median" | "closest";
}

export const DEFAULT_SNAP: SnapSettings = {
  enabled: false, target: "grid", element: "closest",
  translateSnap: 0.5, rotateSnap: 15, scaleSnap: 0.1,
  absoluteGrid: false, projectOnto: "none",
  snapRotate: true, snapScale: true, snapTranslate: true, snapMixed: false,
  affect: "closest",
};

export function snapValue(value: number, snap: number, enabled: boolean): number {
  if (!enabled || snap <= 0) return value;
  return Math.round(value / snap) * snap;
}

export function snapVector(v: THREE.Vector3, settings: SnapSettings): THREE.Vector3 {
  if (!settings.enabled || !settings.snapTranslate) return v;
  return new THREE.Vector3(
    snapValue(v.x, settings.translateSnap, settings.target === "grid" || settings.target === "increment"),
    snapValue(v.y, settings.translateSnap, settings.target === "grid" || settings.target === "increment"),
    snapValue(v.z, settings.translateSnap, settings.target === "grid" || settings.target === "increment"),
  );
}

export function snapAngle(angle: number, settings: SnapSettings): number {
  return snapValue(angle, (settings.rotateSnap * Math.PI) / 180, settings.enabled && settings.snapRotate);
}

export function snapScaleValue(scale: number, settings: SnapSettings): number {
  return snapValue(scale, settings.scaleSnap, settings.enabled && settings.snapScale);
}

export function snapToGrid(point: THREE.Vector3, gridSize: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.round(point.x / gridSize) * gridSize,
    Math.round(point.y / gridSize) * gridSize,
    Math.round(point.z / gridSize) * gridSize,
  );
}

export function snapToVertex(point: THREE.Vector3, vertices: THREE.Vector3[], threshold: number): THREE.Vector3 {
  let closest = point.clone();
  let minDist = threshold;
  for (const v of vertices) {
    const d = point.distanceTo(v);
    if (d < minDist) { minDist = d; closest = v.clone(); }
  }
  return closest;
}

export function snapToEdge(point: THREE.Vector3, edgeStart: THREE.Vector3, edgeEnd: THREE.Vector3, threshold: number): THREE.Vector3 {
  const ab = edgeEnd.clone().sub(edgeStart);
  const t = THREE.MathUtils.clamp(point.clone().sub(edgeStart).dot(ab) / ab.lengthSq(), 0, 1);
  const projected = edgeStart.clone().add(ab.multiplyScalar(t));
  const d = point.distanceTo(projected);
  return d < threshold ? projected : point;
}

export function snapToFace(point: THREE.Vector3, v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, threshold: number): THREE.Vector3 {
  const edge1 = v1.clone().sub(v0);
  const edge2 = v2.clone().sub(v0);
  const normal = edge1.cross(edge2).normalize();
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, v0);
  const projected = point.clone();
  plane.projectPoint(point, projected);
  const d = point.distanceTo(projected);
  return d < threshold ? projected : point;
}

export function snapToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function snapToVolumeCenter(points: THREE.Vector3[]): THREE.Vector3 {
  if (points.length === 0) return new THREE.Vector3();
  const center = new THREE.Vector3();
  for (const p of points) center.add(p);
  center.divideScalar(points.length);
  return center;
}

export function snapToMedian(points: THREE.Vector3[]): THREE.Vector3 {
  if (points.length === 0) return new THREE.Vector3();
  const sorted = points.map(p => p.clone()).sort((a, b) => a.x - b.x);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? sorted[mid - 1].lerp(sorted[mid], 0.5)
    : sorted[mid];
}

export function snapToActive(active: THREE.Vector3): THREE.Vector3 {
  return active.clone();
}

export function getSnapTarget(settings: SnapSettings): string {
  if (!settings.enabled) return "None";
  switch (settings.target) {
    case "grid": return "Grid";
    case "vertex": return "Vertex";
    case "edge": return "Edge";
    case "face": return "Face";
    case "increment": return "Increment";
    case "volume": return "Volume";
    case "none": return "None";
  }
}

export function getSnapDescription(settings: SnapSettings): string {
  if (!settings.enabled) return "Snapping disabled";
  const parts: string[] = [];
  parts.push(`Target: ${getSnapTarget(settings)}`);
  parts.push(`Element: ${settings.element}`);
  if (settings.snapTranslate) parts.push(`Translate: ${settings.translateSnap}`);
  if (settings.snapRotate) parts.push(`Rotate: ${settings.rotateSnap}°`);
  if (settings.snapScale) parts.push(`Scale: ${settings.scaleSnap}`);
  if (settings.absoluteGrid) parts.push("Absolute grid");
  if (settings.projectOnto !== "none") parts.push(`Project: ${settings.projectOnto}`);
  return parts.join(", ");
}

// ====== KEYMAP SYSTEM ======
export interface KeyBinding {
  action: string;
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  description: string;
  category: string;
}

export const DEFAULT_KEYMAP: KeyBinding[] = [
  { action: "move", key: "w", ctrl: false, shift: false, alt: false, description: "Move tool", category: "Tools" },
  { action: "rotate", key: "e", ctrl: false, shift: false, alt: false, description: "Rotate tool", category: "Tools" },
  { action: "scale", key: "r", ctrl: false, shift: false, alt: false, description: "Scale tool", category: "Tools" },
  { action: "edit-mode", key: "Tab", ctrl: false, shift: false, alt: false, description: "Toggle Edit Mode", category: "Mode" },
  { action: "sculpt-mode", key: "Tab", ctrl: false, shift: true, alt: false, description: "Toggle Sculpt Mode", category: "Mode" },
  { action: "duplicate", key: "d", ctrl: false, shift: true, alt: false, description: "Duplicate selected", category: "Edit" },
  { action: "delete", key: "Delete", ctrl: false, shift: false, alt: false, description: "Delete selected", category: "Edit" },
  { action: "undo", key: "z", ctrl: true, shift: false, alt: false, description: "Undo", category: "Edit" },
  { action: "redo", key: "z", ctrl: true, shift: true, alt: false, description: "Redo", category: "Edit" },
  { action: "command-palette", key: "p", ctrl: true, shift: false, alt: false, description: "Command palette", category: "UI" },
  { action: "shortcuts", key: "?", ctrl: false, shift: false, alt: false, description: "Shortcuts overlay", category: "UI" },
  { action: "select-all", key: "a", ctrl: false, shift: false, alt: false, description: "Select all", category: "Selection" },
  { action: "deselect-all", key: "a", ctrl: false, shift: true, alt: false, description: "Deselect all", category: "Selection" },
  { action: "invert-selection", key: "i", ctrl: false, shift: true, alt: false, description: "Invert selection", category: "Selection" },
  { action: "wireframe-toggle", key: "z", ctrl: false, shift: false, alt: false, description: "Toggle wireframe", category: "View" },
  { action: "view-front", key: "1", ctrl: false, shift: false, alt: false, description: "Front view", category: "View" },
  { action: "view-right", key: "3", ctrl: false, shift: false, alt: false, description: "Right view", category: "View" },
  { action: "view-top", key: "7", ctrl: false, shift: false, alt: false, description: "Top view", category: "View" },
  { action: "view-persp", key: "0", ctrl: false, shift: false, alt: false, description: "Perspective view", category: "View" },
  { action: "frame-selected", key: ".", ctrl: false, shift: false, alt: false, description: "Frame selected", category: "View" },
  { action: "save", key: "s", ctrl: true, shift: false, alt: false, description: "Save scene", category: "File" },
  { action: "open", key: "o", ctrl: true, shift: false, alt: false, description: "Open scene", category: "File" },
  { action: "new", key: "n", ctrl: true, shift: false, alt: false, description: "New scene", category: "File" },
  { action: "extrude", key: "e", ctrl: false, shift: false, alt: false, description: "Extrude (Edit Mode)", category: "Mesh" },
  { action: "inset", key: "i", ctrl: false, shift: false, alt: false, description: "Inset faces (Edit Mode)", category: "Mesh" },
  { action: "bevel", key: "b", ctrl: true, shift: false, alt: false, description: "Bevel edges (Edit Mode)", category: "Mesh" },
  { action: "loop-cut", key: "r", ctrl: true, shift: false, alt: false, description: "Loop cut (Edit Mode)", category: "Mesh" },
  { action: "subdivide", key: "w", ctrl: false, shift: false, alt: false, description: "Subdivide (Edit Mode)", category: "Mesh" },
  { action: "grab", key: "g", ctrl: false, shift: false, alt: false, description: "Grab/move selected", category: "Transform" },
  { action: "nudge-up", key: "ArrowUp", ctrl: false, shift: false, alt: false, description: "Nudge up", category: "Transform" },
  { action: "nudge-down", key: "ArrowDown", ctrl: false, shift: false, alt: false, description: "Nudge down", category: "Transform" },
  { action: "nudge-left", key: "ArrowLeft", ctrl: false, shift: false, alt: false, description: "Nudge left", category: "Transform" },
  { action: "nudge-right", key: "ArrowRight", ctrl: false, shift: false, alt: false, description: "Nudge right", category: "Transform" },
  { action: "fly-mode", key: "f", ctrl: false, shift: true, alt: false, description: "Toggle fly mode", category: "Camera" },
  { action: "quad-view", key: "q", ctrl: true, shift: true, alt: false, description: "Toggle quad view", category: "View" },
  { action: "shade-smooth", key: "s", ctrl: false, shift: true, alt: false, description: "Shade smooth", category: "Mesh" },
  { action: "shade-flat", key: "f", ctrl: false, shift: true, alt: false, description: "Shade flat", category: "Mesh" },
  { action: "merge-vertices", key: "m", ctrl: false, shift: false, alt: false, description: "Merge vertices", category: "Mesh" },
  { action: "fill", key: "f", ctrl: false, shift: false, alt: false, description: "Fill (Edit Mode)", category: "Mesh" },
  { action: "snap-menu", key: "s", ctrl: false, shift: true, alt: false, description: "Snap menu", category: "Edit" },
  { action: "proportional-editing", key: "o", ctrl: false, shift: false, alt: false, description: "Toggle proportional editing", category: "Edit" },
  { action: "toggle-x-ray", key: "z", ctrl: false, shift: true, alt: false, description: "Toggle X-ray", category: "View" },
  { action: "local-global", key: "l", ctrl: false, shift: false, alt: false, description: "Toggle local/global", category: "Transform" },
  { action: "add-cube", key: "1", ctrl: false, shift: true, alt: false, description: "Add cube", category: "Add" },
  { action: "add-sphere", key: "2", ctrl: false, shift: true, alt: false, description: "Add sphere", category: "Add" },
  { action: "add-cylinder", key: "3", ctrl: false, shift: true, alt: false, description: "Add cylinder", category: "Add" },
  { action: "add-cone", key: "4", ctrl: false, shift: true, alt: false, description: "Add cone", category: "Add" },
  { action: "add-torus", key: "5", ctrl: false, shift: true, alt: false, description: "Add torus", category: "Add" },
  { action: "add-plane", key: "6", ctrl: false, shift: true, alt: false, description: "Add plane", category: "Add" },
  { action: "add-suzanne", key: "7", ctrl: false, shift: true, alt: false, description: "Add Kitsune", category: "Add" },
  { action: "add-light", key: "l", ctrl: false, shift: true, alt: false, description: "Add light", category: "Add" },
  { action: "add-camera", key: "c", ctrl: false, shift: true, alt: false, description: "Add camera", category: "Add" },
];

export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join("+");
}

export function matchKeyBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
  const key = e.key.toLowerCase();
  const bindingKey = binding.key.toLowerCase();
  if (key !== bindingKey) return false;
  if (e.ctrlKey !== binding.ctrl) return false;
  if (e.shiftKey !== binding.shift) return false;
  if (e.altKey !== binding.alt) return false;
  return true;
}

export function loadKeymap(): KeyBinding[] {
  try {
    const raw = localStorage.getItem("kandler:keymap");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_KEYMAP;
}

export function saveKeymap(keymap: KeyBinding[]): void {
  try { localStorage.setItem("kandler:keymap", JSON.stringify(keymap)); } catch {}
}

export function getKeyBindingCategories(): string[] {
  return Array.from(new Set(DEFAULT_KEYMAP.map(k => k.category)));
}

export function getKeyBindingsByCategory(category: string): KeyBinding[] {
  return DEFAULT_KEYMAP.filter(k => k.category === category);
}

export function getKeyBindingByAction(action: string): KeyBinding | undefined {
  return DEFAULT_KEYMAP.find(k => k.action === action);
}
