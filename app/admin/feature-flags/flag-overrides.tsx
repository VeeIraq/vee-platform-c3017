"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeatureFlagOverride, removeFeatureFlagOverride } from "@/lib/actions/admin";

type Entity = { id: string; label: string };
type Override = { id: string; scopeType: "plan" | "business"; scopeId: string; value: boolean };

export function FlagOverrides({
  flagId,
  overrides,
  plans,
  businesses,
}: {
  flagId: string;
  overrides: Override[];
  plans: Entity[];
  businesses: Entity[];
}) {
  const [open, setOpen] = useState(overrides.length > 0);
  const [scopeType, setScopeType] = useState<"plan" | "business">("business");
  const [scopeId, setScopeId] = useState("");
  const [value, setValue] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const entities = scopeType === "plan" ? plans : businesses;
  const labelFor = (o: Override) => {
    const list = o.scopeType === "plan" ? plans : businesses;
    return list.find((e) => e.id === o.scopeId)?.label ?? o.scopeId;
  };

  function addOverride() {
    setError(null);
    startTransition(async () => {
      const result = await setFeatureFlagOverride(flagId, scopeType, scopeId, value);
      if (result.success) {
        setScopeId("");
        router.refresh();
      } else {
        setError(result.error ?? "Couldn't save.");
      }
    });
  }

  function remove(overrideId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeFeatureFlagOverride(overrideId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Couldn't remove.");
      }
    });
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-accent hover:underline">
        {open ? "Hide" : "Manage"} per-plan / per-business overrides {overrides.length > 0 && `(${overrides.length})`}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2.5">
          {overrides.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {overrides.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-fog px-3 py-2 text-sm">
                  <span className="text-ink-soft">
                    <span className="font-semibold text-ink">{o.scopeType === "plan" ? "Plan" : "Business"}:</span> {labelFor(o)}{" "}
                    <span className={`ms-1 font-bold ${o.value ? "text-success" : "text-danger"}`}>{o.value ? "ON" : "OFF"}</span>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(o.id)}
                    className="min-h-8 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-paper"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={scopeType}
              onChange={(e) => {
                setScopeType(e.target.value as "plan" | "business");
                setScopeId("");
              }}
              className="min-h-9 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm"
            >
              <option value="business">Business</option>
              <option value="plan">Plan</option>
            </select>
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="min-h-9 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm"
            >
              <option value="">Choose {scopeType === "plan" ? "a plan" : "a business"}…</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
            <select
              value={value ? "on" : "off"}
              onChange={(e) => setValue(e.target.value === "on")}
              className="min-h-9 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm"
            >
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
            <button
              type="button"
              disabled={pending || !scopeId}
              onClick={addOverride}
              className="min-h-9 rounded-[var(--radius-sm)] bg-accent px-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Add override"}
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
