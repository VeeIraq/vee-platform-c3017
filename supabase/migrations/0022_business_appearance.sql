-- =====================================================================
-- 0022_business_appearance.sql
-- =====================================================================
-- Lets a business owner pick a colour theme for their own public profile
-- (app/[username]) and hide individual profile sections/links without
-- deleting the underlying data (e.g. temporarily hiding "Call" while
-- keeping the phone number saved). Both are plain columns on `businesses`,
-- so the existing "owner updates own business" RLS policy from
-- 0003_helpers_and_rls.sql (has_business_permission(id, 'profile.edit'))
-- already covers writes -- no new policy needed.
--
-- Self-contained: no dependency on 0018-0020.
-- =====================================================================

alter table businesses
  add column if not exists theme_preset text not null default 'vee',
  add column if not exists profile_sections jsonb not null default '{
    "offer": true,
    "menu": true,
    "whatsapp": true,
    "instagram": true,
    "maps": true,
    "reviews": true,
    "call": true,
    "website": true,
    "reservation": true,
    "customReview": true,
    "customLinks": true
  }'::jsonb;

comment on column businesses.theme_preset is
  'Public-profile colour preset, chosen by the owner in Dashboard > Profile > Appearance. One of: vee, midnight, ocean, sunset. Unknown values fall back to "vee" in app code.';
comment on column businesses.profile_sections is
  'Per-section show/hide flags for the owner''s own public profile (app/[username]). Independent of feature-flag availability (lib/data/feature-flags.ts) -- a section can be available on the plan but still hidden here, and vice versa a disabled feature always stays hidden regardless of this flag.';
