import { useSite } from "../site/site-context";
import Reveal from "../component/Reveal";

const AboutUs = () => {
  const { settings } = useSite();

  const aboutImage =
    settings.about_image?.trim() || "";

  const smallImage =
    settings.about_small_image?.trim() || "";

  const eyebrow =
    settings.about_eyebrow?.trim() ||
    "The Atelier";

  const title =
    settings.about_title?.trim() ||
    "A quiet room on";

  const titleAccent =
    settings.about_title_accent?.trim() ||
    "Rue de la Lumière";

  const description1 =
    settings.about_description_1?.trim() ||
    "Maison Rosé began with a simple idea: a salon should feel personal, calm and made around you.";

  const description2 =
    settings.about_description_2?.trim() ||
    "Every appointment is given the time and attention it deserves. Hair, colour and care are thoughtfully created for every person who visits.";

  const hasImages =
    Boolean(aboutImage) || Boolean(smallImage);

  return (
    <section
      id="about"
      className="overflow-hidden bg-pearl px-5 py-20 sm:px-8 md:py-28 lg:py-32"
    >
      <div
        className={`mx-auto grid max-w-[1180px] items-center gap-14 ${
          hasImages
            ? "lg:grid-cols-[0.95fr_1.05fr] lg:gap-20"
            : "lg:grid-cols-1"
        }`}
      >
        {/* IMAGES */}

        {hasImages ? (
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto w-full max-w-[560px]">

              {/* MAIN IMAGE */}

              {aboutImage ? (
                <>
                  {/* Decorative frame */}

                  <div
                    aria-hidden
                    className="absolute -left-3 -top-3 h-full w-full border border-rose/50 sm:-left-4 sm:-top-4"
                  />

                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={aboutImage}
                      alt={`${
                        settings.brand_name?.trim() ||
                        "Salon"
                      } interior`}
                      className="h-full w-full object-cover transition duration-700 hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                </>
              ) : null}

              {/* SMALL IMAGE */}

              {smallImage ? (
                <div
                  className={
                    aboutImage
                      ? "absolute -bottom-8 -right-4 z-10 hidden w-40 overflow-hidden border-4 border-pearl bg-pearl shadow-xl sm:block md:w-52"
                      : "mx-auto w-full max-w-[360px] overflow-hidden border-4 border-pearl bg-pearl shadow-xl"
                  }
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={smallImage}
                      alt={`${
                        settings.brand_name?.trim() ||
                        "Salon"
                      } detail`}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : null}

            </div>
          </Reveal>
        ) : null}

        {/* CONTENT */}

        <Reveal
          className={
            hasImages
              ? "order-1 lg:order-2"
              : "mx-auto w-full max-w-[700px]"
          }
          delay={80}
        >
          <div
            className={
              hasImages
                ? "max-w-[570px]"
                : "mx-auto max-w-[700px] text-center"
            }
          >
            <p className="eyebrow">
              {eyebrow}
            </p>

            <h2 className="mt-4 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.01em] text-ink">
              {title}

              {titleAccent ? (
                <>
                  <br />

                  <span className="italic">
                    {titleAccent}
                  </span>
                </>
              ) : null}
            </h2>

            <div
              className={`mt-8 h-px w-14 bg-rose ${
                hasImages
                  ? ""
                  : "mx-auto"
              }`}
            />

            <div className="mt-8 space-y-5 text-base leading-[1.8] text-taupe md:text-[1.05rem]">

              {description1 ? (
                <p>{description1}</p>
              ) : null}

              {description2 ? (
                <p>{description2}</p>
              ) : null}

            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
};

export default AboutUs;