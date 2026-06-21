"use client";
/**
 * Kandler — Toast notifier + Install prompt
 *
 * Made by Kantasu.
 */
import { useEffect, useState } from "react";
import { useStore } from "@/lib/kandler/store";
import { asset } from "@/lib/kandler/asset";

export default function ToastNotifier() {
  const toast = useStore(s => s.toast);
  const clearToast = useStore(s => s.clearToast);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 2500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  useEffect(() => {
    const onInstallable = () => setShowInstall(true);
    window.addEventListener("kandler-installable", onInstallable);
    return () => window.removeEventListener("kandler-installable", onInstallable);
  }, []);

  if (!toast && !showInstall) return null;

  const colors: Record<string, string> = {
    info: "bg-[#2a2d33] border-white/20 text-white",
    success: "bg-[#1d3a1d] border-green-500/40 text-green-100",
    warning: "bg-[#3a2f1d] border-amber-500/40 text-amber-100",
    error: "bg-[#3a1d1d] border-red-500/40 text-red-100",
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {showInstall && (
        <div className="pointer-events-auto bg-[#1f2228] border border-[#e08a3c]/40 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-3">
          <img src={asset("/icon.png")} alt="Kandler" className="w-7 h-7 rounded" />
          <div className="text-[12px] text-white/85">
            <div className="font-semibold">Install Kandler to your device</div>
            <div className="text-white/50 text-[11px]">Run locally — full offline support</div>
          </div>
          <button
            className="px-3 py-1 bg-[#e08a3c] text-black text-[11px] rounded font-medium"
            onClick={() => {
              const ev = (window as any).__kandlerInstallPrompt;
              if (ev) {
                ev.prompt();
                ev.userChoice.then(() => { (window as any).__kandlerInstallPrompt = null; setShowInstall(false); });
              } else {
                setShowInstall(false);
              }
            }}
          >Install</button>
          <button
            className="text-white/40 hover:text-white text-[16px]"
            onClick={() => setShowInstall(false)}
          >×</button>
        </div>
      )}
      {toast && (
        <div className={`pointer-events-auto border rounded px-3 py-2 text-[12px] shadow-xl ${colors[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
