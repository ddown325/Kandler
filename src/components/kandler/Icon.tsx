/**
 * Kandler — Icon library
 * Custom SVG icons used throughout the UI. No emojis — clean, consistent
 * vector glyphs that match the Blender/Kandler aesthetic.
 *
 * Usage:
 *   import { Icon } from "@/components/kandler/Icon";
 *   <Icon name="mesh" size={14} />
 *
 * Made by Kantasu.
 */
import React from "react";

export type IconName =
  | "select"
  | "box-select"
  | "cursor"
  | "move"
  | "rotate"
  | "scale"
  | "extrude"
  | "inset"
  | "bevel"
  | "knife"
  | "loop-cut"
  | "annotate"
  | "measure"
  | "edit"
  // Object kinds
  | "mesh"
  | "light"
  | "camera"
  | "empty"
  | "curve"
  | "armature"
  | "group"
  // Properties tabs
  | "tab-render"
  | "tab-output"
  | "tab-scene"
  | "tab-world"
  | "tab-object"
  | "tab-modifiers"
  | "tab-mesh"
  | "tab-material"
  | "tab-light"
  | "tab-camera"
  // UI actions
  | "eye"
  | "eye-off"
  | "lock"
  | "unlock"
  | "trash"
  | "plus"
  | "chevron-down"
  | "chevron-right"
  | "play"
  | "pause"
  | "skip-back"
  | "skip-forward"
  | "step-back"
  | "step-forward"
  | "undo"
  | "redo"
  | "save"
  | "render-image"
  | "dot"
  | "x"
  | "search"
  // Axis / transform gizmo
  | "axis-x"
  | "axis-y"
  | "axis-z";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 16, className = "", color = "currentColor", strokeWidth = 2 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    // --- Tools ---
    case "select":
      return (<svg {...props}><path d="M4 4l7 16 2-7 7-2z" /></svg>);
    case "box-select":
      return (<svg {...props} strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>);
    case "cursor":
      return (<svg {...props}><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><circle cx="12" cy="12" r="3" /></svg>);
    case "move":
      return (<svg {...props}><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>);
    case "rotate":
      return (<svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" /></svg>);
    case "scale":
      return (<svg {...props}><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>);
    case "extrude":
      return (<svg {...props}><rect x="3" y="14" width="14" height="7" rx="1" /><rect x="7" y="3" width="14" height="7" rx="1" fill={color} fillOpacity="0.2" /><line x1="3" y1="14" x2="7" y2="3" /><line x1="17" y1="14" x2="21" y2="3" /></svg>);
    case "inset":
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="1" /><rect x="7" y="7" width="10" height="10" rx="1" fill={color} fillOpacity="0.2" /></svg>);
    case "bevel":
      return (<svg {...props}><path d="M3 21L21 3" /><path d="M3 21h18M3 21V3" /></svg>);
    case "knife":
      return (<svg {...props}><path d="M14 4l6 6-9 9-6-6 9-9z" /><line x1="14" y1="4" x2="20" y2="10" /></svg>);
    case "loop-cut":
      return (<svg {...props}><ellipse cx="12" cy="12" rx="10" ry="4" /></svg>);
    case "annotate":
      return (<svg {...props}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>);
    case "measure":
      return (<svg {...props}><rect x="2" y="9" width="20" height="6" rx="1" transform="rotate(45 12 12)" /><line x1="7" y1="14" x2="9" y2="12" /><line x1="11" y1="14" x2="13" y2="12" /></svg>);
    case "edit":
      return (<svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);

    // --- Object kinds ---
    case "mesh":
      return (<svg {...props}><path d="M12 2L2 7v10l10 5 10-5V7z" /><path d="M2 7l10 5 10-5M12 12v10" /></svg>);
    case "light":
      return (<svg {...props}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.3 1 2.3v1h6v-1c0-1 .3-1.6 1-2.3A7 7 0 0 0 12 2z" /></svg>);
    case "camera":
      return (<svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
    case "empty":
      return (<svg {...props}><circle cx="12" cy="12" r="2" fill={color} /><circle cx="12" cy="12" r="8" /></svg>);
    case "curve":
      return (<svg {...props}><path d="M3 12c4 0 4-8 8-8s4 8 8 8" /><circle cx="3" cy="12" r="1.5" fill={color} /><circle cx="19" cy="12" r="1.5" fill={color} /></svg>);
    case "armature":
      return (<svg {...props}><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="13" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="12" y1="13" x2="12" y2="20" /><circle cx="8" cy="13" r="1.5" /><circle cx="16" cy="13" r="1.5" /><circle cx="12" cy="20" r="1.5" /></svg>);
    case "group":
      return (<svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);

    // --- Properties tabs ---
    case "tab-render":
      return (<svg {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>);
    case "tab-output":
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>);
    case "tab-scene":
      return (<svg {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>);
    case "tab-world":
      return (<svg {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2c3 3 5 7 5 10s-2 7-5 10c-3-3-5-7-5-10s2-7 5-10z" /></svg>);
    case "tab-object":
      return (<svg {...props}><path d="M12 2L2 7v10l10 5 10-5V7z" /><path d="M2 7l10 5 10-5M12 12v10" /></svg>);
    case "tab-modifiers":
      return (<svg {...props}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2.6 2.6 6-6a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-2.1z" /></svg>);
    case "tab-mesh":
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>);
    case "tab-material":
      return (<svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 2v20M2 12h20" /><path d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20z" fill={color} fillOpacity="0.3" /></svg>);
    case "tab-light":
      return (<svg {...props}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.3 1 2.3v1h6v-1c0-1 .3-1.6 1-2.3A7 7 0 0 0 12 2z" /></svg>);
    case "tab-camera":
      return (<svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);

    // --- UI actions ---
    case "eye":
      return (<svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
    case "eye-off":
      return (<svg {...props}><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
    case "lock":
      return (<svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
    case "unlock":
      return (<svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>);
    case "trash":
      return (<svg {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
    case "plus":
      return (<svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
    case "chevron-down":
      return (<svg {...props}><polyline points="6 9 12 15 18 9" /></svg>);
    case "chevron-right":
      return (<svg {...props}><polyline points="9 18 15 12 9 6" /></svg>);
    case "play":
      return (<svg {...props} fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>);
    case "pause":
      return (<svg {...props} fill={color} stroke="none"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>);
    case "skip-back":
      return (<svg {...props} fill={color} stroke="none"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke={color} strokeWidth="2" /></svg>);
    case "skip-forward":
      return (<svg {...props} fill={color} stroke="none"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke={color} strokeWidth="2" /></svg>);
    case "step-back":
      return (<svg {...props} fill={color} stroke="none"><polygon points="15 6 9 12 15 18 15 6" /></svg>);
    case "step-forward":
      return (<svg {...props} fill={color} stroke="none"><polygon points="9 6 15 12 9 18 9 6" /></svg>);
    case "undo":
      return (<svg {...props}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>);
    case "redo":
      return (<svg {...props}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>);
    case "save":
      return (<svg {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>);
    case "render-image":
      return (<svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
    case "dot":
      return (<svg {...props} fill={color} stroke="none"><circle cx="12" cy="12" r="6" /></svg>);
    case "x":
      return (<svg {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
    case "search":
      return (<svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);

    // --- Axis arrows ---
    case "axis-x":
      return (<svg {...props}><line x1="3" y1="12" x2="21" y2="12" /><polyline points="15 6 21 12 15 18" /></svg>);
    case "axis-y":
      return (<svg {...props}><line x1="12" y1="3" x2="12" y2="21" /><polyline points="6 9 12 3 18 9" /></svg>);
    case "axis-z":
      return (<svg {...props}><line x1="3" y1="21" x2="21" y2="3" /><polyline points="9 3 21 3 21 15" /></svg>);

    default:
      return null;
  }
}

// Helper: convert object kind to icon name
export function kindToIcon(kind: string): IconName {
  switch (kind) {
    case "mesh": return "mesh";
    case "light": return "light";
    case "camera": return "camera";
    case "empty": return "empty";
    case "curve": return "curve";
    case "armature": return "armature";
    case "group": return "group";
    default: return "mesh";
  }
}
