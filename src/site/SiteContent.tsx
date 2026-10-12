import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { SiteData } from "../api/types";

import {
  getGallery,
  getServices,
  getSettings,
} from "../api/client";

import { getSupabase } from "../api/supabase";
import { SiteContext } from "./site-context";
import { EMPTY_SITE } from "./defaults";

type Props = {
  children: ReactNode;
};

export default function SiteContent({ children }: Props) {
  const [site, setSite] = useState<SiteData>(EMPTY_SITE);

  const reloadSettings = useCallback(async () => {
    const settings = await getSettings();

    setSite((previous) => ({
      ...previous,
      settings,
    }));
  }, []);

  const reloadGallery = useCallback(async () => {
    const gallery = await getGallery();

    setSite((previous) => ({
      ...previous,
      gallery,
    }));
  }, []);

  const reloadServices = useCallback(async () => {
    const services = await getServices();

    setSite((previous) => ({
      ...previous,
      services,
    }));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const results = await Promise.allSettled([
        getSettings(),
        getGallery(),
        getServices(),
      ]);

      if (!active) return;

      setSite((previous) => ({
        settings:
          results[0].status === "fulfilled"
            ? results[0].value
            : previous.settings,

        gallery:
          results[1].status === "fulfilled"
            ? results[1].value
            : previous.gallery,

        services:
          results[2].status === "fulfilled"
            ? results[2].value
            : previous.services,
      }));

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Initial site request ${index + 1} failed:`,
            result.reason
          );
        }
      });
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let supabase;

    try {
      supabase = getSupabase();
    } catch (error) {
      console.warn("Supabase Realtime unavailable:", error);
      return;
    }

    const timers: Record<string, ReturnType<typeof setTimeout>> =
      {};

    const schedule = (
      key: string,
      callback: () => Promise<void>
    ) => {
      if (timers[key]) {
        clearTimeout(timers[key]);
      }

      timers[key] = setTimeout(() => {
        void callback().catch(console.error);
      }, 300);
    };

    const settingsChannel = supabase
      .channel("salon-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
        },
        () => {
          schedule("settings", reloadSettings);
        }
      )
      .subscribe();

    const galleryChannel = supabase
      .channel("salon-gallery")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gallery_images",
        },
        () => {
          schedule("gallery", reloadGallery);
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel("salon-services")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
        },
        () => {
          schedule("services", reloadServices);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_categories",
        },
        () => {
          schedule("services", reloadServices);
        }
      )
      .subscribe();

    return () => {
      Object.values(timers).forEach(clearTimeout);

      void supabase.removeChannel(settingsChannel);
      void supabase.removeChannel(galleryChannel);
      void supabase.removeChannel(servicesChannel);
    };
  }, [
    reloadSettings,
    reloadGallery,
    reloadServices,
  ]);

  return (
    <SiteContext.Provider value={site}>
      {children}
    </SiteContext.Provider>
  );
}