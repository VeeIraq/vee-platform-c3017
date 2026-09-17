-- ============================================================================
-- Vee platform — 0003: helper functions + row-level security
-- Every table with tenant data is locked down here. Nothing in this file is
-- optional — the frontend never enforces tenant isolation on its own; these
-- policies are the actual boundary. All helper functions are STABLE and
-- SECURITY INVOKER (run as the calling user) unless noted otherwise.
-- ============================================================================

create or replace function is_vee_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and internal_role is not null
  );
$$;

create or replace function is_super_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and internal_role = 'super_admin'
  );
$$;

create or replace function is_business_member(target_business_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and accepted_at is not null
  );
$$;

create or replace function is_business_owner(target_business_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and role = 'owner'
      and accepted_at is not null
  );
$$;

create or replace function has_business_permission(target_business_id uuid, perm text)
returns boolean language sql stable as $$
  select exists (
    select 1 from business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and accepted_at is not null
      and (role = 'owner' or permissions ? perm)
  );
$$;

-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table plans enable row level security;
alter table businesses enable row level security;
alter table business_members enable row level security;
alter table locations enable row level security;
alter table profile_links enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table product_options enable row level security;
alter table nfc_devices enable row level security;
alter table orders enable row level security;
alter table analytics_events enable row level security;
alter table leads enable row level security;
alter table catalogue_products enable row level security;
alter table subscriptions enable row level security;
alter table feature_flags enable row level security;
alter table feature_flag_overrides enable row level security;
alter table feature_flag_audit_log enable row level security;
alter table site_content enable row level security;
alter table nav_menu_items enable row level security;
alter table translation_overrides enable row level security;
alter table support_tickets enable row level security;
alter table audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "read own profile" on profiles for select
  using (id = auth.uid() or is_vee_staff());
create policy "update own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- internal_role is intentionally NOT settable by the user themselves — only
-- via the service-role client from a verified Super Admin action.

-- ---------------------------------------------------------------------------
-- plans — public catalogue, staff-managed
-- ---------------------------------------------------------------------------
create policy "anyone can read active plans" on plans for select using (active or is_vee_staff());
create policy "staff manage plans" on plans for all
  using (is_vee_staff()) with check (is_vee_staff());

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create policy "public reads published businesses" on businesses for select
  using (status = 'published' or is_business_member(id) or is_vee_staff());
create policy "owner updates own business" on businesses for update
  using (has_business_permission(id, 'profile.edit') or is_vee_staff())
  with check (has_business_permission(id, 'profile.edit') or is_vee_staff());
create policy "authenticated users create a business" on businesses for insert
  with check (auth.uid() is not null);
create policy "staff delete businesses" on businesses for delete using (is_vee_staff());

-- ---------------------------------------------------------------------------
-- business_members
-- ---------------------------------------------------------------------------
create policy "members read their own memberships" on business_members for select
  using (user_id = auth.uid() or is_business_owner(business_id) or is_vee_staff());
create policy "owner manages members" on business_members for insert
  with check (is_business_owner(business_id) or is_vee_staff()
    -- allow the very first membership row (the creating owner) to be self-inserted
    or (user_id = auth.uid() and not exists (select 1 from business_members bm where bm.business_id = business_members.business_id)));
create policy "owner updates members" on business_members for update
  using (is_business_owner(business_id) or is_vee_staff())
  with check (is_business_owner(business_id) or is_vee_staff());
create policy "owner removes members" on business_members for delete
  using (is_business_owner(business_id) or is_vee_staff());

-- ---------------------------------------------------------------------------
-- Generic pattern for tenant-owned child tables (locations, profile_links,
-- menu_categories, nfc_devices, orders, analytics_events): public can read
-- rows belonging to a PUBLISHED + VISIBLE business; members can read/write
-- their own business's rows; Vee staff can do anything.
-- ---------------------------------------------------------------------------

-- locations
create policy "public reads locations of published businesses" on locations for select
  using (exists (select 1 from businesses b where b.id = business_id and b.status = 'published')
         or is_business_member(business_id) or is_vee_staff());
create policy "members write locations" on locations for all
  using (has_business_permission(business_id, 'locations.edit') or is_vee_staff())
  with check (has_business_permission(business_id, 'locations.edit') or is_vee_staff());

-- profile_links
create policy "public reads enabled links of published businesses" on profile_links for select
  using ((enabled and exists (select 1 from businesses b where b.id = business_id and b.status = 'published'))
         or is_business_member(business_id) or is_vee_staff());
create policy "members write links" on profile_links for all
  using (has_business_permission(business_id, 'profile.edit') or is_vee_staff())
  with check (has_business_permission(business_id, 'profile.edit') or is_vee_staff());

-- menu_categories
create policy "public reads visible categories of published businesses" on menu_categories for select
  using ((visible and exists (select 1 from businesses b where b.id = business_id and b.status = 'published'))
         or is_business_member(business_id) or is_vee_staff());
create policy "members write categories" on menu_categories for all
  using (has_business_permission(business_id, 'menu.edit') or is_vee_staff())
  with check (has_business_permission(business_id, 'menu.edit') or is_vee_staff());

-- menu_items
create policy "public reads visible items of published businesses" on menu_items for select
  using ((visible and exists (select 1 from businesses b where b.id = business_id and b.status = 'published'))
         or is_business_member(business_id) or is_vee_staff());
