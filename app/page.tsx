import { ArrowUp } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { ExternalLink } from "@/components/external-link";
import { Header } from "@/components/header";
import { IndexList } from "@/components/index-list";
import { LocalTime } from "@/components/local-time";
import { Section } from "@/components/section";
import { about, beliefs, discord, projects, site, socials, stack, work, writing } from "@/lib/content";

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

const contactRow = "grid min-h-12 grid-cols-[6rem_1fr] items-center border-b border-line sm:grid-cols-[8rem_1fr]";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <span id="top" />
      <Header />

      <main id="main" className="shell">
        <div className="grid grid-cols-1 gap-7 pb-14 pt-12 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8 md:pb-20 md:pt-24">
          <div className="rise">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/avatar-mii.webp"
              alt="Isaiah Boyd's Mii avatar"
              width={64}
              height={64}
              className="size-16 border border-line bg-wash grayscale transition duration-500 hover:grayscale-0"
            />
          </div>
          <div>
            <h1
              className="rise text-[clamp(2.75rem,9vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em]"
              style={delay(60)}
            >
              {site.name}
            </h1>
            <p
              className="rise mt-5 max-w-[30rem] text-xl leading-snug tracking-[-0.015em] text-muted"
              style={delay(120)}
            >
              Software engineer and game developer, building <span className="text-fg">VR games</span>,{" "}
              <span className="text-fg">web software</span> and <span className="text-fg">AI tools</span>.
            </p>
            <p className="rise label mt-6 flex flex-wrap gap-x-5" style={delay(180)}>
              <span>{site.location}</span>
              <LocalTime />
            </p>
          </div>
        </div>

        <Section id="about" title="About">
          <div className="max-w-[34rem] space-y-4 text-base text-muted">
            {about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Section>

        <Section id="work" title="Work">
          <ol className="-my-6">
            {work.map((role) => (
              <li
                key={role.org}
                className="grid gap-x-8 gap-y-2 border-b border-line py-6 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_8rem]"
              >
                <div>
                  <h3 className="text-lg font-medium leading-snug tracking-tight">{role.org}</h3>
                  <p className="label mt-1">{role.title}</p>
                  {role.summary && <p className="mt-3 max-w-[28rem] text-muted">{role.summary}</p>}
                  <ul className="mt-1.5 flex flex-wrap gap-x-5">
                    {role.links.map((link) => (
                      <li key={link.href}>
                        <ExternalLink href={link.href}>{link.label}</ExternalLink>
                      </li>
                    ))}
                  </ul>
                </div>
                {role.metric && (
                  <p className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                    <span className="font-mono text-2xl leading-tight tracking-tighter tabular-nums">
                      {role.metric.value}
                    </span>
                    <span className="label">{role.metric.label}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="projects" title="Projects">
          <IndexList items={projects} />
        </Section>

        <Section id="stack" title="Stack">
          <dl className="-my-3">
            {stack.map(({ group, items }) => (
              <div
                key={group}
                className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="label leading-6">{group}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-5 font-mono text-[0.8125rem] leading-6 text-muted">
                    {items.map((item) => (
                      <li key={item} className="transition-colors hover:text-fg">
                        {item}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="beliefs" title="Beliefs">
          <ol className="space-y-9">
            {beliefs.map(({ title, note }) => (
              <li key={title}>
                <h3 className="text-[1.375rem] font-medium leading-snug tracking-[-0.025em]">{title}</h3>
                <p className="mt-2 max-w-[30rem] text-muted">{note}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="writing" title="Writing">
          <IndexList items={writing} />
        </Section>

        <Section id="contact" title="Contact">
          <p className="max-w-[30rem] text-muted">Email is the best way to reach me.</p>
          <div className="mt-3 flex items-center gap-1">
            <a
              href={`mailto:${site.email}`}
              className="link-line min-w-0 break-all text-[clamp(1.125rem,5.4vw,2rem)] font-medium tracking-[-0.035em]"
            >
              {site.email}
            </a>
            <CopyButton value={site.email} label="Copy email address" />
          </div>

          <dl className="mt-10 border-t border-line">
            {socials.map(({ label, handle, href }) => (
              <div key={label} className={contactRow}>
                <dt className="label">{label}</dt>
                <dd>
                  <ExternalLink href={href}>{handle}</ExternalLink>
                </dd>
              </div>
            ))}
            <div className={contactRow}>
              <dt className="label">Discord</dt>
              <dd className="flex items-center gap-1 font-mono text-xs text-muted">
                {discord}
                <CopyButton value={discord} label="Copy Discord username" />
              </dd>
            </div>
          </dl>
        </Section>
      </main>

      <footer className="shell">
        <div className="flex items-center justify-between border-t border-line pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          <p className="label">
            © {new Date().getFullYear()} {site.name}
          </p>
          <a href="#top" className="label group inline-flex items-center gap-1.5 py-2 transition-colors hover:text-fg">
            Top
            <ArrowUp
              aria-hidden
              strokeWidth={1.5}
              className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </footer>
    </>
  );
}
