import {
  Hand,
  QrCode,
  Grid2x2,
  TrendingUp,
  LineChart,
  UtensilsCrossed,
  Coffee,
  BedDouble,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Briefcase,
  Users,
  MoreHorizontal,
  Search,
  Tag,
  MessageCircle,
  Camera,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Maps the plain icon-name strings stored in lib/i18n/dictionaries/content.json
 * (WHY_ITEMS, BUSINESS_TYPE_ITEMS) and used ad-hoc in a couple of marketing
 * sections to an actual lucide-react icon component. Content stays a portable
 * string ("restaurant", "whatsapp", ...) rather than importing a component
 * directly, so translators/CMS editors never touch React.
 *
 * Unknown names fall back to MoreHorizontal rather than throwing -- a typo'd
 * or future icon key shouldn't take the whole section down.
 */
const ICONS: Record<string, ComponentType<LucideProps>> = {
  tap: Hand,
  qr: QrCode,
  grid: Grid2x2,
  growth: TrendingUp,
  chartLine: LineChart,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  hotel: BedDouble,
  salon: Scissors,
  retail: ShoppingBag,
  clinic: Stethoscope,
  briefcase: Briefcase,
  users: Users,
  more: MoreHorizontal,
  search: Search,
  tag: Tag,
  whatsapp: MessageCircle,
  camera: Camera,
};

export function Icon({ name, className, ...props }: { name: string; className?: string } & LucideProps) {
  const LucideIcon = ICONS[name] ?? MoreHorizontal;
  return <LucideIcon className={className} aria-hidden="true" {...props} />;
}
