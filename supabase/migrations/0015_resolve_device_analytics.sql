-- Extends resolve_device() to also return business_id and the device's
-- type, so the /d/[serial] redirect page can log an nfc_tap or qr_scan
-- analytics event (business_id is required by analytics_events, and the
-- device type -- 'qr_only' vs everything else -- decides which of the two
-- event types this particular tap/scan counts as) without a second,
-- separately-RLS'd query against nfc_devices.
--
-- Still returns nothing else -- no serial listing, no other device
-- columns -- so this stays exactly as narrow as the original function.
--
-- Postgres won't let CREATE OR REPLACE change an existing function's
-- return type, so the old 3-column version from 0013 has to be dropped
-- first.
drop function if exists resolve_device(text);

create function resolve_device(p_serial text)
returns table (username text, status device_status, table_number text, business_id uuid, device_type device_type)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select b.username, d.status, d.table_number, d.business_id, d.type
  from nfc_devices d
  join businesses b on b.id = d.business_id
  where d.serial = p_serial
  limit 1;
$$;

comment on function resolve_device(text) is
  'Public-callable device-tap resolver. Bypasses RLS internally (security definer) but returns only username/status/table_number/business_id/device_type for one exact serial match -- never exposes the nfc_devices table for listing.';

grant execute on function resolve_device(text) to anon, authenticated;
