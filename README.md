# Isaiah Boyd — Portfolio

Source for my personal portfolio: a dependency-free static site, hand-written HTML, CSS and a little JavaScript. No build step.

## Structure

```
public/
  index.html        content, semantics and the SVG icon sprite
  styles.css        design tokens (light + dark) and layout
  main.js           theme, command palette (Ctrl K), accordion, skin picker, GitHub data, lab demos
  lenis.min.js      Lenis smooth scrolling (MIT), vendored
  data/github.json  snapshot of GitHub stats and the contribution calendar
  fonts/            Geist and Geist Mono (self-hosted, variable)
  img/              avatar, Basketball Heroes banner, ball skins, project covers, Open Graph image
wrangler.jsonc      Cloudflare Workers static-assets config (serves ./public)
```

## Run locally

```sh
python -m http.server 4173 --directory public
```

Then open http://localhost:4173.

## Data

- Stats, repo stars and "recently pushed" load live from the public GitHub API and fall back to `public/data/github.json`.
- The contribution graph tries a live fetch from the public `github-contributions-api.jogruber.de` service (username only) and falls back to the snapshot.
- Refresh the snapshot with the GitHub CLI (`gh api users/isaiahagi`, `gh api graphql` for the contribution calendar).

## Deploy

Cloudflare Workers serves `./public` as static assets (see `wrangler.jsonc`).

```sh
npx wrangler deploy
```

## Notes

- Respects `prefers-reduced-motion` (no smooth scroll or reveal animations) and works without JavaScript.
- The quantization and tokenization panels are small browser-side illustrations, not benchmarks.
