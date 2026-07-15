// Kandler Help System — tutorials, tooltips, documentation links.
// Kandler Post-Processing — SSAO, bloom, DOF, color correction, FXAA.

import * as THREE from "three";
import { EffectComposer } from "three-stdlib";
import { RenderPass } from "three-stdlib";
import { ShaderPass } from "three-stdlib";
import { UnrealBloomPass } from "three-stdlib";
import { SSAOPass } from "three-stdlib";
import { BokehPass } from "three-stdlib";
import { GammaCorrectionShader } from "three-stdlib";

// ====== TUTORIALS ======
export interface TutorialStep {
  title: string;
  description: string;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Learn the basics of navigating the Kandler 3D viewport.",
    difficulty: "beginner",
    steps: [
      { title: "Welcome to Kandler!", description: "Kandler is a Blender-like 3D modeling editor built with Three.js. Created by KANTASU." },
      { title: "Orbit, Pan, Zoom", description: "Right-click and drag to orbit. Shift + right-drag to pan. Wheel to zoom." },
      { title: "Selecting Objects", description: "Left-click on any object to select it." },
      { title: "Moving Objects", description: "Press W for the Move tool. Drag the colored arrows to move." },
      { title: "Rotating Objects", description: "Press E for the Rotate tool. Drag the colored rings." },
      { title: "Scaling Objects", description: "Press R for the Scale tool. Drag the handles." },
      { title: "Adding Objects", description: "Click 'Mesh' in the toolbar to add primitives." },
      { title: "Command Palette", description: "Press Ctrl+P for the command palette." },
      { title: "Shortcuts", description: "Press ? for the keyboard shortcut overlay." },
      { title: "Done!", description: "You know the basics. Happy modeling!" },
    ],
  },
  {
    id: "edit-mode",
    name: "Edit Mode Basics",
    description: "Learn how to edit mesh geometry.",
    difficulty: "beginner",
    steps: [
      { title: "Edit Mode", description: "Press Tab to toggle Edit Mode." },
      { title: "Vertex Display", description: "Red dots appear on every vertex." },
      { title: "Extruding", description: "Press E to extrude faces." },
      { title: "Inset", description: "Press I to inset faces." },
      { title: "Bevel", description: "Press Ctrl+B to bevel edges." },
      { title: "Loop Cut", description: "Press Ctrl+R for loop cuts." },
      { title: "Subdivide", description: "Press W to subdivide." },
      { title: "Delete", description: "Press Delete to remove geometry." },
      { title: "Back to Object Mode", description: "Press Tab to return." },
    ],
  },
  {
    id: "materials",
    name: "Material Editing",
    description: "Learn how to create and edit materials.",
    difficulty: "intermediate",
    steps: [
      { title: "Materials Tab", description: "Click 'Mats' tab to see all materials." },
      { title: "Create Material", description: "Click '+ New' to create a material." },
      { title: "Color", description: "Click the color swatch to change base color." },
      { title: "Metalness/Roughness", description: "Adjust metalness and roughness for PBR." },
      { title: "Assign", description: "Select a mesh and assign the material." },
      { title: "Emissive", description: "Set emissive color for glowing materials." },
    ],
  },
  {
    id: "modifiers",
    name: "Modifier Stack",
    description: "Learn how to use the non-destructive modifier stack.",
    difficulty: "intermediate",
    steps: [
      { title: "What are Modifiers?", description: "Non-destructive operations that modify geometry in real-time." },
      { title: "Add Modifier", description: "Select a mesh, go to Properties > Mods tab." },
      { title: "Subdivision", description: "Add Subdivision for smooth meshes." },
      { title: "Mirror", description: "Add Mirror for symmetric models." },
      { title: "Boolean", description: "Add Boolean for CSG operations." },
      { title: "Array", description: "Add Array to duplicate along an offset." },
      { title: "Reorder", description: "Use arrows to reorder modifiers." },
      { title: "Toggle", description: "Disable a modifier without removing it." },
    ],
  },
  {
    id: "sculpting",
    name: "Sculpt Mode",
    description: "Learn how to sculpt meshes.",
    difficulty: "intermediate",
    steps: [
      { title: "Sculpt Mode", description: "Enable Sculpt Mode from the Sculpt panel." },
      { title: "Choose Brush", description: "Select from Draw, Grab, Smooth, Flatten, etc." },
      { title: "Brush Settings", description: "Adjust Size, Strength, and Falloff." },
      { title: "Sculpting", description: "Click and drag on the mesh to sculpt." },
      { title: "Symmetry", description: "Enable X/Y/Z symmetry for mirrored strokes." },
    ],
  },
  {
    id: "animation",
    name: "Animation Basics",
    description: "Learn how to keyframe and animate.",
    difficulty: "intermediate",
    steps: [
      { title: "Timeline", description: "The timeline at the bottom shows time and FPS." },
      { title: "Duration", description: "Set duration and FPS." },
      { title: "Keyframe Position", description: "Move time to 0, click 'Loc Key'." },
      { title: "Animate", description: "Move to a different time, move the object, key again." },
      { title: "Playback", description: "Click Play to preview." },
    ],
  },
  {
    id: "rendering",
    name: "Rendering & Export",
    description: "Learn how to capture images and export.",
    difficulty: "intermediate",
    steps: [
      { title: "Render Tab", description: "Click 'Render' tab on the right panel." },
      { title: "Image Capture", description: "Click 'Image' to capture at custom resolution." },
      { title: "Turntable", description: "Click 'Turntable' for 360° rotation capture." },
      { title: "Export", description: "Use File > Export for GLTF, OBJ, STL, etc." },
      { title: "Kandler Native", description: "Save as .kndl for full fidelity." },
    ],
  },
];

