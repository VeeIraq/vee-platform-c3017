-- =====================================================================
-- 0012_nfc_device_table_number.sql
-- =====================================================================
-- Adds an optional table_number to nfc_devices so a device can be
-- assigned not just to a business + location, but to a specific table
-- within that location (dine-in ordering mode). Nullable: most device
-- types (flat tags on products, profile cards, etc.) never set it.
--
-- No RLS changes needed -- the existing policies on nfc_devices already
-- cover this column since they're not column-scoped.
-- =====================================================================

alter table nfc_devices add column if not exists table_number text;

comment on column nfc_devices.table_number is
  'Optional table/seat label for a dine-in device. The device itself still always resolves to the business profile URL (/:username), never a fixed menu URL -- ordering flows read this column to pre-select a table, not to change the redirect target.';
