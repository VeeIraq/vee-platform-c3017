"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeatureFlagDefault } from "@/lib/actions/admin";

type SaveState = "idle" | "saving" | "saved" | "error";

export function FlagToggle({ flagId, value }: { flagId: string; value: boolean }) {
  const [pending, startTransition] = useTransition();
  // Optimistic local copy of the flag's on/off state, separate from the
  // `value` prop (server truth as of last render) so the switch responds
  // instantly instead of waiting a round trip, but still reverts itself if
  // the save actually fails.
  const [optimistic, setOptimistic] = useState(value);
  // Tracks the last `value` prop we've synced from, so a change to it (e.g.
  // another tab saved a different value, then this one calls
  // router.refresh()) can reset our local copy. Adjusting state during
  // render like this -- rather than in a useEffect -- is the pattern React
  // recommends for "reset state when a prop changes".
  const [syncedValue, setSyncedValue] = useState(value);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const router = useRouter();

  if (value !== syncedValue) {
    setSyncedValue(value);
    setOptimistic(value);
  }

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [saveState]);

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    setSaveState("saving");
    startTransition(async () => {
      const result = await setFeatureFlagDefault(flagId, next);
      if (result.success) {
        setSaveState("saved");
        router.refresh();
      } else {
        setOptimistic(!next);
        setSaveState("error");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 text-xs font-extrabold ${optimistic ? "text-success" : "text-ink-muted"}`}>
        {optimistic ? "ON" : "OFF"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        disabled={pending}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline disabled:cursor-wait disabled:opacity-80 ${
          optimistic ? "bg-success" : "bg-ink-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            optimistic ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="w-16 text-xs font-semibold" aria-live="polite">
        {saveState === "saving" && <span className="text-ink-muted">Saving…</span>}
        {saveState === "saved" && <span className="text-success">Saved</span>}
        {saveState === "error" && <span className="text-danger">Couldn&apos;t save</span>}
      </span>
    </div>
  );
}