export interface DocLink {
  title: string;
  url: string;
  category: string;
}

export const DOC_LINKS: DocLink[] = [
  { title: "Three.js Documentation", url: "https://threejs.org/docs/", category: "Reference" },
  { title: "Three.js Examples", url: "https://threejs.org/examples/", category: "Reference" },
  { title: "glTF 2.0 Specification", url: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html", category: "Reference" },
  { title: "Blender Manual", url: "https://docs.blender.org/manual/", category: "Reference" },
  { title: "Kandler GitHub", url: "https://github.com/ddown325/Kandler", category: "Project" },
  { title: "WebGL Fundamentals", url: "https://webglfundamentals.org/", category: "Learning" },
  { title: "Shader Toy", url: "https://www.shadertoy.com/", category: "Learning" },
];

export function getTutorialById(id: string): Tutorial | undefined {
  return TUTORIALS.find(t => t.id === id);
}

export function getTutorialsByDifficulty(diff: string): Tutorial[] {
  return TUTORIALS.filter(t => t.difficulty === diff);
}

// ====== POST-PROCESSING ======
export interface PostProcessingSettings {
  enabled: boolean;
  ssao: { enabled: boolean; intensity: number; kernelRadius: number };
  bloom: { enabled: boolean; strength: number; radius: number; threshold: number };
  dof: { enabled: boolean; focus: number; aperture: number; maxblur: number };
  vignette: { enabled: boolean; intensity: number; offset: number };
  colorCorrection: { enabled: boolean; brightness: number; contrast: number; saturation: number };
}

export const DEFAULT_POST: PostProcessingSettings = {
  enabled: true,
  ssao: { enabled: false, intensity: 1.0, kernelRadius: 8 },
  bloom: { enabled: false, strength: 1.5, radius: 0.4, threshold: 0.85 },
  dof: { enabled: false, focus: 10, aperture: 0.025, maxblur: 0.01 },
  vignette: { enabled: false, intensity: 1.0, offset: 1.0 },
  colorCorrection: { enabled: false, brightness: 0, contrast: 1, saturation: 1 },
};

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 1.0 },
    uOffset: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float dist = distance(vUv, vec2(0.5));
      float vignette = smoothstep(0.8, 0.2, dist * uOffset);
      color.rgb *= mix(1.0, vignette, uIntensity);
      gl_FragColor = color;
    }
  `,
};

const ColorCorrectionShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBrightness: { value: 0 },
    uContrast: { value: 1 },
    uSaturation: { value: 1 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uSaturation;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += uBrightness;
      color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, uSaturation);
      gl_FragColor = color;
    }
  `,
};

export class PostProcessor {
  composer: EffectComposer | null = null;
  renderer: THREE.WebGLRenderer;
  settings: PostProcessingSettings;
  private passes: Map<string, any> = new Map();

  constructor(renderer: THREE.WebGLRenderer, settings: PostProcessingSettings = DEFAULT_POST) {
    this.renderer = renderer;
    this.settings = settings;
  }

