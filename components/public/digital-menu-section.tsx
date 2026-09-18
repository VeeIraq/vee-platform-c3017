import { Search, Tag, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/public/reveal";

/**
 * Marketing-only phone mockup -- static example content (fictional "Vee
 * Café" menu), not a live business. Matches the digital-menu teaser
 * screenshot: phone frame on one side, copy + feature bullets + a
 * Tap→Open→Explore→Order→Review journey strip on the other.
 */
export function DigitalMenuSection({
  eyebrow,
  title,
  desc,
  points,
  journey,
  cta,
  demoHref,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  points: [string, string, string];
  journey: [string, string, string, string, string];
  cta: string;
  demoHref: string;
}) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <PhoneMockup />
        </Reveal>

        <Reveal delayMs={100}>
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{eyebrow}</p>
          <h2 className="text-3xl font-extrabold text-ink">{title}</h2>
          <p className="mt-4 text-ink-muted">{desc}</p>

          <ul className="mt-6 flex flex-col gap-3">
            {[
              { Icon: Search, text: points[0] },
              { Icon: Tag, text: points[1] },
              { Icon: MessageCircle, text: points[2] },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-ink-soft">
                <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label={eyebrow}>
            {journey.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-bold text-ink">{step}</span>
                {i < journey.length - 1 && (
                  <span aria-hidden="true" className="text-ink-muted">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>

          <a href={demoHref} className="mt-6 inline-block min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-5 py-3 font-bold text-ink hover:border-ink">
            {cta}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * A realistic iPhone Pro Max-style frame (Dynamic Island, status bar, side
 * buttons, home indicator) rather than a generic rounded rectangle --
 * purely a CSS/SVG mockup, no device photo/trademarked asset involved.
 */
function PhoneMockup() {
  return (
    <div className="mx-auto flex max-w-sm items-center justify-center rounded-[28px] border border-line bg-fog p-8">
      <div className="relative w-[260px] rounded-[62px] border-[14px] border-ink bg-ink shadow-2xl" style={{ aspectRatio: "1290 / 2796" }}>
        {/* Side buttons -- protrude slightly past the bezel for a real-device feel. */}
        <span aria-hidden="true" className="absolute -left-[17px] top-[92px] h-7 w-[3px] rounded-full bg-ink-2" />
        <span aria-hidden="true" className="absolute -left-[17px] top-[130px] h-12 w-[3px] rounded-full bg-ink-2" />
        <span aria-hidden="true" className="absolute -left-[17px] top-[190px] h-12 w-[3px] rounded-full bg-ink-2" />
        <span aria-hidden="true" className="absolute -right-[17px] top-[150px] h-16 w-[3px] rounded-full bg-ink-2" />

        <div className="relative h-full w-full overflow-hidden rounded-[48px] bg-paper">
          {/* Dynamic Island */}
          <span aria-hidden="true" className="absolute inset-x-0 top-3 z-20 mx-auto h-7 w-28 rounded-full bg-ink" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pb-1 pt-4 text-[11px] font-bold text-ink">
            <span>9:41</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="block h-[7px] w-[13px] rounded-[1px] border border-ink" />
              <span className="block h-[7px] w-[7px] rounded-full border border-ink" />
              <span className="block h-[10px] w-[18px] rounded-[2px] border border-ink p-px">
                <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
            <div className="flex flex-col items-center gap-1.5 border-b border-line pb-3 text-center">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full [background:var(--accent-grad)] text-white">
                🛒
              </span>
              <p className="text-sm font-extrabold text-ink">Vee Café — Menu</p>
              <p className="text-xs text-ink-muted">3 items in cart</p>
            </div>
            {[
              ["🍵", "Cold Brew", "4,800 IQD"],
              ["🍔", "Vee Smash Burger", "15,000 IQD"],
              ["🍮", "Tiramisu", "7,000 IQD"],
            ].map(([emoji, name, price]) => (
              <div key={name} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-fog px-3 py-2.5">
                <span aria-hidden="true" className="text-lg">
                  {emoji}
                </span>
                <p className="text-xs font-bold text-ink">
                  {name} — {price}
                </p>
              </div>
            ))}
            {/* Decorative only (illustrative demo menu, not a real order flow) --
                a span styled like a button rather than an actual <button> so
                it isn't announced as an interactive control with no action. */}
            <span
              aria-hidden="true"
              className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-bold text-white [background:var(--accent-grad)]"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Send order via WhatsApp
            </span>
          </div>

          {/* Home indicator */}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-2 mx-auto h-1 w-28 rounded-full bg-ink/40" />
        </div>
      </div>
    </div>
  );
}
