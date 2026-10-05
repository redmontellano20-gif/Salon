import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL?.trim();

const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let client:
  SupabaseClient | null =
  null;

if (url && key) {
  client = createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },

      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
}

/* =========================================
   GET CONFIG
========================================= */

export function getSupabaseConfig() {
  if (!url) {
    throw new Error(
      "VITE_SUPABASE_URL is missing from frontend .env"
    );
  }

  if (!key) {
    throw new Error(
      "VITE_SUPABASE_ANON_KEY is missing from frontend .env"
    );
  }

  return {
    url: url.replace(
      /\/$/,
      ""
    ),

    key,
  };
}

/* =========================================
   GET SUPABASE CLIENT
========================================= */

export function getSupabase():
  SupabaseClient {
  if (!client) {
    throw new Error(
      "Supabase frontend client is not configured."
    );
  }

  return client;
}