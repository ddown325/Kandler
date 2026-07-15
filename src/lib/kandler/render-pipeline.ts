// Kandler Complete Render Pipeline — image capture, turntable, panoramic, HDR, tone mapping.
import * as THREE from "three";
import { EffectComposer } from "three-stdlib";
import { RenderPass } from "three-stdlib";
import { ShaderPass } from "three-stdlib";
import { UnrealBloomPass } from "three-stdlib";
import { SSAOPass } from "three-stdlib";
import { BokehPass } from "three-stdlib";
import { GammaCorrectionShader } from "three-stdlib";
import { OutlinePass } from "three-stdlib";

export interface RenderSettings {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp" | "exr";
  quality: number;
  samples: number;
  transparent: boolean;
  exposure: number;
  toneMapping: "none" | "aces" | "reinhard" | "cineon" | "linear";
}

export const DEFAULT_RENDER: RenderSettings = {
  width: 1920, height: 1080, format: "png", quality: 90, samples: 4,
  transparent: false, exposure: 1.0, toneMapping: "aces",
};

export interface PostProcessSettings {
  ssao: boolean;
  bloom: boolean;
  dof: boolean;
  vignette: boolean;
  colorCorrection: boolean;
  chromaticAberration: boolean;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  dofFocus: number;
  dofAperture: number;
  dofMaxBlur: number;
  vignetteIntensity: number;
  vignetteOffset: number;
  ccBrightness: number;
  ccContrast: number;
  ccSaturation: number;
  ccGamma: number;
  caAmount: number;
}

export const DEFAULT_POST: PostProcessSettings = {
  ssao: false, bloom: false, dof: false, vignette: false, colorCorrection: false, chromaticAberration: false,
  bloomStrength: 1.5, bloomThreshold: 0.85, bloomRadius: 0.4,
  dofFocus: 10, dofAperture: 0.025, dofMaxBlur: 0.01,
  vignetteIntensity: 1.0, vignetteOffset: 1.0,
  ccBrightness: 0, ccContrast: 1, ccSaturation: 1, ccGamma: 1,
  caAmount: 0.01,
};

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, uIntensity: { value: 1.0 }, uOffset: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uIntensity; uniform float uOffset; varying vec2 vUv;
    void main() { vec4 color = texture2D(tDiffuse, vUv); float dist = distance(vUv, vec2(0.5));
    float vignette = smoothstep(0.8, 0.2, dist * uOffset); color.rgb *= mix(1.0, vignette, uIntensity); gl_FragColor = color; }`,
};

const ColorCorrectionShaderDef = {
  uniforms: { tDiffuse: { value: null }, uBrightness: { value: 0 }, uContrast: { value: 1 }, uSaturation: { value: 1 }, uGamma: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uBrightness; uniform float uContrast; uniform float uSaturation; uniform float uGamma; varying vec2 vUv;
    void main() { vec4 color = texture2D(tDiffuse, vUv); color.rgb += uBrightness;
    color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, uSaturation);
    color.rgb = pow(color.rgb, vec3(1.0 / uGamma)); gl_FragColor = color; }`,
};

const ChromaticAberrationShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.01 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmount; varying vec2 vUv;
    void main() { vec2 dir = vUv - 0.5; float dist = length(dir); float amount = uAmount * dist;
    vec4 r = texture2D(tDiffuse, vUv - dir * amount); vec4 g = texture2D(tDiffuse, vUv);
    vec4 b = texture2D(tDiffuse, vUv + dir * amount); gl_FragColor = vec4(r.r, g.g, b.b, 1.0); }`,
};

export class RenderPipeline {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer | null = null;
  postSettings: PostProcessSettings;
  private passes: Map<string, any> = new Map();
  private renderPass: RenderPass | null = null;

  constructor(renderer: THREE.WebGLRenderer, postSettings: PostProcessSettings = DEFAULT_POST) {
    this.renderer = renderer;
    this.postSettings = postSettings;
  }

  setup(scene: THREE.Scene, camera: THREE.Camera, w: number, h: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(w, h);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    this.passes.set("render", this.renderPass);

    if (this.postSettings.ssao) {
      const saoPass = new SSAOPass(scene, camera, w, h);
      this.composer.addPass(saoPass);
      this.passes.set("ssao", saoPass);
    }
    if (this.postSettings.bloom) {
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), this.postSettings.bloomStrength, this.postSettings.bloomRadius, this.postSettings.bloomThreshold);
      this.composer.addPass(bloomPass);
      this.passes.set("bloom", bloomPass);
    }
    if (this.postSettings.dof) {
      const bokehPass = new BokehPass(scene, camera, { focus: this.postSettings.dofFocus, aperture: this.postSettings.dofAperture, maxblur: this.postSettings.dofMaxBlur });
      this.composer.addPass(bokehPass);
      this.passes.set("dof", bokehPass);
    }
    if (this.postSettings.chromaticAberration) {
      const caPass = new ShaderPass(ChromaticAberrationShader);
      caPass.uniforms.uAmount.value = this.postSettings.caAmount;
      this.composer.addPass(caPass);
      this.passes.set("ca", caPass);
    }
    if (this.postSettings.vignette) {
      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms.uIntensity.value = this.postSettings.vignetteIntensity;
      vignettePass.uniforms.uOffset.value = this.postSettings.vignetteOffset;
      this.composer.addPass(vignettePass);
      this.passes.set("vignette", vignettePass);
    }
    if (this.postSettings.colorCorrection) {
      const ccPass = new ShaderPass(ColorCorrectionShaderDef);
      ccPass.uniforms.uBrightness.value = this.postSettings.ccBrightness;
      ccPass.uniforms.uContrast.value = this.postSettings.ccContrast;
      ccPass.uniforms.uSaturation.value = this.postSettings.ccSaturation;
      ccPass.uniforms.uGamma.value = this.postSettings.ccGamma;
      this.composer.addPass(ccPass);
      this.passes.set("cc", ccPass);
    }
    const outputPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(outputPass);
    this.passes.set("output", outputPass);
  }

  render(): void {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.renderPass?.scene ?? new THREE.Scene(), this.renderPass?.camera ?? new THREE.Camera());
  }

  resize(w: number, h: number): void {
    if (this.composer) this.composer.setSize(w, h);
  }

  updateScene(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.renderPass) { this.renderPass.scene = scene; this.renderPass.camera = camera; }
    const saoPass = this.passes.get("ssao");
    if (saoPass) { saoPass.scene = scene; saoPass.camera = camera; }
    const bokehPass = this.passes.get("dof");
    if (bokehPass) { bokehPass.scene = scene; bokehPass.camera = camera; }
  }

  setToneMapping(mode: "none" | "aces" | "reinhard" | "cineon" | "linear"): void {
    switch (mode) {
      case "none": this.renderer.toneMapping = THREE.NoToneMapping; break;
      case "aces": this.renderer.toneMapping = THREE.ACESFilmicToneMapping; break;
      case "reinhard": this.renderer.toneMapping = THREE.ReinhardToneMapping; break;
      case "cineon": this.renderer.toneMapping = THREE.CineonToneMapping; break;
      case "linear": this.renderer.toneMapping = THREE.LinearToneMapping; break;
    }
  }

  setExposure(exposure: number): void {
    this.renderer.toneMappingExposure = exposure;
  }

  dispose(): void {
    this.composer = null;
    this.passes.clear();
    this.renderPass = null;
  }

  captureImage(settings: RenderSettings): string {
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    const oldPR = this.renderer.getPixelRatio();
    const oldExposure = this.renderer.toneMappingExposure;
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, settings.transparent ? 0 : 1);
    this.renderer.toneMappingExposure = settings.exposure;
    this.setToneMapping(settings.toneMapping);
    if (this.composer) { this.composer.setSize(settings.width, settings.height); this.composer.render(); }
    else { this.renderer.render(this.renderPass?.scene ?? new THREE.Scene(), this.renderPass?.camera ?? new THREE.Camera()); }
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    this.renderer.setSize(oldSize.x, oldSize.y);
    this.renderer.setPixelRatio(oldPR);
    this.renderer.toneMappingExposure = oldExposure;
    return dataUrl;
  }

  captureTurntable(settings: RenderSettings, camera: THREE.PerspectiveCamera, target: THREE.Vector3, frames: number = 36): string[] {
    const results: string[] = [];
    const oldPos = camera.position.clone();
    const radius = camera.position.distanceTo(target);
    for (let i = 0; i < frames; i++) {
      const angle = (i / frames) * Math.PI * 2;
      camera.position.set(target.x + Math.cos(angle) * radius, target.y + radius * 0.3, target.z + Math.sin(angle) * radius);
      camera.lookAt(target);
      const dataUrl = this.captureImage(settings);
      results.push(dataUrl);
    }
    camera.position.copy(oldPos);
    camera.lookAt(target);
    return results;
  }

  capturePanoramic(settings: RenderSettings, scene: THREE.Scene, center: THREE.Vector3): string {
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, new THREE.WebGLCubeRenderTarget(1024));
    cubeCamera.position.copy(center);
    cubeCamera.update(this.renderer, scene);
    const panCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const panScene = new THREE.Scene();
    const panMat = new THREE.ShaderMaterial({
      uniforms: { envMap: { value: cubeCamera.renderTarget.texture } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `uniform samplerCube envMap; varying vec2 vUv;
        void main() { float theta = vUv.x * 2.0 * 3.14159265; float phi = (1.0 - vUv.y) * 3.14159265;
        vec3 dir = vec3(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta));
        gl_FragColor = textureCube(envMap, dir); }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), panMat);
    panScene.add(quad);
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(panScene, panCamera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  captureCubemap(settings: RenderSettings, scene: THREE.Scene, center: THREE.Vector3): { px: string; nx: string; py: string; ny: string; pz: string; nz: string } {
    const results: { px: string; nx: string; py: string; ny: string; pz: string; nz: string } = {
      px: "", nx: "", py: "", ny: "", pz: "", nz: "",
    };
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, new THREE.WebGLCubeRenderTarget(settings.width));
    cubeCamera.position.copy(center);
    cubeCamera.update(this.renderer, scene);
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    for (const face of ["px", "nx", "py", "ny", "pz", "nz"] as const) {
      const mat = new THREE.MeshBasicMaterial({ map: cubeCamera.renderTarget.texture });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      tempScene.add(quad);
      this.renderer.render(tempScene, tempCamera);
      results[face] = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
      tempScene.remove(quad);
    }
    this.renderer.setSize(oldSize.x, oldSize.y);
    return results;
  }

  captureDepthMap(scene: THREE.Scene, camera: THREE.Camera, settings: RenderSettings): string {
    const oldClear = this.renderer.getClearColor(new THREE.Color());
    const oldAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 1);
    const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    scene.overrideMaterial = depthMaterial;
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    scene.overrideMaterial = null;
    this.renderer.setClearColor(oldClear, oldAlpha);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  captureNormalMap(scene: THREE.Scene, camera: THREE.Camera, settings: RenderSettings): string {
    const oldClear = this.renderer.getClearColor(new THREE.Color());
    const oldAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(new THREE.Color(0.5, 0.5, 1), 1);
    const normalMaterial = new THREE.MeshNormalMaterial();
    scene.overrideMaterial = normalMaterial;
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    scene.overrideMaterial = null;
    this.renderer.setClearColor(oldClear, oldAlpha);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  captureWireframe(scene: THREE.Scene, camera: THREE.Camera, settings: RenderSettings): string {
    const oldClear = this.renderer.getClearColor(new THREE.Color());
    const oldAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x0a0614, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    scene.overrideMaterial = wireMaterial;
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    scene.overrideMaterial = null;
    this.renderer.setClearColor(oldClear, oldAlpha);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  captureMatcap(scene: THREE.Scene, camera: THREE.Camera, settings: RenderSettings, matcapTexture: THREE.Texture): string {
    const oldClear = this.renderer.getClearColor(new THREE.Color());
    const oldAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 1);
    const matcapMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    scene.overrideMaterial = matcapMaterial;
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    scene.overrideMaterial = null;
    this.renderer.setClearColor(oldClear, oldAlpha);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  captureClayRender(scene: THREE.Scene, camera: THREE.Camera, settings: RenderSettings): string {
    const oldClear = this.renderer.getClearColor(new THREE.Color());
    const oldAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x222222, 1);
    const clayMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1, metalness: 0 });
    scene.overrideMaterial = clayMaterial;
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setSize(settings.width, settings.height);
    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL(`image/${settings.format}`, settings.quality / 100);
    scene.overrideMaterial = null;
    this.renderer.setClearColor(oldClear, oldAlpha);
    this.renderer.setSize(oldSize.x, oldSize.y);
    return dataUrl;
  }

  setPostSettings(settings: Partial<PostProcessSettings>): void {
    this.postSettings = { ...this.postSettings, ...settings };
  }

  getPostSettings(): PostProcessSettings {
    return this.postSettings;
  }

  enablePass(name: string): void {
    const pass = this.passes.get(name);
    if (pass) pass.enabled = true;
  }

  disablePass(name: string): void {
    const pass = this.passes.get(name);
    if (pass) pass.enabled = false;
  }

  togglePass(name: string): void {
    const pass = this.passes.get(name);
    if (pass) pass.enabled = !pass.enabled;
  }

  isPassEnabled(name: string): boolean {
    const pass = this.passes.get(name);
    return pass ? pass.enabled : false;
  }

  getPassNames(): string[] {
    return Array.from(this.passes.keys());
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadArrayBuffer(data: ArrayBuffer, filename: string, mime: string = "application/octet-stream"): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string, mime: string = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function createCubeRenderTarget(size: number = 512): THREE.WebGLCubeRenderTarget {
  return new THREE.WebGLCubeRenderTarget(size, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
}

export function createPMREMGenerator(renderer: THREE.WebGLRenderer): THREE.PMREMGenerator {
  return new THREE.PMREMGenerator(renderer);
}

export function generateEnvironmentMap(renderer: THREE.WebGLRenderer, scene: THREE.Scene, size: number = 256): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.04);
  pmrem.dispose();
  return target.texture;
}

