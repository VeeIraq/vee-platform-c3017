import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { dir } from "@/lib/i18n/config";
import { MenuExperience } from "@/app/[username]/menu/menu-experience";

export const metadata: Metadata = { title: "Demo menu" };

// A static, always-on example of the digital menu -- "Vee Café", the same
// fictional business shown in the homepage phone mockup -- so "Browse the
// demo menu" leads somewhere a visitor can actually search/filter, not the
// hardware product catalogue. No business/DB row backs this: it's fixed
// demo content, so likes are off and nothing here is persisted.
const CATEGORIES = [
  { id: "drinks", name: { en: "Drinks", ar: "المشروبات", ku: "خواردنەوە" }, icon: "🥤" },
  { id: "food", name: { en: "Food", ar: "الطعام", ku: "خواردن" }, icon: "🍽️" },
  { id: "dessert", name: { en: "Dessert", ar: "الحلويات", ku: "شیرینی" }, icon: "🍰" },
];

const ITEMS = [
  {
    id: "cold-brew",
    category_id: "drinks",
    name: { en: "Cold Brew", ar: "كولد برو", ku: "کۆڵد برو" },
    description: { en: "Slow-steeped 18 hours, served over ice.", ar: "منقوع ببطء 18 ساعة، يقدَّم مع الثلج.", ku: "بە هێواشی بۆ 18 کاتژمێر چێشراوە، لەگەڵ سەهۆڵ خراوەتە سەر." },
    price: 4800,
    discount_price: null,
    image_url: null,
    tags: [],
    available: true,
    labels: [],
    options: [],
  },
  {
    id: "flat-white",
    category_id: "drinks",
    name: { en: "Flat White", ar: "فلات وايت", ku: "فلات وایت" },
    description: { en: "Double espresso, steamed milk.", ar: "إسبريسو مزدوج مع حليب مبخّر.", ku: "دوو ئێسپرێسۆ لەگەڵ شیری هەڵم." },
    price: 5000,
    discount_price: null,
    image_url: null,
    tags: [],
    available: true,
    labels: [],
    options: [],
  },
  {
    id: "smash-burger",
    category_id: "food",
    name: { en: "Vee Smash Burger", ar: "في سماش برغر", ku: "ڤی سماش بەرگەر" },
    description: { en: "Double smashed patty, cheddar, house sauce.", ar: "قطعتان مهروستان، جبن شيدر، صلصة خاصة.", ku: "دوو پارچەی گۆشتی گویزراو، پەنیری چێدەر، سۆسی تایبەت." },
    price: 15000,
    discount_price: null,
    image_url: null,
    tags: [],
    available: true,
    labels: [],
    options: [],
  },
  {
    id: "grilled-halloumi",
    category_id: "food",
    name: { en: "Grilled Halloumi Wrap", ar: "لفافة حلوم مشوي", ku: "ڕاپی حەلوومی برژاو" },
    description: { en: "Grilled halloumi, greens, tahini sauce.", ar: "حلوم مشوي، خضار، صلصة طحينة.", ku: "حەلوومی برژاو، سەوزە، سۆسی تەحینی." },
    price: 9000,
    discount_price: 8000,
    image_url: null,
    tags: [],
    available: true,
    labels: [],
    options: [],
  },
  {
    id: "tiramisu",
    category_id: "dessert",
    name: { en: "Tiramisu", ar: "تيراميسو", ku: "تیرامیسۆ" },
    description: { en: "Classic espresso-soaked layers.", ar: "طبقات كلاسيكية منقوعة بالإسبريسو.", ku: "چینی کلاسیکی تێدراو بە ئێسپرێسۆ." },
    price: 7000,
    discount_price: null,
    image_url: null,
    tags: [],
    available: true,
    labels: [],
    options: [],
  },
  {
    id: "baklava",
    category_id: "dessert",
    name: { en: "Pistachio Baklava", ar: "بقلاوة فستق", ku: "بەقڵاوای فستق" },
    description: { en: "Layers of filo, pistachio, honey syrup.", ar: "طبقات عجين رقيق، فستق، شراب العسل.", ku: "چینی هەویرێکی باریک، فستق، شەربەتی هەنگوین." },
    price: 6000,
    discount_price: null,
    image_url: null,
    tags: [],
    available: false,
    labels: [],
    options: [],
  },
];

const BUSINESS_NAME = { en: "Vee Café", ar: "في كافيه", ku: "ڤی کافێ" };

export default async function DemoMenuPage() {
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, `menuPage.${path}`);
  const name = BUSINESS_NAME[locale];

  return (
    <div dir={dir(locale)} className="min-h-screen bg-paper">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-sm font-semibold text-accent hover:underline">
              ← {tt("viewProfile")}
            </Link>
            <h1 className="mt-1 truncate text-xl font-extrabold text-ink">{name}</h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              {locale === "ar" ? "قائمة تجريبية" : locale === "ku" ? "مێنووی نموونەیی" : "Demo menu"}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-line bg-ink">
            <span className="text-sm font-bold text-white" aria-hidden="true">
              V
            </span>
          </div>
        </div>
      </header>

      <MenuExperience
        businessId="demo"
        likesEnabled={false}
        initialLikes={{}}
        categories={CATEGORIES}
        items={ITEMS}
        locale={locale}
        dict={dict}
      />

      <p className="pb-10 text-center text-xs text-ink-muted">
        {t(dict, "profile.poweredBy")} Vee
      </p>
    </div>
  );
}
