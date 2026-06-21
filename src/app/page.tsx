"use client";
/**
 * Kandler — Main Application Page
 *
 * Layout (Blender-inspired):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Top Menu Bar                                       │
 *   ├───┬───────────────┬──────────────────┬──────────────┤
 *   │ T │   Outliner    │   3D Viewport    │  Properties  │
 *   │ o │               │   (with gizmos)  │              │
 *   │ o │               │                  │              │
 *   │ l ├───────────────┴──────────────────┴──────────────┤
 *   │ b │              Timeline                           │
 *   ├───┴──────────────────────────────────────────────────┤
 *   │  Status Bar                                          │
 *   └─────────────────────────────────────────────────────┘
 *
 * Made by Kantasu.
 */
import dynamic from "next/dynamic";
import { useStore } from "@/lib/kandler/store";
import TopMenuBar from "@/components/kandler/menus/TopMenuBar";
import Toolbar from "@/components/kandler/tools/Toolbar";
import Outliner from "@/components/kandler/panels/Outliner";
import PropertiesPanel from "@/components/kandler/panels/PropertiesPanel";
import Timeline from "@/components/kandler/panels/Timeline";
import StatusBar from "@/components/kandler/StatusBar";
import ResizablePanel from "@/components/kandler/ResizablePanel";
import TransformGizmo from "@/components/kandler/viewport/TransformGizmo";
import ToastNotifier from "@/components/kandler/ToastNotifier";

// Three.js viewport must be client-only (uses WebGL)
const Viewport3D = dynamic(() => import("@/components/kandler/viewport/Viewport3D"), { ssr: false });

export default function KandlerPage() {
  const leftPanelWidth = useStore(s => s.leftPanelWidth);
  const rightPanelWidth = useStore(s => s.rightPanelWidth);
  const bottomPanelHeight = useStore(s => s.bottomPanelHeight);
  const setLeft = useStore(s => s.setLeftPanelWidth);
  const setRight = useStore(s => s.setRightPanelWidth);
  const setBottom = useStore(s => s.setBottomPanelHeight);
  const showOutliner = useStore(s => s.showOutliner);
  const showProperties = useStore(s => s.showProperties);
  const showTimeline = useStore(s => s.showTimeline);
  const showToolbar = useStore(s => s.showToolbar);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#1a1d23]">
      <TopMenuBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbar (vertical icons) */}
        {showToolbar && <Toolbar />}

        {/* Outliner (resizable) */}
        {showOutliner && (
          <ResizablePanel side="left" size={leftPanelWidth} onResize={setLeft} min={180} max={500}>
            <div className="flex-1 overflow-hidden">
              <Outliner />
            </div>
          </ResizablePanel>
        )}

        {/* Center: Viewport + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <Viewport3D />
            <TransformGizmo />
          </div>
          {showTimeline && (
            <ResizablePanel side="bottom" size={bottomPanelHeight} onResize={setBottom} min={80} max={400}>
              <div className="flex-1 overflow-hidden">
                <Timeline />
              </div>
            </ResizablePanel>
          )}
        </div>

        {/* Right: Properties */}
        {showProperties && (
          <ResizablePanel side="right" size={rightPanelWidth} onResize={setRight} min={220} max={560}>
            <div className="flex-1 overflow-hidden">
              <PropertiesPanel />
            </div>
          </ResizablePanel>
        )}
      </div>

      <StatusBar />
      <ToastNotifier />
    </div>
  );
}
