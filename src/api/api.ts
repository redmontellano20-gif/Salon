import type {
  SiteData,
  ServiceGroup,
  GalleryImage,
  Settings,
  BookingInput,
  Booking,
} from "./types";

const API_URL = "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("admin_token");

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...options.headers,
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return data as T;
}

/* =========================================
   PUBLIC SITE
========================================= */

export async function getServices(): Promise<ServiceGroup[]> {
  return request<ServiceGroup[]>("/services");
}

export async function getGallery(): Promise<GalleryImage[]> {
  return request<GalleryImage[]>("/gallery");
}

export async function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}

export async function getSiteData(): Promise<SiteData> {
  const [services, gallery, settings] = await Promise.all([
    getServices(),
    getGallery(),
    getSettings(),
  ]);

  return {
    services,
    gallery,
    settings,
  };
}

export async function createBooking(
  booking: BookingInput
): Promise<Booking> {
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  });
}

/* =========================================
   ADMIN AUTH
========================================= */

export const admin = {
  async login(email: string, password: string) {
    const data = await request<{
      message: string;
      token: string;
      user: {
        id: number;
        email: string;
      };
    }>("/auth/login", {
      method: "POST",

      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    localStorage.setItem(
      "admin_token",
      data.token
    );

    return data;
  },

  async logout() {
    localStorage.removeItem("admin_token");
  },

  async me() {
    return request<{
      authenticated: boolean;
    }>("/admin/me");
  },
};