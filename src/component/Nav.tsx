import { useEffect, useState } from "react";
import { useSite } from "../site/site-context";
import { buildNav, splitNav } from "../site/nav";
import Brand from "./Brand";

const Nav = () => {
  const { settings } = useSite();
  const { links, book } = splitNav(buildNav(settings));
  const bookLabel = book?.label ?? "Book";
  const bookHref = book?.href ?? "#visit";

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll + close on Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "bg-pearl/85 backdrop-blur-md border-b border-line"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 sm:px-8 md:py-5">
          {/* Left — desktop links */}
          <ul className="hidden flex-1 items-center gap-8 text-[0.78rem] uppercase tracking-[0.18em] text-ink lg:flex">
            {links.slice(0, 3).map((l) => (
              <li key={l.key}>
                <a href={l.href} className="ul-link transition-colors hover:text-rose-deep">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Center — wordmark */}
          <a
            href="#top"
            aria-label={`${settings.brand_name} — home`}
            className="text-2xl md:text-[1.7rem] lg:flex-none lg:text-center"
          >
            <Brand name={settings.brand_name} />
          </a>

          {/* Right — desktop links + CTA */}
          <div className="hidden flex-1 items-center justify-end gap-8 lg:flex">
            {links.slice(3).map((l) => (
              <a
                key={l.key}
                href={l.href}
                className="ul-link text-[0.78rem] uppercase tracking-[0.18em] text-ink transition-colors hover:text-rose-deep"
              >
                {l.label}
              </a>
            ))}
            <a href={bookHref} className="btn !px-6 !py-3">
              {bookLabel}
            </a>
          </div>

          {/* Mobile — hamburger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden"
          >
            <span
              className={`h-px w-7 bg-ink transition-all duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-7 bg-ink transition-all duration-300 ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-px w-7 bg-ink transition-all duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-ink text-pearl transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-full flex-col px-8 pb-12 pt-24">
          <ul className="flex flex-col divide-y divide-pearl/10">
            {links.map((l, i) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 font-display text-[clamp(1.6rem,6.5vw,2.15rem)] leading-none text-pearl transition-colors hover:text-rose"
                  style={{
                    transitionDelay: open ? `${90 + i * 50}ms` : "0ms",
                    opacity: open ? 1 : 0,
                    transform: open ? "none" : "translateY(10px)",
                    transitionProperty: "opacity, transform, color",
                    transitionDuration: "500ms",
                  }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={bookHref}
            onClick={() => setOpen(false)}
            className="btn btn--on-dark mt-10 self-start"
          >
            {bookLabel} an appointment
          </a>
          <p className="mt-auto text-sm tracking-wide text-pearl/60">
            {settings.address_1} · Open {settings.hours_1?.split("·")[0]?.trim() || "Tue–Sun"}
          </p>
        </div>
      </div>
    </>
  );
};

export default Nav;
