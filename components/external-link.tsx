import { ArrowUpRight } from "lucide-react";

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1 py-1.5 font-mono text-xs text-muted transition-colors hover:text-fg"
    >
      <span className="link-line">{children}</span>
      <ArrowUpRight
        aria-hidden
        strokeWidth={1.5}
        className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
