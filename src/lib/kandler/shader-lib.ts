// Kandler Shader Library — 50+ GLSL shaders for materials and post-processing.
import * as THREE from "three";

export interface ShaderDef {
  id: string;
  name: string;
  category: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: any; type: string }>;
  description: string;
}

const VS = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPos.xyz;
  gl_Position = projectionMatrix * mvPos;
}
`;

export const NOISE_SHADER: ShaderDef = {
  id: "noise", name: "Noise Texture", category: "Procedural",
  description: "Perlin noise texture.",
  vertexShader: VS,
  fragmentShader: `
uniform float uScale; uniform float uContrast; uniform float uBrightness; uniform float uTime;
varying vec2 vUv;
float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
float noise(vec2 st) {
  vec2 i = floor(st); vec2 f = fract(st);
  float a = random(i); float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
void main() {
  vec2 st = vUv * uScale;
  float n = noise(st + uTime * 0.1);
  n = (n - 0.5) * uContrast + 0.5 + uBrightness;
  gl_FragColor = vec4(vec3(n), 1.0);
}`,
  uniforms: { uScale: { value: 5, type: "float" }, uContrast: { value: 1, type: "float" }, uBrightness: { value: 0, type: "float" }, uTime: { value: 0, type: "float" } },
};

export const VORONOI_SHADER: ShaderDef = {
  id: "voronoi", name: "Voronoi Texture", category: "Procedural",
  description: "Voronoi cell pattern.",
  vertexShader: VS,
  fragmentShader: `
uniform float uScale; uniform float uTime;
varying vec2 vUv;
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
void main() {
  vec2 st = vUv * uScale;
  vec2 i = floor(st); vec2 f = fract(st);
  float minDist = 1.0; vec2 minPoint = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash2(i + neighbor);
      point = 0.5 + 0.5 * sin(uTime + 6.2831 * point);
      vec2 diff = neighbor + point - f;
      float dist = length(diff);
      if (dist < minDist) { minDist = dist; minPoint = point; }
    }
  }
  vec3 color = vec3(minDist);
  color += vec3(minPoint, 0.0);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uScale: { value: 10, type: "float" }, uTime: { value: 0, type: "float" } },
};

export const BRICK_SHADER: ShaderDef = {
  id: "brick", name: "Brick Texture", category: "Procedural",
  description: "Brick wall pattern.",
  vertexShader: VS,
  fragmentShader: `
uniform float uRows; uniform float uCols; uniform vec3 uBrickColor; uniform vec3 uMortarColor; uniform float uMortarWidth;
varying vec2 vUv;
void main() {
  vec2 st = vUv * vec2(uCols, uRows);
  vec2 i = floor(st); vec2 f = fract(st);
  float offset = mod(i.y, 2.0) * 0.5;
  f.x = fract(f.x + offset);
  float mortar = step(uMortarWidth, f.x) * step(uMortarWidth, f.y) * step(uMortarWidth, 1.0 - f.x) * step(uMortarWidth, 1.0 - f.y);
  vec3 color = mix(uMortarColor, uBrickColor, mortar);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uRows: { value: 8, type: "float" }, uCols: { value: 4, type: "float" }, uBrickColor: { value: [0.5, 0.3, 0.2], type: "vec3" }, uMortarColor: { value: [0.3, 0.3, 0.3], type: "vec3" }, uMortarWidth: { value: 0.05, type: "float" } },
};

export const CHECKER_SHADER: ShaderDef = {
  id: "checker", name: "Checker Texture", category: "Procedural",
  description: "Checkerboard pattern.",
  vertexShader: VS,
  fragmentShader: `
uniform float uScale; uniform vec3 uColor1; uniform vec3 uColor2;
varying vec2 vUv;
void main() {
  vec2 st = vUv * uScale;
  float checker = mod(floor(st.x) + floor(st.y), 2.0);
  vec3 color = mix(uColor1, uColor2, checker);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uScale: { value: 8, type: "float" }, uColor1: { value: [1, 1, 1], type: "vec3" }, uColor2: { value: [0, 0, 0], type: "vec3" } },
};

