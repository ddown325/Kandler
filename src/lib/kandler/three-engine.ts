"use client";

import * as THREE from "three";
import { RoomEnvironment } from "three-stdlib";
import type {
  SceneState,
  SceneObject,
  MaterialDef,
  GeometryParams,
  Transform,
  RGB,
} from "../types";
import { applyModifiers } from "./modifiers-v2";
import { buildSuzanne } from "./kitsune";
import { useKandler } from "./store";

function rgbToColor([r, g, b]: RGB): THREE.Color {
  return new THREE.Color(r, g, b);
}

export function buildGeometry(params: GeometryParams): THREE.BufferGeometry {
  switch (params.kind) {
    case "cube":
      return new THREE.BoxGeometry(params.width ?? 2, params.height ?? 2, params.depth ?? 2);
    case "sphere":
      return new THREE.SphereGeometry(params.radius ?? 1, params.segments ?? 32, Math.max(2, (params.segments ?? 32) / 2));
    case "cylinder":
      return new THREE.CylinderGeometry(
        params.radiusTop ?? 1, params.radiusBottom ?? 1,
        params.height ?? 2, params.radialSegments ?? 32, params.heightSegments ?? 1,
      );
    case "cone":
      return new THREE.ConeGeometry(params.radius ?? 1, params.height ?? 2, params.radialSegments ?? 32, params.heightSegments ?? 1);
    case "torus":
      return new THREE.TorusGeometry(params.radius ?? 1, params.tube ?? 0.35, params.radialSegments ?? 16, params.tubularSegments ?? 64, params.arc ?? Math.PI * 2);
    case "torusknot":
      return new THREE.TorusKnotGeometry(params.radius ?? 1, params.tube ?? 0.3, params.tubularSegments ?? 128, params.radialSegments ?? 16, params.p ?? 2, params.q ?? 3);
    case "plane":
      return new THREE.PlaneGeometry(params.width ?? 4, params.height ?? 4, params.segments ?? 1, params.segments ?? 1);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(params.radius ?? 1, params.detail ?? 0);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(params.radius ?? 1, params.detail ?? 0);
    case "octahedron":
      return new THREE.OctahedronGeometry(params.radius ?? 1, params.detail ?? 0);
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(params.radius ?? 1, params.detail ?? 0);
    case "circle":
      return new THREE.CircleGeometry(params.radius ?? 1, params.segments ?? 32, params.thetaStart ?? 0, params.thetaLength ?? Math.PI * 2);
    case "capsule":
      return new THREE.CapsuleGeometry(params.radius ?? 0.6, Math.max(0.01, (params.height ?? 1.6) - 2 * (params.radius ?? 0.6)), params.radialSegments ?? 16, params.heightSegments ?? 1);
    case "teapot":
      return new THREE.SphereGeometry(params.radius ?? 1, 16, 12);
    case "suzanne":
      return buildSuzanne(params.radius ?? 1);
    case "grid":
      return new THREE.PlaneGeometry(params.width ?? 4, params.height ?? 4, params.segments ?? 8, params.segments ?? 8);
    case "tube": {
      const path = new THREE.CatmullRomCurve3(
        Array.from({ length: 8 }, (_, i) => {
          const t = i / 7;
          const a = t * (params.arc ?? Math.PI * 2);
          return new THREE.Vector3(Math.cos(a) * (params.radius ?? 0.5), Math.sin(a) * (params.radius ?? 0.5), 0);
        }),
      );
      return new THREE.TubeGeometry(path, params.tubularSegments ?? 64, params.tube ?? 0.1, params.radialSegments ?? 12, false);
    }
    case "helix": {
      const path = new THREE.CatmullRomCurve3(
        Array.from({ length: 64 }, (_, i) => {
          const t = i / 63;
          const a = t * Math.PI * 6;
          return new THREE.Vector3(Math.cos(a) * (params.radius ?? 0.5), t * 2 - 1, Math.sin(a) * (params.radius ?? 0.5));
        }),
      );
      return new THREE.TubeGeometry(path, params.tubularSegments ?? 64, params.tube ?? 0.1, params.radialSegments ?? 8, false);
    }
  }
}

