"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { sections, type SectionId } from "@/lib/content";

/** The last section whose top has passed the upper third of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current: SectionId | null = null;
      for (const { id } of sections) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= window.innerHeight / 3) current = id;
      }
      setActive(atEnd ? "contact" : current);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return active;
}

export function Header() {
  const active = useActiveSection();

  // keep the current item visible when the nav scrolls sideways on small screens
  useEffect(() => {
    const link = document.querySelector<HTMLElement>('header nav a[aria-current="location"]');
    const strip = link?.closest("nav");
    if (!link || !strip) return;
    strip.scrollTo({ left: link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-x-6 md:flex-nowrap">
        <a href="#top" className="flex h-12 items-center font-mono text-xs tracking-tight md:h-14">
          isaiahboyd<span className="text-faint">.xyz</span>
        </a>

        <motion.nav
          layoutScroll
          aria-label="Sections"
          className="relative order-3 -mx-5 w-[calc(100%+2.5rem)] overflow-x-auto px-3 [scrollbar-width:none] md:order-none md:mx-0 md:ml-auto md:w-auto md:px-0"
        >
          <ul className="flex w-max">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  className="relative block px-2 py-3 text-[0.8125rem] text-faint transition-colors hover:text-fg aria-[current]:text-fg md:py-[1.0625rem]"
                >
                  {label}
                  {active === id && (
                    <motion.span
                      layoutId="nav-marker"
                      className="absolute inset-x-2 bottom-0 h-px bg-fg"
                      transition={{ type: "spring", stiffness: 500, damping: 42 }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
