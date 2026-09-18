-- =====================================================================
-- 0021_homepage_sections_v2.sql
-- =====================================================================
-- Adds three new homepage sections (digital-menu teaser, business-types
-- grid, analytics stat row) that render the menuTeaser / businessTypesSection
-- / analyticsTeaser copy already present in lib/i18n/dictionaries/*.json
-- (ported from the original static site but never wired to a homepage
-- section) -- see app/(marketing)/page.tsx.
--
-- Self-contained: only touches site_content homepage.* rows, no dependency
-- on 0018-0020 (menu_likes / menu_item_labels / review_pages).
--
-- Existing installs already have the 8 original homepage.* rows from
-- 0010_cms_seed.sql, so the 3 new sections are inserted AND every row's
-- sort_order is explicitly reset to the new intended order below --
-- an insert-only migration would add the new sections but leave the
-- old ones in their old (now wrong) order.
-- =====================================================================

insert into site_content (key, type, content, visible, sort_order) values ('homepage.digitalMenu', 'section', '{}'::jsonb, true, 2) on conflict (key) do nothing;
insert into site_content (key, type, content, visible, sort_order) values ('homepage.businessTypes', 'section', '{}'::jsonb, true, 4) on conflict (key) do nothing;
insert into site_content (key, type, content, visible, sort_order) values ('homepage.analyticsStats', 'section', '{}'::jsonb, true, 8) on conflict (key) do nothing;

update site_content set sort_order = 0 where key = 'homepage.hero';
update site_content set sort_order = 1 where key = 'homepage.explain';
update site_content set sort_order = 2 where key = 'homepage.digitalMenu';
update site_content set sort_order = 3 where key = 'homepage.why';
update site_content set sort_order = 4 where key = 'homepage.businessTypes';
update site_content set sort_order = 5 where key = 'homepage.products';
update site_content set sort_order = 6 where key = 'homepage.how';
update site_content set sort_order = 7 where key = 'homepage.plans';
update site_content set sort_order = 8 where key = 'homepage.analyticsStats';
update site_content set sort_order = 9 where key = 'homepage.faq';
update site_content set sort_order = 10 where key = 'homepage.contact';