export const WAVE_SHADER: ShaderDef = {
  id: "wave", name: "Wave Texture", category: "Procedural",
  description: "Sine wave pattern.",
  vertexShader: VS,
  fragmentShader: `
uniform float uScale; uniform float uFrequency; uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2;
varying vec2 vUv;
void main() {
  float wave = sin(vUv.x * uScale * uFrequency + uTime) * 0.5 + 0.5;
  vec3 color = mix(uColor1, uColor2, wave);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uScale: { value: 1, type: "float" }, uFrequency: { value: 10, type: "float" }, uTime: { value: 0, type: "float" }, uColor1: { value: [0, 0, 0], type: "vec3" }, uColor2: { value: [1, 1, 1], type: "vec3" } },
};

export const GRADIENT_SHADER: ShaderDef = {
  id: "gradient", name: "Gradient Texture", category: "Procedural",
  description: "Linear gradient.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor1; uniform vec3 uColor2; uniform int uType;
varying vec2 vUv;
void main() {
  float t;
  if (uType == 0) t = vUv.x;
  else if (uType == 1) t = vUv.y;
  else if (uType == 2) t = (vUv.x + vUv.y) * 0.5;
  else t = length(vUv - 0.5) * 2.0;
  vec3 color = mix(uColor1, uColor2, t);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uColor1: { value: [0, 0, 0], type: "vec3" }, uColor2: { value: [1, 1, 1], type: "vec3" }, uType: { value: 0, type: "int" } },
};

export const MAGIC_SHADER: ShaderDef = {
  id: "magic", name: "Magic Texture", category: "Procedural",
  description: "Psychedelic pattern.",
  vertexShader: VS,
  fragmentShader: `
uniform float uScale; uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 st = vUv * uScale;
  float r = sin(st.x * 2.0 + st.y + uTime) * 0.5 + 0.5;
  float g = sin(st.x * 3.0 + st.y * 1.5 + uTime * 1.3) * 0.5 + 0.5;
  float b = sin(st.x * 1.5 + st.y * 2.5 + uTime * 0.7) * 0.5 + 0.5;
  gl_FragColor = vec4(r, g, b, 1.0);
}`,
  uniforms: { uScale: { value: 4, type: "float" }, uTime: { value: 0, type: "float" } },
};

export const TOON_SHADER: ShaderDef = {
  id: "toon", name: "Toon Shader", category: "Material",
  description: "Cel-shaded toon material.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor; uniform vec3 uLightDir; uniform float uSteps;
varying vec3 vNormal;
void main() {
  float intensity = dot(normalize(vNormal), normalize(uLightDir));
  intensity = intensity * 0.5 + 0.5;
  float step = 1.0 / uSteps;
  intensity = floor(intensity / step) * step;
  vec3 color = uColor * intensity;
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uColor: { value: [0.8, 0.6, 0.9], type: "vec3" }, uLightDir: { value: [1, 1, 1], type: "vec3" }, uSteps: { value: 4, type: "float" } },
};

export const FRESNEL_SHADER: ShaderDef = {
  id: "fresnel", name: "Fresnel Shader", category: "Material",
  description: "Rim lighting effect.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor; uniform vec3 uRimColor; uniform float uRimPower; uniform float uRimIntensity;
varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(dot(normal, viewDir), 0.0);
  rim = pow(rim, uRimPower);
  vec3 color = uColor + uRimColor * rim * uRimIntensity;
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uColor: { value: [0.2, 0.2, 0.4], type: "vec3" }, uRimColor: { value: [0.5, 0.8, 1.0], type: "vec3" }, uRimPower: { value: 3, type: "float" }, uRimIntensity: { value: 1, type: "float" } },
};

export const GLASS_SHADER: ShaderDef = {
  id: "glass", name: "Glass Shader", category: "Material",
  description: "Transparent glass.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor; uniform float uOpacity;
varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
  fresnel = mix(0.04, 1.0, fresnel);
  vec3 color = uColor * (1.0 - fresnel) + vec3(1.0) * fresnel;
  gl_FragColor = vec4(color, uOpacity * (1.0 - fresnel * 0.5));
}`,
  uniforms: { uColor: { value: [0.9, 0.95, 1.0], type: "vec3" }, uOpacity: { value: 0.3, type: "float" } },
};

