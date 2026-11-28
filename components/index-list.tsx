"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { Entry } from "@/lib/content";

/** Linked rows with one highlight that glides to whichever row is hovered or focused. */
export function IndexList({ items }: { items: Entry[] }) {
  const [active, setActive] = useState<string | null>(null);
  const layoutId = useId();

  return (
    <ul className="-my-4" onPointerLeave={() => setActive(null)}>
      {items.map(({ title, summary, meta, href }) => {
        const external = href?.startsWith("http");
        const Arrow = external ? ArrowUpRight : ArrowRight;
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-medium leading-snug tracking-tight">{title}</h3>
              <span className="flex shrink-0 items-center gap-3">
                <span className="label">{meta}</span>
                <span className="grid w-4 place-items-center">
                  {href && (
                    <Arrow
                      aria-hidden
                      strokeWidth={1.5}
                      className={`size-4 text-faint transition duration-300 group-hover:text-fg ${
                        external
                          ? "group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          : "group-hover:translate-x-1"
                      }`}
                    />
                  )}
                </span>
              </span>
            </div>
            <p className="mt-1 max-w-[30rem] pr-7 text-muted">{summary}</p>
          </>
        );

        return (
          <li
            key={title}
            className="relative isolate border-b border-line last:border-b-0"
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(href ? title : null)}
          >
            <AnimatePresence>
              {active === title && (
                <motion.span
                  aria-hidden
                  layoutId={layoutId}
                  className="absolute -inset-x-3 inset-y-0 -z-10 bg-wash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 44 }}
                />
              )}
            </AnimatePresence>
            {href ? (
              <a
                href={href}
                className="group block py-4"
                onFocus={() => setActive(title)}
                onBlur={() => setActive(null)}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {body}
              </a>
            ) : (
              <div className="py-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
