-- =====================================================================
-- 0020_review_pages.sql
-- =====================================================================
-- Optional, per-business custom review/feedback page (distinct from the
-- existing businesses.google_review_url external link): a business owner
-- can enable it, customize its title/intro/questions, and each question
-- always collects a star rating (1-5) plus one optional free-text comment
-- per submission.
--
-- review_submissions carries no reviewer identity at all (no name/email
-- was asked for) -- it is anonymous by design, so there is no PII to leak.
-- It is never publicly SELECT-able (same "never public" precedent as
-- orders/nfc_devices in 0003_helpers_and_rls.sql) -- only the business's
-- own members (with the reviews.manage permission, or the owner) and Vee
-- staff can read results. Anonymous INSERT is allowed via a normal RLS
-- policy (like the existing `leads` table) because, unlike likes, a
-- fabricated review is a single inspectable/moderatable row rather than a
-- silently-inflated counter -- the write path in
-- lib/actions/reviews.ts additionally rate-limits and rejects a repeat
-- submission from the same anonymous visitor within a cooldown window.
-- =====================================================================

create table review_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  enabled boolean not null default false,
  title jsonb not null default '{}',
  intro jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table review_pages is 'Per-business custom review/feedback page config. One row per business, created on first save from the dashboard. enabled controls whether /:username/reviews is reachable and whether the "Reviews" link shows on the profile.';

create table review_questions (
  id uuid primary key default gen_random_uuid(),
  review_page_id uuid not null references review_pages(id) on delete cascade,
  prompt jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index review_questions_page_idx on review_questions(review_page_id);
comment on table review_questions is 'Ordered list of star-rating questions on a business''s review page. Every question is a 1-5 star rating (no separate "type" column -- that is the only kind of question this feature collects, per the product requirement).';

create table review_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_page_id uuid not null references review_pages(id) on delete cascade,
  ratings jsonb not null default '{}',
  average_rating numeric(3,2) not null,
  comment text,
  status text not null default 'published',
  submitter_hash text not null,
  created_at timestamptz not null default now(),
  constraint review_submissions_status_check check (status in ('published', 'hidden')),
  constraint review_submissions_average_rating_check check (average_rating >= 1 and average_rating <= 5)
);
create index review_submissions_business_idx on review_submissions(business_id, created_at desc);
create index review_submissions_page_idx on review_submissions(review_page_id);
create index review_submissions_submitter_idx on review_submissions(review_page_id, submitter_hash, created_at desc);
comment on table review_submissions is 'One customer''s anonymous submission: ratings is {question_id: 1-5, ...}, average_rating is the precomputed mean for fast aggregate queries, comment is optional free text, status is the moderation flag (published/hidden). No reviewer identity is collected. submitter_hash (sha256 of an httpOnly per-visitor cookie + business_id) is used only to reject an obvious repeat submission within a short cooldown -- see lib/actions/reviews.ts -- never displayed or exported.';

alter table review_pages enable row level security;
alter table review_questions enable row level security;
alter table review_submissions enable row level security;

-- review_pages
create policy "public reads enabled review pages" on review_pages for select
  using ((enabled and exists (select 1 from businesses b where b.id = business_id and b.status = 'published'))
         or has_business_permission(business_id, 'reviews.manage') or is_vee_staff());
create policy "members manage review page" on review_pages for all
  using (has_business_permission(business_id, 'reviews.manage') or is_vee_staff())
  with check (has_business_permission(business_id, 'reviews.manage') or is_vee_staff());

-- review_questions (scoped through the parent review_page's business, same
-- shape as product_options through menu_items)
create policy "public reads questions of enabled pages" on review_questions for select
  using (
    exists (
      select 1 from review_pages rp join businesses b on b.id = rp.business_id
      where rp.id = review_page_id and rp.enabled and b.status = 'published'
    )
    or exists (
      select 1 from review_pages rp where rp.id = review_page_id and (has_business_permission(rp.business_id, 'reviews.manage') or is_vee_staff())
    )
  );
create policy "members write questions" on review_questions for all
  using (exists (select 1 from review_pages rp where rp.id = review_page_id and (has_business_permission(rp.business_id, 'reviews.manage') or is_vee_staff())))
  with check (exists (select 1 from review_pages rp where rp.id = review_page_id and (has_business_permission(rp.business_id, 'reviews.manage') or is_vee_staff())));

-- review_submissions -- never publicly readable; anonymous insert allowed
-- only for an enabled page on a published business.
create policy "anyone can submit a review for an enabled page" on review_submissions for insert
  with check (
    exists (
      select 1 from review_pages rp join businesses b on b.id = rp.business_id
      where rp.id = review_page_id and rp.enabled and b.status = 'published' and b.id = business_id
    )
  );
create policy "members read own business reviews" on review_submissions for select
  using (has_business_permission(business_id, 'reviews.manage') or is_vee_staff());
create policy "members moderate own business reviews" on review_submissions for update
  using (has_business_permission(business_id, 'reviews.manage') or is_vee_staff())
  with check (has_business_permission(business_id, 'reviews.manage') or is_vee_staff());

create trigger review_pages_set_updated_at before update on review_pages
  for each row execute function set_updated_at();

insert into feature_flags (key, label, description, scope, default_value)
values ('custom_reviews', 'Custom business review page', 'Optional per-business review/feedback page at /:username/reviews', 'global', true)
on conflict (key) do nothing;
