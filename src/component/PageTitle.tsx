import { useEffect } from "react";

import {
  useLocation,
} from "react-router-dom";

import {
  useSite,
} from "../site/site-context";

export default function PageTitle() {
  const location = useLocation();

  const { settings } = useSite();

  useEffect(() => {
    const path = location.pathname;
    const hash = location.hash;

    let pageTitle = "Home";

    /* =========================
       ADMIN
    ========================= */

    if (path === "/admin/login") {
      pageTitle = "Admin Login";
    }

    else if (
      path === "/admin/dashboard"
    ) {
      pageTitle = "Dashboard";
    }

    else if (
      path === "/admin/bookings"
    ) {
      pageTitle = "Bookings";
    }

    else if (
      path === "/admin/services"
    ) {
      pageTitle = "Services";
    }

    else if (
      path === "/admin/gallery"
    ) {
      pageTitle = "Gallery";
    }

    else if (
      path === "/admin/settings"
    ) {
      pageTitle = "Settings";
    }

    /* =========================
       PUBLIC ROUTES
    ========================= */

    else if (
      path === "/services"
    ) {
      pageTitle = "Services";
    }

    else if (
      path === "/about"
    ) {
      pageTitle = "About";
    }

    /* =========================
       HOME HASH SECTIONS
    ========================= */

    else if (
      hash === "#about"
    ) {
      pageTitle = "About";
    }

    else if (
      hash === "#services"
    ) {
      pageTitle = "Services";
    }

    else if (
      hash === "#gallery"
    ) {
      pageTitle = "Gallery";
    }

    else if (
      hash === "#visit" ||
      hash === "#book" ||
      hash === "#booking"
    ) {
      pageTitle = "Book";
    }

    else {
      pageTitle = "Home";
    }

    /* =========================
       BRAND NAME
    ========================= */

    const brandName =
      settings?.brand_name?.trim() ||
      settings?.brandName?.trim() ||
      settings?.salon_name?.trim() ||
      settings?.salonName?.trim() ||
      settings?.brand?.trim() ||
      settings?.name?.trim() ||
      "Salon";

    /* =========================
       SET BROWSER TITLE
    ========================= */

    document.title =
      `${pageTitle} | ${brandName}`;

  }, [
    location.pathname,
    location.hash,
    settings,
  ]);

  return null;
}