export function buildMaterial(mat: MaterialDef, wireframeOverride = false): THREE.Material {
  if (mat.type === "wireframe" || wireframeOverride) {
    return new THREE.MeshBasicMaterial({ color: rgbToColor(mat.color), wireframe: true });
  }
  if (mat.type === "normal") {
    return new THREE.MeshNormalMaterial({ wireframe: mat.wireframe, flatShading: mat.flatShading });
  }
  if (mat.type === "toon") {
    return new THREE.MeshToonMaterial({
      color: rgbToColor(mat.color),
      emissive: rgbToColor(mat.emissive),
      wireframe: mat.wireframe,
    });
  }
  if (mat.type === "basic") {
    return new THREE.MeshBasicMaterial({
      color: rgbToColor(mat.color),
      wireframe: mat.wireframe,
      transparent: mat.transparent,
      opacity: mat.opacity,
      side: mat.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  if (mat.type === "standard") {
    return new THREE.MeshStandardMaterial({
      color: rgbToColor(mat.color),
      emissive: rgbToColor(mat.emissive),
      emissiveIntensity: mat.emissiveIntensity,
      metalness: 0,
      roughness: mat.roughness,
      wireframe: mat.wireframe,
      transparent: mat.transparent,
      opacity: mat.opacity,
      flatShading: mat.flatShading,
      side: mat.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  // pbr
  return new THREE.MeshStandardMaterial({
    color: rgbToColor(mat.color),
    emissive: rgbToColor(mat.emissive),
    emissiveIntensity: mat.emissiveIntensity,
    metalness: mat.metalness,
    roughness: mat.roughness,
    wireframe: mat.wireframe,
    transparent: mat.transparent,
    opacity: mat.opacity,
    flatShading: mat.flatShading,
    side: mat.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function applyTransform(obj: THREE.Object3D, t: Transform) {
  obj.position.set(t.position[0], t.position[1], t.position[2]);
  obj.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2]);
  obj.scale.set(t.scale[0], t.scale[1], t.scale[2]);
}

// Re-export for backwards compatibility (exporters import from here)
export { applyModifiers };

export class ThreeEngine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  editorCamera: THREE.PerspectiveCamera;
  orbit: OrbitState;
  transformControls: TransformControlsLite;
  grid: THREE.GridHelper;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  objectMap = new Map<string, THREE.Object3D>();
  container: HTMLElement;
  raf = 0;
  disposed = false;
  statsCallback?: (fps: number, drawCalls: number, tris: number) => void;
  lastStatsTime = 0;
  frames = 0;
  activeCameraId: string | null = null;
  sceneCameras: { id: string; camera: THREE.PerspectiveCamera | THREE.OrthographicCamera }[] = [];
  onSelect?: (id: string, additive: boolean) => void;
  onTransformChange?: (id: string, transform: Transform) => void;
  onCursorMove?: (pos: [number, number, number]) => void;
  onBoxSelect?: (ids: string[]) => void;
  selectedIds: string[] = [];
  envMap: THREE.Texture | null = null;
  shadowsEnabled = true;
  cursor3D: THREE.Mesh;
  boxSelectDiv: HTMLDivElement;
  boxSelectStart: { x: number; y: number } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";

    this.scene = new THREE.Scene();
    this.editorCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
    this.editorCamera.position.set(6, 4, 8);
    this.editorCamera.lookAt(0, 1, 0);

    // Environment map for PBR reflections
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.envMap = pmrem.fromScene(new RoomEnvironment(this.renderer), 0.04).texture;
      this.scene.environment = this.envMap;
      pmrem.dispose();
    } catch (e) {
      console.warn("Env map failed:", e);
    }

    this.ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0xb39bff, 0x080820, 0.45);
    this.scene.add(this.hemi);

    this.grid = new THREE.GridHelper(40, 40, 0x8b5cf6, 0x4c1d95);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.35;
    this.scene.add(this.grid);

    // invisible ground for shadows
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.25 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.name = "__shadow_ground";
    this.scene.add(ground);

    this.orbit = new OrbitState(this.editorCamera, container);
    this.transformControls = new TransformControlsLite(this.editorCamera, container, this.orbit);
    this.transformControls.onChange = () => {
      const o = this.transformControls.attached[0];
      if (!o) return;
      const id = (o.userData as any).objectId as string;
      if (!id) return;
      this.onTransformChange?.(id, {
        position: [o.position.x, o.position.y, o.position.z],
        rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
        scale: [o.scale.x, o.scale.y, o.scale.z],
      });
    };

    // 3D cursor
    const cursorGeo = new THREE.SphereGeometry(0.05, 16, 12);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xff3355, depthTest: false, transparent: true, opacity: 0.9 });
    this.cursor3D = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursor3D.renderOrder = 999;
    this.cursor3D.name = "__cursor";
    this.scene.add(this.cursor3D);

    // Box select overlay
    this.boxSelectDiv = document.createElement("div");
    this.boxSelectDiv.style.cssText = "position:absolute;border:1px solid #a855f7;background:rgba(168,85,247,0.15);pointer-events:none;display:none;z-index:10;";
    container.appendChild(this.boxSelectDiv);

    // resize observer
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this._ro = ro;

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("kandler:nudge", this.onNudge as any);
    window.addEventListener("kandler:frame-selected", this.onFrameSelected);
    window.addEventListener("kandler:set-view", this.onSetView);

    this.animate();
  }

  _ro?: ResizeObserver;

  resize() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h);
    this.editorCamera.aspect = w / h;
    this.editorCamera.updateProjectionMatrix();
    for (const { camera } of this.sceneCameras) {
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        (camera as THREE.PerspectiveCamera).aspect = w / h;
        camera.updateProjectionMatrix();
      } else {
        const ortho = camera as THREE.OrthographicCamera;
        const s = (ortho.top - ortho.bottom) / 2;
        ortho.left = -s * (w / h);
        ortho.right = s * (w / h);
        ortho.updateProjectionMatrix();
      }
    }
  }

  setSelected(ids: string[]) {
    this.selectedIds = ids;
    this.transformControls.attach(ids.map((id) => this.objectMap.get(id)).filter(Boolean) as THREE.Object3D[]);
  }

  setTransformMode(mode: "translate" | "rotate" | "scale") {
    this.transformControls.setMode(mode);
  }

  setSnap(enabled: boolean, t: number, r: number, s: number) {
    this.transformControls.snapTranslate = enabled ? t : 0;
    this.transformControls.snapRotate = enabled ? (r * Math.PI) / 180 : 0;
    this.transformControls.snapScale = enabled ? s : 0;
  }

  onPointerDown = (e: PointerEvent) => {
    if (this.transformControls.dragging) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.activeCamera());

    // Right-click = move 3D cursor
    if (e.button === 2) {
      const meshes: THREE.Object3D[] = [];
      this.objectMap.forEach((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o); });
      const hits = this.raycaster.intersectObjects(meshes, false);
      let pos: THREE.Vector3;
      if (hits.length > 0) {
        pos = hits[0].point.clone();
      } else {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const p = new THREE.Vector3();
        pos = this.raycaster.ray.intersectPlane(plane, p) || new THREE.Vector3();
      }
      this.cursor3D.position.copy(pos);
      this.onCursorMove?.([pos.x, pos.y, pos.z]);
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return;

    // Shift+drag = box select
    if (e.shiftKey) {
      this.boxSelectStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.boxSelectDiv.style.display = "block";
      this.boxSelectDiv.style.left = `${this.boxSelectStart.x}px`;
      this.boxSelectDiv.style.top = `${this.boxSelectStart.y}px`;
      this.boxSelectDiv.style.width = "0px";
      this.boxSelectDiv.style.height = "0px";
      return;
    }

    // Normal pick
    const meshes: THREE.Object3D[] = [];
    const idMap = new Map<THREE.Object3D, string>();
    this.objectMap.forEach((o, id) => {
      if ((o as THREE.Mesh).isMesh) {
        meshes.push(o);
        idMap.set(o, id);
      }
    });
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const id = idMap.get(hits[0].object);
      if (id && this.onSelect) this.onSelect(id, e.shiftKey);
    } else {
      if (this.onSelect) this.onSelect("", e.shiftKey);
    }
  };

  onPointerMove = (e: PointerEvent) => {
    if (!this.boxSelectStart) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const minX = Math.min(this.boxSelectStart.x, x);
    const minY = Math.min(this.boxSelectStart.y, y);
    const w = Math.abs(x - this.boxSelectStart.x);
    const h = Math.abs(y - this.boxSelectStart.y);
    this.boxSelectDiv.style.left = `${minX}px`;
    this.boxSelectDiv.style.top = `${minY}px`;
    this.boxSelectDiv.style.width = `${w}px`;
    this.boxSelectDiv.style.height = `${h}px`;
  };

  onPointerUp = (e: PointerEvent) => {
    if (!this.boxSelectStart) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const minX = Math.min(this.boxSelectStart.x, x);
    const minY = Math.min(this.boxSelectStart.y, y);
    const maxX = Math.max(this.boxSelectStart.x, x);
    const maxY = Math.max(this.boxSelectStart.y, y);
    this.boxSelectDiv.style.display = "none";
    this.boxSelectStart = null;
    if (maxX - minX < 4 && maxY - minY < 4) return;
    const cam = this.activeCamera();
    const selected: string[] = [];
    this.objectMap.forEach((o, id) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const pos = new THREE.Vector3();
      o.getWorldPosition(pos);
      pos.project(cam);
      const sx = ((pos.x + 1) / 2) * rect.width;
      const sy = ((-pos.y + 1) / 2) * rect.height;
      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) selected.push(id);
    });
    this.onBoxSelect?.(selected);
  };

  onFrameSelected = () => {
    const objs = this.selectedIds.map((id) => this.objectMap.get(id)).filter(Boolean) as THREE.Object3D[];
    if (objs.length > 0) this.orbit.frame(objs);
  };

  onSetView = (e: Event) => {
    const v = (e as CustomEvent).detail as "front" | "back" | "left" | "right" | "top" | "bottom" | "persp";
    this.orbit.setView(v);
  };

  onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
    if (e.key === "w" || e.key === "W") this.transformControls.setMode("translate");
    else if (e.key === "e" || e.key === "E") this.transformControls.setMode("rotate");
    else if (e.key === "r" || e.key === "R") this.transformControls.setMode("scale");
  };

  onNudge = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const { key, mode, step, rotStep, selectedIds } = detail;
    const cam = this.activeCamera();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    cam.matrix.extractBasis(right, up, new THREE.Vector3());
    right.y = 0; right.normalize();
    up.y = 0; up.normalize();
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    if (up.lengthSq() < 0.001) up.set(0, 0, 1);

    const store = useKandler.getState();
    store.pushHistory();

    for (const id of selectedIds) {
      const sceneObj = store.scene.objects[id];
      if (!sceneObj) continue;
      if (mode === "translate") {
        let dx = 0, dz = 0;
        if (key === "ArrowUp") { dx += right.x * step; dz += right.z * step; }
        else if (key === "ArrowDown") { dx -= right.x * step; dz -= right.z * step; }
        else if (key === "ArrowLeft") { dx -= up.x * step; dz -= up.z * step; }
        else if (key === "ArrowRight") { dx += up.x * step; dz += up.z * step; }
        store.updateTransformField(id, "position", [
          sceneObj.transform.position[0] + dx,
          sceneObj.transform.position[1],
          sceneObj.transform.position[2] + dz,
        ]);
      } else if (mode === "rotate") {
        let drx = 0, dry = 0;
        if (key === "ArrowUp") drx = -rotStep;
        else if (key === "ArrowDown") drx = rotStep;
        else if (key === "ArrowLeft") dry = -rotStep;
        else if (key === "ArrowRight") dry = rotStep;
        store.updateTransformField(id, "rotation", [
          sceneObj.transform.rotation[0] + drx,
          sceneObj.transform.rotation[1] + dry,
          sceneObj.transform.rotation[2],
        ]);
      } else if (mode === "scale") {
        const s = step * 10;
        let ds = 0;
        if (key === "ArrowUp") ds = s;
        else if (key === "ArrowDown") ds = -s;
        store.updateTransformField(id, "scale", [
          Math.max(0.001, sceneObj.transform.scale[0] + ds),
          Math.max(0.001, sceneObj.transform.scale[1] + ds),
          Math.max(0.001, sceneObj.transform.scale[2] + ds),
        ]);
      }
    }
  };

  activeCamera(): THREE.Camera {
    if (this.activeCameraId) {
      const c = this.sceneCameras.find((s) => s.id === this.activeCameraId);
      if (c) return c.camera;
    }
    return this.editorCamera;
  }

  // Sync full scene from state
  sync(scene: SceneState) {
    // remove objects not in state
    const toRemove: string[] = [];
    this.objectMap.forEach((_, id) => {
      if (!scene.objects[id]) toRemove.push(id);
    });
    for (const id of toRemove) {
      const o = this.objectMap.get(id);
      if (o) {
        this.scene.remove(o);
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const mat = (o as THREE.Mesh).material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      }
      this.objectMap.delete(id);
    }

    // rebuild scene camera list
    this.sceneCameras = [];
    for (const id of Object.keys(scene.objects)) {
      const o = scene.objects[id];
      if (o.kind === "camera" && o.camera) {
        let cam = this.objectMap.get(id) as THREE.PerspectiveCamera | THREE.OrthographicCamera | undefined;
        if (!cam || cam.userData.kind !== o.camera.kind) {
          if (cam) this.scene.remove(cam);
          const aspect = this.container.clientWidth / this.container.clientHeight;
          cam = o.camera.kind === "perspective"
            ? new THREE.PerspectiveCamera(o.camera.fov ?? 50, aspect, o.camera.near ?? 0.1, o.camera.far ?? 1000)
            : new THREE.OrthographicCamera(-5, 5, 5, -5, o.camera.near ?? 0.1, o.camera.far ?? 1000);
          cam.userData.kind = o.camera.kind;
          cam.userData.isSceneCamera = true;
          this.scene.add(cam);
          this.objectMap.set(id, cam);
        } else {
          if (o.camera.kind === "perspective") {
            const p = cam as THREE.PerspectiveCamera;
            p.fov = o.camera.fov ?? 50;
            p.near = o.camera.near ?? 0.1;
            p.far = o.camera.far ?? 1000;
            p.updateProjectionMatrix();
          }
        }
        applyTransform(cam, o.transform);
        this.sceneCameras.push({ id, camera: cam });
      }
    }
    this.activeCameraId = scene.activeCameraId;

    // upsert meshes, lights, groups
    for (const id of Object.keys(scene.objects)) {
      const o = scene.objects[id];
      if (o.kind === "camera") continue;
      if (o.kind === "mesh") {
        let mesh = this.objectMap.get(id) as THREE.Mesh | undefined;
        const geo = o.geometry ? buildGeometry(o.geometry) : new THREE.BoxGeometry(1, 1, 1);
        // For perf we rebuild geometry each sync only if geometry params changed
        if (!mesh || mesh.userData.geoSig !== JSON.stringify(o.geometry) || mesh.userData.matId !== o.materialId) {
          if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
          }
          const matDef = o.materialId ? scene.materials[o.materialId] : undefined;
          const mat = matDef ? buildMaterial(matDef, scene.ui.wireframeMode === "all") : new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.geoSig = JSON.stringify(o.geometry);
          mesh.userData.matId = o.materialId;
          mesh.userData.objectId = id;
          this.scene.add(mesh);
          this.objectMap.set(id, mesh);
        }
        applyTransform(mesh, o.transform);
        mesh.visible = o.visible;
        // material live update
        if (o.materialId && scene.materials[o.materialId]) {
          updateMaterialLive(mesh.material as THREE.Material, scene.materials[o.materialId], scene.ui.wireframeMode === "all");
        }
      } else if (o.kind === "light" && o.light) {
        let light = this.objectMap.get(id) as THREE.Light | undefined;
        const needRebuild = !light || light.userData.lightKind !== o.light.kind;
        if (needRebuild) {
          if (light) this.scene.remove(light);
          switch (o.light.kind) {
            case "directional":
              light = new THREE.DirectionalLight(rgbToColor(o.light.color), o.light.intensity);
              (light as THREE.DirectionalLight).castShadow = o.light.castShadow;
              (light as THREE.DirectionalLight).shadow.mapSize.set(1024, 1024);
              (light as THREE.DirectionalLight).shadow.camera.left = -20;
              (light as THREE.DirectionalLight).shadow.camera.right = 20;
              (light as THREE.DirectionalLight).shadow.camera.top = 20;
              (light as THREE.DirectionalLight).shadow.camera.bottom = -20;
              break;
            case "point":
              light = new THREE.PointLight(rgbToColor(o.light.color), o.light.intensity, o.light.distance ?? 0, o.light.decay ?? 2);
              (light as THREE.PointLight).castShadow = o.light.castShadow;
              break;
            case "spot":
              light = new THREE.SpotLight(rgbToColor(o.light.color), o.light.intensity, o.light.distance ?? 0, o.light.angle ?? Math.PI / 6, o.light.penumbra ?? 0.2, o.light.decay ?? 2);
              (light as THREE.SpotLight).castShadow = o.light.castShadow;
              break;
            case "hemisphere":
              light = new THREE.HemisphereLight(rgbToColor(o.light.color), 0x000000, o.light.intensity);
              break;
            case "area": {
              const al = new THREE.RectAreaLight(rgbToColor(o.light.color), o.light.intensity, 4, 4);
              light = al;
              break;
            }
          }
          if (light) {
            light.userData.lightKind = o.light.kind;
            light.userData.objectId = id;
            this.scene.add(light);
            this.objectMap.set(id, light);
          }
        } else {
          light.color = rgbToColor(o.light.color);
          light.intensity = o.light.intensity;
        }
        if (light) {
          applyTransform(light, o.transform);
          light.visible = o.visible;
        }
      } else if (o.kind === "group" || o.kind === "empty") {
        let g = this.objectMap.get(id) as THREE.Group | undefined;
        if (!g) {
          g = new THREE.Group();
          g.userData.objectId = id;
          this.scene.add(g);
          this.objectMap.set(id, g);
        }
        applyTransform(g, o.transform);
        g.visible = o.visible;
      }
    }

    // environment
    if (scene.environment.background) {
      this.scene.background = rgbToColor(scene.environment.background);
    } else {
      this.scene.background = null;
    }
    this.ambient.intensity = scene.environment.ambientIntensity;
    this.grid.visible = scene.environment.gridVisible;
    this.renderer.toneMappingExposure = scene.environment.exposure;
    switch (scene.environment.toneMapping) {
      case "none": this.renderer.toneMapping = THREE.NoToneMapping; break;
      case "aces": this.renderer.toneMapping = THREE.ACESFilmicToneMapping; break;
      case "reinhard": this.renderer.toneMapping = THREE.ReinhardToneMapping; break;
      case "cineon": this.renderer.toneMapping = THREE.CineonToneMapping; break;
    }
    if (scene.environment.fog) {
      this.scene.fog = new THREE.Fog(rgbToColor(scene.environment.fog.color), scene.environment.fog.near, scene.environment.fog.far);
    } else {
      this.scene.fog = null;
    }
    this.shadowsEnabled = scene.environment.shadowMapEnabled;
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.needsUpdate = true;

    // 3D cursor position
    this.cursor3D.position.set(scene.ui.cursor[0], scene.ui.cursor[1], scene.ui.cursor[2]);

    // Environment map toggle
    this.scene.environment = scene.ui.envMapEnabled ? this.envMap : null;

    // Grid visibility
    this.grid.visible = scene.environment.gridVisible;
  }

  animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    this.orbit.update();
    this.transformControls.update();
    this.renderer.render(this.scene, this.activeCamera());
    this.frames++;
    const now = performance.now();
    if (now - this.lastStatsTime > 500) {
      const fps = (this.frames * 1000) / (now - this.lastStatsTime);
      this.frames = 0;
      this.lastStatsTime = now;
      const info = this.renderer.info;
      this.statsCallback?.(fps, info.render.calls, info.render.triangles);
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this._ro?.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("kandler:nudge", this.onNudge as any);
    window.removeEventListener("kandler:frame-selected", this.onFrameSelected);
    window.removeEventListener("kandler:set-view", this.onSetView);
    this.transformControls.dispose();
    this.envMap?.dispose();
    this.renderer.dispose();
    if (this.boxSelectDiv.parentElement === this.container) {
      this.container.removeChild(this.boxSelectDiv);
    }
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

function updateMaterialLive(mat: THREE.Material, def: MaterialDef, wireOverride: boolean) {
  if (wireOverride) {
    (mat as THREE.MeshBasicMaterial).wireframe = true;
    return;
  }
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.color = rgbToColor(def.color);
    mat.emissive = rgbToColor(def.emissive);
    mat.emissiveIntensity = def.emissiveIntensity;
    mat.metalness = def.metalness;
    mat.roughness = def.roughness;
    mat.wireframe = def.wireframe;
    mat.transparent = def.transparent;
    mat.opacity = def.opacity;
    mat.flatShading = def.flatShading;
    mat.needsUpdate = true;
    mat.side = def.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  } else if (mat instanceof THREE.MeshBasicMaterial) {
    mat.color = rgbToColor(def.color);
    mat.wireframe = def.wireframe;
    mat.opacity = def.opacity;
    mat.transparent = def.transparent;
    mat.side = def.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  } else if (mat instanceof THREE.MeshToonMaterial) {
    mat.color = rgbToColor(def.color);
    mat.emissive = rgbToColor(def.emissive);
    mat.wireframe = def.wireframe;
  } else if (mat instanceof THREE.MeshNormalMaterial) {
    mat.wireframe = def.wireframe;
    mat.flatShading = def.flatShading;
  }
}

