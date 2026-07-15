"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type {
  SceneState,
  SceneObject,
  MaterialDef,
  Transform,
  PrimitiveKind,
  LightKind,
  ObjectKind,
  GeometryParams,
  ModifierDef,
  ModifierKind,
  Vec3,
  RGB,
} from "./types";
import { DEFAULT_TRANSFORM } from "./types";

function uid(prefix = "obj"): string {
  return `${prefix}_${uuid().slice(0, 8)}`;
}

function defaultMaterial(): MaterialDef {
  return {
    id: uid("mat"),
    name: "Material",
    type: "pbr",
    color: [0.62, 0.32, 0.93], // purple default
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
    metalness: 0.1,
    roughness: 0.55,
    opacity: 1,
    transparent: false,
    wireframe: false,
    flatShading: false,
    doubleSided: false,
    map: null,
    normalMap: null,
    roughnessMap: null,
    toonSteps: 3,
  };
}

function geometryFor(kind: PrimitiveKind): GeometryParams {
  switch (kind) {
    case "cube":
      return { kind, width: 2, height: 2, depth: 2 };
    case "sphere":
      return { kind, radius: 1, segments: 32 };
    case "cylinder":
      return { kind, radiusTop: 1, radiusBottom: 1, height: 2, radialSegments: 32, heightSegments: 1 };
    case "cone":
      return { kind, radius: 1, height: 2, radialSegments: 32, heightSegments: 1 };
    case "torus":
      return { kind, radius: 1, tube: 0.35, radialSegments: 16, tubularSegments: 64, arc: Math.PI * 2 };
    case "torusknot":
      return { kind, radius: 1, tube: 0.3, tubularSegments: 128, radialSegments: 16, p: 2, q: 3 };
    case "plane":
      return { kind, width: 4, height: 4, segments: 1 };
    case "dodecahedron":
      return { kind, radius: 1, detail: 0 };
    case "icosahedron":
      return { kind, radius: 1, detail: 0 };
    case "octahedron":
      return { kind, radius: 1, detail: 0 };
    case "tetrahedron":
      return { kind, radius: 1, detail: 0 };
    case "circle":
      return { kind, radius: 1, segments: 32, thetaStart: 0, thetaLength: Math.PI * 2 };
    case "capsule":
      return { kind, radius: 0.6, height: 1.6, radialSegments: 16, heightSegments: 1 };
    case "teapot":
      return { kind, radius: 1, segments: 10 };
  }
}

function defaultScene(): SceneState {
  const camId = uid("cam");
  const sunId = uid("light");
  const matId = uid("mat");
  const cubeId = uid("mesh");
  const mat = defaultMaterial();
  mat.id = matId;
  mat.color = [0.62, 0.32, 0.93];

  const cube: SceneObject = {
    id: cubeId,
    name: "Cube",
    kind: "mesh",
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM, position: [0, 1, 0] },
    geometry: geometryFor("cube"),
    materialId: matId,
    modifiers: [],
    tracks: [],
    parentId: null,
    children: [],
  };

  const sun: SceneObject = {
    id: sunId,
    name: "Sun",
    kind: "light",
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM, position: [5, 8, 5], rotation: [-Math.PI / 4, Math.PI / 4, 0] },
    light: {
      kind: "directional",
      color: [1, 1, 1],
      intensity: 2.5,
      castShadow: true,
    },
    tracks: [],
    parentId: null,
    children: [],
  };

  const camera: SceneObject = {
    id: camId,
    name: "Camera",
    kind: "camera",
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM, position: [6, 4, 8] },
    camera: { kind: "perspective", fov: 50, near: 0.1, far: 1000 },
    tracks: [],
    parentId: null,
    children: [],
  };

  return {
    version: 1,
    name: "Untitled",
    objects: { [cubeId]: cube, [sunId]: sun, [camId]: camera },
    rootOrder: [cubeId, sunId, camId],
    materials: { [matId]: mat },
    activeCameraId: null, // null = editor camera
    environment: {
      background: [0.05, 0.04, 0.08],
      ambientIntensity: 0.35,
      fog: null,
      gridVisible: true,
      gridColor: [0.35, 0.18, 0.55],
      gridDivisions: 20,
      shadowMapEnabled: true,
      toneMapping: "aces",
      exposure: 1.0,
    },
    animation: {
      fps: 24,
      duration: 5,
      currentTime: 0,
      playing: false,
    },
    ui: {
      transformMode: "translate",
      snapEnabled: false,
      snapTranslate: 0.5,
      snapRotate: 15,
      snapScale: 0.1,
      showStats: true,
      wireframeMode: "off",
      shadingMode: "material",
      editMode: false,
      selectionMode: "object",
      selectTool: "default",
      cursor: [0, 0, 0] as [number, number, number],
      quadView: false,
      showOverlay: true,
      showNormals: false,
      envMapEnabled: true,
      sculptMode: false,
    },
  };
}

