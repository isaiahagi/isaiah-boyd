# Isaiah Boyd — Portfolio

Source for [isaiahboyd.xyz](https://isaiahboyd.xyz): a dependency-free static site with a live ASCII-art background. Hand-written HTML, CSS and a little JavaScript. No build step.

## Structure

```
public/
  index.html        content and semantics
  styles.css        design tokens, layout, frame buttons, combobox, saved buttons
  bg.js             ASCII background engine (canvas glyph atlas; Ocean, Plasma, Rain, Off)
  hero.js           ASCII wordmark scramble, spinning ASCII basketball, role typewriter
  main.js           clock, reveal, counters, GitHub stats, copy buttons, combobox, pull-to-refresh
  img/sprite.svg    all icons as one SVG sprite (brand marks + Lucide UI icons)
  img/              avatar, Open Graph image, touch icon
  fonts/            DM Sans and JetBrains Mono (self-hosted, variable)
  data/github.json  fallback snapshot for the GitHub numbers
wrangler.jsonc      Cloudflare Workers static-assets config (serves ./public)
```

## Run locally

```sh
python -m http.server 4173 --directory public
```

Then open http://localhost:4173.

## Design notes

- Art direction: terminal-noir. Near-black, bone text, one ember accent (`--accent`), ASCII everywhere.
- **Background picker** (bottom-left combobox) switches the canvas scene. The choice is remembered in `localStorage`. The re-roll button, or pulling down at the top of the page on a touch device, re-seeds the scene and re-scrambles the wordmark.
- **Frame buttons** (`.fbtn`): corner brackets that grow into a full frame on hover and focus.
- **Saved buttons** (`.save`): the copy button morphs its icon into a check.
- Respects `prefers-reduced-motion`: static background frame, no typewriter, wordmark scramble or reveals.
- Works without JavaScript (content is plain HTML; only the background and effects need JS).

## Icons

Everything is one sprite, `public/img/sprite.svg`, referenced with `<use href="img/sprite.svg#id">`.

- `b-*` brand marks: [Simple Icons](https://simpleicons.org) (CC0), plus C# from [devicon](https://devicon.dev) (MIT), the JAX mark from [jax-ml/jax](https://github.com/jax-ml/jax) and the SGLang mark redrawn from [sgl-project/sglang](https://github.com/sgl-project/sglang) as a one-colour outline.
- `l-*` UI and concept icons: [Lucide](https://lucide.dev) (ISC).

Brand names and logos belong to their owners.

## Data

- Public repo count and followers load live from the public GitHub API (`api.github.com/users/isaiahagi`) and fall back to `public/data/github.json`.
- The clock uses the `America/New_York` time zone.

## Deploy

Cloudflare Workers serves `./public` as static assets (see `wrangler.jsonc`).

```sh
npx wrangler deploy
```
