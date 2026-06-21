# Kandler — 3D Modeling Suite

> A Three.js-powered, browser-based 3D modeling suite with Blender-class capabilities.
> **Made by Kantasu.**

![Kandler](public/icon.png)

Live at: **https://ddown325.github.io/Kandler/**

## Install & Run

### A. Use the hosted version (GitHub Pages)

1. Visit **https://ddown325.github.io/Kandler/**
2. (Optional) Install as a PWA:
   - **Chrome/Edge/Brave desktop**: click the install icon in the address bar, or use the in-app **Install** button.
   - **iOS Safari**: Share → *Add to Home Screen*.
   - **Android Chrome**: menu → *Install app*.
3. After install, Kandler runs offline from your app drawer / home screen.

### B. Deploy to your own GitHub Pages (one-time setup)

The repo ships with a GitHub Actions workflow at `.github/workflows/deploy.yml` that auto-builds and deploys on every push to `main`.

1. **Push this repo to GitHub** (repo name must be `Kandler` so the basePath matches):
   ```bash
   git init
   git add .
   git commit -m "Initial Kandler commit"
   git branch -M main
   git remote add origin https://github.com/ddown325/Kandler.git
   git push -u origin main
   ```

2. **Enable GitHub Pages via Actions** (repo → Settings → Pages → Source → *GitHub Actions*).

3. Wait ~2 minutes for the workflow to finish — your site goes live at `https://ddown325.github.io/Kandler/`.

> If you rename the repo, update `basePath` in `next.config.ts` (and `BASE` in `src/app/layout.tsx`) to match the new repo name.

### C. Run locally (developers)

```bash
bun install              # or: npm install / pnpm install
bun run dev              # starts dev server on http://localhost:3000
```

### D. Build a production static export locally

```bash
NODE_ENV=production bun run next build
# Output goes to ./out/
# To preview:  npx serve out  (or any static file server)
```

To test the production build with the `/Kandler/` base path (simulating GitHub Pages):

```bash
mkdir -p /tmp/test && cp -r out /tmp/test/Kandler
cd /tmp/test && python3 -m http.server 3001
# Visit http://localhost:3001/Kandler/
```

## Capabilities

Kandler ships with a comprehensive feature set mirroring Blender's core workflows:

### Modeling
- **15 primitive types**: Cube, UV Sphere, Ico Sphere, Cylinder, Cone, Torus, Torus Knot, Plane, Circle, Grid, Tetrahedron, Octahedron, Dodecahedron, Suzanne (Monkey)
- **Edit mode** with vertex/edge/face selection
- **Mesh operations**: Extrude, Inset, Subdivide, Bevel, Merge, Fill, Loop Cut, Knife, Delete components, Triangulate, Flip Normals, Recalculate Normals
- **Modifier stack**: Subdivision, Mirror, Array, Solidify, Bevel, Boolean, Decimate, Wireframe, Screw, Simple Deform, Displace, Wave, Build, Remesh — with reordering, enable/disable, per-modifier params

### Materials (PBR)
- **Physical-based rendering**: base color, metallic, roughness, emissive + intensity, opacity, transmission, IOR, thickness, clearcoat
- **Procedural textures**: Checker, Noise, Brick, Gradient
- **Display options**: wireframe, flat/smooth shading, double-sided
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
- **Transform gizmos** with axis-locked dragging via camera-parallel-plane raycasting
- **Direct drag-to-move** — click an object with the Move/Rotate/Scale tool and drag

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

### Keyboard Shortcuts (Blender-style)
| Key | Action |
|-----|--------|
| `Tab` | Toggle Object / Edit mode |
| `A` / `Shift+A` | Select all / none |
| `G` / `R` / `S` | Move / Rotate / Scale (then click+drag the object) |
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
│   ├── layout.tsx              # PWA manifest, SW registration, basePath-aware icons
│   ├── page.tsx                # Main Kandler layout
│   └── globals.css             # Blender-dark theme
├── lib/kandler/
│   ├── store.ts                # Zustand store: scene, selection, modes, history
│   ├── viewport.ts             # Three.js engine: render, sync, picking, orbit, raycast helpers
│   ├── viewport-registry.ts    # Module singleton for active viewport
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
├── public/
│   ├── manifest.json           # PWA manifest (relative URLs)
│   ├── sw.js                   # Service worker (offline cache)
│   ├── icon.png                # Kandler icon (by Kantasu)
│   ├── favicon.png
│   └── .nojekyll               # Disables Jekyll so _next/ works on Pages
└── .github/workflows/deploy.yml  # Auto-deploy to GitHub Pages
```

## GitHub Pages notes

- **basePath**: `next.config.ts` sets `basePath: "/Kandler"` and `assetPrefix: "/Kandler/"` in production (only). In dev, both are empty so the dev server works as usual.
- **Static export**: `output: "export"` generates a fully static site into `./out/`.
- **No Jekyll**: `public/.nojekyll` ensures GitHub Pages serves the `_next/` directory.
- **PWA**: `manifest.json` and `sw.js` use relative URLs (`./icon.png`, etc.) so they work under any base path.
- **Auto-deploy**: push to `main` triggers `.github/workflows/deploy.yml` which builds and deploys to Pages.

## Tech Stack
- **Next.js 16** + **TypeScript 5**
- **Three.js 0.184** — WebGL rendering
- **Tailwind CSS 4** + **shadcn/ui** — UI
- **Zustand** — state management
- **PWA** — installable, offline-capable

## License & Credits

Kandler is © 2026 **Kantasu**. All rights reserved.

Three.js is © The Three.js Authors (MIT).
