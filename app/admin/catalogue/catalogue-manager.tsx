"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { pick } from "@/lib/i18n/pick";
import { moveCatalogueProduct } from "@/lib/actions/catalogue";
import { ProductEditor } from "./product-editor";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["catalogue_products"]["Row"];

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-fog text-ink-muted",
  published: "bg-success-bg text-success",
  hidden: "bg-warning-bg text-warning",
  out_of_stock: "bg-danger-bg text-danger",
};

export function CatalogueManager({ products }: { products: Product[] }) {
  const [editing, setEditing] = useState<Product | null | "new">(null);
  const [movePending, startMove] = useTransition();
  const router = useRouter();

  function move(id: string, direction: "up" | "down") {
    startMove(async () => {
      await moveCatalogueProduct(id, direction);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">Vee&apos;s own NFC/QR hardware line, shown on the public site.</p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="min-h-11 shrink-0 rounded-[var(--radius-sm)] bg-accent px-5 text-sm font-bold text-white shadow-md hover:brightness-105"
        >
          + Add product
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => {
          const price = product.discount_price_iqd ?? product.price_iqd;
          return (
            <div key={product.id} className="rounded-[var(--radius-lg)] border border-line bg-paper p-4">
              <div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-fog">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt="" width={200} height={150} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl" aria-hidden="true">📇</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-ink">{pick(product.name as Record<string, string>, "en")}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[product.status]}`}>
                  {product.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{product.sku}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {price != null ? (
                  <>
                    <span className="font-bold text-ink">
                      {price.toLocaleString()} {product.currency}
                    </span>
                    {product.discount_price_iqd != null && (
                      <span className="text-xs text-ink-muted line-through">
                        {product.price_iqd?.toLocaleString()} {product.currency}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-ink-muted">Request a quote</span>
                )}
                {product.featured && <span className="ms-auto text-xs font-bold text-gold">★ Featured</span>}
              </div>

              <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(product)}
                  className="min-h-9 flex-1 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={movePending || i === 0}
                  onClick={() => move(product.id, "up")}
                  title="Move earlier"
                  className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={movePending || i === products.length - 1}
                  onClick={() => move(product.id, "down")}
                  title="Move later"
                  className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
            No products yet — click &quot;Add product&quot; above.
          </p>
        )}
      </div>

      {editing && <ProductEditor product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
