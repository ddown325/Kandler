# Kandler

**A Blender-like 3D modeling editor that runs entirely in your browser.**

Kandler is a feature-rich, installable, offline-capable 3D editor built with Next.js, Three.js, and Babylon.js. It is designed to be deployed to GitHub Pages — no backend, no server, no install (until you choose to install it as a PWA for offline use).

![Kandler](public/icons/kandler-512.png)

## Features

### Dual rendering engines
- **Three.js** viewport with full PBR, shadows, gizmos, grid, orbit/pan/zoom
- **Babylon.js** viewport with the same scene — toggle live at any time
- Both engines share one serializable scene model so your work is engine-portable

### Modeling
- 13 primitives: cube, sphere, cylinder, cone, torus, torus knot, plane, dodecahedron, icosahedron, octahedron, tetrahedron, circle, capsule
- Move / Rotate / Scale gizmos with optional snapping
- Modifier stack: Bevel, Subdivision, Mirror, Array, Boolean, Simple Deform, Wireframe, Solidify, Decimate (reorderable, toggleable per-object)
- Scene hierarchy with parent/child, visibility, lock, rename, drag-reorder
- Duplicate, delete, multi-select

### Materials
- PBR (metal/rough), Standard (Phong), Basic (unlit), Wireframe, Normal-map debug, Toon/Cel
- Base color, emissive, emissive intensity, opacity, transparent flag
- Wireframe, flat-shading, double-sided toggles
- Texture upload for albedo, normal, roughness maps
- Per-material library panel

### Lighting
- Point, Directional (Sun), Spot, Hemisphere, Area lights
- Per-light intensity, color, distance, decay, angle, penumbra, cast-shadow
- Global ambient + tone mapping (ACES / Reinhard / Cineon / None) + exposure
- Optional scene fog

### Cameras
- Perspective + Orthographic scene cameras
- Live switch between editor camera and any scene camera
- FOV, near, far controls

### Animation
- Per-object keyframe tracks for position / rotation / scale
- Timeline scrubber, play/pause, duration, FPS
- Visual keyframe markers per track

### Environment & World
- Background color, ambient intensity, grid color/visibility
- Shadow maps toggle, tone mapping, exposure
- Fog with color, near, far

### Export / Import
| Format | Direction |
|---|---|
| `.kndl` | Save/Load native (full fidelity) |
| Three.js ObjectLoader JSON | Export |
| Babylon.js SceneLoader JSON | Export |
| glTF 2.0 (`.gltf`, embedded) | Export |
| OBJ | Export |
| STL (ASCII) | Export |

### UX
- Blender-like dark purple theme
- Undo/redo (50 levels)
- Keyboard shortcuts: `W/E/R` (move/rotate/scale), `Shift+D` (duplicate), `Del` (delete), `Ctrl+Z` / `Ctrl+Shift+Z` (undo/redo), `A` (select all)
- Right-drag = orbit, Shift+right-drag = pan, wheel = zoom
- Resizable three-pane layout: outliner · viewport+timeline · properties/world/materials

### Installable for offline use
- Service worker caches the app shell
- Add to home screen / install as PWA — works fully offline after first load

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `kandler`) and push this project to it.
2. In the repo settings → **Pages** → **Source** → choose **GitHub Actions**.
3. Push to `main`. The included workflow (`.github/workflows/deploy.yml`) builds the site with the correct `BASE_PATH` and publishes to GitHub Pages.
4. Visit `https://<your-username>.github.io/kandler/`.

The repo name is used automatically as the base path. If you forked to a different repo name, the workflow picks it up from `${{ github.event.repository.name }}` — no manual config needed.

## Local development

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
```

For a production build that simulates GitHub Pages locally:

```bash
REPO_NAME=kandler bun run build:gh
# static export lands in ./out — serve with any static host
npx serve out
```

## Tech stack

- Next.js 16 (App Router, static export)
- TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Three.js (r185) for primary viewport + GLTF/OBJ/STL export
- Babylon.js (9.x) as alternative viewport engine + native Babylon export
- Zustand for state
- lucide-react icons
- PWA: Web App Manifest + Service Worker

## License

MIT — do whatever you want, just don't sue.