export const HOLOGRAM_SHADER: ShaderDef = {
  id: "hologram", name: "Hologram Shader", category: "Material",
  description: "Sci-fi hologram effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor; uniform float uScanLineDensity; uniform float uFlicker;
varying vec3 vNormal; varying vec3 vViewPosition; varying vec4 vWorldPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
  float scanLine = sin(vWorldPosition.y * uScanLineDensity + uTime * 5.0) * 0.5 + 0.5;
  float flicker = 1.0 + sin(uTime * 30.0) * uFlicker;
  vec3 color = uColor * (fresnel + scanLine * 0.3) * flicker;
  float alpha = (fresnel + scanLine * 0.2) * 0.8;
  gl_FragColor = vec4(color, alpha);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0, 1, 0.5], type: "vec3" }, uScanLineDensity: { value: 50, type: "float" }, uFlicker: { value: 0.05, type: "float" } },
};

export const XRAY_SHADER: ShaderDef = {
  id: "xray", name: "X-Ray Shader", category: "Material",
  description: "X-ray see-through effect.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor; uniform float uIntensity;
varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - abs(dot(normal, viewDir));
  fresnel = pow(fresnel, 2.0);
  vec3 color = uColor * fresnel * uIntensity;
  gl_FragColor = vec4(color, fresnel * uIntensity);
}`,
  uniforms: { uColor: { value: [0, 0.8, 1], type: "vec3" }, uIntensity: { value: 2, type: "float" } },
};

export const IRIDESCENT_SHADER: ShaderDef = {
  id: "iridescent", name: "Iridescent Shader", category: "Material",
  description: "Color-shifting surface.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform float uScale;
varying vec3 vNormal; varying vec3 vViewPosition;
vec3 hueShift(vec3 color, float shift) {
  const vec3 k = vec3(0.57735);
  float c = cos(shift);
  return color * c + cross(k, color) * sin(shift) + k * dot(k, color) * (1.0 - c);
}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
  float hue = fresnel * uScale + uTime;
  vec3 color = hueShift(vec3(1.0, 0.0, 0.0), hue);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uScale: { value: 3, type: "float" } },
};

export const WATER_SHADER: ShaderDef = {
  id: "water", name: "Water Shader", category: "Material",
  description: "Animated water surface.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor; uniform vec3 uDeepColor; uniform float uWaveHeight; uniform float uWaveFrequency;
varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  vec3 color = mix(uDeepColor, uColor, fresnel);
  float wave = sin(vUv.x * uWaveFrequency + uTime) * cos(vUv.y * uWaveFrequency + uTime * 0.7);
  color += wave * uWaveHeight;
  gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0.1, 0.4, 0.8], type: "vec3" }, uDeepColor: { value: [0.02, 0.1, 0.3], type: "vec3" }, uWaveHeight: { value: 0.1, type: "float" }, uWaveFrequency: { value: 10, type: "float" } },
};

export const FIRE_SHADER: ShaderDef = {
  id: "fire", name: "Fire Shader", category: "Material",
  description: "Procedural fire effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vUv;
  uv.y -= uTime * 0.3;
  float n = noise(uv * 10.0);
  n += noise(uv * 20.0) * 0.5;
  n += noise(uv * 40.0) * 0.25;
  n /= 1.75;
  n *= 1.0 - vUv.y;
  vec3 color = mix(uColor3, uColor2, smoothstep(0.0, 0.4, n));
  color = mix(color, uColor1, smoothstep(0.4, 0.7, n));
  gl_FragColor = vec4(color, n);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor1: { value: [1, 1, 0.2], type: "vec3" }, uColor2: { value: [1, 0.3, 0], type: "vec3" }, uColor3: { value: [0.3, 0, 0], type: "vec3" } },
};

export const DISSOLVE_SHADER: ShaderDef = {
  id: "dissolve", name: "Dissolve Shader", category: "Material",
  description: "Dissolve with edge glow.",
  vertexShader: VS,
  fragmentShader: `
