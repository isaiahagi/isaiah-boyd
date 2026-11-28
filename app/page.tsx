import { DiscordProfile } from "@/components/discord-profile";
import { about, beliefs, discord, projects, site, socials, stack, work, writing, type Entry } from "@/lib/content";

function Entries({ items }: { items: Entry[] }) {
  return (
    <ul>
      {items.map(({ title, summary, href }) => (
        <li key={title}>
          {href ? <a href={href}>{title}</a> : title}: {summary}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main>
      <h2>{site.name}</h2>
      <p>I&apos;m a software engineer and game developer.</p>

      <DiscordProfile />

      <p>Some things about me:</p>
      <ul>
        {about.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p>Where I&apos;ve worked:</p>
      <ul>
        {work.map(({ org, title, summary, metric, links }) => (
          <li key={org}>
            <b>{org}</b>, {title}
            {metric && ` (${metric.value} ${metric.label})`}
            {links.map((link) => (
              <span key={link.href}>
                {" "}
                [<a href={link.href}>{link.label}</a>]
              </span>
            ))}
            {summary && (
              <ul>
                <li>{summary}</li>
              </ul>
            )}
          </li>
        ))}
      </ul>

      <p>Projects:</p>
      <Entries items={projects} />

      <p>Things I use and like:</p>
      <ul>
        {stack.map(({ group, items }) => (
          <li key={group}>
            {group}: {items.join(", ")}
          </li>
        ))}
      </ul>

      <p>Some things I believe:</p>
      <ul>
        {beliefs.map(({ title, note }) => (
          <li key={title}>
            {title}
            <ul>
              <li>{note}</li>
            </ul>
          </li>
        ))}
      </ul>

      <p>Writing:</p>
      <Entries items={writing} />

      <p>Contact:</p>
      <ul>
        <li>
          Email: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        {socials.map(({ label, handle, href }) => (
          <li key={label}>
            {label}: <a href={href}>{handle}</a>
          </li>
        ))}
        <li>Discord: {discord.username}</li>
      </ul>
    </main>
  );
}
