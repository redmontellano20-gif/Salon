import { useSite } from "../site/site-context";

const Hero = () => {
  const { settings } = useSite();

  const heroImage =
    settings?.hero_image?.trim() || settings?.hero_image_url?.trim() ;

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-pearl pt-28 pb-16 sm:pt-32 md:pt-36 md:pb-24"
    >
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* COPY */}
        <div className="order-2 lg:order-1">
          <p
            className="eyebrow rise flex items-center gap-3"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="inline-block h-px w-8 bg-rose" />
            Hair & &amp; Beauty Salon
          </p>

          <h1 className="mt-6 font-display font-medium leading-[0.94] tracking-[-0.01em] text-ink">
            <span
              className="rise block text-[clamp(3rem,11vw,7.5rem)]"
              style={{ animationDelay: "0.15s" }}
            >
              Beauty,
            </span>

            <span
              className="rise block text-[clamp(3rem,11vw,7.5rem)] italic"
              style={{ animationDelay: "0.28s" }}
            >
              made to
            </span>

            <span
              className="rise relative block w-fit text-[clamp(3rem,11vw,7.5rem)]"
              style={{ animationDelay: "0.41s" }}
            >
              measure.

              <span
                className="draw absolute -bottom-1 left-0 h-[4px] w-full bg-rose sm:h-[6px]"
                style={{ animationDelay: "1.15s" }}
              />
            </span>
          </h1>

          <p
            className="rise mt-8 max-w-md text-base leading-relaxed text-taupe md:text-lg"
            style={{ animationDelay: "0.54s" }}
          >
            A hair, colour and skin atelier where every appointment is composed
            by hand. No rush, no template — only you, considered.
          </p>

          <div
            className="rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.66s" }}
          >
            <a href="#visit" className="btn">
              Book your visit
            </a>

            <a href="#services" className="btn btn--ghost">
              View services
            </a>
          </div>

          <div
            className="rise mt-10 flex items-center gap-4 text-taupe"
            style={{ animationDelay: "0.78s" }}
          />
        </div>

        {/* PORTRAIT */}
        <div
          className="rise order-1 lg:order-2"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="relative">
            <div
              aria-hidden
              className="absolute -right-3 -top-3 h-full w-full border border-rose/50 sm:-right-4 sm:-top-4"
            />

            <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush sm:aspect-[5/6]">
              <img
                src={heroImage}
                alt="Salon portrait"
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;