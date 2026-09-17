import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { SectionsManager } from "./sections-manager";
import { FaqManager } from "./faq-manager";
import { SeoForm } from "./seo-form";

export default async function AdminContentPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const [{ data: sectionRows }, { data: faqRows }, { data: seoRow }] = await Promise.all([
    supabase.from("site_content").select("key, visible, sort_order").eq("type", "section").order("sort_order"),
    supabase.from("site_content").select("key, content, visible, sort_order").eq("type", "faq").order("sort_order"),
    supabase.from("site_content").select("content").eq("key", "seo.home").eq("type", "page").maybeSingle(),
  ]);

  const sections = (sectionRows ?? []).map((r) => ({
    key: r.key.replace(/^homepage\./, ""),
    visible: r.visible,
    sortOrder: r.sort_order,
  }));

  const faqItems = (faqRows ?? []).map((r) => {
    const content = r.content as { q?: { en?: string; ar?: string; ku?: string }; a?: { en?: string; ar?: string; ku?: string } };
    return {
      key: r.key,
      visible: r.visible,
      sortOrder: r.sort_order,
      q: { en: content.q?.en ?? "", ar: content.q?.ar ?? "", ku: content.q?.ku ?? "" },
      a: { en: content.a?.en ?? "", ar: content.a?.ar ?? "", ku: content.a?.ku ?? "" },
    };
  });

  const seoContent = (seoRow?.content ?? {}) as {
    title?: { en?: string; ar?: string; ku?: string };
    description?: { en?: string; ar?: string; ku?: string };
  };
  const seo = {
    title: { en: seoContent.title?.en ?? "", ar: seoContent.title?.ar ?? "", ku: seoContent.title?.ku ?? "" },
    description: { en: seoContent.description?.en ?? "", ar: seoContent.description?.ar ?? "", ku: seoContent.description?.ku ?? "" },
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-extrabold text-ink">Homepage content</h1>
            <p className="text-sm text-ink-muted">
              Show, hide and reorder homepage sections. Section copy itself is edited in Translations — this only
              controls whether a section appears and where.
            </p>
          </div>
          <a
            href="/?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink-soft hover:bg-fog"
          >
            Preview site (shows drafts) ↗
          </a>
        </div>
        <SectionsManager sections={sections} />
      </div>

      <div>
        <h2 className="mb-1 text-xl font-extrabold text-ink">FAQ</h2>
        <p className="mb-4 text-sm text-ink-muted">Add, edit, reorder, show or hide questions shown on the homepage FAQ section.</p>
        <FaqManager items={faqItems} />
      </div>

      <div>
        <h2 className="mb-1 text-xl font-extrabold text-ink">Homepage SEO</h2>
        <p className="mb-4 text-sm text-ink-muted">The page title and description search engines and link previews show.</p>
        <SeoForm seo={seo} />
      </div>
    </div>
  );
}
