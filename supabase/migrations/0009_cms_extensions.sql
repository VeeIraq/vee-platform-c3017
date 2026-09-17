-- =====================================================================
-- 0009_cms_extensions.sql
-- =====================================================================
-- Extends the CMS schema (site_content / nav_menu_items / translation_overrides
-- from 0002_core_tables.sql) so Super Admin can actually manage: homepage
-- section visibility/order, header + footer navigation links, and pricing
-- display fields that the marketing homepage already expects (popular
-- badge, per-plan CTA text, setup price) but the `plans` table didn't yet
-- have columns for.
--
-- These three tables were defined with full RLS in 0002/0003 but were never
-- wired up on the read side and never seeded -- this migration is what
-- turns them from dormant schema into a real, working CMS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- plans: add the display fields the homepage pricing section needs
-- ---------------------------------------------------------------------
alter table plans add column if not exists setup_price_iqd integer;
alter table plans add column if not exists popular boolean not null default false;
alter table plans add column if not exists cta jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- nav_menu_items: distinguish header vs footer placement, and which
-- footer column ("Solutions" / "Company" / "Legal") a footer link sits in
-- ---------------------------------------------------------------------
alter table nav_menu_items add column if not exists location text not null default 'header';
alter table nav_menu_items add constraint nav_menu_items_location_check
  check (location in ('header', 'footer'));
alter table nav_menu_items add column if not exists footer_group text;
alter table nav_menu_items add constraint nav_menu_items_footer_group_check
  check (footer_group is null or footer_group in ('solutions', 'company', 'legal'));

-- ---------------------------------------------------------------------
-- updated_at triggers -- every other editable table gets one, these two
-- were missed when they were first created
-- ---------------------------------------------------------------------
drop trigger if exists site_content_set_updated_at on site_content;
create trigger site_content_set_updated_at
  before update on site_content
  for each row execute function set_updated_at();

drop trigger if exists translation_overrides_set_updated_at on translation_overrides;
create trigger translation_overrides_set_updated_at
  before update on translation_overrides
  for each row execute function set_updated_at();

comment on column nav_menu_items.location is 'header (primary site nav) or footer (footer link columns)';
comment on column nav_menu_items.footer_group is 'Which footer column this link sits in, when location = footer. Group headings themselves stay translation-driven (footer.solutions / footer.company / footer.legal).';
comment on column plans.popular is 'Show the "Most popular" badge on the marketing pricing section for this plan.';
comment on column plans.cta is 'Per-language button text for this plan on the marketing pricing section, e.g. {"en":"Choose Business",...}. Falls back to the generic nav.cta string when empty.';
comment on column plans.setup_price_iqd is 'One-time setup fee in IQD, shown alongside the recurring price_iqd. Null = no setup fee shown.';
