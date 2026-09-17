-- ============================================================================
-- Vee platform — 0002: core tables
-- Field shapes mirror ARCHITECTURE.md from the original static prototype
-- 1:1 wherever an entity already existed there, extended with what a real
-- multi-tenant SaaS needs (staff roles, feature flags, CMS, audit log).
-- Per-language text (name/description/etc.) is stored as jsonb:
--   { "en": "...", "ar": "...", "ku": "..." }
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users. Every person who can log in (business
-- owner, business staff, or Vee internal staff) has exactly one row here.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  locale locale not null default 'en',
  internal_role internal_role,              -- null unless this is a Vee staff account
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
comment on table profiles is 'One row per auth.users account. internal_role is set only for Vee internal staff (never for business owners/staff), and is what admin.vee.iq access is gated on.';

-- ---------------------------------------------------------------------------
-- plans — subscription tiers. Seeded with the 4 plans from the original
-- pricing content (see 0004_seed_data.sql); editable by Super Admin.
-- ---------------------------------------------------------------------------
create table plans (
  id text primary key,                      -- 'vee_start' | 'vee_business' | 'vee_pro' | 'vee_custom'
  name jsonb not null default '{}',
  tagline jsonb not null default '{}',
  price_iqd integer,                        -- null => "contact us" / custom pricing
  billing_cycle text not null default 'monthly',
  features jsonb not null default '[]',     -- array of per-language feature strings
  max_locations integer not null default 1,
  max_staff integer not null default 1,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table businesses (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,          -- vee.iq/:username — validated in app layer against a reserved-word list
  name jsonb not null default '{}',
  category jsonb not null default '{}',
  description jsonb not null default '{}',
  logo_url text,
  cover_image_url text,
  status business_status not null default 'draft',
  ordering_mode ordering_mode not null default 'menu_only',
  reservation_enabled boolean not null default false,
  reservation_url text,
  offer jsonb,                              -- optional promo banner text, per-language
  menu_link_enabled boolean not null default true,
  whatsapp_number text,
  phone text,
  instagram_url text,
  website_url text,
  google_maps_url text,
  google_review_url text,
  plan_id text references plans(id) default 'vee_start',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index businesses_status_idx on businesses(status);

create table business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role business_role not null default 'staff',
  permissions jsonb not null default '[]',  -- array of permission strings for staff, e.g. ["menu.edit","orders.view"]
  invited_email citext,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(business_id, user_id)
);
create index business_members_user_idx on business_members(user_id);
create index business_members_business_idx on business_members(business_id);

create table locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name jsonb not null default '{}',
  address jsonb not null default '{}',
  hours jsonb not null default '{}',
  maps_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index locations_business_idx on locations(business_id);

create table profile_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null default 'custom',      -- 'fixed' | 'custom'
  icon text not null default 'link',
  label jsonb not null default '{}',
  url text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0
);
create index profile_links_business_idx on profile_links(business_id);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name jsonb not null default '{}',
  icon text not null default 'grid',
  visible boolean not null default true,
  scheduled_start time,                     -- optional daypart scheduling (e.g. breakfast menu)
  scheduled_end time,
  sort_order integer not null default 0
);
create index menu_categories_business_idx on menu_categories(business_id);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  price numeric(12,2) not null default 0,
  discount_price numeric(12,2),
  currency text not null default 'IQD',
  image_url text,
  gallery jsonb not null default '[]',      -- array of image urls
  tags text[] not null default '{}',        -- subset of popular|new|featured
  allergens jsonb not null default '[]',
  available boolean not null default true,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_business_idx on menu_items(business_id);
create index menu_items_category_idx on menu_items(category_id);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  type text not null default 'single',      -- 'single' | 'multi'
  name jsonb not null default '{}',
  choices jsonb not null default '[]',      -- [{ id, name: {en,ar,ku}, priceDelta }]
  sort_order integer not null default 0
);
create index product_options_menu_item_idx on product_options(menu_item_id);

create table nfc_devices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  serial citext not null unique,            -- printed/engraved on the physical unit for activation
  type device_type not null,
  status device_status not null default 'unassigned',
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
create index nfc_devices_business_idx on nfc_devices(business_id);
comment on table nfc_devices is 'Physical NFC/QR products. Always resolve to /:username (the Business Profile) — never to a fixed menu — so a business can change links/menu/ordering mode without replacing hardware.';

