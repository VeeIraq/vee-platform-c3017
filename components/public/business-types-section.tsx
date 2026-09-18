import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/public/reveal";
import { CONTENT } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/config";

export function BusinessTypesSection({ eyebrow, title, locale }: { eyebrow: string; title: string; locale: Locale }) {
  const items = CONTENT.BUSINESS_TYPE_ITEMS as Array<{
    id: string;
    icon: string;
    name: Record<string, string>;
    desc: Record<string, string>;
  }>;

  return (
    <section className="bg-fog px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{eyebrow}</p>
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-ink">{title}</h2>
        <ul className="mt-10 grid gap-4 text-start sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} as="li" delayMs={(i % 4) * 60}>
              <div className="hover-lift flex h-full flex-col items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-5 text-center shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fog-2 text-accent">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-ink">{pick(item.name, locale)}</h3>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
