"use client";
/**
 * Kandler — Resizable panel layout
 * Wraps children with a draggable right edge/bottom edge for resizing.
 *
 * Made by Kantasu.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  side: "right" | "bottom" | "left";
  size: number;
  onResize: (size: number) => void;
  min?: number;
  max?: number;
  children: React.ReactNode;
}

export default function ResizablePanel({ side, size, onResize, min = 200, max = 600, children }: Props) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pos: 0, size: 0 });

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = side === "right"
        ? startRef.current.pos - e.clientX
        : side === "left"
        ? e.clientX - startRef.current.pos
        : startRef.current.pos - e.clientY;
      onResize(Math.max(min, Math.min(max, startRef.current.size + delta)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, side, onResize, min, max]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    startRef.current = { pos: side === "bottom" ? e.clientY : e.clientX, size };
    setDragging(true);
  };

  return (
    <div className="relative flex" style={side === "right" ? { width: size } : side === "left" ? { width: size } : { height: size }}>
      {children}
      <div
        onMouseDown={startDrag}
        className={`kandler-resizer absolute ${dragging ? "dragging" : ""} ${
          side === "right" ? "top-0 left-0 w-0.5 h-full cursor-ew-resize" :
          side === "left" ? "top-0 right-0 w-0.5 h-full cursor-ew-resize" :
          "top-0 left-0 h-0.5 w-full cursor-ns-resize"
        }`}
      />
    </div>
  );
}