create table orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  items jsonb not null default '[]',        -- [{ menuItemId, quantity, selectedOptions, notes }]
  total numeric(12,2) not null default 0,
  status order_status not null default 'new',
  type order_type not null default 'whatsapp',
  customer_name text,
  table_number text,
  created_at timestamptz not null default now()
);
create index orders_business_idx on orders(business_id, created_at desc);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null,                       -- profile_view | nfc_tap | qr_scan | menu_view | product_view | whatsapp_click | ...
  metadata jsonb not null default '{}',
  session_locale locale,
  device_type text,                         -- mobile | tablet | desktop
  created_at timestamptz not null default now()
);
create index analytics_events_business_idx on analytics_events(business_id, created_at desc);
create index analytics_events_type_idx on analytics_events(business_id, type);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext,
  phone text,
  business_name text,
  message text,
  source text not null default 'contact_form',
  status lead_status not null default 'new',
  created_at timestamptz not null default now()
);

create table catalogue_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  category text not null default 'nfc',
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  features jsonb not null default '[]',
  specifications jsonb not null default '{}',
  price_iqd integer,                        -- null => "request a quote"
  request_quote boolean not null default false,
  images jsonb not null default '[]',
  colors jsonb not null default '[]',        -- e.g. ["black","white"]
  status product_status not null default 'draft',
  sort_order integer not null default 0,
  featured boolean not null default false,
  seo_title jsonb not null default '{}',
  seo_description jsonb not null default '{}',
  cta_type text not null default 'enquire',  -- 'enquire' | 'order' | 'quote'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table catalogue_products is 'Vee''s own product catalogue (NFC cards, acrylic stands, etc.) shown on the public marketing site — distinct from menu_items, which belong to individual businesses.';

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  plan_id text not null references plans(id),
  status text not null default 'trial',      -- trial | active | suspended | cancelled
  billing_cycle text not null default 'monthly',
  renews_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Feature flags — global / per-plan / per-business overrides
-- ---------------------------------------------------------------------------
create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                  -- e.g. 'public_profiles', 'online_ordering'
  label text not null,
  description text not null default '',
  scope flag_scope not null default 'global',
  default_value boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table feature_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references feature_flags(id) on delete cascade,
  scope_type text not null,                  -- 'plan' | 'business'
  scope_id text not null,                    -- plan_id or business_id (as text)
  value boolean not null,
  unique(flag_id, scope_type, scope_id)
);

create table feature_flag_audit_log (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid references feature_flags(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,                      -- 'created' | 'updated' | 'override_set' | 'override_removed'
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site CMS — homepage sections, nav, footer, FAQ, banners, legal pages —
-- editable by Super Admin without a code deploy.
-- ---------------------------------------------------------------------------
create table site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                  -- 'homepage.hero', 'faq.item.3', 'legal.privacy', ...
  type text not null,                        -- 'section' | 'faq' | 'banner' | 'page' | 'setting'
  content jsonb not null default '{}',       -- per-language rich content
  visible boolean not null default true,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  sort_order integer not null default 0,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table nav_menu_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references nav_menu_items(id) on delete cascade,
  label jsonb not null default '{}',
  url text not null,
  icon text,
  image_url text,
  open_new_tab boolean not null default false,
  placement text not null default 'both',    -- 'desktop' | 'mobile' | 'both'
  access_rule text not null default 'public',-- 'public' | 'authenticated' | 'business_owner' | 'vee_staff'
  visible boolean not null default true,
  sort_order integer not null default 0
);

create table translation_overrides (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  key text not null,
  locale locale not null,
  value text not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique(namespace, key, locale)
);
comment on table translation_overrides is 'Super Admin-editable overrides layered on top of the static EN/AR/KU dictionaries at runtime, so a copy fix never requires a deploy.';

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  requester_name text not null,
  requester_email citext not null,
  subject text not null,
  message text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'normal',
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_business_idx on support_tickets(business_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  business_id uuid references businesses(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,                      -- 'created' | 'updated' | 'deleted' | 'published' | ...
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_business_idx on audit_log(business_id, created_at desc);
create index audit_log_actor_idx on audit_log(actor_id, created_at desc);

-- updated_at maintenance trigger, applied to the tables that need it
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at before update on businesses
  for each row execute function set_updated_at();
create trigger menu_items_set_updated_at before update on menu_items
  for each row execute function set_updated_at();
create trigger catalogue_products_set_updated_at before update on catalogue_products
  for each row execute function set_updated_at();
create trigger support_tickets_set_updated_at before update on support_tickets
  for each row execute function set_updated_at();

-- New auth.users row => automatic profiles row
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce((new.raw_user_meta_data->>'locale')::locale, 'en'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
