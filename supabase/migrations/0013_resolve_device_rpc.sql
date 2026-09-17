-- =====================================================================
-- 0013_resolve_device_rpc.sql
-- =====================================================================
-- nfc_devices is intentionally never publicly readable (see its RLS
-- policies in 0003_helpers_and_rls.sql: only staff, or a business's own
-- members, can SELECT from it) -- it's internal inventory, not something
-- an anonymous visitor should be able to list or enumerate.
--
-- But an anonymous customer tapping an NFC product or scanning its QR
-- code IS an anonymous visitor, and that tap has to resolve to the
-- business's profile URL. Rather than weakening nfc_devices' RLS with a
-- public SELECT policy (which would let anyone enumerate every serial /
-- business pairing in the table), this adds a narrow SECURITY DEFINER
-- function that looks up exactly one device by its exact serial and
-- returns only the 3 fields a redirect needs -- no listing, no other
-- columns, no way to browse the table through it.
-- =====================================================================

create or replace function resolve_device(p_serial text)
returns table (username text, status device_status, table_number text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select b.username, d.status, d.table_number
  from nfc_devices d
  join businesses b on b.id = d.business_id
  where d.serial = p_serial
  limit 1;
$$;

comment on function resolve_device(text) is
  'Public-callable device-tap resolver. Bypasses RLS internally (security definer) but returns only username/status/table_number for one exact serial match -- never exposes the nfc_devices table for listing.';

grant execute on function resolve_device(text) to anon, authenticated;
