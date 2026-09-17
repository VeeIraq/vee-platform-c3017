-- =====================================================================
-- 0011_fix_nav_menu_duplicates.sql
-- =====================================================================
-- Fixes accidental triplication of nav_menu_items rows caused by the
-- Supabase SQL editor's "Run" button appearing unresponsive during the
-- 0010_cms_seed.sql apply, which led to it being clicked/retried and the
-- insert statements executing 3 times. The nav_menu_items inserts in
-- 0010 had no "on conflict" guard (unlike the site_content inserts),
-- so each of the 12 real nav rows (5 header + 7 footer) ended up
-- stored 3 times (36 rows total instead of 12).
--
-- This migration is intentionally separate from 0010 (already applied
-- migrations are not edited/rewritten). It is self-verifying: every
-- assumption about the current bad state is asserted before anything
-- is deleted, and the whole fix aborts with no changes made if any
-- assertion fails.
--
-- Also adds a unique index so this class of duplication can never
-- happen again, and documents the upsert pattern future CMS seed
-- migrations should use against that index.
--
-- Note: an earlier version of this migration used min(id) to pick the
-- row to keep per duplicate group. That failed with
-- "function min(uuid) does not exist" -- Postgres has no built-in
-- min()/max() aggregate for the uuid type, even though uuid supports
-- ordering comparisons. Fixed by using row_number() instead, which
-- works for any orderable type. That failed attempt made no changes
-- (the error was raised before the delete ran, so the transaction/DO
-- block made zero modifications) -- confirmed by re-checking the row
-- count was still 36 immediately afterward.
-- =====================================================================

do $$
declare
  total_before    int;
  distinct_before int;
  dup_count       int;
  total_after     int;
  header_after    int;
  footer_after    int;
begin
  -- Step 1/2: capture and assert the exact pre-cleanup state.
  select count(*) into total_before from nav_menu_items;

  select count(*) into distinct_before
  from (
    select 1
    from nav_menu_items
    group by label, url, location, coalesce(footer_group, '')
  ) g;

  dup_count := total_before - distinct_before;

  raise notice 'Preview: total_rows_before=%, distinct_combinations=%, duplicate_rows=%',
    total_before, distinct_before, dup_count;

  if total_before <> 36 then
    raise exception 'Aborting: expected 36 nav_menu_items rows before cleanup, found %', total_before;
  end if;

  if dup_count <> 24 then
    raise exception 'Aborting: expected exactly 24 duplicate rows, found %', dup_count;
  end if;

  -- Step 3: delete only the repeated copies, keeping the earliest-inserted
  -- row (lowest id, via row_number() -- uuid has no min()/max() aggregate)
  -- for every unique (label, url, location, footer_group).
  delete from nav_menu_items
  where id in (
    select id
    from (
      select id,
             row_number() over (
               partition by label, url, location, coalesce(footer_group, '')
               order by id
             ) as rn
      from nav_menu_items
    ) ranked
    where rn > 1
  );

  -- Step 4: assert the exact post-cleanup state.
  select count(*) into total_after  from nav_menu_items;
  select count(*) into header_after from nav_menu_items where location = 'header';
  select count(*) into footer_after from nav_menu_items where location = 'footer';

  if total_after <> 12 or header_after <> 5 or footer_after <> 7 then
    raise exception
      'Aborting: post-cleanup counts wrong (expected total=12, header=5, footer=7), got total=%, header=%, footer=%',
      total_after, header_after, footer_after;
  end if;

  raise notice 'Cleanup successful: total_before=%, duplicates_removed=%, total_after=%, header=%, footer=%',
    total_before, dup_count, total_after, header_after, footer_after;
end $$;

-- Step 5: prevent this from ever happening again. NULL footer_group
-- (header rows) is normalized to '' via coalesce so header rows are
-- also protected -- Postgres unique indexes otherwise treat NULLs as
-- distinct from each other, which would let header duplicates back in.
create unique index if not exists nav_menu_items_unique_item_idx
  on nav_menu_items (label, url, location, (coalesce(footer_group, '')));

-- Step 6: future CMS seed/data migrations that insert into
-- nav_menu_items should use this index as an upsert conflict target,
-- e.g.:
--
--   insert into nav_menu_items (label, url, placement, access_rule, location, footer_group, visible, sort_order)
--   values (...)
--   on conflict (label, url, location, (coalesce(footer_group, '')))
--   do nothing;
--
-- This makes re-running (or accidentally re-running) a seed migration
-- safe: it will insert missing rows once and silently skip rows that
-- already exist, instead of duplicating them.
