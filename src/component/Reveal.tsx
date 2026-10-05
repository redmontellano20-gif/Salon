import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** stagger, in ms */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "figure" | "article";
};

/**
 * Fades + rises its children into view once, when scrolled near.
 * Falls back to visible immediately if IntersectionObserver is missing
 * or the user prefers reduced motion (handled in CSS).
 */
const Reveal = ({ children, delay = 0, className = "", as = "div" }: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  // Start visible when there's no IntersectionObserver (e.g. SSR / old
  // browsers); reduced-motion is handled in CSS.
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;