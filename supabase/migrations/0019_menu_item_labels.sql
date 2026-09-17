-- =====================================================================
-- 0019_menu_item_labels.sql
-- =====================================================================
-- Structured, multi-language menu item labels (Chef's Choice, New Item,
-- Highly Recommended, Best Seller, Popular, Limited Offer, ...), distinct
-- from the pre-existing free-text menu_items.tags column (which stays
-- as-is -- out of scope for this change; see the project's launch-audit
-- notes for a future-consolidation recommendation).
--
-- Two tables so the label catalogue is data, not code, and "additional
-- labels can be added later" (per the product requirement) means a normal
-- INSERT into menu_labels, not a schema change or a new dictionary key:
--   - menu_labels: the catalogue (one row per label, per-language name),
--     Vee-staff-managed like feature_flags -- a business picks from this
--     list, it doesn't invent its own global labels.
--   - menu_item_label_links: which labels are assigned to which item,
--     scoped through the item's own business exactly like product_options
--     is scoped in 0003_helpers_and_rls.sql.
-- =====================================================================

create table menu_labels (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name jsonb not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table menu_labels is 'Catalogue of assignable menu item labels (Chef''s Choice, New Item, ...). Vee-staff-managed; businesses pick from this list when tagging a menu item. Add a new label later with a normal insert -- no schema change needed.';

create table menu_item_label_links (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  label_id uuid not null references menu_labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (menu_item_id, label_id)
);
create index menu_item_label_links_item_idx on menu_item_label_links(menu_item_id);
create index menu_item_label_links_label_idx on menu_item_label_links(label_id);

alter table menu_labels enable row level security;
alter table menu_item_label_links enable row level security;

create policy "anyone reads active labels" on menu_labels for select using (active or is_vee_staff());
create policy "staff manage label catalogue" on menu_labels for all
  using (is_vee_staff()) with check (is_vee_staff());

-- Same "public reads through a visible+published parent, members write
-- through has_business_permission" pattern as product_options.
create policy "public reads label links of visible items" on menu_item_label_links for select
  using (
    exists (
      select 1 from menu_items mi join businesses b on b.id = mi.business_id
      where mi.id = menu_item_id and mi.visible and b.status = 'published'
    )
    or exists (
      select 1 from menu_items mi where mi.id = menu_item_id and (is_business_member(mi.business_id) or is_vee_staff())
    )
  );
create policy "members write label links" on menu_item_label_links for all
  using (exists (select 1 from menu_items mi where mi.id = menu_item_id and (has_business_permission(mi.business_id, 'menu.edit') or is_vee_staff())))
  with check (exists (select 1 from menu_items mi where mi.id = menu_item_id and (has_business_permission(mi.business_id, 'menu.edit') or is_vee_staff())));

insert into menu_labels (key, name, sort_order) values
  ('chefs_choice',        '{"en":"Chef''s Choice","ar":"اختيار الشيف","ku":"هەڵبژاردەی شێف"}'::jsonb, 0),
  ('new_item',             '{"en":"New Item","ar":"عنصر جديد","ku":"بەرهەمی نوێ"}'::jsonb, 1),
  ('highly_recommended',   '{"en":"Highly Recommended","ar":"موصى به بشدة","ku":"زۆر پێشنیارکراو"}'::jsonb, 2),
  ('best_seller',          '{"en":"Best Seller","ar":"الأكثر مبيعًا","ku":"زۆرترین فرۆش"}'::jsonb, 3),
  ('popular',              '{"en":"Popular","ar":"رائج","ku":"بەناوبانگ"}'::jsonb, 4),
  ('limited_offer',        '{"en":"Limited Offer","ar":"عرض محدود","ku":"ئۆفەری سنووردار"}'::jsonb, 5)
on conflict (key) do nothing;

insert into feature_flags (key, label, description, scope, default_value)
values ('menu_item_labels', 'Menu item labels', 'Structured labels (Chef''s Choice, Best Seller, ...) on public digital menu items', 'global', true)
on conflict (key) do nothing;