  setup(scene: THREE.Scene, camera: THREE.Camera, w: number, h: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(w, h);
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
    this.passes.set("render", renderPass);

    if (this.settings.ssao.enabled) {
      const saoPass = new SSAOPass(scene, camera, w, h);
      saoPass.params.saoIntensity = this.settings.ssao.intensity;
      saoPass.params.saoKernelRadius = this.settings.ssao.kernelRadius;
      this.composer.addPass(saoPass);
      this.passes.set("ssao", saoPass);
    }

    if (this.settings.bloom.enabled) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        this.settings.bloom.strength,
        this.settings.bloom.radius,
        this.settings.bloom.threshold,
      );
      this.composer.addPass(bloomPass);
      this.passes.set("bloom", bloomPass);
    }

    if (this.settings.dof.enabled) {
      const bokehPass = new BokehPass(scene, camera, {
        focus: this.settings.dof.focus,
        aperture: this.settings.dof.aperture,
        maxblur: this.settings.dof.maxblur,
      });
      this.composer.addPass(bokehPass);
      this.passes.set("dof", bokehPass);
    }

    if (this.settings.vignette.enabled) {
      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms.uIntensity.value = this.settings.vignette.intensity;
      vignettePass.uniforms.uOffset.value = this.settings.vignette.offset;
      this.composer.addPass(vignettePass);
      this.passes.set("vignette", vignettePass);
    }

    if (this.settings.colorCorrection.enabled) {
      const ccPass = new ShaderPass(ColorCorrectionShader);
      ccPass.uniforms.uBrightness.value = this.settings.colorCorrection.brightness;
      ccPass.uniforms.uContrast.value = this.settings.colorCorrection.contrast;
      ccPass.uniforms.uSaturation.value = this.settings.colorCorrection.saturation;
      this.composer.addPass(ccPass);
      this.passes.set("cc", ccPass);
    }

    const outputPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(outputPass);
  }

  render(): void {
    if (this.composer && this.settings.enabled) {
      this.composer.render();
    }
  }

  resize(w: number, h: number): void {
    if (this.composer) this.composer.setSize(w, h);
  }

  updateScene(scene: THREE.Scene, camera: THREE.Camera): void {
    const renderPass = this.passes.get("render");
    if (renderPass) { renderPass.scene = scene; renderPass.camera = camera; }
    const saoPass = this.passes.get("ssao");
    if (saoPass) { saoPass.scene = scene; saoPass.camera = camera; }
    const bokehPass = this.passes.get("dof");
    if (bokehPass) { bokehPass.scene = scene; bokehPass.camera = camera; }
  }

  dispose(): void {
    this.composer = null;
    this.passes.clear();
  }
}

// ====== RENDER ======
export interface RenderSettings {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp";
  quality: number;
  samples: number;
  transparent: boolean;
}

export const DEFAULT_RENDER: RenderSettings = {
  width: 1920,
  height: 1080,
  format: "png",
  quality: 90,
  samples: 4,
  transparent: false,
};

export function renderImage(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  settings: RenderSettings,
): string {
  const oldSize = renderer.getSize(new THREE.Vector2());
  const oldPR = renderer.getPixelRatio();
  renderer.setSize(settings.width, settings.height);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, settings.transparent ? 0 : 1);
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
  renderer.setSize(oldSize.x, oldSize.y);
  renderer.setPixelRatio(oldPR);
  return dataUrl;
}

