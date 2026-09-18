"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  toggleMenuCategory,
  toggleMenuItemAvailability,
  toggleMenuItemVisibility,
  uploadMenuItemImage,
  createProductOption,
  deleteProductOption,
  addOptionChoice,
  removeOptionChoice,
  setMenuLikesEnabled,
  setMenuItemLabels,
  type ActionState,
} from "@/lib/actions/menu";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/config";

type Category = { id: string; name: Record<string, string>; visible: boolean };
type OptionChoice = { id: string; name: Record<string, string>; priceDelta: number };
type ProductOption = { id: string; type: "single" | "multi"; name: Record<string, string>; choices: OptionChoice[] };
export type MenuLabel = { id: string; key: string; name: Record<string, string> };
type Item = {
  id: string;
  category_id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  discount_price: number | null;
  tags: string[];
  available: boolean;
  visible: boolean;
  image_url: string | null;
  labelIds: string[];
  options: ProductOption[];
};

export function MenuManager({
  businessId,
  categories,
  items,
  locale,
  likesEnabled,
  imageUploadsEnabled = true,
  labelCatalogue,
}: {
  businessId: string;
  categories: Category[];
  items: Item[];
  locale: Locale;
  likesEnabled: boolean;
  imageUploadsEnabled?: boolean;
  labelCatalogue: MenuLabel[];
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id ?? "");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedLabelsItemId, setExpandedLabelsItemId] = useState<string | null>(null);
  const [expandedEditItemId, setExpandedEditItemId] = useState<string | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-4">
        <LikesToggle businessId={businessId} enabled={likesEnabled} />
        <CategoryForm businessId={businessId} />
        <ul className="flex flex-col gap-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border p-3 ${
                selectedCategory === cat.id ? "border-accent bg-fog" : "border-line bg-paper"
              }`}
            >
              <button type="button" onClick={() => setSelectedCategory(cat.id)} className="flex-1 text-start text-sm font-semibold text-ink">
                {pick(cat.name, locale)}
              </button>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted">
                <input
                  type="checkbox"
                  defaultChecked={cat.visible}
                  onChange={(e) =>
                    startTransition(() => {
                      toggleMenuCategory(cat.id, businessId, e.target.checked);
                      router.refresh();
                    })
                  }
                />
                Visible
              </label>
              <button
                type="button"
                aria-label={`Delete ${pick(cat.name, locale)}`}
                onClick={() =>
                  startTransition(() => {
                    deleteMenuCategory(cat.id, businessId);
                    if (selectedCategory === cat.id) setSelectedCategory("");
                    router.refresh();
                  })
                }
                className="text-danger"
              >
                ✕
              </button>
            </li>
          ))}
          {categories.length === 0 && <p className="text-sm text-ink-muted">Add a category to get started.</p>}
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        {selectedCategory ? (
          <>
            <ul className="flex flex-col gap-3">
              {items
                .filter((i) => i.category_id === selectedCategory)
                .map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
                    <div className="flex items-start gap-3">
                      <ItemImage businessId={businessId} itemId={item.id} imageUrl={item.image_url} uploadsEnabled={imageUploadsEnabled} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-ink">{pick(item.name, locale)}</p>
                          <p className="font-bold text-ink">{(item.discount_price ?? item.price).toLocaleString()} IQD</p>
                        </div>
                        {item.labelIds.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.labelIds.map((labelId) => {
                              const label = labelCatalogue.find((l) => l.id === labelId);
                              if (!label) return null;
                              return (
                                <span key={labelId} className="rounded-full bg-gold/30 px-2 py-0.5 text-[11px] font-semibold text-canyon">
                                  {pick(label.name, locale)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 font-semibold text-ink-soft">
                            <input
                              type="checkbox"
                              defaultChecked={item.available}
                              onChange={(e) =>
                                startTransition(() => {
                                  toggleMenuItemAvailability(item.id, businessId, e.target.checked);
                                  router.refresh();
                                })
                              }
                            />
                            Available
                          </label>
                          <label className="flex items-center gap-1.5 font-semibold text-ink-soft">
                            <input
                              type="checkbox"
                              defaultChecked={item.visible}
                              onChange={(e) =>
                                startTransition(() => {
                                  toggleMenuItemVisibility(item.id, businessId, e.target.checked);
                                  router.refresh();
                                })
                              }
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            className="font-semibold text-ink-soft hover:underline"
                            onClick={() => setExpandedItemId((cur) => (cur === item.id ? null : item.id))}
                          >
                            {expandedItemId === item.id ? "Hide" : "Sizes & add-ons"}
                            {item.options.length > 0 ? ` (${item.options.length})` : ""}
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-ink-soft hover:underline"
                            onClick={() => setExpandedLabelsItemId((cur) => (cur === item.id ? null : item.id))}
                          >
                            {expandedLabelsItemId === item.id ? "Hide" : "Labels"}
                            {item.labelIds.length > 0 ? ` (${item.labelIds.length})` : ""}
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-accent hover:underline"
                            onClick={() => setExpandedEditItemId((cur) => (cur === item.id ? null : item.id))}
                          >
                            {expandedEditItemId === item.id ? "Hide" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-danger"
                            onClick={() =>
                              startTransition(() => {
                                deleteMenuItem(item.id, businessId);
                                router.refresh();
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    {expandedEditItemId === item.id && (
                      <ItemEditForm businessId={businessId} item={item} categories={categories} locale={locale} />
                    )}
                    {expandedItemId === item.id && <ItemOptionsEditor businessId={businessId} item={item} locale={locale} />}
                    {expandedLabelsItemId === item.id && (
                      <ItemLabelsEditor businessId={businessId} item={item} labelCatalogue={labelCatalogue} locale={locale} />
                    )}
                  </li>
                ))}
              {items.filter((i) => i.category_id === selectedCategory).length === 0 && (
                <p className="text-sm text-ink-muted">No items in this category yet.</p>
              )}
            </ul>

            <ItemForm businessId={businessId} categoryId={selectedCategory} categories={categories} labelCatalogue={labelCatalogue} />
          </>
        ) : (
          <p className="text-sm text-ink-muted">Select or create a category to manage its items.</p>
        )}
      </div>
    </div>
  );
}

function CategoryForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createMenuCategory, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
      <input type="hidden" name="businessId" value={businessId} />
      <p className="text-sm font-bold text-ink">New category</p>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
      <TextInput name="nameEn" placeholder="Category name (English)" required aria-label="Category name (English)" />
      <TextInput name="nameAr" placeholder="اسم الفئة (Arabic)" dir="rtl" aria-label="Category name (Arabic)" />
      <TextInput name="nameKu" placeholder="ناوی بەش (Kurdish)" dir="rtl" aria-label="Category name (Kurdish)" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </Button>
    </form>
  );
}

function ItemForm({
  businessId,
  categoryId,
  categories,
  labelCatalogue,
}: {
  businessId: string;
  categoryId: string;
  categories: Category[];
  labelCatalogue: MenuLabel[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createMenuItem, undefined);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      <input type="hidden" name="businessId" value={businessId} />
      <h2 className="font-bold text-ink">Add an item</h2>
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" required>
          <Select id="categoryId" name="categoryId" defaultValue={categoryId} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name.en ?? Object.values(cat.name)[0]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Name (English)" htmlFor="nameEn" required>
          <TextInput id="nameEn" name="nameEn" required />
        </Field>
        <Field label="Price (IQD)" htmlFor="price" required>
          <TextInput id="price" name="price" type="number" min={0} step={250} required />
        </Field>
        <Field label="Name (Arabic)" htmlFor="nameAr">
          <TextInput id="nameAr" name="nameAr" dir="rtl" />
        </Field>
        <Field label="Discount price (optional)" htmlFor="discountPrice">
          <TextInput id="discountPrice" name="discountPrice" type="number" min={0} step={250} />
        </Field>
        <Field label="Name (Kurdish)" htmlFor="nameKu">
          <TextInput id="nameKu" name="nameKu" dir="rtl" />
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Comma-separated: popular, new, featured">
          <TextInput id="tags" name="tags" placeholder="popular, new" />
        </Field>
      </div>
      <Field label="Description (English)" htmlFor="descriptionEn">
        <TextArea id="descriptionEn" name="descriptionEn" />
      </Field>
      <Field label="Photo (optional)" htmlFor="image" hint="You can also add or change it later from the item's thumbnail.">
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="block w-full text-sm text-ink-soft file:me-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-fog file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink"
        />
      </Field>
      {labelCatalogue.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">Labels</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {labelCatalogue.map((label) => (
              <label key={label.id} className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="labelIds" value={label.id} className="h-4 w-4" />
                {label.name.en}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}

// Full edit panel for an existing item -- covers exactly the fields that had
// no way to change after creation (category, names, descriptions, price,
// discount, tags). Image, availability, visibility and labels already have
// their own dedicated inline controls elsewhere on the row.
function ItemEditForm({
  businessId,
  item,
  categories,
  locale,
}: {
  businessId: string;
  item: Item;
  categories: Category[];
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMenuItem, undefined);
  return (
    <form action={action} className="flex flex-col gap-4 border-t border-line pt-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="itemId" value={item.id} />
      <p className="text-sm font-bold text-ink">Edit item</p>
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm font-medium text-success">Saved.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor={`edit-categoryId-${item.id}`} required>
          <Select id={`edit-categoryId-${item.id}`} name="categoryId" defaultValue={item.category_id} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {pick(cat.name, locale)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price (IQD)" htmlFor={`edit-price-${item.id}`} required>
          <TextInput id={`edit-price-${item.id}`} name="price" type="number" min={0} step={250} defaultValue={item.price} required />
        </Field>
        <Field label="Name (English)" htmlFor={`edit-nameEn-${item.id}`} required>
          <TextInput id={`edit-nameEn-${item.id}`} name="nameEn" defaultValue={item.name.en} required />
        </Field>
        <Field label="Discount price (optional)" htmlFor={`edit-discountPrice-${item.id}`}>
          <TextInput
            id={`edit-discountPrice-${item.id}`}
            name="discountPrice"
            type="number"
            min={0}
            step={250}
            defaultValue={item.discount_price ?? ""}
          />
        </Field>
        <Field label="Name (Arabic)" htmlFor={`edit-nameAr-${item.id}`}>
          <TextInput id={`edit-nameAr-${item.id}`} name="nameAr" dir="rtl" defaultValue={item.name.ar} />
        </Field>
        <Field label="Tags" htmlFor={`edit-tags-${item.id}`} hint="Comma-separated: popular, new, featured">
          <TextInput id={`edit-tags-${item.id}`} name="tags" placeholder="popular, new" defaultValue={item.tags.join(", ")} />
        </Field>
        <Field label="Name (Kurdish)" htmlFor={`edit-nameKu-${item.id}`}>
          <TextInput id={`edit-nameKu-${item.id}`} name="nameKu" dir="rtl" defaultValue={item.name.ku} />
        </Field>
      </div>
      <Field label="Description (English)" htmlFor={`edit-descriptionEn-${item.id}`}>
        <TextArea id={`edit-descriptionEn-${item.id}`} name="descriptionEn" defaultValue={item.description.en} />
      </Field>
      <Field label="Description (Arabic)" htmlFor={`edit-descriptionAr-${item.id}`}>
        <TextArea id={`edit-descriptionAr-${item.id}`} name="descriptionAr" dir="rtl" defaultValue={item.description.ar} />
      </Field>
      <Field label="Description (Kurdish)" htmlFor={`edit-descriptionKu-${item.id}`}>
        <TextArea id={`edit-descriptionKu-${item.id}`} name="descriptionKu" dir="rtl" defaultValue={item.description.ku} />
      </Field>
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function LikesToggle({ businessId, enabled }: { businessId: string; enabled: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
      <label className="flex items-start gap-2.5 text-sm font-semibold text-ink-soft">
        <input
          type="checkbox"
          defaultChecked={enabled}
          className="mt-0.5 h-4 w-4"
          onChange={(e) =>
            startTransition(() => {
              setMenuLikesEnabled(businessId, e.target.checked);
              router.refresh();
            })
          }
        />
        <span>
          Menu item likes
          <span className="block text-xs font-normal text-ink-muted">
            Let customers tap a heart on a menu item. No account needed; one like per visitor per item.
          </span>
        </span>
      </label>
    </div>
  );
}

// Inline multi-select label editor for an existing item -- there is no
// general "edit item" form in this dashboard (name/price/etc. are set once
// at creation), so this follows the same "expand the row, flip a checkbox,
// save immediately" pattern already used for Available/Visible above,
// rather than introducing a new edit-item flow.
function ItemLabelsEditor({
  businessId,
  item,
  labelCatalogue,
  locale,
}: {
  businessId: string;
  item: Item;
  labelCatalogue: MenuLabel[];
  locale: Locale;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(item.labelIds);

  if (labelCatalogue.length === 0) {
    return <p className="border-t border-line pt-3 text-xs text-ink-muted">No labels are configured yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {labelCatalogue.map((label) => {
          const checked = selected.includes(label.id);
          return (
            <label key={label.id} className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
              <input
                type="checkbox"
                checked={checked}
                disabled={pending}
                onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, label.id] : prev.filter((id) => id !== label.id)))}
              />
              {pick(label.name, locale)}
            </label>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        className="w-fit"
        onClick={() =>
          startTransition(async () => {
            await setMenuItemLabels(item.id, businessId, selected);
            router.refresh();
          })
        }
      >
        {pending ? "Saving…" : "Save labels"}
      </Button>
    </div>
  );
}

function ItemImage({
  businessId,
  itemId,
  imageUrl,
  uploadsEnabled,
}: {
  businessId: string;
  itemId: string;
  imageUrl: string | null;
  uploadsEnabled: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadMenuItemImage, undefined);

  if (!uploadsEnabled) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-16 w-16 rounded-[var(--radius-sm)] border border-line object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-line text-xl">🍽️</span>
        )}
        <span className="max-w-16 text-center text-[10px] text-ink-muted">Not on your plan</span>
      </div>
    );
  }

  return (
    <form action={action} className="flex shrink-0 flex-col items-center gap-1">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="itemId" value={itemId} />
      <label className="group relative block cursor-pointer">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-16 w-16 rounded-[var(--radius-sm)] border border-line object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-line text-xl">🍽️</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-sm)] bg-ink/0 text-white opacity-0 transition-opacity group-hover:bg-ink/50 group-hover:opacity-100">
          <Icon name="camera" className="h-5 w-5" />
        </span>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.form?.requestSubmit()}
          aria-label={imageUrl ? "Change item photo" : "Add item photo"}
        />
      </label>
      <span className="text-[10px] font-semibold text-ink-muted">{imageUrl ? "Change photo" : "Add photo"}</span>
      {pending && <span className="text-[10px] text-ink-muted">Uploading…</span>}
      {state?.error && <span className="text-[10px] text-danger">{state.error}</span>}
    </form>
  );
}

// Sizes (required, single-choice) and add-ons (optional, multi-choice) are
// both "option groups" (product_options rows) that differ only by `type`.
// Each group holds its own list of choices, each with a price difference
// applied on top of the item's base price.
function ItemOptionsEditor({ businessId, item, locale }: { businessId: string; item: Item; locale: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-3">
      {item.options.length === 0 && (
        <p className="text-xs text-ink-muted">No sizes or add-ons yet. Add a required choice (e.g. Size) or an optional add-on group below.</p>
      )}
      <ul className="flex flex-col gap-3">
        {item.options.map((opt) => (
          <li key={opt.id} className="rounded-[var(--radius-sm)] border border-line bg-fog p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink">
                {pick(opt.name, locale)}
                <span className="ms-1.5 font-normal text-ink-muted">{opt.type === "single" ? "· required choice" : "· optional add-ons"}</span>
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-danger"
                onClick={() =>
                  startTransition(() => {
                    deleteProductOption(opt.id, businessId);
                    router.refresh();
                  })
                }
              >
                Delete group
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {opt.choices.map((choice) => (
                <li key={choice.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-paper px-2.5 py-1.5 text-xs">
                  <span className="text-ink">{pick(choice.name, locale)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">
                      {choice.priceDelta > 0 ? "+" : ""}
                      {choice.priceDelta.toLocaleString()} IQD
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${pick(choice.name, locale)}`}
                      className="text-danger"
                      onClick={() =>
                        startTransition(() => {
                          removeOptionChoice(opt.id, choice.id, businessId);
                          router.refresh();
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
              {opt.choices.length === 0 && <li className="text-xs text-ink-muted">No choices yet.</li>}
            </ul>
            <ChoiceForm businessId={businessId} optionId={opt.id} />
          </li>
        ))}
      </ul>
      <OptionGroupForm businessId={businessId} itemId={item.id} />
    </div>
  );
}