// ---- Lightweight orbit control (no extra dep) ----
class OrbitState {
  camera: THREE.PerspectiveCamera;
  el: HTMLElement;
  target = new THREE.Vector3(0, 1, 0);
  spherical = new THREE.Spherical();
  dragging = false;
  panning = false;
  lastX = 0;
  lastY = 0;
  enabled = true;

  constructor(camera: THREE.PerspectiveCamera, el: HTMLElement) {
    this.camera = camera;
    this.el = el;
    const offset = new THREE.Vector3().subVectors(camera.position, this.target);
    this.spherical.setFromVector3(offset);
    el.addEventListener("pointerdown", this.onDown);
    el.addEventListener("pointermove", this.onMove);
    el.addEventListener("pointerup", this.onUp);
    el.addEventListener("pointerleave", this.onUp);
    el.addEventListener("wheel", this.onWheel, { passive: false });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  onDown = (e: PointerEvent) => {
    if (e.button === 0) return; // left click is selection / gizmo
    if (e.button === 1 || e.button === 2) {
      this.dragging = true;
      if (e.shiftKey) this.panning = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      e.preventDefault();
    }
  };
  onMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    if (this.panning) {
      const panScale = this.spherical.radius * 0.0015;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      this.camera.matrix.extractBasis(right, up, new THREE.Vector3());
      this.target.addScaledVector(right, -dx * panScale);
      this.target.addScaledVector(up, dy * panScale);
    } else {
      this.spherical.theta -= dx * 0.005;
      this.spherical.phi -= dy * 0.005;
      this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi));
    }
  };
  onUp = () => {
    this.dragging = false;
    this.panning = false;
  };
  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.spherical.radius *= 1 + e.deltaY * 0.001;
    this.spherical.radius = Math.max(0.5, Math.min(500, this.spherical.radius));
  };
  update() {
    if (!this.enabled) return;
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
  setTarget(x: number, y: number, z: number) {
    this.target.set(x, y, z);
  }
  frame(objects: THREE.Object3D[]) {
    if (objects.length === 0) return;
    const box = new THREE.Box3();
    objects.forEach((o) => box.expandByObject(o));
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    this.target.copy(center);
    this.spherical.radius = Math.max(2, size * 1.6);
    this.spherical.theta = Math.PI / 4;
    this.spherical.phi = Math.PI / 3;
  }
}

