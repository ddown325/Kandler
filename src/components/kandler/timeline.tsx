"use client";

import { useKandler } from "@/lib/kandler/store";
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Timeline() {
  const anim = useKandler((s) => s.scene.animation);
  const setAnimation = useKandler((s) => s.setAnimation);
  const selectedIds = useKandler((s) => s.selectedIds);
  const scene = useKandler((s) => s.scene);
  const updateTransformField = useKandler((s) => s.updateTransformField);

  const fmt = (s: number) => `${s.toFixed(2)}s`;

  const addKeyframe = (path: "position" | "rotation" | "scale") => {
    if (selectedIds.length === 0) return;
    const obj = scene.objects[selectedIds[0]];
    if (!obj) return;
    const tracks = obj.tracks || [];
    let track = tracks.find((t) => t.path === path && t.component === "all");
    if (!track) {
      track = { path, component: "all", keyframes: [] };
      tracks.push(track);
    }
    const value = path === "rotation" ? obj.transform.rotation : path === "scale" ? obj.transform.scale : obj.transform.position;
    track.keyframes = [...track.keyframes, { time: anim.currentTime, value: [...value] as any }].sort((a, b) => a.time - b.time);
    // commit
    updateTransformField(obj.id, "position", obj.transform.position);
    // we have to push tracks separately — using transform write will preserve tracks
    useKandler.setState((s) => ({
      scene: {
        ...s.scene,
        objects: {
          ...s.scene.objects,
          [obj.id]: { ...s.scene.objects[obj.id], tracks: [...tracks] },
        },
      },
    }));
  };

  const seek = (t: number) => setAnimation({ currentTime: Math.max(0, Math.min(anim.duration, t)) });

  // For demo: snapshot-apply at time 0 and play button just toggles
  return (
    <div className="flex flex-col h-full bg-[#150b25] border-t border-purple-500/30">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-purple-500/20">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">Timeline</span>
        <div className="flex items-center gap-1 ml-2">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-200 hover:bg-purple-500/20" onClick={() => seek(0)}>
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-200 hover:bg-purple-500/20" onClick={() => setAnimation({ playing: !anim.playing })}>
            {anim.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-200 hover:bg-purple-500/20" onClick={() => seek(anim.duration)}>
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-purple-300">
          <span>{fmt(anim.currentTime)} / {fmt(anim.duration)}</span>
          <span className="text-purple-500/60">·</span>
          <span>{anim.fps} FPS</span>
        </div>
      </div>
      <div className="flex-1 px-3 py-2 space-y-2">
        {/* time scrubber */}
        <input
          type="range"
          min={0}
          max={anim.duration}
          step={0.01}
          value={anim.currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
        />
        {/* keyframe buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-200" onClick={() => addKeyframe("position")} disabled={selectedIds.length === 0}>
            <Plus className="w-3 h-3 mr-1" /> Loc Key
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-200" onClick={() => addKeyframe("rotation")} disabled={selectedIds.length === 0}>
            <Plus className="w-3 h-3 mr-1" /> Rot Key
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-200" onClick={() => addKeyframe("scale")} disabled={selectedIds.length === 0}>
            <Plus className="w-3 h-3 mr-1" /> Scale Key
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-[10px] uppercase text-purple-400">Duration</label>
            <input
              type="number"
              step={0.5}
              value={anim.duration}
              onChange={(e) => setAnimation({ duration: parseFloat(e.target.value) || 1 })}
              className="w-16 h-7 px-2 text-xs bg-[#1a0e2e] border border-purple-500/30 text-purple-100 rounded"
            />
            <label className="text-[10px] uppercase text-purple-400">FPS</label>
            <input
              type="number"
              step={1}
              value={anim.fps}
              onChange={(e) => setAnimation({ fps: parseInt(e.target.value) || 24 })}
              className="w-14 h-7 px-2 text-xs bg-[#1a0e2e] border border-purple-500/30 text-purple-100 rounded"
            />
          </div>
        </div>
        {/* track display */}
        {selectedIds.length === 1 && (scene.objects[selectedIds[0]]?.tracks || []).length > 0 ? (
          <div className="space-y-1">
            {(scene.objects[selectedIds[0]]!.tracks || []).map((t, ti) => (
              <div key={ti} className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-purple-400 w-12">{t.path.slice(0, 3)}</span>
                <div className="relative flex-1 h-5 bg-[#1a0e2e] border border-purple-500/20 rounded">
                  {t.keyframes.map((k, ki) => (
                    <div
                      key={ki}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-fuchsia-500 rotate-45 rounded-sm"
                      style={{ left: `${(k.time / anim.duration) * 100}%` }}
                      title={`t=${k.time.toFixed(2)}s`}
                    />
                  ))}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-purple-400"
                    style={{ left: `${(anim.currentTime / anim.duration) * 100}%` }}
                  />
                </div>
                <button
                  className="text-red-300 hover:text-red-400"
                  onClick={() => {
                    const obj = scene.objects[selectedIds[0]];
                    if (!obj) return;
                    const newTracks = (obj.tracks || []).filter((_, i) => i !== ti);
                    useKandler.setState((s) => ({
                      scene: {
                        ...s.scene,
                        objects: { ...s.scene.objects, [obj.id]: { ...obj, tracks: newTracks } },
                      },
                    }));
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[10px] text-purple-400/50 py-1">
            Select an object and key its location, rotation, or scale
          </div>
        )}
      </div>
    </div>
  );
}
