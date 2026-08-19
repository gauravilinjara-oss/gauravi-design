import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  collectReferences,
  mirrorSite,
} from '../scripts/mirror-live-site.mjs';

test('collects same-origin HTML assets and pages without mail or external links', () => {
  const html = [
    '<link href="/assets/site.css">',
    '<img src="/assets/hero.webp">',
    '<a href="/work.html">Work</a>',
    '<a href="mailto:a@b.com">Mail</a>',
    '<script src="https://cdn.example/x.js"></script>',
  ].join('');

  const refs = collectReferences(
    html,
    'text/html',
    new URL('https://gauravi.design/'),
  ).map(String);

  assert.deepEqual(refs.sort(), [
    'https://gauravi.design/assets/hero.webp',
    'https://gauravi.design/assets/site.css',
    'https://gauravi.design/work.html',
  ]);
});

test('collects url references from CSS', () => {
  const refs = collectReferences(
    '.hero{background:url("../images/sky.webp")}',
    'text/css',
    new URL('https://gauravi.design/assets/css/site.css'),
  );

  assert.equal(String(refs[0]), 'https://gauravi.design/assets/images/sky.webp');
});

test('mirrors a route and its same-origin assets to deterministic paths', async () => {
  const destination = await mkdtemp(path.join(tmpdir(), 'gauravi-mirror-'));
  const responses = new Map([
    ['https://gauravi.design/', new Response('<link href="/assets/site.css"><img src="/assets/hero.webp">', { headers: { 'content-type': 'text/html' } })],
    ['https://gauravi.design/assets/site.css', new Response('body{color:#16202b}', { headers: { 'content-type': 'text/css' } })],
    ['https://gauravi.design/assets/hero.webp', new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/webp' } })],
  ]);

  try {
    const report = await mirrorSite({
      origin: 'https://gauravi.design',
      destination,
      routeMap: [{ urlPath: '/', outputPath: 'mockups/meadow-ship.html' }],
      fetchImpl: async (url) => {
        const response = responses.get(String(url));
        if (!response) return new Response('Not found', { status: 404 });
        return response.clone();
      },
    });

    assert.deepEqual(report.failed, []);
    assert.deepEqual(report.written.sort(), [
      'assets/hero.webp',
      'assets/site.css',
      'mockups/meadow-ship.html',
    ]);
    assert.match(await readFile(path.join(destination, 'mockups/meadow-ship.html'), 'utf8'), /site\.css/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});
