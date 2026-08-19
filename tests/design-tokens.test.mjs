import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const caseAssets = [
  'assets/case/case-bo-ix.css',
  'assets/case/case-fx-ix.css',
  'assets/case/case-st-ix.css',
];

async function portfolioSources({ includePrototype = false } = {}) {
  const files = (await readdir('mockups'))
    .filter((name) => /\.(?:css|html)$/.test(name))
    .filter((name) => includePrototype || name !== 'gh-redesign.html')
    .map((name) => `mockups/${name}`)
    .concat(caseAssets);
  return Promise.all(files.map(async (path) => ({ path, source: await readFile(path, 'utf8') })));
}

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  return channels.reduce((sum, value, index) => {
    const linear = value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    return sum + linear * [.2126, .7152, .0722][index];
  }, 0);
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + .05) / (dark + .05);
}

test('defines the shared visual and motion tokens', async () => {
  const css = await readFile('mockups/tokens.css', 'utf8');
  for (const declaration of [
    '--font-display: Satoshi, system-ui, sans-serif',
    '--font-mono: Satoshi, system-ui, sans-serif',
    '--ink: #16202b',
    '--surface: #f4f7fc',
    '--sun: #ffc93c',
    '--link: #2f6cb8',
    '--motion-fast: 160ms',
    '--motion-standard: 260ms',
    '--motion-expressive: 500ms',
    '--hit-target: 44px',
  ]) assert.ok(css.toLowerCase().includes(declaration.toLowerCase()), declaration);
});

test('uses Satoshi as the single portfolio family', async () => {
  const css = await readFile('mockups/tokens.css', 'utf8');
  for (const declaration of [
    '--font-display: Satoshi, system-ui, sans-serif',
    '--font-text: Satoshi, system-ui, sans-serif',
    '--font-accent: Satoshi, system-ui, sans-serif',
    '--font-mono: Satoshi, system-ui, sans-serif',
  ]) assert.ok(css.includes(declaration), declaration);

  const files = (await readdir('mockups'))
    .filter((name) => /\.(?:css|html)$/.test(name));
  const source = (await Promise.all([
    ...files.map((name) => `mockups/${name}`),
    'assets/case/case-bo-ix.css',
    'assets/case/case-fx-ix.css',
    'assets/case/case-st-ix.css',
  ].map((path) => readFile(path, 'utf8')))).join('\n');
  assert.equal(source.match(/\b(?:Switzer|Geist\s*Mono|Fraunces|Archivo)\b/i)?.[0], undefined);
});

