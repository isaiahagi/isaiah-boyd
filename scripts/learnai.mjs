// Builds the Learn AI pages from their markdown files.
//   node scripts/learnai.mjs            writes index.html and pro.html
//   node scripts/learnai.mjs --embeds   also fetches link previews missing from embeds.json
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../public/learnai/", import.meta.url);
const read = (name) => readFileSync(new URL(name, dir), "utf8").replace(/\r\n/g, "\n");
const embeds = existsSync(new URL("embeds.json", dir)) ? JSON.parse(read("embeds.json")) : {};

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// links, bold, italic and code. code is set aside first so nothing inside it is touched
function inline(text) {
  const code = [];
  return text
    .replace(/`([^`]+)`/g, (_, c) => `\0${code.push(`<code>${escape(c)}</code>`) - 1}\0`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\0(\d+)\0/g, (_, i) => code[i]);
}

// a line that starts with a bare url becomes a preview card, with any text after it underneath
function embed(url, note) {
  const { title, description, image } = embeds[url] ?? {};
  const { hostname, pathname } = new URL(url);
  const site = hostname.replace(/^www\./, "");
  const card = [
    `<a class="embed" href="${escape(url)}">`,
    `<span class="site"><img src="https://www.google.com/s2/favicons?domain=${hostname}&amp;sz=32" alt="" width="16" height="16" loading="lazy">${site}</span>`,
    `<b>${escape(title || (site + pathname).replace(/\/$/, ""))}</b>`,
    description && `<span class="about">${escape(description)}</span>`,
    image && `<img class="preview" src="${escape(image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`,
    "</a>",
    note && `<p class="note">${inline(note)}</p>`,
  ];
  return card.filter(Boolean).join("\n");
}

