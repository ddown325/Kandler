# Kandler — 3D Modeling Suite

> A Three.js-powered, browser-based 3D modeling suite with Blender-class capabilities.
> **Made by Kantasu.**

![Kandler](public/icon.png)

## Install & Run Locally

### Option 1 — Install as a PWA (recommended for end users)

Kandler is a Progressive Web App. You can install it directly from your browser:

1. Open Kandler in **Chrome / Edge / Brave / Safari 17+**.
2. Click the **Install** icon in the address bar (or use the menu → *Install Kandler*).
3. After install, Kandler launches from your desktop / app drawer — full offline support, no browser chrome.

> On **iOS Safari**: tap the Share button → *Add to Home Screen*.
> On **Android Chrome**: menu → *Install app*.

### Option 2 — Run from source (developers)

```bash
# 1. Install dependencies
bun install        # or: npm install / pnpm install

# 2. Start the dev server
bun run dev        # or: npm run dev

# 3. Open http://localhost:3000

# 4. Build for production
bun run build
bun run start
```

**Requirements**: Node.js 18+, modern browser with WebGL 2.

## Capabilities

Kandler ships with a comprehensive feature set mirroring Blender's core workflows:

### Modeling
- **15 primitive types**: Cube, UV Sphere, Ico Sphere, Cylinder, Cone, Torus, Torus Knot, Plane, Circle, Grid, Tetrahedron, Octahedron, Dodecahedron, Suzanne (Monkey)
- **Edit mode** with vertex/edge/face selection
- **Mesh operations**: Extrude, Inset, Subdivide, Bevel, Merge, Fill, Loop Cut, Knife, Delete components, Triangulate, Flip Normals, Recalculate Normals
- **Modifier stack**: Subdivision Surface, Mirror, Array, Solidify, Bevel, Boolean, Decimate, Wireframe, Screw, Simple Deform, Displace, Wave, Build, Remesh — with reordering, enable/disable, per-modifier params

### Materials (PBR)
- **Physical-based rendering**: base color, metallic, roughness, emissive + intensity, opacity, transmission, IOR, thickness, clearcoat
- **Procedural textures**: Checker, Noise, Brick, Gradient
- **Display options**: wireframe, flat/ smooth shading, double-sided
- Multiple material slots per object

### Lighting
- 4 light types: **Point, Spot, Sun (directional), Area**
- Per-light: color, intensity, distance, spot angle/penumbra, area width/height
- Shadow casting with configurable map size + bias

### Cameras
- Perspective & orthographic projection
- FOV / ortho size / near / far / aspect ratio
- Camera view (Numpad 0)

### Scene Management
- **Outliner** with collections, color tags, visibility/selectability toggles
- Per-object: hide in viewport / render, lock, display as bounds/wire, rename
- 3D cursor with explicit position control

### Viewport
- Orbit / pan / zoom (mouse + numpad presets: Top / Front / Side / Camera / Free)
- 4 shading modes: Wireframe, Solid, Material, Rendered
- Grid + axis helpers, frame-all, frame-selected
- Transform gizmos (move / rotate / scale) with axis-locking

### Animation
- Timeline with scrubbing, playback controls, FPS / frame-range editor
- Keyframe markers per track

### Rendering
- Engines: Eevee (real-time), Cycles (path-traced), Workbench (preview)
- Resolution presets (Full HD, 4K, Square, Portrait, Print A4)
- Tone mapping: ACES, Reinhard, Cineon, Linear, None
- SSAO, Bloom, Shadows, Fog
- One-click PNG render export

### File I/O
- Save / Load scenes as `.kandler.json`
- Export rendered images as PNG
- GLTF / OBJ export hooks

### Keyboard Shortcuts (Blender-style)
| Key | Action |
|-----|--------|
| `Tab` | Toggle Object / Edit mode |
| `A` / `Shift+A` | Select all / none |
| `G` / `R` / `S` | Move / Rotate / Scale |
| `E` | Extrude (edit mode) |
| `I` | Inset (edit mode) |
| `W` | Subdivide (edit mode) |
| `Ctrl+M` | Merge vertices (edit mode) |
| `F` | Fill (edit mode) |
| `X` / `Del` | Delete |
| `Shift+D` | Duplicate |
| `B` | Box select |
| `C` | 3D cursor tool |
| `Z` | Cycle shading modes |
| `H` / `Shift+H` | Hide / unhide all |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Home` | Frame all |
| `Numpad 1/3/7/0` | Front / Side / Top / Camera views |
| `N` | Toggle properties |
| `T` | Toggle toolbar |

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # PWA manifest, SW registration, branding
│   ├── page.tsx                # Main Kandler layout
│   └── globals.css             # Blender-dark theme
├── lib/kandler/
│   ├── store.ts                # Zustand store: scene, selection, modes, history
│   ├── viewport.ts             # Three.js engine: render, sync, picking, orbit
│   └── mesh-ops.ts             # Edit-mode mesh operations
├── components/kandler/
│   ├── menus/TopMenuBar.tsx
│   ├── tools/Toolbar.tsx
│   ├── panels/Outliner.tsx
│   ├── panels/PropertiesPanel.tsx
│   ├── panels/Timeline.tsx
│   ├── viewport/Viewport3D.tsx
│   ├── viewport/TransformGizmo.tsx
│   ├── StatusBar.tsx
│   ├── ToastNotifier.tsx
│   └── ResizablePanel.tsx
└── public/
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service worker (offline cache)
    └── icon.png                # Kandler icon (by Kantasu)
```

## Tech Stack
- **Next.js 16** + **TypeScript 5**
- **Three.js 0.184** — WebGL rendering
- **Tailwind CSS 4** + **shadcn/ui** — UI
- **Zustand** — state management
- **PWA** — installable, offline-capable

## License & Credits

Kandler is © 2026 **Kantasu**. All rights reserved.

Three.js is © The Three.js Authors (MIT).
