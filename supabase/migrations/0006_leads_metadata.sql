-- ============================================================================
-- Vee platform — 0006: leads.metadata
-- The public contact form (see contact.form* strings in the ported i18n
-- dictionary) collects more than the base leads columns — business type,
-- WhatsApp number, Instagram handle, branch count, plan interest, and
-- preferred language. Kept as flexible jsonb rather than more columns since
-- this is sales-intake data the Super Admin views as a whole, not queried
-- column-by-column.
-- ============================================================================
alter table leads add column if not exists metadata jsonb not null default '{}';
