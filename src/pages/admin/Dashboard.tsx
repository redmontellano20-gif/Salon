import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  admin,
  ApiError,
} from "../../api/client";

import type {
  Booking,
  Stats,
} from "../../api/types";

import { useAdminContext } from "./admin-context";

import {
  Card,
  Loading,
  PageHeader,
  StatusPill,
} from "./ui";

import { formatDateTime } from "./utils";

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  description: string;
  accent?: boolean;
}[] = [
  {
    key: "newBookings",
    label: "New Bookings",
    description: "Waiting for review",
    accent: true,
  },
  {
    key: "totalBookings",
    label: "Total Bookings",
    description: "All booking requests",
  },
  {
    key: "services",
    label: "Services",
    description: "Available salon services",
  },
  {
    key: "gallery",
    label: "Gallery",
    description: "Uploaded photos",
  },
];

export default function Dashboard() {
  const { stats } = useAdminContext();

  const [recent, setRecent] =
    useState<Booking[] | null>(null);

  const [recentError, setRecentError] =
    useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    try {
      const rows = await admin.bookings.list();

      setRecent(rows.slice(0, 6));
      setRecentError(null);
    } catch (error) {
      setRecent([]);

      setRecentError(
        error instanceof ApiError
          ? error.message
          : "Couldn't load recent bookings."
      );
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const newCount = stats?.newBookings ?? 0;

  return (
    <>
      <PageHeader title="Dashboard" />

      {/* OVERVIEW */}

      <div className="mb-7">
        <p className="text-sm text-taupe">
          Here&apos;s a quick overview of your salon.
        </p>
      </div>

      {/* NEW BOOKING ALERT */}

      {newCount > 0 && (
        <Card className="mb-8 border-rose/30 bg-rose/10">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                You have{" "}
                <span className="text-rose-deep">
                  {newCount} new booking
                  {newCount === 1 ? "" : "s"}
                </span>
              </p>

              <p className="mt-1 text-xs text-taupe">
                Review the latest booking requests from your clients.
              </p>
            </div>

            <Link
              to="/admin/bookings"
              className="inline-flex w-fit items-center justify-center rounded-full bg-rose-deep px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-white transition hover:opacity-90"
            >
              Review bookings
            </Link>
          </div>
        </Card>
      )}

      {/* STATISTICS */}

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl text-ink">
            Overview
          </h2>

          <p className="mt-1 text-xs text-taupe">
            Your salon activity at a glance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <Card
              key={card.key}
              className={`p-5 transition ${
                card.accent
                  ? "border-rose/30 bg-rose/5"
                  : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.15em] text-taupe">
                    {card.label}
                  </p>

                  <p
                    className={`mt-3 font-display text-4xl ${
                      card.accent && newCount > 0
                        ? "text-rose-deep"
                        : "text-ink"
                    }`}
                  >
                    {stats
                      ? stats[card.key]
                      : "—"}
                  </p>
                </div>

                {card.accent && newCount > 0 && (
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-deep" />
                )}
              </div>

              <p className="mt-3 text-xs text-taupe">
                {card.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* RECENT BOOKINGS */}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-ink">
              Recent Bookings
            </h2>

            <p className="mt-1 text-xs text-taupe">
              Latest booking requests from your clients.
            </p>
          </div>

          <Link
            to="/admin/bookings"
            className="shrink-0 text-xs font-medium uppercase tracking-[0.1em] text-rose-deep transition hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentError ? (
          <Card className="px-5 py-6">
            <div role="alert">
              <p className="text-sm font-medium text-rose-deep">
                Unable to load bookings
              </p>

              <p className="mt-1 text-xs text-taupe">
                {recentError}
              </p>

              <button
                type="button"
                onClick={() => {
                  setRecentError(null);
                  setRecent(null);
                  loadRecent();
                }}
                className="mt-3 text-xs font-medium text-rose-deep underline"
              >
                Try again
              </button>
            </div>
          </Card>
        ) : recent === null ? (
          <Loading />
        ) : recent.length === 0 ? (
          <Card className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-ink">
              No bookings yet
            </p>

            <p className="mt-1 text-xs text-taupe">
              New booking requests from your website will appear here.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {/* TABLE HEADER */}

            <div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-4 border-b border-line bg-pearl/50 px-5 py-3 sm:grid">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">
                Client
              </p>

              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">
                Service
              </p>

              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">
                Date
              </p>

              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">
                Status
              </p>
            </div>

            {/* BOOKINGS */}

            <div className="divide-y divide-line">
              {recent.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 px-5 py-4 transition hover:bg-pearl/40 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {booking.name}
                    </p>

                    <p className="mt-0.5 text-xs text-taupe sm:hidden">
                      Client
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {booking.service || "No service"}
                    </p>

                    <p className="mt-0.5 text-xs text-taupe sm:hidden">
                      Service
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-taupe">
                      {formatDateTime(
                        booking.created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <StatusPill
                      status={booking.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </>
  );
}