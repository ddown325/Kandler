/**
 * Kandler — Asset path helper
 *
 * Returns the basePath-aware URL for a given public asset.
 * Uses NEXT_PUBLIC_BASE_PATH which is inlined at build time, so it works
 * identically on the server, during hydration, and in the static export
 * deployed to GitHub Pages.
 *
 * Usage:
 *   import { asset } from "@/lib/kandler/asset";
 *   <img src={asset("/icon.png")} />
 *
 * Made by Kantasu.
 */

export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  // Normalize: ensure path starts with "/", and we don't double up the slash.
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}
