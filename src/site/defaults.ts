/* Non-business defaults used while live settings load. */
import type { SiteData, Settings } from "../api/types";

export const DEFAULT_SETTINGS: Settings = {
  nav_home: "Home",
  nav_about: "About",
  nav_services: "Services",
  nav_gallery: "Gallery",
  nav_book: "Book",
  brand_name: "",
  address_1: "",
  address_2: "",
  hours_1: "",
  hours_2: "",
  hours_3: "",
  phone: "",
  email: "",
};

export const EMPTY_SITE: SiteData = {
  settings: DEFAULT_SETTINGS,
  services: [],
  gallery: [],
};

/** Apply non-business defaults without substituting bundled sample content. */
export function mergeSite(data: Partial<SiteData> | null | undefined): SiteData {
  if (!data) return EMPTY_SITE;
  return {
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    services: data.services ?? [],
    gallery: data.gallery ?? [],
  };
}
