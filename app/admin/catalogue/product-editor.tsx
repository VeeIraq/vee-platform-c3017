"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import {
  createCatalogueProduct,
  updateCatalogueProduct,
  deleteCatalogueProduct,
  uploadCatalogueProductImage,
  removeCatalogueProductImage,
  setCatalogueProductMainImage,
} from "@/lib/actions/catalogue";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["catalogue_products"]["Row"];

const STATUSES = ["draft", "published", "hidden", "out_of_stock"] as const;

function specsToText(specs: unknown): string {
  if (!specs || typeof specs !== "object") return "";
  return Object.entries(specs as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function ProductEditor({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const isCreate = !product;
  const [createdId, setCreatedId] = useState<string | null>(null);
  const editingId = product?.id ?? createdId;

  const [result, setResult] = useState<{ success: boolean; error?: string } | undefined>(undefined);
  const [pending, startSaving] = useTransition();

  const router = useRouter();
  const [deletePending, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      if (isCreate && !createdId) {
        const res = await createCatalogueProduct(undefined, formData);
        setResult(res);
        if (res.success && res.id) setCreatedId(res.id);
      } else if (editingId) {
        const res = await updateCatalogueProduct(editingId, undefined, formData);
        setResult(res);
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!editingId) return;
    if (!confirm("Permanently delete this product? This can't be undone.")) return;
    startDelete(async () => {
      await deleteCatalogueProduct(editingId);
      router.refresh();
      onClose();
    });
  }

  const name = (product?.name as Record<string, string> | undefined) ?? {};
  const description = (product?.description as Record<string, string> | undefined) ?? {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Add product" : "Edit product"}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-8 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl rounded-[var(--radius-lg)] border border-line bg-paper p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-ink">{isCreate ? "Add product" : "Edit product"}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-fog" aria-label="Close">
            ✕
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          {result?.error && (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-3 py-2 text-sm font-medium text-danger">
              {result.error}
            </p>
          )}
          {result?.success && (
            <p role="status" className="rounded-[var(--radius-sm)] bg-success-bg px-3 py-2 text-sm font-medium text-success">
              Saved.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" required>
              <TextInput id="sku" name="sku" defaultValue={product?.sku} required disabled={!isCreate} />
            </Field>
            <Field label="Category" htmlFor="category" hint="e.g. nfc, qr, accessories">
              <TextInput id="category" name="category" defaultValue={product?.category ?? "nfc"} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name (English)" htmlFor="name_en" required>
              <TextInput id="name_en" name="name_en" defaultValue={name.en} required />
            </Field>
            <Field label="Name (Arabic)" htmlFor="name_ar">
              <TextInput id="name_ar" name="name_ar" dir="rtl" defaultValue={name.ar} />
            </Field>
            <Field label="Name (Kurdish)" htmlFor="name_ku">
              <TextInput id="name_ku" name="name_ku" dir="rtl" defaultValue={name.ku} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Description (English)" htmlFor="description_en">
              <TextArea id="description_en" name="description_en" defaultValue={description.en} />
            </Field>
            <Field label="Description (Arabic)" htmlFor="description_ar">
              <TextArea id="description_ar" name="description_ar" dir="rtl" defaultValue={description.ar} />
            </Field>
            <Field label="Description (Kurdish)" htmlFor="description_ku">
              <TextArea id="description_ku" name="description_ku" dir="rtl" defaultValue={description.ku} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Price" htmlFor="price" hint="Blank = request a quote">
              <TextInput id="price" name="price" type="number" min={0} defaultValue={product?.price_iqd ?? ""} />
            </Field>
            <Field label="Sale price" htmlFor="discountPrice" hint="Optional; must be lower">
              <TextInput id="discountPrice" name="discountPrice" type="number" min={0} defaultValue={product?.discount_price_iqd ?? ""} />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <TextInput id="currency" name="currency" defaultValue={product?.currency ?? "IQD"} />
            </Field>
            <Field label="Colors" htmlFor="colors" hint="Comma-separated">
              <TextInput id="colors" name="colors" defaultValue={(product?.colors ?? []).join(", ")} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={product?.status ?? "draft"}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="mt-6 flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />
              Featured (highlighted on the public site)
            </label>
          </div>

          <Field label="Specifications" htmlFor="specifications" hint={'One per line, as "Key: Value"'}>
            <TextArea id="specifications" name="specifications" rows={4} defaultValue={specsToText(product?.specifications)} />
          </Field>

          {editingId && <ImageManager productId={editingId} images={(product?.images as string[] | undefined) ?? []} />}
          {isCreate && !createdId && <p className="text-xs text-ink-muted">Save the product first, then you can add images.</p>}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {!isCreate && (
              <button
                type="button"
                disabled={deletePending}
                onClick={handleDelete}
                className="min-h-10 rounded-[var(--radius-sm)] border border-danger px-4 text-sm font-bold text-danger hover:bg-danger-bg disabled:opacity-60"
              >
                {deletePending ? "Deleting…" : "Delete product"}
              </button>
            )}
            <div className="ms-auto flex gap-2">
              <button type="button" onClick={onClose} className="min-h-10 rounded-[var(--radius-sm)] border border-line px-4 text-sm font-semibold text-ink-soft">
                Close
              </button>
              <button type="submit" disabled={pending} className="min-h-10 rounded-[var(--radius-sm)] bg-accent px-5 text-sm font-bold text-white disabled:opacity-60">
                {pending ? "Saving…" : createdId ? "Save changes" : "Save product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImageManager({ productId, images }: { productId: string; images: string[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadCatalogueProductImage(undefined, fd);
      if (!res.success) setError(res.error ?? "Upload failed.");
      router.refresh();
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function makeMain(url: string) {
    startTransition(async () => {
      await setCatalogueProductMainImage(productId, url);
      router.refresh();
    });
  }

  function remove(url: string) {
    if (!confirm("Remove this image?")) return;
    startTransition(async () => {
      await removeCatalogueProductImage(productId, url);
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-fog p-4">
      <p className="mb-3 text-sm font-bold text-ink">Images</p>
      {error && <p className="mb-2 text-xs font-medium text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative w-24">
            <div className="h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-paper">
              <Image src={url} alt="" width={96} height={96} className="h-full w-full object-cover" />
            </div>
            {i === 0 && <span className="absolute start-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">Main</span>}
            <div className="mt-1 flex justify-center gap-1">
              {i !== 0 && (
                <button type="button" disabled={pending} onClick={() => makeMain(url)} title="Set as main image" className="text-[10px] font-semibold text-accent hover:underline">
                  Set main
                </button>
              )}
              <button type="button" disabled={pending} onClick={() => remove(url)} title="Delete image" className="text-[10px] font-semibold text-danger hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border-2 border-dashed border-line text-center text-[11px] font-semibold text-ink-muted hover:border-accent hover:text-accent">
          {pending ? "Uploading…" : "+ Add image"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-ink-muted">The first image is used as the product&apos;s main photo. Click &quot;Set main&quot; on another to replace it.</p>
    </div>
  );
}
