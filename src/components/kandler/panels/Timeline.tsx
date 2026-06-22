"use client";
/**
 * Kandler — Timeline Panel (bottom)
 * Frame scrubber, playback controls, keyframe markers, frame range editor.
 * Uses custom SVG icons (no emojis).
 *
 * Made by Kantasu.
 */
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/kandler/store";
import { Icon } from "@/components/kandler/Icon";

export default function Timeline() {
  const project = useStore(s => s.project);
  const tracks = useStore(s => s.tracks);
  const setCurrentFrame = useStore(s => s.setCurrentFrame);
  const setPlaying = useStore(s => s.setPlaying);
  const setFrameRange = useStore(s => s.setFrameRange);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Playback loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const fpsTarget = project.fps;
    const interval = 1000 / fpsTarget;
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      if (useStore.getState().project.playing) {
        acc += dt;
        if (acc >= interval) {
          acc -= interval;
          const s = useStore.getState();
          const next = s.project.currentFrame + 1;
          if (next > s.project.frameEnd) {
            s.setCurrentFrame(s.project.frameStart);
          } else {
            s.setCurrentFrame(next);
          }
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [project.fps]);

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    ctx.fillStyle = "#1e1a2e";
    ctx.fillRect(0, 0, W, H);
    // Frame range
    const start = project.frameStart;
    const end = project.frameEnd;
    const range = Math.max(1, end - start);
    const playheadX = ((project.currentFrame - start) / range) * W;
    // Frame ticks
    const tickInterval = Math.max(1, Math.floor(range / 20));
    ctx.strokeStyle = "#3d3654";
    ctx.fillStyle = "#888";
    ctx.font = "10px ui-monospace, monospace";
    for (let f = start; f <= end; f += tickInterval) {
      const x = ((f - start) / range) * W;
      ctx.beginPath();
      ctx.moveTo(x, H - 12);
      ctx.lineTo(x, H - 6);
      ctx.stroke();
      ctx.fillText(String(f), x + 2, H - 2);
    }
    // Keyframes
    for (const track of tracks) {
      for (const kf of track.keyframes) {
        const x = ((kf.frame - start) / range) * W;
        ctx.fillStyle = "#b388ff";
        ctx.beginPath();
        ctx.arc(x, H / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Playhead
    ctx.strokeStyle = "#b388ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, H);
    ctx.stroke();
  }, [project, tracks]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const start = project.frameStart;
    const end = project.frameEnd;
    const frame = Math.round(start + ratio * (end - start));
    setCurrentFrame(frame);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1a2e] text-white kandler-ui">
      <div className="kandler-panel-header flex items-center justify-between px-3 py-1.5">
        <span>Timeline</span>
        <div className="flex items-center gap-2 text-[11px]">
          <label className="flex items-center gap-1">Start
            <input type="number" className="kandler-input w-16" value={project.frameStart}
              onChange={e => setFrameRange(parseInt(e.target.value) || 1, project.frameEnd)} />
          </label>
          <label className="flex items-center gap-1">End
            <input type="number" className="kandler-input w-16" value={project.frameEnd}
              onChange={e => setFrameRange(project.frameStart, parseInt(e.target.value) || 250)} />
          </label>
          <label className="flex items-center gap-1">FPS
            <input type="number" className="kandler-input w-12" value={project.fps}
              onChange={e => useStore.setState({ project: { ...project, fps: parseInt(e.target.value) || 24 } })} />
          </label>
        </div>
      </div>
      <div className="flex items-center px-3 py-1 gap-2 border-b border-[#2d2840]">
        <button
          className="kandler-tool-btn"
          onClick={() => setCurrentFrame(project.frameStart)}
          title="Go to start"
        ><Icon name="skip-back" size={16} /></button>
        <button
          className="kandler-tool-btn"
          onClick={() => setCurrentFrame(project.currentFrame - 1)}
          title="Previous frame"
        ><Icon name="step-back" size={16} /></button>
        <button
          className={`kandler-tool-btn ${project.playing ? "active" : ""}`}
          onClick={() => setPlaying(!project.playing)}
          title={project.playing ? "Pause" : "Play"}
        >{project.playing ? <Icon name="pause" size={16} /> : <Icon name="play" size={16} />}</button>
        <button
          className="kandler-tool-btn"
          onClick={() => setCurrentFrame(project.currentFrame + 1)}
          title="Next frame"
        ><Icon name="step-forward" size={16} /></button>
        <button
          className="kandler-tool-btn"
          onClick={() => setCurrentFrame(project.frameEnd)}
          title="Go to end"
        ><Icon name="skip-forward" size={16} /></button>
        <div className="flex-1" />
        <span className="text-[11px] font-mono">
          Frame: <span className="text-[#b388ff] font-semibold">{project.currentFrame}</span> / {project.frameEnd}
        </span>
      </div>
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="w-full h-full cursor-pointer"
        />
      </div>
    </div>
  );
}
