"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

export type FaqAccordionItem = { key: string; question: string; answer: string };

/**
 * FAQ accordion following the WAI-ARIA "Accordion (Sections With Show/Hide
 * Functionality)" pattern: each header is a real <button> (Enter/Space work
 * for free), aria-expanded + aria-controls tie it to its answer panel, and
 * Up/Down/Home/End move focus between headers without changing which panels
 * are open. Multiple panels can be open at once -- a FAQ isn't a "pick one"
 * UI, unlike a typical single-open accordion.
 */
export function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const headerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = -1;
    if (e.key === "ArrowDown") target = (index + 1) % items.length;
    else if (e.key === "ArrowUp") target = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = items.length - 1;
    if (target !== -1) {
      e.preventDefault();
      headerRefs.current[target]?.focus();
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = open.has(item.key);
        const headerId = `${baseId}-h-${index}`;
        const panelId = `${baseId}-p-${index}`;
        return (
          <div key={item.key} className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-fog-2">
            <h3 className="m-0">
              <button
                ref={(el) => {
                  headerRefs.current[index] = el;
                }}
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.key)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-start font-bold text-ink hover:bg-fog focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline focus-visible:-outline-offset-2"
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="px-5 pb-4 text-sm text-ink-muted"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