test('small editorial text meets WCAG AA contrast on both shared surfaces', async () => {
  const css = await readFile('mockups/case-editorial.css', 'utf8');
  const faint = css.match(/--case-faint:\s*(#[\da-f]{6})/i)?.[1];
  const sidebar = css.match(/--case-sidebar:\s*(#[\da-f]{6})/i)?.[1];
  const canvas = css.match(/--case-canvas:\s*(#[\da-f]{6})/i)?.[1];

  assert.ok(faint && sidebar && canvas, 'shared editorial color tokens are defined');
  assert.ok(contrast(faint, sidebar) >= 4.5, `${faint} on ${sidebar} must reach 4.5:1`);
  assert.ok(contrast(faint, canvas) >= 4.5, `${faint} on ${canvas} must reach 4.5:1`);
});

test('every Satoshi declaration uses the canonical sans fallback stack', async () => {
  const failures = [];
  for (const { path, source } of await portfolioSources({ includePrototype: true })) {
    for (const match of source.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
      if (!/\bSatoshi\b/i.test(match[1])) continue;
      const blockStart = source.lastIndexOf('{', match.index);
      const selector = source.slice(source.lastIndexOf('}', blockStart) + 1, blockStart);
      if (/@font-face/i.test(selector)) continue;
      const normalized = match[1].replace(/["']/g, '').replace(/\s+/g, '').toLowerCase();
      const canonical = normalized === 'satoshi,system-ui,sans-serif'
        || /^var\(--[^,]+,satoshi,system-ui,sans-serif\)$/.test(normalized);
      if (!canonical) {
        const line = source.slice(0, match.index).split('\n').length;
        failures.push(`${path}:${line} (${match[1].trim()})`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('portfolio headings preserve their HTML casing', async () => {
  const files = (await readdir('mockups'))
    .filter((name) => /\.(?:css|html)$/.test(name));
  const source = (await Promise.all([
    ...files.map((name) => `mockups/${name}`),
    'assets/case/case-bo-ix.css',
    'assets/case/case-fx-ix.css',
    'assets/case/case-st-ix.css',
  ].map((path) => readFile(path, 'utf8')))).join('\n');
  assert.equal(
    source.match(/(?:^|})\s*[^{}]*\bh[1-4]\b[^{}]*\{[^{}]*text-transform\s*:\s*lowercase/i)?.[0],
    undefined,
  );
});

test('portfolio typography stays within the imported Satoshi weights', async () => {
  const failures = [];
  for (const { path, source } of await portfolioSources()) {
    const page = path.endsWith('.html') ? cheerio.load(source) : null;
    const styles = page
      ? page('style').map((_, style) => page(style).html()).get().join('\n')
      : source;
    for (const match of styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = match[1].trim();
      const declaration = match[2];
      const nativeGoogleArtifact = path === 'mockups/case-googlehealth.html'
        && /(?:^|[\s,.])\.mat(?:[\s.:#>+~]|$)/.test(selector)
        && !/\bSatoshi\b/i.test(declaration);
      if (nativeGoogleArtifact) continue;
      for (const weight of declaration.matchAll(/font-weight\s*:\s*(\d{3})\b/gi)) {
        if (!['400', '500', '600'].includes(weight[1])) {
          failures.push(`${path}: ${selector} (${weight[1]})`);
        }
      }
      for (const weight of declaration.matchAll(/["']wght["']\s+(\d{3})\b/gi)) {
        if (!['400', '500', '600'].includes(weight[1])) {
          failures.push(`${path}: ${selector} (wght ${weight[1]})`);
        }
      }
    }

    if (path.endsWith('.html')) {
      const $ = cheerio.load(source);
      $('[style*="font-weight"]').each((_, element) => {
        const value = $(element).attr('style').match(/font-weight\s*:\s*(\d{3})\b/i)?.[1];
        if (!value || ['400', '500', '600'].includes(value)) return;
        if (path === 'mockups/case-googlehealth.html' && $(element).closest('.mat').length) return;
        failures.push(`${path}: inline ${element.tagName} (${value})`);
      });
    }
  }
  assert.deepEqual(failures, []);
});

test('the standalone Google Health prototype scopes its native typeface to its artifact root', async () => {
  const html = await readFile('mockups/gh-redesign.html', 'utf8');
  const $ = cheerio.load(html);
  assert.ok($('body').hasClass('m3'), 'the product-native scope is the standalone artifact root');
  assert.match($('style').first().html(), /\.m3\s*\{[^}]*font-family:'Roboto Flex',Roboto,system-ui,sans-serif/s);
});

test('the public type specimen documents the shipped Satoshi range', async () => {
  const html = await readFile('mockups/site-info.html', 'utf8');
  assert.match(html, /Satoshi[^<]*400\s*→\s*600/);
  assert.doesNotMatch(html, /Satoshi[^<]*400\s*→\s*900/);
});

test('portfolio heading overrides retain the editorial weight hierarchy', async () => {
  const files = (await readdir('mockups'))
    .filter((name) => /\.(?:css|html)$/.test(name))
    .filter((name) => !['case-googlehealth.html', 'gh-redesign.html'].includes(name));
  const source = (await Promise.all([
    ...files.map((name) => `mockups/${name}`),
    'assets/case/case-bo-ix.css',
    'assets/case/case-fx-ix.css',
    'assets/case/case-st-ix.css',
  ].map((path) => readFile(path, 'utf8')))).join('\n');
  assert.equal(source.match(/\bh1\b[^{}]*\{[^{}]*font-weight\s*:\s*(?!400\b)\d+/i)?.[0], undefined);
  assert.equal(source.match(/\bh[2-4]\b[^{}]*\{[^{}]*font-weight\s*:\s*(?!500\b)\d+/i)?.[0], undefined);
});

test('shared controls do not use Arial or transition all', async () => {
  const css = await Promise.all([
    'mockups/nav.css',
    'mockups/buttons.css',
    'mockups/footer.css',
  ].map((file) => readFile(file, 'utf8')));
  assert.doesNotMatch(css.join('\n'), /font-family\s*:\s*Arial/i);
  assert.doesNotMatch(css.join('\n'), /transition\s*:\s*all(?:\s|;)/i);
});