export function generateCubeMap(renderer: THREE.WebGLRenderer, scene: THREE.Scene, position: THREE.Vector3, size: number = 512): THREE.CubeTexture {
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, new THREE.WebGLCubeRenderTarget(size));
  cubeCamera.position.copy(position);
  cubeCamera.update(renderer, scene);
  return cubeCamera.renderTarget.texture;
}

export function applyToneMapping(renderer: THREE.WebGLRenderer, mode: "none" | "aces" | "reinhard" | "cineon" | "linear", exposure: number = 1): void {
  switch (mode) {
    case "none": renderer.toneMapping = THREE.NoToneMapping; break;
    case "aces": renderer.toneMapping = THREE.ACESFilmicToneMapping; break;
    case "reinhard": renderer.toneMapping = THREE.ReinhardToneMapping; break;
    case "cineon": renderer.toneMapping = THREE.CineonToneMapping; break;
    case "linear": renderer.toneMapping = THREE.LinearToneMapping; break;
  }
  renderer.toneMappingExposure = exposure;
}

export function setRendererQuality(renderer: THREE.WebGLRenderer, quality: "low" | "medium" | "high" | "ultra"): void {
  switch (quality) {
    case "low":
      renderer.setPixelRatio(0.5);
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      break;
    case "medium":
      renderer.setPixelRatio(0.75);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      break;
    case "high":
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      break;
    case "ultra":
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      break;
  }
}

export function getRendererInfo(renderer: THREE.WebGLRenderer): {
  vendor: string;
  renderer: string;
  version: string;
  maxTextures: string;
  maxTextureSize: string;
  maxAttributes: string;
} {
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    vendor: debugInfo ? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string) : "Unknown",
    renderer: debugInfo ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string) : "Unknown",
    version: gl.getParameter(gl.VERSION) as string,
    maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS).toString(),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE).toString(),
    maxAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS).toString(),
  };
}

export function createSelectionOutline(scene: THREE.Scene, camera: THREE.Camera, w: number, h: number, objects: THREE.Object3D[], color: number = 0xa855f7): OutlinePass {
  const outlinePass = new OutlinePass(new THREE.Vector2(w, h), scene, camera);
  outlinePass.selectedObjects = objects;
  outlinePass.edgeColor = new THREE.Color(color);
  outlinePass.edgeStrength = 4;
  outlinePass.edgeGlow = 0.5;
  outlinePass.edgeThickness = 2;
  outlinePass.visibleEdgeColor = new THREE.Color(color);
  outlinePass.hiddenEdgeColor = new THREE.Color(color).multiplyScalar(0.3);
  return outlinePass;
}