create policy "members write items" on menu_items for all
  using (has_business_permission(business_id, 'menu.edit') or is_vee_staff())
  with check (has_business_permission(business_id, 'menu.edit') or is_vee_staff());

-- product_options (scoped through parent menu_item's business)
create policy "public reads options of visible items" on product_options for select
  using (exists (
    select 1 from menu_items mi join businesses b on b.id = mi.business_id
    where mi.id = menu_item_id and mi.visible and b.status = 'published'
  ) or exists (
    select 1 from menu_items mi where mi.id = menu_item_id and (is_business_member(mi.business_id) or is_vee_staff())
  ));
create policy "members write options" on product_options for all
  using (exists (select 1 from menu_items mi where mi.id = menu_item_id and (has_business_permission(mi.business_id, 'menu.edit') or is_vee_staff())))
  with check (exists (select 1 from menu_items mi where mi.id = menu_item_id and (has_business_permission(mi.business_id, 'menu.edit') or is_vee_staff())));

-- nfc_devices — never publicly readable (internal inventory / activation records)
create policy "members read own devices" on nfc_devices for select
  using ((business_id is not null and is_business_member(business_id)) or is_vee_staff());
create policy "staff manage devices" on nfc_devices for all
  using (is_vee_staff()) with check (is_vee_staff());
create policy "owner activates own device" on nfc_devices for update
  using (business_id is not null and has_business_permission(business_id, 'devices.edit'))
  with check (business_id is not null and has_business_permission(business_id, 'devices.edit'));

-- orders — never public; customer PII stays inside the authenticated dashboard
create policy "members read own orders" on orders for select
  using (has_business_permission(business_id, 'orders.view') or is_vee_staff());
create policy "members update own orders" on orders for update
  using (has_business_permission(business_id, 'orders.view') or is_vee_staff())
  with check (has_business_permission(business_id, 'orders.view') or is_vee_staff());
create policy "anyone can place an order for a published business" on orders for insert
  with check (exists (select 1 from businesses b where b.id = business_id and b.status = 'published'));

-- analytics_events — write-only for anonymous visitors (via a Route Handler
-- using the anon key so no PII is ever collected), read restricted to the
-- owning business + Vee staff.
create policy "anyone can log an analytics event for a published business" on analytics_events for insert
  with check (exists (select 1 from businesses b where b.id = business_id and b.status = 'published'));
create policy "members read own analytics" on analytics_events for select
  using (has_business_permission(business_id, 'analytics.view') or is_vee_staff());

-- leads — public contact form inserts, staff-only reads
create policy "anyone can submit a lead" on leads for insert with check (true);
create policy "staff read leads" on leads for select using (is_vee_staff());
create policy "staff update leads" on leads for update using (is_vee_staff()) with check (is_vee_staff());

-- catalogue_products — Vee's own marketing catalogue
create policy "public reads published catalogue products" on catalogue_products for select
  using (status = 'published' or is_vee_staff());
create policy "staff manage catalogue" on catalogue_products for all
  using (is_vee_staff()) with check (is_vee_staff());

-- subscriptions
create policy "owner reads own subscription" on subscriptions for select
  using (is_business_member(business_id) or is_vee_staff());
create policy "staff manage subscriptions" on subscriptions for all
  using (is_vee_staff()) with check (is_vee_staff());

-- feature flags — publicly readable (client needs to know what's on), staff-writable
create policy "anyone reads feature flags" on feature_flags for select using (true);
create policy "staff manage feature flags" on feature_flags for all
  using (is_vee_staff()) with check (is_vee_staff());
create policy "anyone reads flag overrides" on feature_flag_overrides for select using (true);
create policy "staff manage flag overrides" on feature_flag_overrides for all
  using (is_vee_staff()) with check (is_vee_staff());
create policy "staff read flag audit log" on feature_flag_audit_log for select using (is_vee_staff());
create policy "staff write flag audit log" on feature_flag_audit_log for insert with check (is_vee_staff());

-- site CMS — publicly readable when visible, staff-writable
create policy "anyone reads visible site content" on site_content for select
  using (visible or is_vee_staff());
create policy "staff manage site content" on site_content for all
  using (is_vee_staff()) with check (is_vee_staff());
create policy "anyone reads visible nav items" on nav_menu_items for select
  using (visible or is_vee_staff());
create policy "staff manage nav items" on nav_menu_items for all
  using (is_vee_staff()) with check (is_vee_staff());
create policy "anyone reads translation overrides" on translation_overrides for select using (true);
create policy "staff manage translation overrides" on translation_overrides for all
  using (is_vee_staff()) with check (is_vee_staff());

-- support_tickets
create policy "anyone can open a ticket" on support_tickets for insert with check (true);
create policy "owner reads own business tickets" on support_tickets for select
  using ((business_id is not null and is_business_member(business_id)) or is_vee_staff());
create policy "staff manage tickets" on support_tickets for update
  using (is_vee_staff()) with check (is_vee_staff());

-- audit_log — append-only from the app's perspective; readable by the
-- business it belongs to (transparency for owners) or Vee staff.
create policy "members read own audit log" on audit_log for select
  using ((business_id is not null and is_business_member(business_id)) or is_vee_staff());
create policy "authenticated users write audit entries" on audit_log for insert
  with check (auth.uid() is not null);
