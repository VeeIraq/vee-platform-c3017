-- WhatsApp ordering (the cart -> wa.me checkout handoff on the public
-- digital menu) has been removed from the app: the menu is browse-only
-- now (see app/[username]/menu/menu-experience.tsx). The "whatsapp_ordering"
-- feature flag no longer gates anything in code, so drop it -- and any
-- per-plan/per-business overrides pointing at it -- rather than leaving a
-- dead toggle in Super Admin > Feature flags.
delete from feature_flag_overrides
where flag_id in (select id from feature_flags where key = 'whatsapp_ordering');

delete from feature_flags where key = 'whatsapp_ordering';
