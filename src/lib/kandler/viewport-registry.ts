/**
 * Kandler — Viewport Registry
 * A tiny module-level singleton so that the TransformGizmo (and other UI)
 * can access the active Three.js viewport's camera, scene, and raycaster
 * without prop-drilling.
 *
 * The viewport is also exposed on `window.__kandlerViewport` for debugging
 * and for any external scripts that need to query the scene.
 *
 * Made by Kantasu.
 */
import type { ViewportHandle } from "./viewport";

let _active: ViewportHandle | null = null;

export function registerViewport(vp: ViewportHandle) {
  _active = vp;
  if (typeof window !== "undefined") {
    (window as any).__kandlerViewport = vp;
  }
}

export function unregisterViewport(vp: ViewportHandle) {
  if (_active === vp) _active = null;
  if (typeof window !== "undefined") {
    (window as any).__kandlerViewport = null;
  }
}

export function getViewport(): ViewportHandle | null {
  return _active;
}
