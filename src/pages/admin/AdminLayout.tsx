import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  admin,
  ApiError,
} from "../../api/client";

import type {
  Settings,
  Stats,
} from "../../api/types";

import type { AdminContext } from "./admin-context";

import Brand from "../../component/Brand";
import { cx } from "./utils";

const NAV = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    end: true,
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
    badge: true,
  },
  {
    to: "/admin/services",
    label: "Services",
  },
  {
    to: "/admin/gallery",
    label: "Gallery",
  },
  {
    to: "/admin/settings",
    label: "Settings",
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [statsError, setStatsError] =
    useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const value = await admin.stats();

      setStats(value);
      setStatsError(null);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        return;
      }

      setStatsError(
        error instanceof ApiError
          ? error.message
          : "Couldn't load dashboard stats."
      );
    }
  }, []);

  const refreshSettings =
    useCallback(async () => {
      try {
        const value =
          await admin.settings.get();

        setSettings(value);
      } catch (error) {
        console.error(
          "Couldn't load settings:",
          error
        );
      }
    }, []);

  useEffect(() => {
    refreshStats();
    refreshSettings();
  }, [refreshStats, refreshSettings]);

  const logout = async () => {
    await admin.logout();

    navigate("/admin/login", {
      replace: true,
    });
  };

  const newCount =
    stats?.newBookings ?? 0;

  const brandName =
    settings?.brand_name?.trim() ||
    "Salon";

  const linkClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    cx(
      "flex items-center justify-between rounded-md px-3 py-2 text-sm transition",

      isActive
        ? "bg-ink text-pearl"
        : "text-ink/75 hover:bg-blush/50 hover:text-ink"
    );

  return (
    <div className="min-h-screen bg-pearl text-ink lg:flex">

      <aside className="border-b border-line bg-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">

        <div className="flex items-center justify-between px-5 py-5 lg:block">

          <div>
            <Brand
              name={brandName}
              className="text-xl"
            />

            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-taupe">
              Salon Admin
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="text-xs uppercase tracking-[0.14em] text-taupe hover:text-rose-deep lg:hidden"
          >
            Log out
          </button>

        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:mt-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">

          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              <span className="whitespace-nowrap">
                {item.label}
              </span>

              {item.badge &&
              newCount > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1.5 text-[0.66rem] font-semibold text-white">
                  {newCount}
                </span>
              ) : null}
            </NavLink>
          ))}

        </nav>

        <div className="hidden border-t border-line px-5 py-4 lg:block">

          <p className="text-xs text-taupe">
            Administrator
          </p>

          <div className="mt-2 flex items-center gap-3 text-xs">

            <button
              type="button"
              onClick={logout}
              className="uppercase tracking-[0.14em] text-ink hover:text-rose-deep"
            >
              Log out
            </button>

            <span className="text-line">
              ·
            </span>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="uppercase tracking-[0.14em] text-taupe hover:text-ink"
            >
              View site ↗
            </a>

          </div>

        </div>

      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">

        <div className="mx-auto max-w-4xl">

          {statsError ? (
            <div
              role="alert"
              className="mb-6 text-sm text-rose-deep"
            >
              <p>{statsError}</p>

              <button
                type="button"
                onClick={refreshStats}
                className="mt-1 underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          <Outlet
            context={
              {
                stats,
                refreshStats,
                settings,
                refreshSettings,
                setSettings,
              } satisfies AdminContext
            }
          />

        </div>

      </main>

    </div>
  );
}