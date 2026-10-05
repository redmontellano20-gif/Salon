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
  name: string;
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
  const amount = Number(price).toFixed(2);

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
    const loadServices = async () => {
      try {
        const supabase = getSupabase();

        const { data: categories, error: categoryError } =
          await supabase
            .from("service_categories")
            .select("*")
            .order("sort_order", { ascending: true });

        if (categoryError) {
          throw categoryError;
        }

        const { data: serviceRows, error: serviceError } =
          await supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (serviceError) {
          throw serviceError;
        }

        const groups: ServiceGroup[] = (
          (categories ?? []) as Category[]
        ).map((category) => ({
          id: category.id,
          title: category.name,
          note: category.note ?? "",
          items: ((serviceRows ?? []) as Service[]).filter(
            (service) =>
              service.category_id === category.id
          ),
        }));

        setServices(groups);
      } catch (err) {
        console.error("Failed to load services:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load services."
        );
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  if (loading) {
    return (
      <section className="bg-cream px-5 py-24 text-center">
        <p>Loading services...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-cream px-5 py-24 text-center">
        <p className="text-rose-deep">
          Failed to load services: {error}
        </p>
      </section>
    );
  }

  return (
    <section
      id="services"
      className="bg-cream px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1180px]">

        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Our Services</p>

            <h2 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[0.95] text-ink">
              The menu
              <br />
              of services
            </h2>
          </div>

          <p className="max-w-xs text-sm leading-relaxed text-taupe md:text-right">
            Consultations are complimentary. Prices are a
            starting point — the final figure is quoted,
            gladly, in the chair.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-x-16 gap-y-16 md:mt-20 md:grid-cols-2">

          {services.map((group, gi) => (
            <Reveal
              key={group.id}
              delay={(gi % 2) * 90}
            >
              <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">

                <h3 className="font-display text-3xl font-medium text-ink">
                  {group.title}
                </h3>

                {group.note && (
                  <span className="eyebrow !text-taupe !tracking-[0.22em]">
                    {group.note}
                  </span>
                )}

              </div>

              <ul className="flex flex-col gap-6">

                {group.items.map((item) => (
                  <li key={item.id}>

                    <div className="leader">

                      <span className="font-display text-xl text-ink sm:text-[1.35rem]">
                        {item.name}
                      </span>

                      <span
                        className="leader__fill"
                        aria-hidden
                      />

                      <span className="font-display text-xl tabular-nums text-rose-deep sm:text-[1.35rem]">
                        {money(
                          item.price,
                          item.price_prefix
                        )}
                      </span>

                    </div>

                    {item.detail && (
                      <p className="mt-1.5 text-sm text-taupe">
                        {item.detail}
                      </p>
                    )}

                  </li>
                ))}

              </ul>
            </Reveal>
          ))}

        </div>

        {services.length === 0 && (
          <p className="mt-16 text-center text-taupe">
            No services available.
          </p>
        )}

        <Reveal className="mt-20 flex flex-col items-center gap-6 text-center">
          <div className="seam max-w-sm text-taupe">
            <span className="seam__node" />
          </div>

          <a href="#visit" className="btn">
            Reserve a chair
          </a>
        </Reveal>

      </div>
    </section>
  );
};

export default Services;