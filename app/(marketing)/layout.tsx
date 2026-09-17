import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { getNavItems } from "@/lib/data/public";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [headerItems, footerItems] = await Promise.all([getNavItems("header"), getNavItems("footer")]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader navItems={headerItems} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter navItems={footerItems} />
    </div>
  );
}
