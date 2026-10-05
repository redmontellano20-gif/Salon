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

const API_URL =
  "http://localhost:5000/api";

/* =========================================
   API ERROR
========================================= */

export class ApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

/* =========================================
   REQUEST
========================================= */

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    localStorage.getItem(
      "admin_token"
    );

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...options.headers,
      },
    }
  );

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(
        "admin_token"
      );
    }

    throw new ApiError(
      data?.message ||
        `Request failed (${response.status})`,
      response.status
    );
  }

  return data as T;
}

/* =========================================
   PUBLIC SERVICES
========================================= */

export async function getServices():
  Promise<ServiceGroup[]> {
  return request<ServiceGroup[]>(
    "/services"
  );
}

/* =========================================
   PUBLIC GALLERY
========================================= */

export async function getGallery():
  Promise<GalleryImage[]> {
  return request<GalleryImage[]>(
    "/gallery"
  );
}

/* =========================================
   PUBLIC SETTINGS
========================================= */

export async function getSettings():
  Promise<Settings> {
  return request<Settings>(
    "/settings"
  );
}

/* =========================================
   SITE DATA
========================================= */

export async function getSiteData():
  Promise<SiteData> {
  const [
    services,
    gallery,
    settings,
  ] = await Promise.all([
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

/* =========================================
   PUBLIC BOOKING
========================================= */

export async function createBooking(
  data: BookingInput
): Promise<Booking> {
  return request<Booking>(
    "/bookings",
    {
      method: "POST",

      body:
        JSON.stringify(data),
    }
  );
}

/* =========================================
   SHARED IMAGE UPLOAD
========================================= */

async function uploadSettingsImage(
  path: string,
  file: File,
  fallbackMessage: string
): Promise<{
  url: string;
  settings: Settings;
}> {
  const token =
    localStorage.getItem(
      "admin_token"
    );

  const formData =
    new FormData();

  formData.append(
    "image",
    file
  );

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        method: "POST",

        headers: {
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },

        body: formData,
      }
    );

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (
      response.status === 401
    ) {
      localStorage.removeItem(
        "admin_token"
      );
    }

    throw new ApiError(
      data?.message ||
        `${fallbackMessage} (${response.status})`,
      response.status
    );
  }

  return data;
}

/* =========================================
   ADMIN
========================================= */

