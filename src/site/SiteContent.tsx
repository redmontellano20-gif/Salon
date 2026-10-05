import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SiteData } from "../api/types";

import {
  getGallery,
  getServices,
  getSettings,
  getSiteData,
} from "../api/client";

import { getSupabase } from "../api/supabase";

import { SiteContext } from "./site-context";
import { EMPTY_SITE } from "./defaults";

type Props = {
  children: ReactNode;
};

export default function SiteContent({
  children,
}: Props) {
  const [site, setSite] =
    useState<SiteData>(EMPTY_SITE);

  const mountedRef =
    useRef(true);

  /*
   * Small timers prevent several database
   * events from causing many requests at once.
   */
  const settingsTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const galleryTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const servicesTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* =========================================
     INITIAL WEBSITE LOAD
  ========================================= */

  const loadSite =
    useCallback(async () => {
      try {
        const data =
          await getSiteData();

        if (!mountedRef.current) {
          return;
        }

        setSite(data);
      } catch (error) {
        console.error(
          "Failed to load site:",
          error
        );
      }
    }, []);

  /* =========================================
     RELOAD SETTINGS ONLY
  ========================================= */

  const reloadSettings =
    useCallback(async () => {
      try {
        const settings =
          await getSettings();

        if (!mountedRef.current) {
          return;
        }

        setSite((previous) => ({
          ...previous,
          settings,
        }));
      } catch (error) {
        console.error(
          "Failed to refresh settings:",
          error
        );
      }
    }, []);

  /* =========================================
     RELOAD GALLERY ONLY
  ========================================= */

  const reloadGallery =
    useCallback(async () => {
      try {
        const gallery =
          await getGallery();

        if (!mountedRef.current) {
          return;
        }

        setSite((previous) => ({
          ...previous,
          gallery,
        }));
      } catch (error) {
        console.error(
          "Failed to refresh gallery:",
          error
        );
      }
    }, []);

  /* =========================================
     RELOAD SERVICES ONLY
  ========================================= */

  const reloadServices =
    useCallback(async () => {
      try {
        const services =
          await getServices();

        if (!mountedRef.current) {
          return;
        }

        setSite((previous) => ({
          ...previous,
          services,
        }));
      } catch (error) {
        console.error(
          "Failed to refresh services:",
          error
        );
      }
    }, []);

  /* =========================================
     DEBOUNCED REFRESH
  ========================================= */

  const scheduleSettingsRefresh =
    useCallback(() => {
      if (settingsTimer.current) {
        clearTimeout(
          settingsTimer.current
        );
      }

      settingsTimer.current =
        setTimeout(() => {
          reloadSettings();
        }, 100);
    }, [reloadSettings]);

  const scheduleGalleryRefresh =
    useCallback(() => {
      if (galleryTimer.current) {
        clearTimeout(
          galleryTimer.current
        );
      }

      galleryTimer.current =
        setTimeout(() => {
          reloadGallery();
        }, 100);
    }, [reloadGallery]);

  const scheduleServicesRefresh =
    useCallback(() => {
      if (servicesTimer.current) {
        clearTimeout(
          servicesTimer.current
        );
      }

      servicesTimer.current =
        setTimeout(() => {
          reloadServices();
        }, 100);
    }, [reloadServices]);

  /* =========================================
     INITIAL LOAD + SUPABASE REALTIME
  ========================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadSite();

    let supabase;

    try {
      supabase =
        getSupabase();
    } catch (error) {
      console.error(
        "Supabase realtime unavailable:",
        error
      );

      return () => {
        mountedRef.current = false;
      };
    }

    /* =====================================
       SETTINGS CHANNEL
    ===================================== */

    const settingsChannel =
      supabase
        .channel(
          "public-settings-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "settings",
          },
          () => {
            scheduleSettingsRefresh();
          }
        )

    /* =====================================
       GALLERY CHANNEL
    ===================================== */

    const galleryChannel =
      supabase
        .channel(
          "public-gallery-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "gallery_images",
          },
          () => {
            scheduleGalleryRefresh();
          }
        )

    /* =====================================
       SERVICES CHANNEL
    ===================================== */

    const servicesChannel =
      supabase
        .channel(
          "public-services-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "services",
          },
          () => {
            scheduleServicesRefresh();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "service_categories",
          },
          () => {
            scheduleServicesRefresh();
          }
        )
        
    /* =====================================
       CLEANUP
    ===================================== */

    return () => {
      mountedRef.current = false;

      if (
        settingsTimer.current
      ) {
        clearTimeout(
          settingsTimer.current
        );
      }

      if (
        galleryTimer.current
      ) {
        clearTimeout(
          galleryTimer.current
        );
      }

      if (
        servicesTimer.current
      ) {
        clearTimeout(
          servicesTimer.current
        );
      }

      supabase.removeChannel(
        settingsChannel
      );

      supabase.removeChannel(
        galleryChannel
      );

      supabase.removeChannel(
        servicesChannel
      );
    };
  }, [
    loadSite,
    scheduleSettingsRefresh,
    scheduleGalleryRefresh,
    scheduleServicesRefresh,
  ]);

  return (
    <SiteContext.Provider
      value={site}
    >
      {children}
    </SiteContext.Provider>
  );
}