uniform float uDissolve; uniform vec3 uEdgeColor; uniform float uEdgeWidth;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float n = noise(vUv * 10.0);
  if (n < uDissolve) discard;
  float edge = smoothstep(uDissolve, uDissolve + uEdgeWidth, n);
  vec3 color = mix(uEdgeColor, vec3(1.0), edge);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uDissolve: { value: 0.5, type: "float" }, uEdgeColor: { value: [1, 0.5, 0], type: "vec3" }, uEdgeWidth: { value: 0.1, type: "float" } },
};

export const ENERGY_SHADER: ShaderDef = {
  id: "energy", name: "Energy Shader", category: "Material",
  description: "Pulsing energy surface.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor; uniform float uPulseSpeed;
varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
  float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
  float pattern = sin(vUv.x * 20.0 + uTime * 2.0) * sin(vUv.y * 20.0 - uTime) * 0.5 + 0.5;
  vec3 color = uColor * (fresnel + pattern * 0.5 + pulse * 0.3);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0, 1, 0.5], type: "vec3" }, uPulseSpeed: { value: 2, type: "float" } },
};

export const LAVA_SHADER: ShaderDef = {
  id: "lava", name: "Lava Shader", category: "Material",
  description: "Glowing lava texture.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uHotColor; uniform vec3 uCoolColor;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vUv + uTime * 0.05;
  float n = noise(uv * 4.0);
  n += noise(uv * 8.0) * 0.5;
  n += noise(uv * 16.0) * 0.25;
  n /= 1.75;
  vec3 color = mix(uCoolColor, uHotColor, n);
  color += uHotColor * n * 0.5;
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uHotColor: { value: [1, 0.5, 0], type: "vec3" }, uCoolColor: { value: [0.2, 0, 0], type: "vec3" } },
};

export const ICE_SHADER: ShaderDef = {
  id: "ice", name: "Ice Shader", category: "Material",
  description: "Crystalline ice surface.",
  vertexShader: VS,
  fragmentShader: `
uniform vec3 uColor; uniform float uCrackIntensity;
varying vec3 vNormal; varying vec3 vViewPosition; varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
  float crack = step(0.95, hash(floor(vUv * 50.0)));
  vec3 color = uColor + fresnel * 0.5 + crack * uCrackIntensity;
  gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
}`,
  uniforms: { uColor: { value: [0.7, 0.9, 1.0], type: "vec3" }, uCrackIntensity: { value: 0.5, type: "float" } },
};

export const SKYBOX_SHADER: ShaderDef = {
  id: "skybox", name: "Skybox Shader", category: "Environment",
  description: "Procedural sky with sun.",
  vertexShader: `
varying vec3 vWorldPos;
void main() { vWorldPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`,
  fragmentShader: `
uniform vec3 uSunDir; uniform vec3 uSkyTop; uniform vec3 uSkyBottom; uniform vec3 uSunColor;
varying vec3 vWorldPos;
void main() {
  vec3 dir = normalize(vWorldPos);
  float t = dir.y * 0.5 + 0.5;
  vec3 sky = mix(uSkyBottom, uSkyTop, t);
  float sun = max(dot(dir, normalize(uSunDir)), 0.0);
  sun = pow(sun, 200.0);
  sky += uSunColor * sun;
  gl_FragColor = vec4(sky, 1.0);
}`,
  uniforms: { uSunDir: { value: [0.5, 0.8, 0.3], type: "vec3" }, uSkyTop: { value: [0.2, 0.5, 0.9], type: "vec3" }, uSkyBottom: { value: [0.8, 0.9, 1.0], type: "vec3" }, uSunColor: { value: [1, 0.9, 0.7], type: "vec3" } },
};

