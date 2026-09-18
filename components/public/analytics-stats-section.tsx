import Image from "next/image";
import { Link } from "next-view-transitions";
import { Reveal } from "@/components/public/reveal";

// Illustrative example figures for the marketing page -- not live data for
// any real business. Kept as plain digits (not locale-formatted) to match
// how the reference design renders them across all three languages.
const STATS: [string, number][] = [
  ["profileVisits", 2458],
  ["menuViews", 1842],
  ["whatsappClicks", 624],
  ["nfcTaps", 318],
  ["orders", 142],
];

export function AnalyticsStatsSection({
  eyebrow,
  title,
  desc,
  cta,
  kpiLabels,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  kpiLabels: Record<string, string>;
}) {
  return (
    <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <Image src="/brand/vee-logo-white.png" alt="Vee" width={96} height={33} className="mx-auto mb-6" />
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gold">{eyebrow}</p>
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-paper-muted">{desc}</p>

        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATS.map(([key, value], i) => (
            <Reveal key={key} delayMs={i * 60}>
              <div className="flex h-full flex-col items-center gap-1 rounded-[var(--radius-md)] border border-white/10 bg-ink-soft px-3 py-5">
                <dt className="order-2 mt-1 text-xs font-semibold text-gold">{kpiLabels[key]}</dt>
                <dd className="order-1 text-2xl font-extrabold text-white sm:text-3xl">{value.toLocaleString("en-US")}</dd>
              </div>
            </Reveal>
          ))}
        </dl>

        <Link
          href="/dashboard/analytics"
          className="mt-8 inline-block min-h-11 rounded-[var(--radius-sm)] border border-white/40 px-5 py-3 font-bold text-white hover:border-white hover:bg-white/10"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