// covers the markdown these pages use: headings with {#id}, paragraphs, flat lists, quotes,
// fenced code, images with a caption on the next line, link embeds and raw html blocks
function render(markdown) {
  const blocks = [];
  const contents = [];
  const lines = markdown.split("\n");
  // collects the following lines while they match
  const take = (start, test) => {
    let end = start;
    while (end < lines.length && test(lines[end])) end++;
    return [lines.slice(start, end), end];
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    let match, group;
    if (!line.trim()) {
      i++;
    } else if (line.startsWith("```")) {
      [group, i] = take(i + 1, (l) => !l.startsWith("```"));
      blocks.push(`<pre><code>${escape(group.join("\n"))}</code></pre>`);
      i++;
    } else if (line.startsWith("<")) {
      [group, i] = take(i, (l) => l.trim());
      blocks.push(group.join("\n"));
    } else if ((match = line.match(/^(#{1,3}) (.+?)(?: \{#([\w-]+)\})?$/))) {
      const [, hashes, text, id] = match;
      const level = hashes.length;
      if (level === 2 && id) contents.push(`<li><a href="#${id}">${inline(text)}</a></li>`);
      blocks.push(`<h${level}${id ? ` id="${id}"` : ""}>${inline(text)}</h${level}>`);
      i++;
    } else if ((match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      const [, alt, src] = match;
      [group, i] = take(i + 1, (l) => l.trim());
      blocks.push(`<figure><a href="${src}"><img src="${src}" alt="${escape(alt)}" loading="lazy"></a><figcaption>${inline(group.join(" "))}</figcaption></figure>`);
    } else if ((match = line.match(/^(https?:\/\/\S+)(?: (.+))?$/))) {
      blocks.push(embed(match[1], match[2]));
      i++;
    } else if ((match = line.match(/^(-|\d+\.) /))) {
      const bullet = match[1] === "-";
      const marker = bullet ? /^- / : /^\d+\. /;
      [group, i] = take(i, (l) => marker.test(l));
      const tag = bullet ? "ul" : "ol";
      blocks.push(`<${tag}>\n${group.map((l) => `<li>${inline(l.replace(marker, ""))}</li>`).join("\n")}\n</${tag}>`);
    } else if (line.startsWith("> ")) {
      [group, i] = take(i, (l) => l.startsWith("> "));
      blocks.push(`<blockquote>${inline(group.map((l) => l.slice(2)).join(" "))}</blockquote>`);
    } else {
      // the first line always belongs to the paragraph, so the loop always moves forward
      [group, i] = take(i + 1, (l) => l.trim() && !/^(#|- |\d+\. |> |```|<|!\[|https?:)/.test(l));
      blocks.push(`<p>${inline([line, ...group].join(" "))}</p>`);
    }
  }

  // the contents list goes right before the first section
  const first = blocks.findIndex((b) => b.startsWith("<h2"));
  blocks.splice(first, 0, `<nav aria-label="Contents">\n<p>Contents:</p>\n<ul>\n${contents.join("\n")}\n</ul>\n</nav>`);
  return blocks.join("\n\n");
}

const pages = [
  { name: "index", script: "visitors.js" },
  { name: "pro", script: "benchmarks.js" },
].map((page) => {
  const [, head, body] = read(`${page.name}.md`).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(head.split("\n").map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]));
  return { ...page, meta, body };
});

if (process.argv.includes("--embeds")) {
  const urls = new Set(pages.flatMap((p) => [...p.body.matchAll(/^(https?:\/\/\S+)/gm)].map((m) => m[1])));
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", ndash: "–", mdash: "—" };
  const decode = (s) =>
    s.replace(/&(#x?[\da-f]+|\w+);/gi, (all, e) =>
      e[0] === "#" ? String.fromCodePoint(Number(e.slice(1).replace(/^x/i, "0x"))) : (entities[e] ?? all),
    );
  for (const url of urls) {
    if (embeds[url]) continue;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; link-preview)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const html = await res.text();
      const tags = {};
      for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
        const key = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
        const value = tag.match(/content=(["'])([\s\S]*?)\1/i)?.[2];
        if (key && value) tags[key.toLowerCase()] ??= decode(value).trim();
      }
      const title = tags["og:title"] || decode(html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? "").trim();
      const image = tags["og:image"] && new URL(tags["og:image"], res.url);
      embeds[url] = {
        title,
        description: tags["og:description"] || tags.description || "",
        image: image?.protocol === "https:" ? image.href : "",
      };
      console.log("ok  ", url, "-", title);
    } catch (error) {
      console.log("fail", url, "-", error.message);
    }
  }
  writeFileSync(new URL("embeds.json", dir), JSON.stringify(embeds, null, 2) + "\n");
}

// the saved values are the same as `discord` in lib/content.ts. discord.js replaces them with live ones
const discordId = "1313630076809510975";
const profile = `https://discord.com/users/${discordId}`;
const cdn = "https://cdn.discordapp.com";
const header = `<header>
<p>made by <a href="${profile}">Isaiah</a> (<a href="https://x.com/IsaiahSrc">@IsaiahSrc</a>)</p>
<a id="discord" href="${profile}" data-id="${discordId}">
<span class="avatar">
<img data-avatar src="${cdn}/avatars/${discordId}/f60eb94a10a34a6d68a7e6ffe139410a.png?size=160" alt="My Discord avatar" width="80" height="80">
<img data-decoration src="${cdn}/avatar-decoration-presets/a_33656b7ed12cde00c1826b654cf65590.png?size=240&amp;passthrough=true" alt="" width="96" height="96">
</span>
<span><b data-name>isaiah</b><br><span data-username>isaiahbd</span> on Discord<span data-status></span></span>
</a>
<p>more questions? dm me on discord <a href="${profile}"><strong>@isaiahbd</strong></a>, i'm happy to answer questions about AI/LLMs or anything.</p>
</header>`;

for (const { name, script, meta, body } of pages) {
  writeFileSync(
    new URL(`${name}.html`, dir),
    `<!doctype html>
<!-- generated from ${name}.md by scripts/learnai.mjs. edit the markdown, not this file -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(meta.description)}">
<title>${escape(meta.title)}</title>
<link rel="icon" href="https://isaiahboyd.xyz/favicon.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
${header}
<main>
${render(body)}
</main>
<footer><p><a href="#">back to top ↑</a></p></footer>
<script src="discord.js"></script>
<script src="${script}"></script>
</body>
</html>
`,
  );
}