export interface KandlerStore {
  scene: SceneState;
  selectedIds: string[];
  history: SceneState[];
  future: SceneState[];
  // actions
  select: (ids: string[], additive?: boolean) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  addObject: (
    kind: ObjectKind,
    opts?: Partial<SceneObject>
  ) => string;
  addPrimitive: (kind: PrimitiveKind) => string;
  addLight: (kind: LightKind) => string;
  addCamera: () => string;
  addGroup: () => string;
  addEmpty: () => string;

  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => string | null;
  renameObject: (id: string, name: string) => void;
  setObjectVisible: (id: string, visible: boolean) => void;
  setObjectLocked: (id: string, locked: boolean) => void;
  reparent: (id: string, parentId: string | null) => void;

  updateTransform: (id: string, t: Partial<Transform>) => void;
  updateTransformField: (id: string, field: keyof Transform, value: Vec3) => void;
  updateGeometry: (id: string, g: Partial<GeometryParams>) => void;
  updateLight: (id: string, l: Partial<NonNullable<SceneObject["light"]>>) => void;
  updateCamera: (id: string, c: Partial<NonNullable<SceneObject["camera"]>>) => void;

  addMaterial: () => string;
  updateMaterial: (id: string, m: Partial<MaterialDef>) => void;
  deleteMaterial: (id: string) => void;
  assignMaterial: (objectId: string, materialId: string) => void;

  addModifier: (objectId: string, kind: ModifierKind) => string;
  updateModifier: (objectId: string, modId: string, patch: Partial<ModifierDef>) => void;
  removeModifier: (objectId: string, modId: string) => void;
  moveModifier: (objectId: string, modId: string, dir: "up" | "down") => void;

  setActiveCamera: (id: string | null) => void;
  updateEnvironment: (e: Partial<SceneState["environment"]>) => void;
  setTransformMode: (m: "translate" | "rotate" | "scale") => void;
  setSnap: (s: Partial<SceneState["ui"]>) => void;
  setAnimation: (a: Partial<SceneState["animation"]>) => void;
  setUI: (u: Partial<SceneState["ui"]>) => void;
  setSceneName: (name: string) => void;
  setCursor: (c: Vec3) => void;
  toggleEditMode: () => void;
  setShadingMode: (m: "wireframe" | "solid" | "material" | "rendered") => void;
  setSelectionMode: (m: "object" | "vertex" | "edge" | "face") => void;
  setSelectTool: (t: "default" | "box" | "lasso" | "cursor" | "measure") => void;
  frameSelected: () => void;
  setView: (v: "front" | "back" | "left" | "right" | "top" | "bottom" | "persp") => void;

