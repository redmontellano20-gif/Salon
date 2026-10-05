import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  admin,
  ApiError,
} from "../../api/client";

import type {
  Booking,
  BookingStatus,
} from "../../api/types";

import { useAdminContext } from "./admin-context";

import {
  Button,
  Card,
  Loading,
  PageHeader,
  StatusPill,
} from "./ui";

import {
  cx,
  formatDate,
  formatDateTime,
} from "./utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "archived", label: "Archived" },
];

export default function Bookings() {
  const { refreshStats } = useAdminContext();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [rows, setRows] =
    useState<Booking[]>([]);

  const [
    loadedFilter,
    setLoadedFilter,
  ] = useState<string | null>(null);

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [
    bookingToDelete,
    setBookingToDelete,
  ] = useState<Booking | null>(null);

  /* =========================================
     LOAD BOOKINGS
     FIRST COME, FIRST SERVED
  ========================================= */

  const load = useCallback(() => {
    admin.bookings
      .list(
        filter === "all"
          ? undefined
          : filter
      )
      .then((data) => {
        const sortedBookings = [...data].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

        setRows(sortedBookings);
        setLoadedFilter(filter);
        setError(null);
      })
      .catch((e) => {
        setRows([]);
        setLoadedFilter(filter);

        setError(
          e instanceof ApiError
            ? e.message
            : "Couldn't load bookings."
        );
      });
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const loading =
    loadedFilter !== filter;

  /* =========================================
     SEARCH
  ========================================= */

  const filteredRows = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return rows;
    }

    return rows.filter((booking) => {
      const searchableText = [
        booking.name,
        booking.email,
        booking.phone,
        booking.service,
        booking.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [rows, search]);

  /* =========================================
     RUN ACTION
  ========================================= */

  const run = async (
    id: number,
    fn: () => Promise<unknown>
  ) => {
    setBusyId(id);
    setError(null);

    try {
      await fn();

      load();
      refreshStats();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong."
      );
    } finally {
      setBusyId(null);
    }
  };

  /* =========================================
     CHANGE STATUS
  ========================================= */

  const setStatus = (
    id: number,
    status: BookingStatus
  ) => {
    run(
      id,
      () =>
        admin.bookings.setStatus(
          id,
          status
        )
    );
  };

  /* =========================================
     DELETE
  ========================================= */

  const openDeleteModal = (
    booking: Booking
  ) => {
    setBookingToDelete(booking);
  };

  const closeDeleteModal = () => {
    if (busyId !== null) {
      return;
    }

    setBookingToDelete(null);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) {
      return;
    }

    const id = bookingToDelete.id;

    setBusyId(id);
    setError(null);

    try {
      await admin.bookings.remove(id);

      setBookingToDelete(null);

      load();
      refreshStats();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't delete booking."
      );
    } finally {
      setBusyId(null);
    }
  };

  /* =========================================
     ESCAPE KEY
  ========================================= */

  useEffect(() => {
    if (!bookingToDelete) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        busyId === null
      ) {
        setBookingToDelete(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [bookingToDelete, busyId]);

  return (
    <>
      {/* =====================================
          HEADER
      ===================================== */}

      <PageHeader title="Bookings" />

      <div className="mb-7">
        <p className="max-w-xl text-sm leading-6 text-taupe">
          View and manage client appointments.
          Bookings are arranged first come,
          first served.
        </p>
      </div>

      {/* =====================================
          SEARCH + FILTER
      ===================================== */}

      <Card className="mb-6 p-4 sm:p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-md">

            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-taupe"
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search bookings..."
              aria-label="Search bookings"
              className="w-full rounded-full border border-line bg-pearl py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-taupe/60 focus:border-rose-deep"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-taupe transition hover:text-ink"
              >
                ×
              </button>
            )}

          </div>

          {/* FILTERS */}

          <div className="flex flex-wrap gap-2">

            {FILTERS.map((item) => (

              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setFilter(item.key)
                }
                className={cx(
                  "rounded-full px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.1em] transition",

                  filter === item.key
                    ? "bg-ink text-pearl"
                    : "border border-line bg-transparent text-taupe hover:border-rose hover:text-ink"
                )}
              >
                {item.label}
              </button>

            ))}

          </div>

        </div>

      </Card>

      {/* =====================================
          QUEUE SUMMARY
      ===================================== */}

      {!loading &&
        !error &&
        rows.length > 0 && (

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>

              <h2 className="font-display text-xl text-ink">
                {filter === "all"
                  ? "Booking Queue"
                  : `${
                      filter
                        .charAt(0)
                        .toUpperCase() +
                      filter.slice(1)
                    } Bookings`}
              </h2>

              <p className="mt-1 text-xs text-taupe">

                {search
                  ? `${filteredRows.length} result${
                      filteredRows.length === 1
                        ? ""
                        : "s"
                    } found`
                  : filter === "all"
                  ? "Oldest booking appears first."
                  : `${rows.length} booking${
                      rows.length === 1
                        ? ""
                        : "s"
                    }`}

              </p>

            </div>

            {filter === "all" &&
              !search && (

                <div className="rounded-full border border-rose/30 bg-rose/5 px-4 py-2">

                  <span className="text-xs font-medium text-rose-deep">
                    {rows.length} in queue
                  </span>

                </div>

              )}

          </div>

        )}

      {/* =====================================
          CONTENT
      ===================================== */}

      {loading ? (

        <Loading />

      ) : error ? (

        <Card className="px-5 py-8 text-center">

          <p className="text-sm font-medium text-rose-deep">
            Couldn't load bookings
          </p>

          <p className="mt-1 text-xs text-taupe">
            {error}
          </p>

          <Button
            variant="ghost"
            onClick={load}
            className="mt-4"
          >
            Try again
          </Button>

        </Card>

      ) : rows.length === 0 ? (

        <Card className="px-5 py-14 text-center">

          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose/10 text-rose-deep">
            +
          </div>

          <p className="mt-4 font-display text-lg text-ink">
            No bookings yet
          </p>

          <p className="mx-auto mt-1 max-w-sm text-sm text-taupe">

            {filter === "all"
              ? "New appointment requests from your website will appear here."
              : `There are no ${filter} bookings.`}

          </p>

        </Card>

      ) : filteredRows.length === 0 ? (

        <Card className="px-5 py-14 text-center">

          <p className="font-display text-lg text-ink">
            No results found
          </p>

          <p className="mt-1 text-sm text-taupe">
            Try searching for another
            name, email, phone, or service.
          </p>

          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="mt-4 text-xs font-medium uppercase tracking-[0.1em] text-rose-deep hover:underline"
          >
            Clear search
          </button>

        </Card>

      ) : (

        <div className="space-y-3">

          {filteredRows.map(
            (booking) => {

              /*
                Find the real position from
                the complete current queue.

                Searching will NOT change
                the customer's queue number.
              */

              const queueIndex =
                rows.findIndex(
                  (item) =>
                    item.id ===
                    booking.id
                );

              const queueNumber =
                queueIndex + 1;

              const isFirst =
                queueNumber === 1 &&
                filter === "all";

              return (

                <Card
                  key={booking.id}
                  className={cx(
                    "overflow-hidden p-0 transition",

                    isFirst
                      ? "border-rose/40"
                      : ""
                  )}
                >

                  {/* FIRST IN QUEUE */}

                  {isFirst && (

                    <div className="border-b border-rose/20 bg-rose/5 px-5 py-2">

                      <p className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-rose-deep">
                        First in queue
                      </p>

                    </div>

                  )}

                  <div className="p-5">

                    {/* CUSTOMER HEADER */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex min-w-0 gap-3">

                        {/* NUMBER */}

                        <div
                          className={cx(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",

                            isFirst
                              ? "bg-rose-deep text-white"
                              : "bg-rose/10 text-rose-deep"
                          )}
                        >
                          {queueNumber}
                        </div>

                        {/* NAME */}

                        <div className="min-w-0">

                          <p className="mb-1 text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                            Queue #{queueNumber}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-display text-xl text-ink">
                              {booking.name}
                            </h3>

                            <StatusPill
                              status={
                                booking.status
                              }
                            />

                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-taupe">

                            <a
                              href={`mailto:${booking.email}`}
                              className="transition hover:text-ink"
                            >
                              {booking.email}
                            </a>

                            {booking.phone && (
                              <>
                                <span>
                                  ·
                                </span>

                                <a
                                  href={`tel:${booking.phone}`}
                                  className="transition hover:text-ink"
                                >
                                  {
                                    booking.phone
                                  }
                                </a>
                              </>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* BOOKED DATE */}

                      <div className="pl-[52px] sm:pl-0 sm:text-right">

                        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                          Received
                        </p>

                        <p className="mt-1 text-xs text-ink">
                          {formatDateTime(
                            booking.created_at
                          )}
                        </p>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">

                      <div className="rounded-md bg-pearl px-4 py-3">

                        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                          Service
                        </p>

                        <p className="mt-1 text-sm font-medium text-ink">
                          {booking.service ||
                            "Not specified"}
                        </p>

                      </div>

                      <div className="rounded-md bg-pearl px-4 py-3">

                        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                          Preferred Date
                        </p>

                        <p className="mt-1 text-sm font-medium text-ink">
                          {formatDate(
                            booking.preferred_date
                          )}
                        </p>

                      </div>

                    </div>

                    {/* NOTES */}

                    {booking.notes && (

                      <div className="mt-3 rounded-md border border-line px-4 py-3">

                        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                          Notes
                        </p>

                        <p className="mt-1 text-sm leading-6 text-taupe">
                          {booking.notes}
                        </p>

                      </div>

                    )}

                    {/* ACTIONS */}

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">

                      {booking.status ===
                        "new" && (
                        <>

                          <Button
                            variant="primary"
                            disabled={
                              busyId ===
                              booking.id
                            }
                            onClick={() =>
                              setStatus(
                                booking.id,
                                "confirmed"
                              )
                            }
                          >
                            {busyId ===
                            booking.id
                              ? "Updating..."
                              : "Confirm"}
                          </Button>

                          <Button
                            variant="ghost"
                            disabled={
                              busyId ===
                              booking.id
                            }
                            onClick={() =>
                              setStatus(
                                booking.id,
                                "archived"
                              )
                            }
                          >
                            Archive
                          </Button>

                        </>
                      )}

                      {booking.status ===
                        "confirmed" && (

                        <Button
                          variant="ghost"
                          disabled={
                            busyId ===
                            booking.id
                          }
                          onClick={() =>
                            setStatus(
                              booking.id,
                              "archived"
                            )
                          }
                        >
                          Archive
                        </Button>

                      )}

                      {booking.status ===
                        "archived" && (

                        <Button
                          variant="ghost"
                          disabled={
                            busyId ===
                            booking.id
                          }
                          onClick={() =>
                            setStatus(
                              booking.id,
                              "confirmed"
                            )
                          }
                        >
                          Restore
                        </Button>

                      )}

                      <Button
                        variant="danger"
                        disabled={
                          busyId ===
                          booking.id
                        }
                        onClick={() =>
                          openDeleteModal(
                            booking
                          )
                        }
                        className="ml-auto"
                      >
                        Delete
                      </Button>

                    </div>

                  </div>

                </Card>

              );
            }
          )}

        </div>

      )}

      {/* =====================================
          DELETE MODAL
      ===================================== */}

      {bookingToDelete && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-booking-title"
            className="w-full max-w-md overflow-hidden border border-line bg-cream shadow-2xl"
          >

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">

              <div>

                <p className="mb-2 text-[0.62rem] uppercase tracking-[0.18em] text-rose-deep">
                  Permanent action
                </p>

                <h2
                  id="delete-booking-title"
                  className="font-display text-2xl text-ink"
                >
                  Delete booking?
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  busyId !== null
                }
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center text-xl text-taupe transition hover:text-ink disabled:opacity-40"
              >
                ×
              </button>

            </div>

            {/* BODY */}

            <div className="px-6 py-6">

              <p className="text-sm leading-6 text-taupe">
                This booking will be
                permanently removed. This
                action cannot be undone.
              </p>

              <div className="mt-5 rounded-md border border-line bg-pearl p-4">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="font-display text-lg text-ink">
                      {
                        bookingToDelete.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-taupe">
                      {
                        bookingToDelete.email
                      }
                    </p>

                  </div>

                  <StatusPill
                    status={
                      bookingToDelete.status
                    }
                  />

                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                      Service
                    </p>

                    <p className="mt-1 text-sm text-ink">
                      {bookingToDelete.service ||
                        "—"}
                    </p>

                  </div>

                  <div>

                    <p className="text-[0.6rem] uppercase tracking-[0.14em] text-taupe">
                      Preferred Date
                    </p>

                    <p className="mt-1 text-sm text-ink">
                      {formatDate(
                        bookingToDelete.preferred_date
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 border-t border-line px-6 py-4">

              <Button
                variant="ghost"
                disabled={
                  busyId !== null
                }
                onClick={
                  closeDeleteModal
                }
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={
                  busyId !== null
                }
                onClick={
                  confirmDelete
                }
              >
                {busyId ===
                bookingToDelete.id
                  ? "Deleting..."
                  : "Delete"}
              </Button>

            </div>

          </div>

        </div>

      )}
    </>
  );
}