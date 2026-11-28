# isaiahboyd.xyz

My personal site. Next.js (static export), React, TypeScript and a little Tailwind CSS. Plain browser
styles in Times New Roman. The Discord profile loads from [Lanyard](https://github.com/Phineas/lanyard).

## Develop

```sh
npm install
npm run dev
```

`npm run build` writes the site to `out/` and `npm run typecheck` checks types.
`npm run preview` builds and serves it through the Worker.

## Edit content

Everything on the home page is in [`lib/content.ts`](lib/content.ts).

## Structure

```
app/          layout, home page, 404, share image, global styles
components/   Discord profile
lib/          page content
public/       images, and the Learn AI guide in public/learnai (plain HTML)
worker.js     visitor counter, benchmarks API and the learnai subdomain
```

## Deploy

Cloudflare Workers Builds deploys pushes to `main`. `wrangler.jsonc` runs
`npm run build` and uploads `out/`. To deploy by hand: `npm run deploy`.