  loadScene: (scene: SceneState) => void;
  newScene: () => void;
  serialize: () => string;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

let lastSnapshot = 0;

export const useKandler = create<KandlerStore>((set, get) => ({
  scene: defaultScene(),
  selectedIds: [],
  history: [],
  future: [],

  select: (ids, additive) =>
    set((s) => {
      if (additive) {
        const set2 = new Set([...s.selectedIds, ...ids]);
        return { selectedIds: Array.from(set2) };
      }
      return { selectedIds: ids };
    }),
  toggleSelect: (id) =>
    set((s) => {
      const set2 = new Set(s.selectedIds);
      if (set2.has(id)) set2.delete(id);
      else set2.add(id);
      return { selectedIds: Array.from(set2) };
    }),
  clearSelection: () => set({ selectedIds: [] }),

  addObject: (kind, opts) => {
    get().pushHistory();
    const id = uid(kind);
    const obj: SceneObject = {
      id,
      name: kind.charAt(0).toUpperCase() + kind.slice(1),
      kind,
      visible: true,
      locked: false,
      transform: { ...DEFAULT_TRANSFORM },
      modifiers: [],
      tracks: [],
      parentId: null,
      children: [],
      ...opts,
    };
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [id]: obj },
        rootOrder: [...s.scene.rootOrder, id],
      },
      selectedIds: [id],
    }));
    return id;
  },

  addPrimitive: (kind) => {
    const matId = get().addMaterial();
    const mat = get().scene.materials[matId];
    mat.name = `${kind}Mat`;
    const id = get().addObject("mesh", {
      name: kind.charAt(0).toUpperCase() + kind.slice(1),
      geometry: geometryFor(kind),
      materialId: matId,
    });
    return id;
  },

  addLight: (kind) => {
    return get().addObject("light", {
      name: kind === "directional" ? "Sun" : kind.charAt(0).toUpperCase() + kind.slice(1) + " Light",
      light: {
        kind,
        color: [1, 1, 1],
        intensity: kind === "directional" ? 2.5 : kind === "spot" ? 50 : 25,
        distance: 0,
        angle: kind === "spot" ? Math.PI / 6 : 0,
        penumbra: 0.2,
        decay: 2,
        castShadow: true,
      },
    });
  },

  addCamera: () =>
    get().addObject("camera", {
      name: "Camera",
      camera: { kind: "perspective", fov: 50, near: 0.1, far: 1000 },
    }),

  addGroup: () =>
    get().addObject("group", { name: "Group" }),

  addEmpty: () =>
    get().addObject("empty", { name: "Empty" }),

  deleteObject: (id) => {
    get().pushHistory();
    set((s) => {
      const objs = { ...s.scene.objects };
      // collect descendants
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const oid of Object.keys(objs)) {
          const o = objs[oid];
          if (o.parentId && toDelete.has(o.parentId) && !toDelete.has(oid)) {
            toDelete.add(oid);
            changed = true;
          }
        }
      }
      for (const did of toDelete) delete objs[did];
      // fix parent children arrays
      for (const oid of Object.keys(objs)) {
        const o = objs[oid];
        if (o.children) o.children = o.children.filter((c) => !toDelete.has(c));
      }
      return {
        scene: {
          ...s.scene,
          objects: objs,
          rootOrder: s.scene.rootOrder.filter((r) => !toDelete.has(r)),
          activeCameraId:
            s.scene.activeCameraId && toDelete.has(s.scene.activeCameraId) ? null : s.scene.activeCameraId,
        },
        selectedIds: s.selectedIds.filter((sid) => !toDelete.has(sid)),
      };
    });
  },

  duplicateObject: (id) => {
    const src = get().scene.objects[id];
    if (!src) return null;
    get().pushHistory();
    const newId = uid(src.kind);
    const copy: SceneObject = clone(src);
    copy.id = newId;
    copy.name = src.name + " Copy";
    copy.position = [src.transform.position[0] + 1, src.transform.position[1], src.transform.position[2] + 1];
    copy.children = [];
    copy.parentId = null;
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [newId]: copy },
        rootOrder: [...s.scene.rootOrder, newId],
      },
      selectedIds: [newId],
    }));
    return newId;
  },

  renameObject: (id, name) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [id]: { ...s.scene.objects[id], name } },
      },
    })),

  setObjectVisible: (id, visible) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [id]: { ...s.scene.objects[id], visible } },
      },
    })),

  setObjectLocked: (id, locked) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [id]: { ...s.scene.objects[id], locked } },
      },
    })),

  reparent: (id, parentId) => {
    if (id === parentId) return;
    // prevent cycle
    if (parentId) {
      let p: string | null | undefined = parentId;
      while (p) {
        if (p === id) return;
        p = get().scene.objects[p]?.parentId;
      }
    }
    set((s) => {
      const objs = { ...s.scene.objects };
      const obj = objs[id];
      if (!obj) return {};
      const oldParent = obj.parentId;
      if (oldParent && objs[oldParent]) {
        objs[oldParent] = {
          ...objs[oldParent],
          children: (objs[oldParent].children || []).filter((c) => c !== id),
        };
      }
      if (parentId && objs[parentId]) {
        objs[parentId] = {
          ...objs[parentId],
          children: [...(objs[parentId].children || []), id],
        };
      }
      objs[id] = { ...obj, parentId };
      return {
        scene: {
          ...s.scene,
          objects: objs,
          rootOrder: parentId
            ? s.scene.rootOrder.filter((r) => r !== id)
            : s.scene.rootOrder.includes(id)
              ? s.scene.rootOrder
              : [...s.scene.rootOrder, id],
        },
      };
    });
  },

  updateTransform: (id, t) =>
    set((s) => {
      const o = s.scene.objects[id];
      if (!o) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [id]: { ...o, transform: { ...o.transform, ...t } },
          },
        },
      };
    }),

  updateTransformField: (id, field, value) =>
    set((s) => {
      const o = s.scene.objects[id];
      if (!o) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [id]: { ...o, transform: { ...o.transform, [field]: value } },
          },
        },
      };
    }),

  updateGeometry: (id, g) =>
    set((s) => {
      const o = s.scene.objects[id];
      if (!o || !o.geometry) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [id]: { ...o, geometry: { ...o.geometry, ...g } },
          },
        },
      };
    }),

  updateLight: (id, l) =>
    set((s) => {
      const o = s.scene.objects[id];
      if (!o || !o.light) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [id]: { ...o, light: { ...o.light, ...l } },
          },
        },
      };
    }),

  updateCamera: (id, c) =>
    set((s) => {
      const o = s.scene.objects[id];
      if (!o || !o.camera) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [id]: { ...o, camera: { ...o.camera, ...c } },
          },
        },
      };
    }),

  addMaterial: () => {
    const mat = defaultMaterial();
    set((s) => ({
      scene: {
        ...s.scene,
        materials: { ...s.scene.materials, [mat.id]: mat },
      },
    }));
    return mat.id;
  },

  updateMaterial: (id, m) =>
    set((s) => {
      const old = s.scene.materials[id];
      if (!old) return {};
      return {
        scene: {
          ...s.scene,
          materials: { ...s.scene.materials, [id]: { ...old, ...m } },
        },
      };
    }),

  deleteMaterial: (id) => {
    get().pushHistory();
    set((s) => {
      const mats = { ...s.scene.materials };
      delete mats[id];
      const objs = { ...s.scene.objects };
      for (const oid of Object.keys(objs)) {
        if (objs[oid].materialId === id) objs[oid] = { ...objs[oid], materialId: undefined };
      }
      return { scene: { ...s.scene, materials: mats, objects: objs } };
    });
  },

  assignMaterial: (objectId, materialId) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: { ...s.scene.objects, [objectId]: { ...s.scene.objects[objectId], materialId } },
      },
    })),

  addModifier: (objectId, kind) => {
    const modId = uid("mod");
    const params: Record<string, number | string | boolean> = {};
    switch (kind) {
      case "bevel":
        params.width = 0.1; params.segments = 2; params.profile = 0.5;
        break;
      case "subdivision":
        params.levels = 2;
        break;
      case "mirror":
        params.axis = "x";
        break;
      case "array":
        params.count = 3; params.offsetX = 2; params.offsetY = 0; params.offsetZ = 0;
        break;
      case "boolean":
        params.operation = "union"; params.otherId = "";
        break;
      case "simpleDeform":
        params.mode = "twist"; params.angle = 90;
        break;
      case "wireframe":
        params.thickness = 0.02;
        break;
      case "solidify":
        params.thickness = 0.2;
        break;
      case "decimate":
        params.ratio = 0.5;
        break;
    }
    set((s) => {
      const o = s.scene.objects[objectId];
      if (!o) return {};
      const mods = [...(o.modifiers || []), { id: modId, kind, enabled: true, name: kind, params }];
      return {
        scene: {
          ...s.scene,
          objects: { ...s.scene.objects, [objectId]: { ...o, modifiers: mods } },
        },
      };
    });
    return modId;
  },

  updateModifier: (objectId, modId, patch) =>
    set((s) => {
      const o = s.scene.objects[objectId];
      if (!o || !o.modifiers) return {};
      const mods = o.modifiers.map((m) => (m.id === modId ? { ...m, ...patch } : m));
      return {
        scene: {
          ...s.scene,
          objects: { ...s.scene.objects, [objectId]: { ...o, modifiers: mods } },
        },
      };
    }),

  removeModifier: (objectId, modId) =>
    set((s) => {
      const o = s.scene.objects[objectId];
      if (!o || !o.modifiers) return {};
      return {
        scene: {
          ...s.scene,
          objects: {
            ...s.scene.objects,
            [objectId]: { ...o, modifiers: o.modifiers.filter((m) => m.id !== modId) },
          },
        },
      };
    }),

  moveModifier: (objectId, modId, dir) =>
    set((s) => {
      const o = s.scene.objects[objectId];
      if (!o || !o.modifiers) return {};
      const mods = [...o.modifiers];
      const i = mods.findIndex((m) => m.id === modId);
      if (i === -1) return {};
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= mods.length) return {};
      [mods[i], mods[j]] = [mods[j], mods[i]];
      return {
        scene: {
          ...s.scene,
          objects: { ...s.scene.objects, [objectId]: { ...o, modifiers: mods } },
        },
      };
    }),

  setActiveCamera: (id) => set((s) => ({ scene: { ...s.scene, activeCameraId: id } })),
  updateEnvironment: (e) =>
    set((s) => ({ scene: { ...s.scene, environment: { ...s.scene.environment, ...e } } })),
  setTransformMode: (m) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, transformMode: m } } })),
  setSnap: (sn) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, ...sn } } })),
  setAnimation: (a) => set((s) => ({ scene: { ...s.scene, animation: { ...s.scene.animation, ...a } } })),
  setUI: (u) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, ...u } } })),
  setSceneName: (name) => set((s) => ({ scene: { ...s.scene, name } })),
  setCursor: (c) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, cursor: c } } })),
  toggleEditMode: () => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, editMode: !s.scene.ui.editMode } } })),
  setShadingMode: (m) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, shadingMode: m } } })),
  setSelectionMode: (m) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, selectionMode: m } } })),
  setSelectTool: (t) => set((s) => ({ scene: { ...s.scene, ui: { ...s.scene.ui, selectTool: t } } })),
  frameSelected: () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("kandler:frame-selected")); },
  setView: (v) => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("kandler:set-view", { detail: v })); },

  loadScene: (scene) =>
    set({ scene, selectedIds: [], history: [], future: [] }),

  newScene: () =>
    set({ scene: defaultScene(), selectedIds: [], history: [], future: [] }),

  serialize: () => JSON.stringify(get().scene, null, 2),

  pushHistory: () => {
    const now = Date.now();
    // throttle: don't snapshot more than once per 250ms
    if (now - lastSnapshot < 250) return;
    lastSnapshot = now;
    set((s) => ({ history: [...s.history.slice(-49), clone(s.scene)], future: [] }));
  },

  undo: () =>
    set((s) => {
      if (s.history.length === 0) return {};
      const prev = s.history[s.history.length - 1];
      return {
        scene: prev,
        history: s.history.slice(0, -1),
        future: [clone(s.scene), ...s.future].slice(0, 50),
        selectedIds: [],
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return {};
      const next = s.future[0];
      return {
        scene: next,
        future: s.future.slice(1),
        history: [...s.history, clone(s.scene)],
        selectedIds: [],
      };
    }),
}));

export { defaultMaterial, geometryFor };
