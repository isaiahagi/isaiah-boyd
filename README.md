# Isaiah Boyd — Portfolio

Source for my personal portfolio. A dependency-free static site: hand-written HTML, CSS and a little JavaScript, no build step.

## Structure

```
public/
  index.html      content and semantics
  styles.css      design tokens and layout
  main.js         scroll effects, hero dot field, and two small AI experiments
  fonts/          Geist and Geist Mono (self-hosted, variable)
  img/            Basketball Heroes logo, Open Graph image
wrangler.jsonc    Cloudflare Workers static-assets config (serves ./public)
```

## Run locally

```sh
python -m http.server 4173 --directory public
```

Then open http://localhost:4173.

## Deploy

Cloudflare Workers serves `./public` as static assets (see `wrangler.jsonc`).

```sh
npx wrangler deploy
```

## Notes

- Respects `prefers-reduced-motion`; all content is present without JavaScript.
- The quantization and tokenization panels in the research section are small browser-side illustrations, not benchmarks.
