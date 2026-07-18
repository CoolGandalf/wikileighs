const ROUTE_PREFIX = '/wikileighs/ganbaru-video/';
const CDN_ORIGIN = 'https://vz-ef9c225d-d9c.b-cdn.net';
const GANBARU_REFERER = 'https://app.ganbarumethod.com/';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ASSET_PATH_RE = /^[A-Za-z0-9._~!$&'()+,;=:@%/-]+$/;

function textResponse(text, status = 200, extraHeaders = {}) {
  return new Response(text, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function playerPage(uuid) {
  const source = `${ROUTE_PREFIX}${uuid}/hls/playlist.m3u8`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ganbaru demo · WikiLeighs</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #071521; color: #f5f7f8; }
    main { width: min(100%, 1050px); padding: 20px; }
    .frame { overflow: hidden; border: 1px solid #294052; border-radius: 14px; background: #000; box-shadow: 0 18px 60px #0009; }
    video { display: block; width: 100%; max-height: 78vh; background: #000; }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 13px; }
    button { border: 1px solid #5d7486; border-radius: 7px; background: #102534; color: inherit; padding: 8px 13px; cursor: pointer; }
    #status { color: #a9bac6; font-size: 0.9rem; text-align: right; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js" crossorigin="anonymous"></script>
</head>
<body>
  <main>
    <div class="frame"><video id="video" controls playsinline preload="metadata"></video></div>
    <div class="bar"><button type="button" onclick="history.back()">← Back to WikiLeighs</button><span id="status">Loading video…</span></div>
  </main>
  <script>
    const video = document.getElementById('video');
    const status = document.getElementById('status');
    const source = ${JSON.stringify(source)};
    function ready() { status.textContent = 'Ready'; }
    function failed(detail) { status.textContent = 'Video failed to load' + (detail ? ': ' + detail : '.'); }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', ready, { once: true });
      video.addEventListener('error', () => failed(), { once: true });
    } else if (window.Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, ready);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) failed(data.details || data.type);
      });
    } else {
      failed('this browser does not support HLS playback');
    }
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'content-security-policy': "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; media-src 'self' blob:; connect-src 'self' blob:; img-src 'self' data:; base-uri 'none'; frame-ancestors 'self'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  });
}

function rewriteManifest(text, uuid, assetPath) {
  const basePath = assetPath.includes('/') ? assetPath.slice(0, assetPath.lastIndexOf('/') + 1) : '';
  const proxy = (uri) => {
    if (uri.startsWith('data:') || uri.startsWith('blob:')) return uri;
    try {
      const absolute = new URL(uri, `${CDN_ORIGIN}/${uuid}/${basePath}`);
      if (absolute.origin !== CDN_ORIGIN) return uri;
      const prefix = `/${uuid}/`;
      if (!absolute.pathname.startsWith(prefix)) return uri;
      return `${ROUTE_PREFIX}${uuid}/hls/${absolute.pathname.slice(prefix.length)}${absolute.search}`;
    } catch {
      return uri;
    }
  };
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line && !line.startsWith('#')) return proxy(line.trim());
      return line.replace(/URI="([^"]+)"/g, (_match, uri) => `URI="${proxy(uri)}"`);
    })
    .join('\n');
}

async function proxyAsset(request, uuid, assetPath, search = '') {
  if (!assetPath || assetPath.includes('..') || assetPath.startsWith('/') || !SAFE_ASSET_PATH_RE.test(assetPath)) {
    return textResponse('Invalid media path.', 400);
  }

  const upstreamUrl = `${CDN_ORIGIN}/${uuid}/${assetPath}${search}`;
  const upstreamHeaders = new Headers({
    referer: GANBARU_REFERER,
    accept: request.headers.get('accept') || '*/*',
    'user-agent': 'WikiLeighs Ganbaru Player/1.0',
  });
  const range = request.headers.get('range');
  if (range) upstreamHeaders.set('range', range);

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'follow',
  });

  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('access-control-allow-origin', 'https://lgl.gg');
  headers.set('vary', 'Range');
  headers.set('x-content-type-options', 'nosniff');

  const contentType = upstream.headers.get('content-type') || '';
  const isManifest = assetPath.endsWith('.m3u8') || contentType.includes('mpegurl');
  if (isManifest && upstream.ok && request.method !== 'HEAD') {
    const rewritten = rewriteManifest(await upstream.text(), uuid, assetPath);
    headers.delete('content-length');
    headers.set('content-type', 'application/vnd.apple.mpegurl');
    headers.set('cache-control', 'private, max-age=300');
    return new Response(rewritten, { status: upstream.status, headers });
  }

  headers.set('cache-control', upstream.ok ? 'private, max-age=86400' : 'no-store');
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return textResponse('Method not allowed.', 405, { allow: 'GET, HEAD' });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith(ROUTE_PREFIX)) return textResponse('Not found.', 404);
    const parts = url.pathname.slice(ROUTE_PREFIX.length).split('/').filter(Boolean);
    const uuid = parts.shift() || '';
    if (!UUID_RE.test(uuid)) return textResponse('Invalid video ID.', 404);

    if (parts.length === 0) return request.method === 'HEAD' ? new Response(null, { status: 200 }) : playerPage(uuid);
    if (parts.shift() !== 'hls') return textResponse('Not found.', 404);
    return proxyAsset(request, uuid, parts.join('/'), url.search);
  },
};

export { rewriteManifest };
