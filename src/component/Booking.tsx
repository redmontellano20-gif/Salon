import { useState } from "react";

import { useSite } from "../site/site-context";

import {
  createBooking,
  ApiError,
} from "../api/client";

import Reveal from "./Reveal";

/* =========================================
   DATE
========================================= */

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================
   STYLES
========================================= */

const fieldClass =
  "w-full rounded-lg border border-line bg-pearl px-4 py-3 text-sm text-ink outline-none transition placeholder:text-taupe/55 hover:border-taupe/50 focus:border-rose-deep focus:ring-2 focus:ring-rose/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 block text-[0.64rem] font-medium uppercase tracking-[0.16em] text-taupe";

/* =========================================
   BOOKING
========================================= */

const Booking = () => {
  const {
    settings,
    services,
  } = useSite();

  const [sent, setSent] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const today = getToday();

  /* =========================================
     SERVICE OPTIONS
  ========================================= */

  const serviceOptions = (
    services ?? []
  ).flatMap((group) =>
    (group.items ?? [])
      .filter(
        (item) =>
          item.is_active !==
          false
      )
      .map((item) => ({
        key: `${
          group.id ??
          group.title
        }-${
          item.id ??
          item.name
        }`,

        label: `${group.title} · ${item.name}`,

        value: item.name,
      }))
  );

  /* =========================================
     CONTACT DETAILS
  ========================================= */

  const details = [
    {
      label: "Find us",

      lines: [
        settings?.address_1,
        settings?.address_2,
      ].filter(Boolean),
    },

    {
      label: "Hours",

      lines: [
        settings?.hours_1,
        settings?.hours_2,
        settings?.hours_3,
      ].filter(Boolean),
    },

    {
      label: "Speak to us",

      lines: [
        settings?.phone,
        settings?.email,
      ].filter(Boolean),
    },
  ];

  /* =========================================
     SUBMIT BOOKING
  ========================================= */

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form =
      e.currentTarget;

    const fd =
      new FormData(form);

    const selectedDate =
      String(
        fd.get("date") || ""
      );

    /*
     * Extra protection.
     *
     * Even if somebody manually
     * changes the HTML, an old date
     * cannot be submitted from this form.
     */
    if (
      selectedDate &&
      selectedDate < today
    ) {
      setError(
        "Please choose today or a future date."
      );

      return;
    }

    const payload = {
      name: String(
        fd.get("name") || ""
      ).trim(),

      email: String(
        fd.get("email") || ""
      ).trim(),

      phone: String(
        fd.get("phone") || ""
      ).trim(),

      service: String(
        fd.get("service") || ""
      ).trim(),

      preferred_date:
        selectedDate || null,

      notes: String(
        fd.get("notes") || ""
      ).trim(),
    };

    setError(null);
    setSubmitting(true);

    try {
      await createBooking(
        payload
      );

      form.reset();

      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================
     PAGE
  ========================================= */

  return (
    <section
      id="visit"
      className="bg-blush px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

        {/* ===================================
            LEFT SIDE
        =================================== */}

        <Reveal>
          <div className="lg:sticky lg:top-28">

            <p className="eyebrow">
              Reservations
            </p>

            <h2 className="mt-4 font-display text-[clamp(2.6rem,7vw,5rem)] font-medium leading-[0.92] text-ink">
              Reserve
              <br />

              <span className="italic">
                your visit
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-base leading-relaxed text-taupe">
              Tell us a little
              about what you are
              after. We will confirm
              your appointment by
              email within one
              working day.
            </p>

            {/* CONTACT INFORMATION */}

            <dl className="mt-12 space-y-7">
              {details.map(
                (detail) => (
                  <div
                    key={
                      detail.label
                    }
                    className="border-t border-rose/20 pt-5 sm:flex sm:gap-6"
                  >
                    <dt className="mb-2 shrink-0 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-rose-deep sm:mb-0 sm:w-24 sm:pt-1">
                      {
                        detail.label
                      }
                    </dt>

                    <dd className="font-display text-lg leading-snug text-ink md:text-xl">
                      {detail.lines
                        .length >
                      0 ? (
                        detail.lines.map(
                          (
                            line,
                            index
                          ) => (
                            <span
                              key={`${detail.label}-${index}`}
                              className="block"
                            >
                              {
                                line
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-taupe">
                          —
                        </span>
                      )}
                    </dd>
                  </div>
                )
              )}
            </dl>
          </div>
        </Reveal>

        {/* ===================================
            RIGHT SIDE
        =================================== */}

        <Reveal delay={90}>
          <div className="overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_30px_80px_-40px_rgba(23,18,15,0.35)]">

            {/* TOP */}

            <div className="border-b border-line bg-pearl/50 px-6 py-5 sm:px-8">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-rose-deep">
                Appointment request
              </p>

              <h3 className="mt-1 font-display text-2xl text-ink">
                Your appointment
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-taupe">
                Fill in the details
                below and we will
                contact you to
                confirm your
                schedule.
              </p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              {sent ? (

                /* =========================
                   SUCCESS
                ========================= */

                <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blush">
                    <span
                      aria-hidden
                      className="font-display text-3xl text-rose-deep"
                    >
                      ✓
                    </span>
                  </div>

                  <p className="mt-6 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-rose-deep">
                    Request received
                  </p>

                  <h3 className="mt-2 font-display text-3xl text-ink">
                    Thank you.
                  </h3>

                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-taupe">
                    Your appointment
                    request is with
                    us. Look out for
                    a confirmation
                    from{" "}
                    {settings?.email ||
                      "us"}{" "}
                    within one
                    working day.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setError(null);
                    }}
                    className="btn btn--ghost mt-8"
                  >
                    Send another
                  </button>
                </div>
              ) : (

                /* =========================
                   FORM
                ========================= */

                <form
                  onSubmit={
                    onSubmit
                  }
                  className="flex flex-col gap-6"
                >

                  {/* NAME + PHONE */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className={
                          labelClass
                        }
                      >
                        Full name
                        <span className="ml-1 text-rose-deep">
                          *
                        </span>
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        className={
                          fieldClass
                        }
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className={
                          labelClass
                        }
                      >
                        Phone
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className={
                          fieldClass
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label
                      htmlFor="email"
                      className={
                        labelClass
                      }
                    >
                      Email
                      <span className="ml-1 text-rose-deep">
                        *
                      </span>
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className={
                        fieldClass
                      }
                      placeholder="you@email.com"
                    />
                  </div>

                  {/* SERVICE + DATE */}

                  <div className="grid gap-5 sm:grid-cols-2">

                    {/* SERVICE */}

                    <div>
                      <label
                        htmlFor="service"
                        className={
                          labelClass
                        }
                      >
                        Service
                      </label>

                      <div className="relative">
                        <select
                          id="service"
                          name="service"
                          className={`${fieldClass} appearance-none pr-10`}
                          defaultValue=""
                        >
                          <option
                            value=""
                            disabled
                          >
                            Select a service
                          </option>

                          {serviceOptions.map(
                            (
                              option
                            ) => (
                              <option
                                key={
                                  option.key
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}

                          <option value="Not sure yet">
                            Not sure yet
                          </option>
                        </select>

                        <span
                          aria-hidden
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-rose-deep"
                        >
                          ▾
                        </span>
                      </div>
                    </div>

                    {/* DATE */}

                    <div>
                      <label
                        htmlFor="date"
                        className={
                          labelClass
                        }
                      >
                        Preferred date
                      </label>

                      <div className="relative">
                        <input
                          id="date"
                          name="date"
                          type="date"

                          /*
                           * IMPORTANT:
                           * Browser will disable
                           * every date before today.
                           */
                          min={today}

                          className={`${fieldClass} cursor-pointer`}
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blush text-[0.55rem] text-rose-deep">
                          ✓
                        </span>

                        <p className="text-[0.68rem] text-taupe">
                          Today or a
                          future date
                          only
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NOTES */}

                  <div>
                    <label
                      htmlFor="notes"
                      className={
                        labelClass
                      }
                    >
                      Anything we
                      should know?
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      className={`${fieldClass} min-h-[110px] resize-y`}
                      placeholder="Inspiration, hair history, or the look you're after…"
                    />
                  </div>

                  {/* ERROR */}

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-lg border border-rose/30 bg-rose/5 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose/10 text-xs font-medium text-rose-deep">
                          !
                        </div>

                        <div>
                          <p className="text-xs font-medium text-rose-deep">
                            Please check
                            your booking
                          </p>

                          <p className="mt-0.5 text-xs leading-relaxed text-taupe">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* SUBMIT */}

                  <div className="border-t border-line pt-6">
                    <button
                      type="submit"
                      disabled={
                        submitting
                      }
                      className="btn w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Sending request…"
                        : "Request appointment"}
                    </button>

                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-rose-deep" />

                      <p className="text-center text-xs text-taupe">
                        No deposit
                        required to
                        enquire.
                      </p>

                      <span className="h-1 w-1 rounded-full bg-rose-deep" />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Booking;