import { useSite } from "../site/site-context";
import { buildNav } from "../site/nav";
import Brand from "./Brand";

const Footer = () => {
  const { settings } = useSite();

  const nav = buildNav(settings);

  const socialLinks = [
    {
      name: "Facebook",
      url: settings.facebook_url,
    },
    {
      name: "Instagram",
      url: settings.instagram_url,
    },
    {
      name: "TikTok",
      url: settings.tiktok_url,
    },
  ];

  return (
    <footer className="bg-ink px-5 pt-20 pb-8 text-pearl sm:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">

          {/* BRAND */}

          <div>
            <a
              href="#top"
              className="text-4xl"
              aria-label={`${settings.brand_name} — home`}
            >
              <Brand
                name={settings.brand_name}
              />
            </a>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-pearl/60">
              A Hair &amp; Beauty atelier.
              Composed by hand, by appointment.
            </p>
          </div>

          {/* EXPLORE */}

          <nav aria-label="Footer">
            <h3 className="text-[0.68rem] uppercase tracking-[0.24em] text-pearl/45">
              Explore
            </h3>

            <ul className="mt-5 space-y-3 text-sm">
              {nav.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="ul-link text-pearl/85 hover:text-rose"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* VISIT */}

          <div>
            <h3 className="text-[0.68rem] uppercase tracking-[0.24em] text-pearl/45">
              Visit
            </h3>

            <address className="mt-5 space-y-3 text-sm not-italic text-pearl/85">
              <p>
                {settings.address_1}

                <br />

                {settings.address_2}
              </p>

              <p>
                {settings.hours_1}

                <br />

                by appointment
              </p>
            </address>
          </div>

          {/* FOLLOW */}

          <div>
            <h3 className="text-[0.68rem] uppercase tracking-[0.24em] text-pearl/45">
              Follow
            </h3>

            <ul className="mt-5 space-y-3 text-sm">
              {socialLinks.map(
                (social) => (
                  <li key={social.name}>
                    {social.url ? (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ul-link text-pearl/85 hover:text-rose"
                        aria-label={`${settings.brand_name} on ${social.name}`}
                      >
                        {social.name}
                      </a>
                    ) : (
                      <span className="text-pearl/40">
                        {social.name}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* SEPARATOR */}

        <div className="seam mt-16 mb-8 text-pearl/40">
          <span className="seam__node" />
        </div>

        {/* BOTTOM */}

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-pearl/45 sm:flex-row">
          <p>
            © 2026{" "}
            {settings.brand_name}. All
            rights reserved.
          </p>

          <p className="flex gap-5">
            <a
              href="#"
              className="ul-link hover:text-pearl/80"
            >
              Privacy
            </a>

            <a
              href="#"
              className="ul-link hover:text-pearl/80"
            >
              Terms
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;