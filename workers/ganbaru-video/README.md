# Ganbaru video Worker

One-click HLS playback for Ganbaru demo links in WikiLeighs.

## Architecture

- WikiLeighs' Markdown renderer replaces known BunnyCDN `playlist.m3u8` links with `/wikileighs/ganbaru-video/<uuid>`.
- This Worker owns `lgl.gg/wikileighs/ganbaru-video/*` and renders an HLS.js player.
- Manifest and segment requests are proxied to the fixed Ganbaru BunnyCDN origin with `Referer: https://app.ganbarumethod.com/` added server-side.
- The Worker accepts only UUID video IDs and safe relative HLS asset paths; it is not a general-purpose proxy.
- The route sits inside the existing Cloudflare Access application for `lgl.gg/wikileighs/*`, which restricts access to Leigh.
- No Ganbaru account token, cookie, OAuth material, or WikiLeighs secret is stored in the Worker.

## Verify locally

```bash
cd workers/ganbaru-video
node test.mjs
npx wrangler deploy --dry-run -c wrangler.jsonc
npx wrangler dev -c wrangler.jsonc --port 8790
```

Then request a known player and manifest through `http://localhost:8790/wikileighs/ganbaru-video/<uuid>`.

## Deploy

Wrangler OAuth authorization is stored locally outside the repository.

```bash
cd workers/ganbaru-video
npx wrangler deploy -c wrangler.jsonc
```

After deployment, verify that an unauthenticated request receives a Cloudflare Access redirect, then test playback in an authenticated browser.
