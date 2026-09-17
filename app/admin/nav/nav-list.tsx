"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toggleNavVisibility, deleteNavItem, reorderNavItems } from "@/lib/actions/cms";
import { NavItemForm, type NavItemFormValue } from "./nav-item-form";

export type NavListItem = NavItemFormValue & { id: string; visible: boolean; sortOrder: number };

export function NavList({
  title,
  location,
  footerGroup,
  items,
}: {
  title: string;
  location: "header" | "footer";
  footerGroup?: "solutions" | "company" | "legal";
  items: NavListItem[];
}) {
  const [list, setList] = useState(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function move(index: number, direction: -1 | 1) {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
    startTransition(async () => {
      await reorderNavItems(next.map((item) => item.id));
      router.refresh();
    });
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">{title}</h3>
      <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper">
        {list.map((item, i) =>
          editingId === item.id ? (
            <li key={item.id} className="p-4">
              <NavItemForm
                location={location}
                footerGroup={footerGroup}
                item={item}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
              <button type="button" onClick={() => setEditingId(null)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
                Cancel
              </button>
            </li>
          ) : (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={pending || i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move up"
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={pending || i === list.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" width={20} height={20} className="rounded" />
                ) : item.icon ? (
                  <span aria-hidden="true">{item.icon}</span>
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-ink">{item.label.en}</p>
                  <p className="text-xs text-ink-muted">{item.url}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <label className="flex min-h-9 items-center gap-1 text-xs font-semibold text-ink-soft">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(e) => {
                      const visible = e.target.checked;
                      setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, visible } : n)));
                      startTransition(async () => {
                        await toggleNavVisibility(item.id, visible);
                        router.refresh();
                      });
                    }}
                  />
                  Visible
                </label>
                <button type="button" onClick={() => setEditingId(item.id)} className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-ink-soft hover:bg-fog">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("Delete this navigation item?")) return;
                    setList((prev) => prev.filter((n) => n.id !== item.id));
                    startTransition(async () => {
                      await deleteNavItem(item.id);
                      router.refresh();
                    });
                  }}
                  className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-danger hover:bg-fog"
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
        {list.length === 0 && <li className="p-3 text-sm text-ink-muted">No links yet.</li>}
      </ul>

      {adding ? (
        <div className="mt-2 rounded-[var(--radius-md)] border border-dashed border-line bg-paper p-4">
          <NavItemForm
            location={location}
            footerGroup={footerGroup}
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
          />
          <button type="button" onClick={() => setAdding(false)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-2 w-fit rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-fog">
          + Add link
        </button>
      )}
    </div>
  );
}
