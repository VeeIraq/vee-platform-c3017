-- ============================================================================
-- Vee platform — 0005: storage buckets + policies
-- Two public-read buckets, both restricted to image mime types and a 5MB
-- cap at the bucket level (belt-and-suspenders with the app-layer checks in
-- lib/storage/upload.ts). Write access is enforced per-path via RLS on
-- storage.objects, never left to the client alone.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('business-media', 'business-media', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif']),
  ('platform-media', 'platform-media', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do nothing;

-- business-media: path convention `<business_id>/<logo|cover|menu>/<filename>`
-- so the first path segment IS the business_id and can be checked directly.
create policy "public reads business media" on storage.objects for select
  using (bucket_id = 'business-media');

create policy "members upload their business media" on storage.objects for insert
  with check (
    bucket_id = 'business-media'
    and (
      is_vee_staff()
      or has_business_permission((storage.foldername(name))[1]::uuid, 'media.upload')
    )
  );

create policy "members update their business media" on storage.objects for update
  using (
    bucket_id = 'business-media'
    and (is_vee_staff() or has_business_permission((storage.foldername(name))[1]::uuid, 'media.upload'))
  );

create policy "members delete their business media" on storage.objects for delete
  using (
    bucket_id = 'business-media'
    and (is_vee_staff() or has_business_permission((storage.foldername(name))[1]::uuid, 'media.upload'))
  );

-- platform-media: Vee catalogue/site imagery — staff-only writes
create policy "public reads platform media" on storage.objects for select
  using (bucket_id = 'platform-media');

create policy "staff manage platform media" on storage.objects for all
  using (bucket_id = 'platform-media' and is_vee_staff())
  with check (bucket_id = 'platform-media' and is_vee_staff());
