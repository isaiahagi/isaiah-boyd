import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell grid min-h-dvh content-center gap-4">
      <p className="label">404</p>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">This page does not exist.</h1>
      <Link href="/" className="group inline-flex w-max items-center gap-1.5 py-2 text-muted hover:text-fg">
        <ArrowLeft aria-hidden strokeWidth={1.5} className="size-4 transition-transform group-hover:-translate-x-0.5" />
        <span className="link-line">Back home</span>
      </Link>
    </main>
  );
}