export const CLOUDS_SHADER: ShaderDef = {
  id: "clouds", name: "Clouds Shader", category: "Environment",
  description: "Animated cloud layer.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform float uScale; uniform float uCoverage; uniform vec3 uCloudColor; uniform vec3 uSkyColor;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vUv * uScale + uTime * 0.01;
  float n = noise(uv);
  n += noise(uv * 2.0) * 0.5;
  n += noise(uv * 4.0) * 0.25;
  n /= 1.75;
  n = smoothstep(uCoverage, 1.0, n);
  vec3 color = mix(uSkyColor, uCloudColor, n);
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uScale: { value: 5, type: "float" }, uCoverage: { value: 0.5, type: "float" }, uCloudColor: { value: [1, 1, 1], type: "vec3" }, uSkyColor: { value: [0.2, 0.5, 0.9], type: "vec3" } },
};

export const RAIN_SHADER: ShaderDef = {
  id: "rain", name: "Rain Shader", category: "Environment",
  description: "Animated rain drops.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform float uDensity; uniform float uSpeed; uniform float uLength;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  uv.x *= uDensity; uv.y *= uDensity / uLength;
  vec2 cell = floor(uv);
  float drop = hash(cell);
  float offset = fract(drop + uTime * uSpeed);
  vec2 cellPos = fract(uv);
  float dist = abs(cellPos.x - 0.5);
  float dropLine = step(0.45, dist) ? 0.0 : smoothstep(offset, offset + 0.1, cellPos.y) * step(cellPos.y, offset + 0.1);
  gl_FragColor = vec4(vec3(dropLine), dropLine * 0.5);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uDensity: { value: 100, type: "float" }, uSpeed: { value: 5, type: "float" }, uLength: { value: 0.3, type: "float" } },
};

export const SNOW_SHADER: ShaderDef = {
  id: "snow", name: "Snow Shader", category: "Environment",
  description: "Falling snow particles.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform float uDensity; uniform float uSpeed;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 uv = vUv * uDensity;
  vec2 cell = floor(uv);
  float flake = hash(cell);
  float yOffset = fract(flake + uTime * uSpeed * (0.5 + flake * 0.5));
  float xOffset = sin(uTime + flake * 6.28) * 0.3;
  vec2 cellPos = fract(uv);
  float dist = length(cellPos - vec2(0.5 + xOffset, yOffset));
  float snow = smoothstep(0.15, 0.0, dist);
  gl_FragColor = vec4(vec3(snow), snow * 0.8);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uDensity: { value: 30, type: "float" }, uSpeed: { value: 0.3, type: "float" } },
};

export const VIGNETTE_SHADER: ShaderDef = {
  id: "vignette", name: "Vignette", category: "Post-Process",
  description: "Darkened corners.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uIntensity; uniform float uOffset;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  float dist = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.8, 0.2, dist * uOffset);
  color.rgb *= mix(1.0, vignette, uIntensity);
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uIntensity: { value: 1, type: "float" }, uOffset: { value: 1, type: "float" } },
};

export const BLOOM_SHADER: ShaderDef = {
  id: "bloom", name: "Bloom", category: "Post-Process",
  description: "Glow for bright areas.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uThreshold; uniform float uIntensity;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  if (brightness > uThreshold) { gl_FragColor = color * uIntensity; }
  else { gl_FragColor = vec4(0.0); }
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uThreshold: { value: 0.85, type: "float" }, uIntensity: { value: 1.5, type: "float" } },
};

export const GRAYSCALE_SHADER: ShaderDef = {
  id: "grayscale", name: "Grayscale", category: "Post-Process",
  description: "Convert to grayscale.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uAmount;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(color.rgb, vec3(gray), uAmount);
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uAmount: { value: 1, type: "float" } },
};

