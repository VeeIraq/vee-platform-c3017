-- Adds a location dimension to analytics_events (for the "filter by
-- location" requirement on the new Super Admin analytics screen) and
-- extends resolve_device() once more so an NFC/QR tap can log which
-- location/table it happened at, not just which business.
alter table analytics_events
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists analytics_events_location_idx on analytics_events(location_id);

drop function if exists resolve_device(text);

create function resolve_device(p_serial text)
returns table (
  username text,
  status device_status,
  table_number text,
  business_id uuid,
  device_type device_type,
  location_id uuid
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select b.username, d.status, d.table_number, d.business_id, d.type, d.location_id
  from nfc_devices d
  join businesses b on b.id = d.business_id
  where d.serial = p_serial
  limit 1;
$$;

comment on function resolve_device(text) is
  'Public-callable device-tap resolver. Bypasses RLS internally (security definer) but returns only username/status/table_number/business_id/device_type/location_id for one exact serial match -- never exposes the nfc_devices table for listing.';

grant execute on function resolve_device(text) to anon, authenticated;
