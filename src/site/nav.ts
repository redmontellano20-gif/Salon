/* Builds the site navigation from editable settings.

   Labels come from site_settings (nav_home, nav_about, …) so the owner
   can rename them in the admin; the anchor targets are fixed in code
   because they map to real sections on the page. "book" doubles as the
   primary call-to-action button. */
import type { Settings } from "../api/types";

export type NavItem = { key: string; label: string; href: string };

const NAV_DEFS: { key: string; setting: string; href: string; fallback: string }[] = [
  { key: "home", setting: "nav_home", href: "#top", fallback: "Home" },
  { key: "about", setting: "nav_about", href: "#about", fallback: "About" },
  { key: "services", setting: "nav_services", href: "#services", fallback: "Services" },
  { key: "gallery", setting: "nav_gallery", href: "#gallery", fallback: "Gallery" },
  { key: "book", setting: "nav_book", href: "#visit", fallback: "Book" },
];

export function buildNav(settings: Settings): NavItem[] {
  return NAV_DEFS.map((d) => ({
    key: d.key,
    href: d.href,
    label: settings[d.setting]?.trim() || d.fallback,
  }));
}

/** The "book" item is rendered as the CTA button, separate from the links. */
export function splitNav(items: NavItem[]) {
  const links = items.filter((i) => i.key !== "book");
  const book = items.find((i) => i.key === "book");
  return { links, book };
}
