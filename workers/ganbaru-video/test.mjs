import assert from 'node:assert/strict';
import worker, { rewriteManifest } from './src/worker.mjs';

const UUID = '76387a63-49be-4487-948b-31ee38c20cb3';
const BASE = `https://lgl.gg/wikileighs/ganbaru-video/${UUID}`;

async function run() {
  let response = await worker.fetch(new Request('https://lgl.gg/wikileighs/ganbaru-video/not-a-uuid'));
  assert.equal(response.status, 404);

  response = await worker.fetch(new Request(BASE));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, new RegExp(`${UUID}/hls/playlist\\.m3u8`));
  assert.match(html, /hls\.js/);
  assert.match(response.headers.get('content-security-policy'), /cdn\.jsdelivr\.net/);

  response = await worker.fetch(new Request(BASE, { method: 'POST' }));
  assert.equal(response.status, 405);

  const originalFetch = globalThis.fetch;
  let observed;
  globalThis.fetch = async (url, options) => {
    observed = { url, options };
    return new Response('#EXTM3U\n352x240/video.m3u8\n#EXT-X-MAP:URI="init.mp4"\n', {
      status: 200,
      headers: { 'content-type': 'application/vnd.apple.mpegurl' },
    });
  };
  try {
    response = await worker.fetch(new Request(`${BASE}/hls/playlist.m3u8`, { headers: { range: 'bytes=0-99' } }));
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(observed.url, `https://vz-ef9c225d-d9c.b-cdn.net/${UUID}/playlist.m3u8`);
  assert.equal(observed.options.headers.get('referer'), 'https://app.ganbarumethod.com/');
  assert.equal(observed.options.headers.get('range'), 'bytes=0-99');
  assert.equal(response.status, 200);
  const manifest = await response.text();
  assert.match(manifest, new RegExp(`${UUID}/hls/352x240/video\\.m3u8`));
  assert.match(manifest, new RegExp(`URI="/wikileighs/ganbaru-video/${UUID}/hls/init\\.mp4"`));

  const absolute = rewriteManifest(
    `#EXTM3U\nhttps://vz-ef9c225d-d9c.b-cdn.net/${UUID}/1080p/video.m3u8\n`,
    UUID,
    'playlist.m3u8',
  );
  assert.match(absolute, new RegExp(`${UUID}/hls/1080p/video\\.m3u8`));

  console.log('ganbaru worker tests PASS');
}

await run();
