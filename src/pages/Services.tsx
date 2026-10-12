
import { useEffect, useState } from "react";
import { getSupabase } from "../api/supabase";
import Reveal from "../component/Reveal";

type Service = {
  id: number;
  category_id: number;
  name: string;
  detail: string | null;
  price: number | string;
  price_prefix: string | null;
  sort_order: number;
  is_active: boolean;
};

type Category = {
  id: number;
  name?: string;
  title?: string;
  note?: string | null;
  sort_order?: number;
};

type ServiceGroup = {
  id: number;
  title: string;
  note: string;
  items: Service[];
};

const money = (
  price: number | string,
  prefix?: string | null
) => {
  const value = Number(price);

  const amount = Number.isFinite(value)
    ? value.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(price);

  if (prefix?.toLowerCase() === "from") {
    return `from ₱${amount}`;
  }

  return `₱${amount}`;
};

const Services = () => {
  const [services, setServices] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const supabase = getSupabase();

        const { data: categories, error: categoryError } =
          await supabase
            .from("service_categories")
            .select("*")
            .order("sort_order", { ascending: true });

        if (categoryError) throw categoryError;

        const { data: serviceRows, error: serviceError } =
          await supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (serviceError) throw serviceError;

        const groups: ServiceGroup[] = (
          (categories ?? []) as Category[]
        ).map((category) => ({
          id: category.id,
          title: category.title || category.name || "",
          note: category.note ?? "",
          items: ((serviceRows ?? []) as Service[]).filter(
            (service) =>
              service.category_id === category.id
          ),
        }));

        if (active) {
          setServices(groups);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load services:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load services."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      id="services"
      className="relative isolate overflow-hidden bg-cream px-5 py-24 sm:px-8 md:py-32"
    >
      {/* SOFT LUXURY BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 0% 10%, rgba(222,164,158,0.23), transparent 43%), radial-gradient(ellipse at 100% 85%, rgba(232,183,177,0.23), transparent 48%), linear-gradient(135deg, #faf5f1 0%, #fffaf7 50%, #f6ebe7 100%)",
        }}
      />

      {/* DECORATIVE BLOSSOM - TOP LEFT */}

      <svg
        aria-hidden="true"
        viewBox="0 0 420 420"
        className="pointer-events-none absolute -left-32 -top-24 -z-10 w-[360px] opacity-[0.15] sm:w-[450px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#b8787a" strokeWidth="1.3">
          <path d="M210 210C145 140 120 75 190 45C250 20 280 110 210 210Z" />
          <path d="M210 210C245 115 320 70 365 125C405 175 315 220 210 210Z" />
          <path d="M210 210C305 185 380 245 340 310C305 365 235 300 210 210Z" />
          <path d="M210 210C260 290 220 380 150 360C80 340 125 255 210 210Z" />
          <path d="M210 210C115 255 40 205 70 135C100 70 180 125 210 210Z" />
          <circle cx="210" cy="210" r="18" />
          <circle cx="210" cy="210" r="6" />
        </g>
      </svg>

      {/* DECORATIVE BLOSSOM - BOTTOM RIGHT */}

      <svg
        aria-hidden="true"
        viewBox="0 0 420 420"
        className="pointer-events-none absolute -bottom-32 -right-32 -z-10 w-[390px] rotate-12 opacity-[0.12] sm:w-[520px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#b8787a" strokeWidth="1.2">
          <path d="M210 210C145 140 120 75 190 45C250 20 280 110 210 210Z" />
          <path d="M210 210C245 115 320 70 365 125C405 175 315 220 210 210Z" />
          <path d="M210 210C305 185 380 245 340 310C305 365 235 300 210 210Z" />
          <path d="M210 210C260 290 220 380 150 360C80 340 125 255 210 210Z" />
          <path d="M210 210C115 255 40 205 70 135C100 70 180 125 210 210Z" />
          <circle cx="210" cy="210" r="18" />
        </g>
      </svg>

      {/* THIN DECORATIVE LINES */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-20 -z-10 h-px w-36 bg-gradient-to-r from-transparent to-rose/30"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-20 right-0 -z-10 h-px w-48 bg-gradient-to-l from-transparent to-rose/30"
      />

      <div className="relative z-10 mx-auto max-w-[1180px]">
        {/* HEADER */}

        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-rose-deep/60" />

              <p className="eyebrow">
                Our Services
              </p>
            </div>

            <h2 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
              The menu
              <br />
              <span className="italic text-rose-deep">
                of services
              </span>
            </h2>

            <div className="mt-7 h-px w-20 bg-rose/70" />
          </div>

          <p className="max-w-sm text-sm leading-[1.9] text-taupe md:text-right">
            Consultations are complimentary. Prices are a
            starting point — the final figure is quoted,
            gladly, in the chair.
          </p>
        </Reveal>

        {/* LOADING */}

        {loading && (
          <div className="mt-16 flex min-h-48 items-center justify-center">
            <p className="text-sm tracking-wide text-taupe">
              Loading services...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="mt-16 rounded-sm border border-rose/30 bg-white/70 px-6 py-8 text-center">
            <p className="text-sm text-rose-deep">
              Failed to load services: {error}
            </p>
          </div>
        )}

        {/* SERVICE CARDS */}

        {!loading && !error && (
          <div className="mt-16 grid gap-7 md:mt-20 md:grid-cols-2 lg:gap-10">
            {services.map((group, gi) => (
              <Reveal
                key={group.id}
                delay={(gi % 2) * 90}
                className="h-full"
              >
                <div className="group relative h-full overflow-hidden border border-rose/20 bg-white/65 px-6 py-9 shadow-[0_12px_50px_rgba(100,60,60,0.045)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-rose/40 hover:shadow-[0_18px_60px_rgba(100,60,60,0.09)] sm:px-9 sm:py-11">
                  {/* CARD TOP ACCENT */}

                  <div className="absolute left-0 top-0 h-[2px] w-20 bg-rose/60 transition-all duration-500 group-hover:w-full" />

                  <div className="absolute right-5 top-4 font-display text-5xl italic text-rose/10">
                    {String(gi + 1).padStart(2, "0")}
                  </div>

                  {/* CATEGORY */}

                  <div className="relative mb-8 border-b border-rose/20 pb-6">
                    <h3 className="font-display text-3xl font-medium text-ink sm:text-[2.1rem]">
                      {group.title}
                    </h3>

                    {group.note && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-taupe">
                        {group.note}
                      </p>
                    )}
                  </div>

                  {/* SERVICE ITEMS */}

                  <ul className="relative flex flex-col gap-7">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <div className="leader flex items-baseline gap-3">
                          <span className="font-display text-lg text-ink sm:text-[1.3rem]">
                            {item.name}
                          </span>

                          <span
                            className="leader__fill min-w-3 flex-1"
                            aria-hidden="true"
                          />

                          <span className="shrink-0 font-display text-lg tabular-nums text-rose-deep sm:text-[1.3rem]">
                            {money(
                              item.price,
                              item.price_prefix
                            )}
                          </span>
                        </div>

                        {item.detail && (
                          <p className="mt-2 text-sm leading-relaxed text-taupe">
                            {item.detail}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {group.items.length === 0 && (
                    <p className="text-sm italic text-taupe">
                      No available services in this category.
                    </p>
                  )}

                  {/* CARD BOTTOM DECORATION */}

                  <div className="mt-10 flex items-center gap-3 opacity-60">
                    <span className="h-px flex-1 bg-rose/30" />

                    <span className="h-1.5 w-1.5 rotate-45 border border-rose-deep/50" />

                    <span className="h-px w-8 bg-rose/30" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && !error && services.length === 0 && (
          <p className="mt-16 text-center text-taupe">
            No services available.
          </p>
        )}

        {/* RESERVATION BUTTON */}

        {!loading && !error && (
          <Reveal className="mt-20 flex flex-col items-center gap-7 text-center">
            <p className="max-w-sm font-display text-2xl italic leading-relaxed text-taupe">
              A little time, just for you.
            </p>

            <div className="flex w-full max-w-[260px] items-center gap-4">
              <span className="h-px flex-1 bg-rose/50" />

              <span className="h-2 w-2 rotate-45 border border-rose-deep/60" />

              <span className="h-px flex-1 bg-rose/50" />
            </div>

            <a href="#visit" className="btn">
              Reserve a chair
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
};

export default Services;
