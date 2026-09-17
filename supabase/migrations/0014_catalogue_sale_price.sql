-- Adds a sale/discount price and a currency code to Vee's own product
-- catalogue, so Super Admin can run a promotion on a hardware product the
-- same way business owners already can on a menu item (see menu_items.
-- discount_price). price_iqd stays the "regular" price; when
-- discount_price_iqd is set, the public Products pages show it as the
-- active price with the regular price struck through.
alter table catalogue_products
  add column if not exists discount_price_iqd integer,
  add column if not exists currency text not null default 'IQD';

comment on column catalogue_products.discount_price_iqd is 'Optional sale price in the same currency as price_iqd; when set, this is the price shown and price_iqd is struck through.';
comment on column catalogue_products.currency is 'ISO-ish currency code for price_iqd/discount_price_iqd. Every existing row is IQD; the platform is IQD-only today but this keeps the schema ready for more.';
