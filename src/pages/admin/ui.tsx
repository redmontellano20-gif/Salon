/* Small shared UI kit for the admin — a clean, utilitarian take on the
   house palette (pearl surfaces, ink text, rose accents, Jost type).
   Non-component helpers (cx, date formatters) live in ./utils so this
   file exports only components + styling constants. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export const inputClass =
  "w-full rounded-md border border-line bg-pearl px-3 py-2 text-sm text-ink placeholder:text-taupe/55 focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20 transition";

export const labelClass =
  "block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-taupe mb-1.5";

type BtnVariant = "primary" | "ghost" | "danger" | "subtle";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium uppercase tracking-[0.12em] transition disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<BtnVariant, string> = {
    primary: "bg-ink text-pearl hover:bg-rose-deep",
    ghost: "border border-line text-ink hover:border-ink",
    danger: "border border-rose-deep/40 text-rose-deep hover:bg-rose-deep hover:text-white",
    subtle: "text-taupe hover:text-ink",
  };
  return <button className={cx(base, variants[variant], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-lg border border-line bg-cream", className)}>{children}</div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-16 text-center text-sm text-taupe">{label}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-cream/50 px-6 py-16 text-center text-sm text-taupe">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2rem] leading-none text-ink">{title}</h1>
        {sub ? <p className="mt-2 text-sm text-taupe">{sub}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-rose/15 text-rose-deep",
  confirmed: "bg-ink/10 text-ink",
  archived: "bg-taupe/15 text-taupe",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cx(
        "inline-block rounded-full px-2.5 py-0.5 text-[0.66rem] font-medium uppercase tracking-wider",
        STATUS_STYLES[status] ?? "bg-taupe/15 text-taupe"
      )}
    >
      {status}
    </span>
  );
}

