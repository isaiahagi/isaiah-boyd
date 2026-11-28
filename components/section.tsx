import { sections, type SectionId } from "@/lib/content";

type Props = { id: SectionId; title: string; children: React.ReactNode };

/** Editorial two-column row: a sticky numbered label in the margin, content beside it. */
export function Section({ id, title, children }: Props) {
  const number = String(sections.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="grid scroll-mt-20 grid-cols-1 gap-7 border-t border-line py-14 md:scroll-mt-14 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8 md:py-20"
    >
      <div>
        <h2 id={`${id}-title`} className="label flex gap-3 leading-6 md:sticky md:top-24">
          <span aria-hidden>{number}</span>
          <span className="text-fg">{title}</span>
        </h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
