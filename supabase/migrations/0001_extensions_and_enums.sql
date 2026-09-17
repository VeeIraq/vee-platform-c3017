-- ============================================================================
-- Vee platform — 0001: extensions & enums
-- ============================================================================
create extension if not exists "pgcrypto";     -- gen_random_uuid()
create extension if not exists "citext";       -- case-insensitive usernames/emails

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type business_role as enum ('owner', 'staff');
create type internal_role as enum ('super_admin', 'support', 'content_editor', 'sales');
create type business_status as enum ('draft', 'published', 'suspended');
create type ordering_mode as enum ('menu_only', 'whatsapp', 'online', 'table');
create type order_status as enum ('new', 'preparing', 'completed', 'cancelled');
create type order_type as enum ('whatsapp', 'table', 'online');
create type device_type as enum ('acrylic_stand', 'flat_tag', 'tissue_box', 'tent_stand', 'steel_stand', 'nfc_card', 'qr_only');
create type device_status as enum ('unassigned', 'active', 'inactive');
create type product_status as enum ('draft', 'published', 'hidden', 'out_of_stock');
create type lead_status as enum ('new', 'contacted', 'qualified', 'closed');
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type flag_scope as enum ('global', 'plan', 'business');
create type locale as enum ('en', 'ar', 'ku');