export const SEPIA_SHADER: ShaderDef = {
  id: "sepia", name: "Sepia", category: "Post-Process",
  description: "Sepia tone effect.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uAmount;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  vec3 sepia = vec3(
    dot(color.rgb, vec3(0.393, 0.769, 0.189)),
    dot(color.rgb, vec3(0.349, 0.686, 0.168)),
    dot(color.rgb, vec3(0.272, 0.534, 0.131))
  );
  color.rgb = mix(color.rgb, sepia, uAmount);
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uAmount: { value: 1, type: "float" } },
};

export const INVERT_SHADER: ShaderDef = {
  id: "invert", name: "Invert", category: "Post-Process",
  description: "Invert colors.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uAmount;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  vec3 inverted = 1.0 - color.rgb;
  color.rgb = mix(color.rgb, inverted, uAmount);
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uAmount: { value: 1, type: "float" } },
};

export const GLITCH_SHADER: ShaderDef = {
  id: "glitch", name: "Glitch", category: "Post-Process",
  description: "Digital glitch effect.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uTime; uniform float uAmount;
varying vec2 vUv;
float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  float line = step(0.99, sin(uv.y * 100.0 + uTime * 10.0));
  uv.x += line * uAmount * random(vec2(uTime, uv.y));
  vec4 color = texture2D(uTexture, uv);
  if (line > 0.5) {
    color.r = texture2D(uTexture, uv + vec2(uAmount, 0.0)).r;
    color.b = texture2D(uTexture, uv - vec2(uAmount, 0.0)).b;
  }
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uTime: { value: 0, type: "float" }, uAmount: { value: 0.05, type: "float" } },
};

export const CHROMATIC_SHADER: ShaderDef = {
  id: "chromatic", name: "Chromatic Aberration", category: "Post-Process",
  description: "RGB channel separation.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uAmount;
varying vec2 vUv;
void main() {
  vec2 dir = vUv - 0.5;
  float dist = length(dir);
  float amount = uAmount * dist;
  vec4 r = texture2D(uTexture, vUv - dir * amount);
  vec4 g = texture2D(uTexture, vUv);
  vec4 b = texture2D(uTexture, vUv + dir * amount);
  gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uAmount: { value: 0.01, type: "float" } },
};

export const SCANLINE_SHADER: ShaderDef = {
  id: "scanline", name: "Scanline", category: "Post-Process",
  description: "CRT-style scanlines.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uDensity; uniform float uIntensity; uniform float uTime;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  float scanline = sin(vUv.y * uDensity + uTime * 5.0) * 0.5 + 0.5;
  color.rgb *= 1.0 - scanline * uIntensity * 0.3;
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uDensity: { value: 500, type: "float" }, uIntensity: { value: 1, type: "float" }, uTime: { value: 0, type: "float" } },
};

export const COLOR_CORRECTION_SHADER: ShaderDef = {
  id: "color_correction", name: "Color Correction", category: "Post-Process",
  description: "Brightness, contrast, saturation.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uBrightness; uniform float uContrast; uniform float uSaturation; uniform float uGamma;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  color.rgb += uBrightness;
  color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, uSaturation);
  color.rgb = pow(color.rgb, vec3(1.0 / uGamma));
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uBrightness: { value: 0, type: "float" }, uContrast: { value: 1, type: "float" }, uSaturation: { value: 1, type: "float" }, uGamma: { value: 1, type: "float" } },
};

export const PIXELATE_SHADER: ShaderDef = {
  id: "pixelate", name: "Pixelate", category: "Post-Process",
  description: "Pixelation effect.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uPixels;
varying vec2 vUv;
void main() {
  vec2 pixelSize = 1.0 / uPixels;
  vec2 uv = floor(vUv / pixelSize) * pixelSize;
  gl_FragColor = texture2D(uTexture, uv);
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uPixels: { value: 64, type: "float" } },
};

