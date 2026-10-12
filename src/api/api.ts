import type {
  Booking,
  BookingInput,
  BookingStatus,
  GalleryImage,
  ServiceGroup,
  Settings,
  SiteData,
  Stats,
} from "./types";

const configuredUrl =
  import.meta.env.VITE_API_URL?.trim();

const API_URL = (
  configuredUrl ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "/api")
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Cannot connect to the server. Please try again.",
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("admin_token");
    }

    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return data as T;
}

function json(method: string, data: unknown): RequestInit {
  return {
    method,
    body: JSON.stringify(data),
  };
}

async function uploadImage(
  path: string,
  file: File,
  alt?: string
) {
  const formData = new FormData();
  formData.append("image", file);

  if (alt !== undefined) {
    formData.append("alt", alt);
  }

  return request<{
    url: string;
    settings: Settings;
  }>(path, {
    method: "POST",
    body: formData,
  });
}

// PUBLIC WEBSITE

export function getServices(): Promise<ServiceGroup[]> {
  return request("/services");
}

export function getGallery(): Promise<GalleryImage[]> {
  return request("/gallery");
}

export function getSettings(): Promise<Settings> {
  return request("/settings");
}

export async function getSiteData(): Promise<SiteData> {
  const [services, gallery, settings] = await Promise.all([
    getServices(),
    getGallery(),
    getSettings(),
  ]);

  return { services, gallery, settings };
}

export function createBooking(
  booking: BookingInput
): Promise<Booking> {
  return request("/bookings", json("POST", booking));
}

// ADMIN

export const admin = {
  async login(email: string, password: string) {
    const data = await request<{
      message: string;
      token: string;
      user: {
        id: number;
        email: string;
      };
    }>(
      "/auth/login",
      json("POST", {
        email: email.trim().toLowerCase(),
        password,
      })
    );

    localStorage.setItem("admin_token", data.token);
    return data;
  },

  logout() {
    localStorage.removeItem("admin_token");
    return Promise.resolve();
  },

  me() {
    return request<{ authenticated: boolean }>("/admin/me");
  },

  stats(): Promise<Stats> {
    return request("/admin/stats");
  },

  signup(email: string, password: string) {
    return request<{
      message: string;
      user: {
        id: number;
        email: string;
        created_at: string;
      };
    }>(
      "/auth/register",
      json("POST", {
        email: email.trim().toLowerCase(),
        password,
      })
    );
  },

  gallery: {
    list(): Promise<
      {
        id: number;
        url: string;
        alt: string;
        sort_order: number;
      }[]
    > {
      return request("/admin/gallery");
    },

    upload(file: File, alt = "") {
      return uploadImage("/admin/gallery", file, alt);
    },

    update(
      id: number,
      data: {
        alt?: string;
        sort_order?: number;
      }
    ) {
      return request(
        `/admin/gallery/${id}`,
        json("PATCH", data)
      );
    },

    remove(id: number): Promise<{ ok: boolean }> {
      return request(`/admin/gallery/${id}`, {
        method: "DELETE",
      });
    },
  },

  hero: {
    upload(file: File) {
      return uploadImage(
        "/admin/settings/hero-image",
        file
      );
    },
  },

  about: {
    upload(file: File) {
      return uploadImage(
        "/admin/settings/about-image",
        file
      );
    },
  },

  aboutSmall: {
    upload(file: File) {
      return uploadImage(
        "/admin/settings/about-small-image",
        file
      );
    },
  },

  bookings: {
    list(status?: string): Promise<Booking[]> {
      const query =
        status && status !== "all"
          ? `?status=${encodeURIComponent(status)}`
          : "";

      return request(`/admin/bookings${query}`);
    },

    setStatus(
      id: number,
      status: BookingStatus
    ): Promise<Booking> {
      return request(
        `/admin/bookings/${id}/status`,
        json("PATCH", { status })
      );
    },

    remove(id: number): Promise<{ ok: boolean }> {
      return request(`/admin/bookings/${id}`, {
        method: "DELETE",
      });
    },
  },

  categories: {
    create(data: {
      title: string;
      note?: string;
    }) {
      return request(
        "/admin/categories",
        json("POST", data)
      );
    },

    update(
      id: number,
      data: {
        title?: string;
        note?: string;
      }
    ) {
      return request(
        `/admin/categories/${id}`,
        json("PATCH", data)
      );
    },

    remove(id: number): Promise<{ ok: boolean }> {
      return request(`/admin/categories/${id}`, {
        method: "DELETE",
      });
    },
  },

  services: {
    tree(): Promise<ServiceGroup[]> {
      return request("/admin/services/tree");
    },

    create(data: {
      category_id: number;
      name: string;
      detail?: string;
      price: number | string;
    }) {
      return request(
        "/admin/services",
        json("POST", data)
      );
    },

    update(
      id: number,
      data: {
        name?: string;
        detail?: string;
        price?: number | string;
        is_active?: boolean;
      }
    ) {
      return request(
        `/admin/services/${id}`,
        json("PATCH", data)
      );
    },

    remove(id: number): Promise<{ ok: boolean }> {
      return request(`/admin/services/${id}`, {
        method: "DELETE",
      });
    },
  },

  settings: {
    get(): Promise<Settings> {
      return request("/admin/settings");
    },

    save(values: Settings): Promise<Settings> {
      return request(
        "/admin/settings",
        json("PUT", values)
      );
    },
  },
};