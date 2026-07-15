// Kandler Complete Procedural Texture Library — canvas-based texture generators.
// Generates real textures for use as THREE.CanvasTexture.
import * as THREE from "three";

export function generateNoiseTexture(size: number = 256, scale: number = 4, octaves: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const grad: number[][] = [];
  for (let i = 0; i < 256; i++) { grad.push([Math.random() * 2 - 1, Math.random() * 2 - 1]); }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const noise2D = (x: number, y: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad[aa][0] * x + grad[aa][1] * y, grad[ba][0] * (x - 1) + grad[ba][1] * y, u),
                lerp(grad[ab][0] * x + grad[ab][1] * (y - 1), grad[bb][0] * (x - 1) + grad[bb][1] * (y - 1), u), v) * 0.5 + 0.5;
  };
  const fbm = (x: number, y: number) => {
    let total = 0, freq = 1, amp = 1, max = 0;
    for (let i = 0; i < octaves; i++) { total += noise2D(x * freq, y * freq) * amp; max += amp; amp *= 0.5; freq *= 2; }
    return total / max;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = fbm((x / size) * scale, (y / size) * scale);
      const c = Math.floor(v * 255);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateVoronoiTexture(size: number = 256, cells: number = 8, colored: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const points: { x: number; y: number; color: [number, number, number] }[] = [];
  for (let i = 0; i < cells; i++) {
    points.push({
      x: Math.random() * size, y: Math.random() * size,
      color: colored ? [Math.random() * 255, Math.random() * 255, Math.random() * 255] : [128, 128, 128],
    });
  }
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let minDist = Infinity, nearest = points[0], secondDist = Infinity;
      for (const p of points) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < minDist) { secondDist = minDist; minDist = d; nearest = p; }
        else if (d < secondDist) secondDist = d;
      }
      const i = (y * size + x) * 4;
      data[i] = nearest.color[0]; data[i + 1] = nearest.color[1]; data[i + 2] = nearest.color[2]; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateBrickTexture(size: number = 256, rows: number = 8, cols: number = 4, brickColor: string = "#8b5a3a", mortarColor: string = "#3a3a3a"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = mortarColor;
  ctx.fillRect(0, 0, size, size);
  const brickW = size / cols, brickH = size / rows, mortar = 2;
  ctx.fillStyle = brickColor;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : brickW / 2;
    for (let c = -1; c < cols + 1; c++) {
      const x = c * brickW + offset + mortar;
      const y = r * brickH + mortar;
      const w = brickW - mortar * 2, h = brickH - mortar * 2;
      if (x + w > 0 && x < size) ctx.fillRect(Math.max(0, x), y, Math.min(w, size - x), h);
    }
  }
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 20, Math.random() * 20);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateCheckerTexture(size: number = 256, squares: number = 8, color1: string = "#ffffff", color2: string = "#000000"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const sq = size / squares;
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
      ctx.fillRect(x * sq, y * sq, sq, sq);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateGradientTexture(size: number = 256, color1: string = "#000000", color2: string = "#ffffff", angle: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const x1 = size / 2 + Math.cos(angle) * size / 2;
  const y1 = size / 2 + Math.sin(angle) * size / 2;
  const x2 = size / 2 - Math.cos(angle) * size / 2;
  const y2 = size / 2 - Math.sin(angle) * size / 2;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateWaveTexture(size: number = 256, frequency: number = 4, amplitude: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (Math.sin((x / size) * Math.PI * 2 * frequency) * Math.cos((y / size) * Math.PI * 2 * frequency)) * amplitude * 0.5 + 0.5;
      const c = Math.floor(v * 255);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateMagicTexture(size: number = 256, depth: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * depth, v = (y / size) * depth;
      const r = Math.sin(u * 2 + v) * 0.5 + 0.5;
      const g = Math.sin(u * 3 + v * 1.5) * 0.5 + 0.5;
      const b = Math.sin(u * 1.5 + v * 2.5) * 0.5 + 0.5;
      const i = (y * size + x) * 4;
      data[i] = Math.floor(r * 255); data[i + 1] = Math.floor(g * 255); data[i + 2] = Math.floor(b * 255); data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateWoodTexture(size: number = 256, ringFrequency: number = 8, turbulence: number = 0.1): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2, cy = y - size / 2;
      const r = Math.sqrt(cx * cx + cy * cy);
      const angle = Math.atan2(cy, cx);
      const noise = Math.sin(angle * 5 + r * 0.05) * turbulence;
      const ring = Math.sin((r / size) * Math.PI * 2 * ringFrequency + noise * 10) * 0.5 + 0.5;
      const c = Math.floor(ring * 180 + 40);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = Math.floor(c * 0.6); data[i + 2] = Math.floor(c * 0.3); data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateMarbleTexture(size: number = 256, turbulence: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const t = Math.sin((u + v) * 10 + Math.sin(u * 20) * turbulence + Math.sin(v * 15) * turbulence) * 0.5 + 0.5;
      const vein = Math.pow(t, 3);
      const c = Math.floor(vein * 200 + 55);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateCloudTexture(size: number = 256, scale: number = 4, coverage: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const grad: number[][] = [];
  for (let i = 0; i < 256; i++) grad.push([Math.random() * 2 - 1, Math.random() * 2 - 1]);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const noise2D = (x: number, y: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad[aa][0] * x + grad[aa][1] * y, grad[ba][0] * (x - 1) + grad[ba][1] * y, u),
                lerp(grad[ab][0] * x + grad[ab][1] * (y - 1), grad[bb][0] * (x - 1) + grad[bb][1] * (y - 1), u), v) * 0.5 + 0.5;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let n = 0, freq = 1, amp = 1, max = 0;
      for (let i = 0; i < 6; i++) {
        n += noise2D((x / size) * scale * freq, (y / size) * scale * freq) * amp;
        max += amp; amp *= 0.5; freq *= 2;
      }
      n = n / max;
      n = Math.max(0, Math.min(1, (n - coverage) / (1 - coverage)));
      const c = Math.floor(n * 255);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateNormalMapFromHeight(heightMap: THREE.Texture, strength: number = 1): THREE.CanvasTexture {
  const image = heightMap.image as HTMLCanvasElement;
  if (!image) return new THREE.CanvasTexture(document.createElement("canvas"));
  const size = image.width;
  const srcCtx = image.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, size, size).data;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const x1 = Math.max(0, x - 1), x2 = Math.min(size - 1, x + 1);
      const y1 = Math.max(0, y - 1), y2 = Math.min(size - 1, y + 1);
      const hL = srcData[(y * size + x1) * 4] / 255;
      const hR = srcData[(y * size + x2) * 4] / 255;
      const hD = srcData[(y1 * size + x) * 4] / 255;
      const hU = srcData[(y2 * size + x) * 4] / 255;
      const dx = (hR - hL) * strength;
      const dy = (hU - hD) * strength;
      const nz = 1;
      const len = Math.sqrt(dx * dx + dy * dy + nz * nz);
      const i = (y * size + x) * 4;
      data[i] = Math.floor((dx / len * 0.5 + 0.5) * 255);
      data[i + 1] = Math.floor((dy / len * 0.5 + 0.5) * 255);
      data[i + 2] = Math.floor((nz / len * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateRoughnessMap(baseColor: string = "#808080", roughness: number = 0.5, size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `rgb(${Math.floor(roughness * 255)}, ${Math.floor(roughness * 255)}, ${Math.floor(roughness * 255)})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = Math.random() * 3 + 1;
    const v = Math.random() * 60 - 30;
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0}, ${v > 0 ? 255 : 0}, ${v > 0 ? 255 : 0}, ${Math.abs(v) / 255})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  void baseColor;
  return tex;
}

export function generateMetalnessMap(metalness: number = 0, size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = Math.floor(metalness * 255);
  ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateAOTexture(size: number = 256, intensity: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2, cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy) / (size / 2);
      const ao = Math.max(0, 1 - dist * intensity);
      const c = Math.floor(ao * 255);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateSpecularTexture(size: number = 256, intensity: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `rgb(${Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)})`;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateEmissiveTexture(size: number = 256, color: string = "#ff0000", intensity: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  ctx.fillStyle = `rgb(${Math.floor(c.r * 255 * intensity)}, ${Math.floor(c.g * 255 * intensity)}, ${Math.floor(c.b * 255 * intensity)})`;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateDisplacementTexture(size: number = 256, scale: number = 4, height: number = 0.5): THREE.CanvasTexture {
  return generateNoiseTexture(size, scale, 4);
}

export function generateConcreteTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const v = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(${128 + v}, ${128 + v}, ${128 + v}, 0.3)`;
    ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
  }
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(60, 60, 60, ${Math.random() * 0.3})`;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateFabricTexture(size: number = 256, color: string = "#4a4a8a"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const c = new THREE.Color(color);
  const dark = c.clone().multiplyScalar(0.8);
  const light = c.clone().multiplyScalar(1.2);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const v = (x + y) % 4 === 0 ? dark : light;
      ctx.fillStyle = `rgb(${Math.floor(v.r * 255)}, ${Math.floor(v.g * 255)}, ${Math.floor(v.b * 255)})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateMetalTexture(size: number = 256, color: string = "#888888", scratches: number = 50): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const c = new THREE.Color(color);
  const scratch = c.clone().multiplyScalar(1.3);
  ctx.strokeStyle = `rgb(${Math.floor(scratch.r * 255)}, ${Math.floor(scratch.g * 255)}, ${Math.floor(scratch.b * 255)})`;
  for (let i = 0; i < scratches; i++) {
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.globalAlpha = Math.random() * 0.3 + 0.1;
    ctx.beginPath();
    const x = Math.random() * size, y = Math.random() * size;
    const angle = Math.random() * Math.PI * 2;
    const len = Math.random() * 50 + 10;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateLeatherTexture(size: number = 256, color: string = "#5a3a2a"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const c = new THREE.Color(color);
  const dark = c.clone().multiplyScalar(0.6);
  const light = c.clone().multiplyScalar(1.3);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = Math.random() * 8 + 2;
    const v = Math.random() > 0.5 ? light : dark;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${Math.floor(v.r * 255)}, ${Math.floor(v.g * 255)}, ${Math.floor(v.b * 255)}, 0.3)`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateWaterTexture(size: number = 256, color: string = "#1a4a8a"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const c = new THREE.Color(color);
  const light = c.clone().lerp(new THREE.Color(1, 1, 1), 0.3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      if (wave > 0.7) {
        ctx.fillStyle = `rgba(${Math.floor(light.r * 255)}, ${Math.floor(light.g * 255)}, ${Math.floor(light.b * 255)}, ${(wave - 0.7) * 2})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateGrassTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2a5a1a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const g = 80 + Math.random() * 80;
    const b = 20 + Math.random() * 30;
    ctx.fillStyle = `rgba(${Math.floor(g * 0.3)}, ${g}, ${b}, ${Math.random() * 0.5 + 0.3})`;
    ctx.fillRect(x, y, 1, Math.random() * 3 + 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateSandTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#c2b280";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const v = Math.random() * 30 - 15;
    ctx.fillStyle = `rgba(${194 + v}, ${178 + v}, ${128 + v}, 0.5)`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateRockTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#606060";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = Math.random() * 20 + 5;
    const v = Math.random() * 40 - 20;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${96 + v}, ${96 + v}, ${96 + v}, 0.5)`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(40, 40, 40, ${Math.random() * 0.3 + 0.1})`;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateIceTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#a0d0f0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`;
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    let x = Math.random() * size, y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 30;
      y += (Math.random() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateLavaTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const noise = generateNoiseTexture(size, 4, 4);
  const noiseCanvas = noise.image as HTMLCanvasElement;
  const noiseCtx = noiseCanvas.getContext("2d")!;
  const noiseData = noiseCtx.getImageData(0, 0, size, size).data;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = noiseData[(y * size + x) * 4] / 255;
      let r: number, g: number, b: number;
      if (n > 0.7) { r = 255; g = 200 + (n - 0.7) * 183; b = 50; }
      else if (n > 0.4) { r = 200 + (n - 0.4) * 183; g = 50 + (n - 0.4) * 400; b = 0; }
      else { r = n * 400; g = 0; b = 0; }
      const i = (y * size + x) * 4;
      data[i] = Math.min(255, r); data[i + 1] = Math.min(255, g); data[i + 2] = Math.min(255, b); data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateSkinTexture(size: number = 256, baseColor: string = "#e0a080"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  const c = new THREE.Color(baseColor);
  const dark = c.clone().multiplyScalar(0.85);
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const v = Math.random() * 0.3;
    ctx.fillStyle = `rgba(${Math.floor(dark.r * 255)}, ${Math.floor(dark.g * 255)}, ${Math.floor(dark.b * 255)}, ${v})`;
    ctx.fillRect(x, y, 2, 2);
  }
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(180, 140, 110, ${Math.random() * 0.2})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateGradientRampTexture(colors: string[], size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  for (let i = 0; i < colors.length; i++) {
    grad.addColorStop(i / (colors.length - 1), colors[i]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function generateFalloffTexture(size: number = 256, exponent: number = 2): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = (x / size) * 2 - 1;
      const cy = (y / size) * 2 - 1;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const v = Math.max(0, 1 - Math.min(1, dist));
      const c = Math.floor(Math.pow(v, exponent) * 255);
      const i = (y * size + x) * 4;
      data[i] = c; data[i + 1] = c; data[i + 2] = c; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateRandomTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.random() * 255;
    data[i + 1] = Math.random() * 255;
    data[i + 2] = Math.random() * 255;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateSolidColorTexture(color: string, size: number = 16): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export const TEXTURE_PRESETS: { id: string; name: string; category: string; generator: () => THREE.CanvasTexture }[] = [
  { id: "noise", name: "Noise", category: "Procedural", generator: () => generateNoiseTexture(256, 4, 4) },
  { id: "voronoi", name: "Voronoi", category: "Procedural", generator: () => generateVoronoiTexture(256, 8, true) },
  { id: "brick", name: "Brick", category: "Pattern", generator: () => generateBrickTexture(256, 8, 4) },
  { id: "checker", name: "Checker", category: "Pattern", generator: () => generateCheckerTexture(256, 8) },
  { id: "gradient", name: "Gradient", category: "Pattern", generator: () => generateGradientTexture(256, "#000000", "#ffffff", 0) },
  { id: "wave", name: "Wave", category: "Procedural", generator: () => generateWaveTexture(256, 4, 0.5) },
  { id: "magic", name: "Magic", category: "Procedural", generator: () => generateMagicTexture(256, 4) },
  { id: "wood", name: "Wood", category: "Organic", generator: () => generateWoodTexture(256, 8, 0.1) },
  { id: "marble", name: "Marble", category: "Organic", generator: () => generateMarbleTexture(256, 0.5) },
  { id: "cloud", name: "Cloud", category: "Organic", generator: () => generateCloudTexture(256, 4, 0.5) },
  { id: "concrete", name: "Concrete", category: "Surface", generator: () => generateConcreteTexture(256) },
  { id: "fabric", name: "Fabric", category: "Surface", generator: () => generateFabricTexture(256, "#4a4a8a") },
  { id: "metal", name: "Metal", category: "Surface", generator: () => generateMetalTexture(256, "#888888", 50) },
  { id: "leather", name: "Leather", category: "Surface", generator: () => generateLeatherTexture(256, "#5a3a2a") },
  { id: "water", name: "Water", category: "Surface", generator: () => generateWaterTexture(256, "#1a4a8a") },
  { id: "grass", name: "Grass", category: "Surface", generator: () => generateGrassTexture(256) },
  { id: "sand", name: "Sand", category: "Surface", generator: () => generateSandTexture(256) },
  { id: "rock", name: "Rock", category: "Surface", generator: () => generateRockTexture(256) },
  { id: "ice", name: "Ice", category: "Surface", generator: () => generateIceTexture(256) },
  { id: "lava", name: "Lava", category: "Surface", generator: () => generateLavaTexture(256) },
  { id: "skin", name: "Skin", category: "Surface", generator: () => generateSkinTexture(256, "#e0a080") },
  { id: "falloff", name: "Falloff", category: "Utility", generator: () => generateFalloffTexture(256, 2) },
  { id: "random", name: "Random", category: "Utility", generator: () => generateRandomTexture(256) },
];

export function getTexturePresetById(id: string): { id: string; name: string; category: string; generator: () => THREE.CanvasTexture } | undefined {
  return TEXTURE_PRESETS.find(t => t.id === id);
}

export function getTexturePresetsByCategory(category: string): typeof TEXTURE_PRESETS {
  return TEXTURE_PRESETS.filter(t => t.category === category);
}

export function getTextureCategories(): string[] {
  return Array.from(new Set(TEXTURE_PRESETS.map(t => t.category)));
}