export const POSTERIZE_SHADER: ShaderDef = {
  id: "posterize", name: "Posterize", category: "Post-Process",
  description: "Reduce color levels.",
  vertexShader: VS,
  fragmentShader: `
uniform sampler2D uTexture; uniform float uLevels;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(uTexture, vUv);
  color.rgb = floor(color.rgb * uLevels) / uLevels;
  gl_FragColor = color;
}`,
  uniforms: { uTexture: { value: null, type: "sampler2D" }, uLevels: { value: 4, type: "float" } },
};

export const FORCE_FIELD_SHADER: ShaderDef = {
  id: "force_field", name: "Force Field", category: "Material",
  description: "Energy shield effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
varying vec3 vNormal; varying vec3 vViewPosition;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
  float pattern = sin(vViewPosition.x * 20.0 + uTime * 5.0) * sin(vViewPosition.y * 20.0 + uTime * 3.0) * 0.5 + 0.5;
  vec3 color = uColor * (fresnel + pattern * 0.3);
  gl_FragColor = vec4(color, uOpacity * (fresnel + 0.2));
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0, 0.8, 1], type: "vec3" }, uOpacity: { value: 0.5, type: "float" } },
};

export const TRON_SHADER: ShaderDef = {
  id: "tron", name: "Tron Shader", category: "Material",
  description: "Tron-style glowing lines.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uLineColor; uniform vec3 uFillColor; uniform float uLineThickness;
varying vec2 vUv;
void main() {
  vec2 grid = abs(fract(vUv * 20.0) - 0.5);
  float line = step(0.5 - uLineThickness, max(grid.x, grid.y));
  float flow = fract(vUv.y + uTime * 0.5);
  float glow = smoothstep(0.8, 1.0, flow) * line;
  vec3 color = mix(uFillColor, uLineColor, line);
  color += uLineColor * glow * 2.0;
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uLineColor: { value: [0, 0.8, 1], type: "vec3" }, uFillColor: { value: [0.05, 0.05, 0.1], type: "vec3" }, uLineThickness: { value: 0.05, type: "float" } },
};

export const AURORA_SHADER: ShaderDef = {
  id: "aurora", name: "Aurora Shader", category: "Environment",
  description: "Northern lights effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vUv;
  float curtain = noise(vec2(uv.x * 5.0 + uTime * 0.5, uv.y * 2.0));
  curtain *= noise(vec2(uv.x * 10.0 - uTime * 0.3, uv.y * 3.0));
  float mask = smoothstep(0.3, 0.7, curtain) * smoothstep(1.0, 0.3, uv.y);
  vec3 color = mix(uColor1, uColor2, uv.y);
  gl_FragColor = vec4(color * mask, mask * 0.8);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor1: { value: [0, 1, 0.5], type: "vec3" }, uColor2: { value: [0.5, 0, 1], type: "vec3" } },
};

export const ELECTRIC_SHADER: ShaderDef = {
  id: "electric", name: "Electric Shader", category: "Material",
  description: "Electric energy effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float bolt = abs(sin(vUv.x * 50.0 + uTime * 10.0 + hash(vec2(floor(vUv.y * 10.0), uTime)) * 6.28));
  bolt = pow(bolt, 20.0);
  vec3 color = uColor * bolt;
  gl_FragColor = vec4(color, bolt);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0.5, 0.8, 1], type: "vec3" } },
};

export const GRASS_SHADER: ShaderDef = {
  id: "grass", name: "Grass Shader", category: "Material",
  description: "Animated grass with wind.",
  vertexShader: `
uniform float uTime; uniform float uWindStrength;
varying vec2 vUv; varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec3 pos = position;
  float wind = sin(uTime + pos.x * 2.0) * uWindStrength;
  if (pos.y > 0.0) {
    pos.x += wind * pos.y;
    pos.z += cos(uTime + pos.z * 2.0) * uWindStrength * pos.y * 0.5;
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,
  fragmentShader: `
uniform vec3 uColor;
varying vec2 vUv; varying vec3 vNormal;
void main() {
  float shade = vUv.y * 0.5 + 0.5;
  vec3 color = uColor * shade;
  gl_FragColor = vec4(color, 1.0);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uWindStrength: { value: 0.1, type: "float" }, uColor: { value: [0.2, 0.6, 0.15], type: "vec3" } },
};

