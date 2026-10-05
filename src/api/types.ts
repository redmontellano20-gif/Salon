export type ServiceItem = {
  id?: number;
  name: string;
  detail: string;
  price: string;
  sort_order?: number;
  is_active?: boolean;
};

export type ServiceGroup = {
  id?: number;
  title: string;
  note: string;
  sort_order?: number;
  items: ServiceItem[];
};

export type GalleryImage = {
  id?: number;
  src: string;
  alt: string;
  sort_order?: number;
};

export type Settings = Record<string, string>;

export type SiteData = {
  settings: Settings;
  services: ServiceGroup[];
  gallery: GalleryImage[];
};

export type BookingStatus =
  | "new"
  | "confirmed"
  | "archived";

export type Booking = {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  preferred_date: string | null;
  notes: string;
  status: BookingStatus;
  created_at: string;
};

export type Stats = {
  totalBookings: number;
  newBookings: number;
  services: number;
  gallery: number;
};

export type BookingInput = {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  preferred_date?: string | null;
  notes?: string;
};