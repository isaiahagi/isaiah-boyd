# Isaiah Boyd — Portfolio

Source for my personal portfolio: a dependency-free static site, hand-written HTML, CSS and a little JavaScript. No build step.

Palm Coast, FL. The page header shows the real local time and weather, and a pixel sky that follows both.

## Structure

```
public/
  index.html        content, semantics and the SVG icon sprite
  styles.css        design tokens and layout
  main.js           pixel sky + weather, ball polaroids, skin picker, GitHub data, lab demos
  lenis.min.js      Lenis smooth scrolling (MIT), vendored
  data/github.json  snapshot of GitHub stats and the contribution calendar
  fonts/            DM Sans and Caveat (self-hosted, variable)
  img/              avatar, Basketball Heroes banner, ball skins, project icons, Open Graph image
wrangler.jsonc      Cloudflare Workers static-assets config (serves ./public)
```

## Run locally

```sh
python -m http.server 4173 --directory public
```

Then open http://localhost:4173.

## Data

- Current conditions come from the National Weather Service (`api.weather.gov`, free, no key; only fixed Palm Coast coordinates are used) and refresh every 15 minutes while the page is open. Sunrise and sunset are computed locally. If NWS is unreachable, the sky falls back to a time-of-day sky.
- Stars, repo count and followers load live from the public GitHub API and fall back to `public/data/github.json`.
- The contribution graph tries a live fetch from `github-contributions-api.jogruber.de` (username only) and falls back to the snapshot.
- Refresh the snapshot with the GitHub CLI (`gh api users/isaiahagi`, `gh api graphql` for the contribution calendar).

## Deploy

Cloudflare Workers serves `./public` as static assets (see `wrangler.jsonc`).

```sh
npx wrangler deploy
```

## Notes

- Respects `prefers-reduced-motion` (static sky, no smooth scroll or reveals) and works without JavaScript.
- The quantization and tokenization panels are small browser-side illustrations, not benchmarks.