// ---- TransformControls-lite (own implementation to avoid version mismatch) ----
class TransformControlsLite {
  camera: THREE.PerspectiveCamera;
  el: HTMLElement;
  orbit: OrbitState;
  mode: "translate" | "rotate" | "scale" = "translate";
  attached: THREE.Object3D[] = [];
  gizmoGroup: THREE.Group;
  snapTranslate = 0;
  snapRotate = 0;
  snapScale = 0;
  dragging = false;
  activeAxis: "x" | "y" | "z" | null = null;
  dragStart = new THREE.Vector3();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  onChange?: (obj: THREE.Object3D) => void;
  scene: THREE.Scene;

  // Local axes (after the first attached object's quaternion)
  localAxes: { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1),
  };

  constructor(camera: THREE.PerspectiveCamera, el: HTMLElement, orbit: OrbitState) {
    this.camera = camera;
    this.el = el;
    this.orbit = orbit;
    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.visible = false;
    this.gizmoGroup.renderOrder = 999;
    this.scene = (camera.parent as THREE.Scene) || new THREE.Scene();
    this.scene.add(this.gizmoGroup);
    this.buildGizmo();
    el.addEventListener("pointerdown", this.onDown);
    el.addEventListener("pointermove", this.onMove);
    el.addEventListener("pointerup", this.onUp);
  }

  setScene(scene: THREE.Scene) {
    if (this.scene !== scene) {
      this.scene.remove(this.gizmoGroup);
      this.scene = scene;
      this.scene.add(this.gizmoGroup);
    }
  }

  attach(objs: THREE.Object3D[]) {
    this.attached = objs;
    this.gizmoGroup.visible = objs.length > 0;
    this.update();
  }
  detach() {
    this.attached = [];
    this.gizmoGroup.visible = false;
  }
  setMode(m: "translate" | "rotate" | "scale") {
    this.mode = m;
    this.buildGizmo();
    this.update();
  }

  buildGizmo() {
    while (this.gizmoGroup.children.length) this.gizmoGroup.remove(this.gizmoGroup.children[0]);
    const makeArrow = (color: number, axis: "x" | "y" | "z") => {
      const g = new THREE.Group();
      g.userData.axis = axis;
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), mat);
      handle.position.y = 0.5;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 12), mat);
      tip.position.y = 1.1;
      g.add(handle, tip);
      g.userData.pickMeshes = [handle, tip];
      if (axis === "x") g.rotation.z = -Math.PI / 2;
      if (axis === "z") g.rotation.x = Math.PI / 2;
      handle.userData.axis = axis;
      tip.userData.axis = axis;
      return g;
    };
    if (this.mode === "translate" || this.mode === "scale") {
      this.gizmoGroup.add(makeArrow(0xff3355, "x"), makeArrow(0x33ff77, "y"), makeArrow(0x3399ff, "z"));
      if (this.mode === "scale") {
        this.gizmoGroup.children.forEach((g) => {
          g.scale.setScalar(0.8);
        });
      }
    } else {
      // rotate: torus per axis
      const makeRing = (color: number, axis: "x" | "y" | "z") => {
        const g = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
        const torus = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.03, 8, 48), mat);
        torus.userData.axis = axis;
        if (axis === "x") torus.rotation.y = Math.PI / 2;
        if (axis === "z") torus.rotation.x = Math.PI / 2;
        g.add(torus);
        g.userData.pickMeshes = [torus];
        return g;
      };
      this.gizmoGroup.add(makeRing(0xff3355, "x"), makeRing(0x33ff77, "y"), makeRing(0x3399ff, "z"));
    }
  }

  update() {
    if (this.attached.length === 0) {
      this.gizmoGroup.visible = false;
      return;
    }
    this.gizmoGroup.visible = true;
    // place gizmo at the first attached object
    const o = this.attached[0];
    o.getWorldPosition(this.gizmoGroup.position);
    // size based on distance to camera
    const dist = this.camera.position.distanceTo(this.gizmoGroup.position);
    const s = dist * 0.12;
    this.gizmoGroup.scale.setScalar(s);
  }

  onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (this.attached.length === 0) return;
    const rect = this.el.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const pickMeshes: THREE.Mesh[] = [];
    this.gizmoGroup.children.forEach((g) => {
      const ms = g.userData.pickMeshes as THREE.Mesh[] | undefined;
      if (ms) pickMeshes.push(...ms);
    });
    const hits = this.raycaster.intersectObjects(pickMeshes, false);
    if (hits.length > 0) {
      this.activeAxis = hits[0].object.userData.axis as "x" | "y" | "z";
      this.dragging = true;
      this.orbit.enabled = false;
      this.dragStart.copy(this.attached[0].position);
      this.startRotation = this.attached[0].rotation.clone();
      this.startScale = this.attached[0].scale.clone();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  startRotation?: THREE.Euler;
  startScale?: THREE.Vector3;

  onMove = (e: PointerEvent) => {
    if (!this.dragging || !this.activeAxis) return;
    const rect = this.el.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const axisVec = new THREE.Vector3();
    if (this.activeAxis === "x") axisVec.set(1, 0, 0);
    if (this.activeAxis === "y") axisVec.set(0, 1, 0);
    if (this.activeAxis === "z") axisVec.set(0, 0, 1);

    const obj = this.attached[0];
    const plane = new THREE.Plane();
    const normal = axisVec.clone();
    // face plane toward camera as much as possible along the axis
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    if (camDir.dot(normal) < 0) normal.negate();
    plane.setFromNormalAndCoplanarPoint(normal, obj.position);

    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return;

    const delta = hit.clone().sub(obj.position);
    if (this.mode === "translate") {
      const proj = delta.dot(axisVec);
      let v = this.dragStart.clone().addScaledVector(axisVec, proj - delta.dot(axisVec) * 0); // not used directly
      v = this.dragStart.clone();
      const comp = this.activeAxis === "x" ? "x" : this.activeAxis === "y" ? "y" : "z";
      let val = this.dragStart[comp] + delta[comp === "x" ? "x" : comp === "y" ? "y" : "z"];
      if (this.snapTranslate > 0) val = Math.round(val / this.snapTranslate) * this.snapTranslate;
      v[comp] = val;
      // apply to all attached (translate as a group from start)
      this.attached.forEach((o) => {
        const off = o.position.clone().sub(this.dragStart);
        o.position.copy(v).add(off);
      });
    } else if (this.mode === "scale") {
      const comp = this.activeAxis;
      const startVal = this.startScale?.[comp] ?? 1;
      const factor = 1 + delta.dot(axisVec) * 0.5;
      let v = startVal * factor;
      if (this.snapScale > 0) v = Math.round(v / this.snapScale) * this.snapScale;
      this.attached.forEach((o) => {
        o.scale[comp] = Math.max(0.001, v);
      });
    } else {
      // rotate
      const angle = Math.atan2(
        delta.dot(new THREE.Vector3().crossVectors(axisVec, this.camera.up).normalize()),
        delta.dot(new THREE.Vector3().crossVectors(this.camera.up, axisVec).cross(axisVec).normalize()),
      );
      let a = angle;
      if (this.snapRotate > 0) a = Math.round(a / this.snapRotate) * this.snapRotate;
      const comp = this.activeAxis;
      this.attached.forEach((o) => {
        if (this.startRotation) o.rotation[comp] = this.startRotation[comp] + a;
      });
    }
    this.onChange?.(obj);
    this.update();
  };

  onUp = () => {
    this.dragging = false;
    this.activeAxis = null;
    this.orbit.enabled = true;
  };

  dispose() {
    this.el.removeEventListener("pointerdown", this.onDown);
    this.el.removeEventListener("pointermove", this.onMove);
    this.el.removeEventListener("pointerup", this.onUp);
    this.scene.remove(this.gizmoGroup);
  }
}