function OptionGroupForm({ businessId, itemId }: { businessId: string; itemId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProductOption, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-[var(--radius-sm)] border border-dashed border-line p-2.5">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="itemId" value={itemId} />
      {state?.error && <p role="alert" className="w-full text-xs font-medium text-danger">{state.error}</p>}
      <Field label="Group name (English)" htmlFor={`opt-nameEn-${itemId}`} required>
        <TextInput id={`opt-nameEn-${itemId}`} name="nameEn" placeholder="e.g. Size" required />
      </Field>
      <Field label="Group name (Arabic)" htmlFor={`opt-nameAr-${itemId}`}>
        <TextInput id={`opt-nameAr-${itemId}`} name="nameAr" dir="rtl" />
      </Field>
      <Field label="Group name (Kurdish)" htmlFor={`opt-nameKu-${itemId}`}>
        <TextInput id={`opt-nameKu-${itemId}`} name="nameKu" dir="rtl" />
      </Field>
      <Field label="Type" htmlFor={`opt-type-${itemId}`}>
        <Select id={`opt-type-${itemId}`} name="type" defaultValue="single">
          <option value="single">Required choice (e.g. Size)</option>
          <option value="multi">Optional add-ons</option>
        </Select>
      </Field>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add option group"}
      </Button>
    </form>
  );
}

function ChoiceForm({ businessId, optionId }: { businessId: string; optionId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addOptionChoice, undefined);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="optionId" value={optionId} />
      {state?.error && <p role="alert" className="w-full text-xs font-medium text-danger">{state.error}</p>}
      <Field label="Choice (English)" htmlFor={`choice-nameEn-${optionId}`} required>
        <TextInput id={`choice-nameEn-${optionId}`} name="nameEn" placeholder="e.g. Large" required />
      </Field>
      <Field label="Choice (Arabic)" htmlFor={`choice-nameAr-${optionId}`}>
        <TextInput id={`choice-nameAr-${optionId}`} name="nameAr" dir="rtl" />
      </Field>
      <Field label="Choice (Kurdish)" htmlFor={`choice-nameKu-${optionId}`}>
        <TextInput id={`choice-nameKu-${optionId}`} name="nameKu" dir="rtl" />
      </Field>
      <Field label="Price difference (IQD)" htmlFor={`choice-priceDelta-${optionId}`} hint="Use a negative number for a discount">
        <TextInput id={`choice-priceDelta-${optionId}`} name="priceDelta" type="number" step={250} defaultValue={0} />
      </Field>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Adding…" : "Add choice"}
      </Button>
    </form>
  );
}
