-- =====================================================================
-- 0018_menu_likes.sql
-- =====================================================================
-- Anonymous, account-less "like" a customer can give a menu item, with a
-- per-business on/off switch (businesses.likes_enabled) plus a matching
-- global feature flag (menu_likes) so Super Admin retains a platform-wide
-- kill switch, exactly like reservations/google_reviews/etc.
--
-- Anti-abuse design (see lib/actions/likes.ts for the write path):
--   - menu_item_likes has NO insert/update/delete RLS policy for anon or
--     authenticated at all. That is deliberate, not an oversight: the anon
--     key is public (shipped in the frontend bundle), so any RLS policy
--     that let anon write directly would let a script bypass our
--     application-level de-dup/rate-limit logic entirely and inflate a
--     count with a raw REST call. Writes only ever happen through the
--     service-role client from inside the toggleMenuItemLike Server
--     Action, which is the one place the de-dup hash and IP rate limit are
--     enforced. This mirrors the documented justification pattern for
--     service-role use in lib/supabase/server.ts.
--   - "liker_hash" is sha256(an httpOnly random per-visitor cookie value
--     + ':' + business_id), computed in Node -- never a raw IP, and never
--     reversible back to anything identifying. One browser can like a
--     given item at most once (enforced by the unique index below); the
--     same hash is reused across every item of that business so a visitor
--     can still like several different items.
--   - Counts are only ever exposed through get_menu_item_likes() below, a
--     narrow SECURITY DEFINER function returning aggregates (and whether
--     the caller's own hash liked each item) -- never raw rows -- the same
--     "narrow RPC, never broaden RLS" pattern resolve_device() established
--     in 0013_resolve_device_rpc.sql.
-- =====================================================================

alter table businesses add column if not exists likes_enabled boolean not null default false;
comment on column businesses.likes_enabled is 'Business owner''s own on/off switch for the public menu like/favourite button, independent of the global menu_likes feature flag.';

create table menu_item_likes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  liker_hash text not null,
  created_at timestamptz not null default now(),
  unique (menu_item_id, liker_hash)
);
create index menu_item_likes_item_idx on menu_item_likes(menu_item_id);
create index menu_item_likes_business_idx on menu_item_likes(business_id);
comment on table menu_item_likes is 'One row per (anonymous visitor, menu item) like. liker_hash is sha256(httpOnly cookie + business_id) -- never PII, never a raw IP. No RLS write policy for anon/authenticated: only the service-role client (from the toggleMenuItemLike Server Action) writes here, so a direct REST call with the public anon key cannot manipulate counts.';

alter table menu_item_likes enable row level security;
-- Deliberately no insert/update/delete policy for anon/authenticated -- see
-- the header comment. Staff can read raw rows for moderation/debugging.
create policy "staff read likes" on menu_item_likes for select using (is_vee_staff());

-- ---------------------------------------------------------------------
-- Public-callable aggregate reader. Returns counts (and, when a caller
-- passes their own liker_hash, whether that hash already liked each item)
-- for every item of a business -- never a raw row, never another
-- visitor's identity.
-- ---------------------------------------------------------------------
create or replace function get_menu_item_likes(p_business_id uuid, p_liker_hash text default null)
returns table (menu_item_id uuid, like_count bigint, liked_by_caller boolean)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select mi.id,
         count(l.id) as like_count,
         coalesce(bool_or(l.liker_hash = p_liker_hash), false) as liked_by_caller
  from menu_items mi
  left join menu_item_likes l on l.menu_item_id = mi.id
  where mi.business_id = p_business_id
  group by mi.id;
$$;
comment on function get_menu_item_likes(uuid, text) is 'Public-callable like-count reader for one business''s menu items. Bypasses RLS internally (security definer) but returns only aggregate counts and a boolean for the caller''s own hash -- never another visitor''s liker_hash or any other row data.';
grant execute on function get_menu_item_likes(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Global feature flag -- platform-wide kill switch, on top of each
-- business's own likes_enabled toggle, matching every other feature.
-- ---------------------------------------------------------------------
insert into feature_flags (key, label, description, scope, default_value)
values ('menu_likes', 'Menu item likes', 'Anonymous like/favourite button on public digital menu items', 'global', true)
on conflict (key) do nothing;