export function downloadImage(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function renderTurntable(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  settings: RenderSettings,
  frames: number = 36,
): string[] {
  const results: string[] = [];
  const oldPos = camera.position.clone();
  const radius = camera.position.distanceTo(target);
  for (let i = 0; i < frames; i++) {
    const angle = (i / frames) * Math.PI * 2;
    camera.position.set(
      target.x + Math.cos(angle) * radius,
      target.y + radius * 0.3,
      target.z + Math.sin(angle) * radius,
    );
    camera.lookAt(target);
    const dataUrl = renderImage(renderer, scene, camera, settings);
    results.push(dataUrl);
  }
  camera.position.copy(oldPos);
  camera.lookAt(target);
  return results;
}

export function renderPanoramic(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  center: THREE.Vector3,
  settings: RenderSettings,
): string {
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, new THREE.WebGLCubeRenderTarget(1024));
  cubeCamera.position.copy(center);
  cubeCamera.update(renderer, scene);
  const panCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const panScene = new THREE.Scene();
  const panMat = new THREE.ShaderMaterial({
    uniforms: { envMap: { value: cubeCamera.renderTarget.texture } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      uniform samplerCube envMap;
      varying vec2 vUv;
      void main() {
        float theta = vUv.x * 2.0 * 3.14159265;
        float phi = (1.0 - vUv.y) * 3.14159265;
        vec3 dir = vec3(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta));
        gl_FragColor = textureCube(envMap, dir);
      }
    `,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), panMat);
  panScene.add(quad);
  const oldSize = renderer.getSize(new THREE.Vector2());
  renderer.setSize(settings.width, settings.height);
  renderer.render(panScene, panCamera);
  const dataUrl = renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
  renderer.setSize(oldSize.x, oldSize.y);
  return dataUrl;
}

// ====== FLY CONTROLS ======
export class FlyControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  moveSpeed: number = 5;
  rotSpeed: number = 0.002;
  enabled: boolean = false;
  private keys: Set<string> = new Set();
  private mouseDown: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private pitch: number = 0;
  private yaw: number = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.pitch = camera.rotation.x;
    this.yaw = camera.rotation.y;
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.domElement.addEventListener("mousedown", this.onMouseDown);
    this.domElement.addEventListener("mouseup", this.onMouseUp);
    this.domElement.addEventListener("mousemove", this.onMouseMove);
    this.domElement.style.cursor = "grab";
  }

  disable(): void {
    this.enabled = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("mouseup", this.onMouseUp);
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.domElement.style.cursor = "";
  }

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };
  private onMouseDown = (e: MouseEvent) => { this.mouseDown = true; this.lastX = e.clientX; this.lastY = e.clientY; this.domElement.style.cursor = "grabbing"; };
  private onMouseUp = () => { this.mouseDown = false; this.domElement.style.cursor = "grab"; };
  private onMouseMove = (e: MouseEvent) => {
    if (!this.mouseDown) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.yaw -= dx * this.rotSpeed;
    this.pitch -= dy * this.rotSpeed;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
  };

  update(dt: number): void {
    if (!this.enabled) return;
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(this.camera.rotation);
    const speed = this.moveSpeed * dt;
    if (this.keys.has("w")) this.camera.position.addScaledVector(forward, speed);
    if (this.keys.has("s")) this.camera.position.addScaledVector(forward, -speed);
    if (this.keys.has("a")) this.camera.position.addScaledVector(right, -speed);
    if (this.keys.has("d")) this.camera.position.addScaledVector(right, speed);
    if (this.keys.has("q")) this.camera.position.y -= speed;
    if (this.keys.has("e")) this.camera.position.y += speed;
  }
}

// ====== MEASUREMENT ======
export function measureDistance(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

export function measureAngle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): number {
  const v1 = a.clone().sub(b);
  const v2 = c.clone().sub(b);
  const dot = v1.dot(v2) / (v1.length() * v2.length());
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

export function measureArea(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  let area = 0;
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const count = indices ? indices.length : pos.count;
  for (let i = 0; i < count; i += 3) {
    if (indices) {
      va.fromBufferAttribute(pos, indices[i]);
      vb.fromBufferAttribute(pos, indices[i + 1]);
      vc.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      va.fromBufferAttribute(pos, i);
      vb.fromBufferAttribute(pos, i + 1);
      vc.fromBufferAttribute(pos, i + 2);
    }
    const ab = new THREE.Vector3().subVectors(vb, va);
    const ac = new THREE.Vector3().subVectors(vc, va);
    area += ab.cross(ac).length() * 0.5;
  }
  return area;
}

export function measureVolume(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  let volume = 0;
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const count = indices ? indices.length : pos.count;
  for (let i = 0; i < count; i += 3) {
    if (indices) {
      va.fromBufferAttribute(pos, indices[i]);
      vb.fromBufferAttribute(pos, indices[i + 1]);
      vc.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      va.fromBufferAttribute(pos, i);
      vb.fromBufferAttribute(pos, i + 1);
      vc.fromBufferAttribute(pos, i + 2);
    }
    volume += va.dot(vb.clone().cross(vc)) / 6;
  }
  return Math.abs(volume);
}

// ====== CAMERA BOOKMARKS ======
export interface CameraBookmark {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export class BookmarkManager {
  bookmarks: Map<string, CameraBookmark> = new Map();

  save(name: string, camera: THREE.PerspectiveCamera, target: THREE.Vector3): string {
    const id = `bm_${Date.now()}`;
    this.bookmarks.set(id, {
      id, name,
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [target.x, target.y, target.z],
      fov: camera.fov,
    });
    return id;
  }

  restore(id: string, camera: THREE.PerspectiveCamera): THREE.Vector3 | null {
    const bm = this.bookmarks.get(id);
    if (!bm) return null;
    camera.position.set(...bm.position);
    if (bm.fov) { camera.fov = bm.fov; camera.updateProjectionMatrix(); }
    return new THREE.Vector3(...bm.target);
  }

  delete(id: string): void { this.bookmarks.delete(id); }
  list(): CameraBookmark[] { return Array.from(this.bookmarks.values()); }
}

// ====== PREFERENCES ======
export interface Preferences {
  theme: { primary: string; accent: string; background: string; panel: string; text: string };
  viewport: { gridSize: number; gridDivisions: number; fov: number; nearClip: number; farClip: number; antiAliasing: boolean; shadows: boolean };
  undoSteps: number;
  autoSaveInterval: number;
  language: "en" | "es" | "fr" | "de" | "ja" | "zh";
}

export const DEFAULT_PREFS: Preferences = {
  theme: { primary: "#a855f7", accent: "#ec4899", background: "#0a0614", panel: "#150b25", text: "#e9d5ff" },
  viewport: { gridSize: 40, gridDivisions: 40, fov: 50, nearClip: 0.05, farClip: 5000, antiAliasing: true, shadows: true },
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