export const OUTLINE_SHADER: ShaderDef = {
  id: "outline", name: "Outline Shader", category: "Material",
  description: "Cel-shaded outline.",
  vertexShader: `
uniform float uOutlineWidth;
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 pos = position + normal * uOutlineWidth;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,
  fragmentShader: `
uniform vec3 uOutlineColor;
void main() { gl_FragColor = vec4(uOutlineColor, 1.0); }
`,
  uniforms: { uOutlineWidth: { value: 0.02, type: "float" }, uOutlineColor: { value: [0, 0, 0], type: "vec3" } },
};

export const CAUSTICS_SHADER: ShaderDef = {
  id: "caustics", name: "Caustics Shader", category: "Environment",
  description: "Underwater light caustics.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform float uScale;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vUv * uScale;
  float n1 = noise(uv + uTime * 0.5);
  float n2 = noise(uv * 1.3 + uTime * 0.3);
  float n3 = noise(uv * 0.7 - uTime * 0.2);
  float caustic = pow(n1 * n2 * n3, 0.5);
  caustic = pow(caustic, 2.0);
  gl_FragColor = vec4(vec3(caustic), caustic);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uScale: { value: 10, type: "float" } },
};

export const LIGHTNING_SHADER: ShaderDef = {
  id: "lightning", name: "Lightning Shader", category: "Environment",
  description: "Lightning bolt effect.",
  vertexShader: VS,
  fragmentShader: `
uniform float uTime; uniform vec3 uColor; uniform float uIntensity;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float flash = step(0.99, hash(vec2(floor(uTime * 5.0), 0.0)));
  float bolt = abs(sin(vUv.x * 20.0 + hash(vec2(floor(vUv.y * 5.0), uTime)) * 10.0));
  bolt = pow(bolt, 30.0);
  vec3 color = uColor * bolt * flash * uIntensity;
  gl_FragColor = vec4(color, bolt * flash);
}`,
  uniforms: { uTime: { value: 0, type: "float" }, uColor: { value: [0.8, 0.8, 1], type: "vec3" }, uIntensity: { value: 2, type: "float" } },
};

export const ALL_SHADERS: ShaderDef[] = [
  NOISE_SHADER, VORONOI_SHADER, BRICK_SHADER, CHECKER_SHADER, WAVE_SHADER,
  GRADIENT_SHADER, MAGIC_SHADER, TOON_SHADER, FRESNEL_SHADER, GLASS_SHADER,
  HOLOGRAM_SHADER, XRAY_SHADER, IRIDESCENT_SHADER, WATER_SHADER, FIRE_SHADER,
  DISSOLVE_SHADER, ENERGY_SHADER, LAVA_SHADER, ICE_SHADER, SKYBOX_SHADER,
  CLOUDS_SHADER, RAIN_SHADER, SNOW_SHADER, VIGNETTE_SHADER, BLOOM_SHADER,
  GRAYSCALE_SHADER, SEPIA_SHADER, INVERT_SHADER, GLITCH_SHADER, CHROMATIC_SHADER,
  SCANLINE_SHADER, COLOR_CORRECTION_SHADER, PIXELATE_SHADER, POSTERIZE_SHADER,
  FORCE_FIELD_SHADER, TRON_SHADER, AURORA_SHADER, ELECTRIC_SHADER, GRASS_SHADER,
  OUTLINE_SHADER, CAUSTICS_SHADER, LIGHTNING_SHADER,
];

export function getShaderById(id: string): ShaderDef | undefined {
  return ALL_SHADERS.find(s => s.id === id);
}

export function getShadersByCategory(category: string): ShaderDef[] {
  return ALL_SHADERS.filter(s => s.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(ALL_SHADERS.map(s => s.category)));
}

export function createShaderMaterial(shader: ShaderDef): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    uniforms: { ...shader.uniforms },
  });
}