export const admin = {

  /* =======================================
     GALLERY
  ======================================= */

  gallery: {

    async list(): Promise<
      {
        id: number;
        url: string;
        alt: string;
        sort_order: number;
      }[]
    > {
      return request(
        "/admin/gallery"
      );
    },

    async upload(
      file: File,
      alt = ""
    ) {
      const token =
        localStorage.getItem(
          "admin_token"
        );

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      formData.append(
        "alt",
        alt
      );

      const response =
        await fetch(
          `${API_URL}/admin/gallery`,
          {
            method: "POST",

            headers: {
              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body: formData,
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "admin_token"
          );
        }

        throw new ApiError(
          data?.message ||
            `Upload failed (${response.status})`,
          response.status
        );
      }

      return data;
    },

    async update(
      id: number,
      data: {
        alt?: string;
        sort_order?: number;
      }
    ) {
      return request(
        `/admin/gallery/${id}`,
        {
          method: "PATCH",

          body:
            JSON.stringify(data),
        }
      );
    },

    async remove(
      id: number
    ): Promise<{
      ok: boolean;
    }> {
      return request(
        `/admin/gallery/${id}`,
        {
          method: "DELETE",
        }
      );
    },
  },

  /* =======================================
     HERO IMAGE
  ======================================= */

  hero: {
    async upload(
      file: File
    ): Promise<{
      url: string;
      settings: Settings;
    }> {
      return uploadSettingsImage(
        "/admin/settings/hero-image",
        file,
        "Hero image upload failed"
      );
    },
  },

  /* =======================================
     ABOUT IMAGE
  ======================================= */

  about: {
    async upload(
      file: File
    ): Promise<{
      url: string;
      settings: Settings;
    }> {
      return uploadSettingsImage(
        "/admin/settings/about-image",
        file,
        "About image upload failed"
      );
    },
  },

aboutSmall: {
  async upload(
    file: File
  ): Promise<{
    url: string;
    settings: Settings;
  }> {
    return uploadSettingsImage(
      "/admin/settings/about-small-image",
      file,
      "Small About image upload failed"
    );
  },
},

  /* =======================================
     LOGIN
  ======================================= */

  async login(
    email: string,
    password: string
  ) {
    const data =
      await request<{
        message: string;

        token: string;

        user: {
          id: number;
          email: string;
        };
      }>(
        "/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          }),
        }
      );

    localStorage.setItem(
      "admin_token",
      data.token
    );

    return data;
  },

  /* =======================================
     SIGN UP
  ======================================= */

  async signup(
    email: string,
    password: string
  ) {
    return request<{
      message: string;

      user: {
        id: number;
        email: string;
        created_at: string;
      };
    }>(
      "/auth/register",
      {
        method: "POST",

        body: JSON.stringify({
          email:
            email
              .trim()
              .toLowerCase(),

          password,
        }),
      }
    );
  },

  /* =======================================
     LOGOUT
  ======================================= */

  async logout() {
    localStorage.removeItem(
      "admin_token"
    );
  },

  /* =======================================
     CHECK LOGIN
  ======================================= */

  async me() {
    return request<{
      authenticated: boolean;
    }>(
      "/admin/me"
    );
  },

  /* =======================================
     DASHBOARD STATS
  ======================================= */

  async stats():
    Promise<Stats> {
    return request<Stats>(
      "/admin/stats"
    );
  },

  /* =======================================
     BOOKINGS
  ======================================= */

  bookings: {

    async list(
      status?: string
    ): Promise<Booking[]> {
      let path =
        "/admin/bookings";

      if (
        status &&
        status !== "all"
      ) {
        path +=
          `?status=${encodeURIComponent(
            status
          )}`;
      }

      return request<Booking[]>(
        path
      );
    },

    async setStatus(
      id: number,
      status: BookingStatus
    ): Promise<Booking> {
      return request<Booking>(
        `/admin/bookings/${id}/status`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              status,
            }),
        }
      );
    },

    async remove(
      id: number
    ): Promise<{
      ok: boolean;
    }> {
      return request<{
        ok: boolean;
      }>(
        `/admin/bookings/${id}`,
        {
          method: "DELETE",
        }
      );
    },
  },

  /* =======================================
     CATEGORIES
  ======================================= */

  categories: {

    async create(data: {
      title: string;
      note?: string;
    }) {
      return request(
        "/admin/categories",
        {
          method: "POST",

          body:
            JSON.stringify(data),
        }
      );
    },

    async update(
      id: number,
      data: {
        title?: string;
        note?: string;
      }
    ) {
      return request(
        `/admin/categories/${id}`,
        {
          method: "PATCH",

          body:
            JSON.stringify(data),
        }
      );
    },

    async remove(
      id: number
    ): Promise<{
      ok: boolean;
    }> {
      return request(
        `/admin/categories/${id}`,
        {
          method: "DELETE",
        }
      );
    },
  },

  /* =======================================
     SERVICES
  ======================================= */

  services: {

    async tree():
      Promise<ServiceGroup[]> {
      return request<
        ServiceGroup[]
      >(
        "/admin/services/tree"
      );
    },

    async create(data: {
      category_id: number;
      name: string;
      detail?: string;
      price: number | string;
    }) {
      return request(
        "/admin/services",
        {
          method: "POST",

          body:
            JSON.stringify(data),
        }
      );
    },

    async update(
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
        {
          method: "PATCH",

          body:
            JSON.stringify(data),
        }
      );
    },

    async remove(
      id: number
    ): Promise<{
      ok: boolean;
    }> {
      return request(
        `/admin/services/${id}`,
        {
          method: "DELETE",
        }
      );
    },
  },

  /* =======================================
     SETTINGS
  ======================================= */

  settings: {

    async get():
      Promise<Settings> {
      return request<Settings>(
        "/admin/settings"
      );
    },

    async save(
      values: Settings
    ): Promise<Settings> {
      return request<Settings>(
        "/admin/settings",
        {
          method: "PUT",

          body:
            JSON.stringify(
              values
            ),
        }
      );
    },
  },
};
