"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBusinessFeatureOverride, clearBusinessFeatureOverride } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { BusinessFeatureFlag } from "@/lib/data/feature-flags";

// Flags that exist in the system but don't yet gate anything a business
// owner would notice -- called out inline rather than hidden, since Super
// Admin should still be able to set them ahead of that wiring landing, but
// shouldn't be left thinking a toggle already does something it doesn't.
const NOT_YET_WIRED: Record<string, string> = {
  multiple_locations: "There's no branch-management screen in the dashboard yet — this is ready for when that ships.",
};

export function FeatureList({ businessId, flags }: { businessId: string; flags: BusinessFeatureFlag[] }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function force(flag: BusinessFeatureFlag, value: boolean) {
    setError(null);
    setPendingKey(flag.key);
    startTransition(async () => {
      const result = await setBusinessFeatureOverride(flag.id, businessId, value);
      setPendingKey(null);
      if (result.success) router.refresh();
      else setError(result.error ?? "Couldn't save.");
    });
  }

  function reset(flag: BusinessFeatureFlag) {
    if (!flag.businessOverrideId) return;
    setError(null);
    setPendingKey(flag.key);
    startTransition(async () => {
      const result = await clearBusinessFeatureOverride(flag.businessOverrideId!);
      setPendingKey(null);
      if (result.success) router.refresh();
      else setError(result.error ?? "Couldn't remove.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <ul className="flex flex-col gap-2">
        {flags.map((flag) => {
          const hasOverride = flag.businessOverrideId !== null;
          const busy = pendingKey === flag.key;
          return (
            <li key={flag.id} className="rounded-[var(--radius-md)] border border-line bg-paper p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{flag.label}</p>
                  {flag.description && <p className="text-xs text-ink-muted">{flag.description}</p>}
                  {NOT_YET_WIRED[flag.key] && <p className="mt-1 text-xs italic text-warning">{NOT_YET_WIRED[flag.key]}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-ink-muted">
                    Plan default: <span className="font-semibold">{flag.inherited ? "ON" : "OFF"}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      flag.effective ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                    }`}
                  >
                    {flag.effective ? "ON" : "OFF"} for this business
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                {hasOverride ? (
                  <>
                    <span className="text-xs font-semibold text-ink-soft">
                      Overridden to {flag.businessOverrideValue ? "ON" : "OFF"} for this business only
                    </span>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => reset(flag)}>
                      {busy ? "…" : "Reset to plan default"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => force(flag, true)}>
                      {busy ? "…" : "Force ON for this business"}
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => force(flag, false)}>
                      {busy ? "…" : "Force OFF for this business"}
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
        {flags.length === 0 && (
          <p className="rounded-[var(--radius-md)] border border-dashed border-line p-6 text-center text-sm text-ink-muted">
            No feature flags configured yet.
          </p>
        )}
      </ul>
    </div>
  );
}
