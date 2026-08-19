import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

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
  assert.doesNotMatch(source, /font-family\s*:[^;}]*\b(?:Switzer|Geist Mono|Fraunces|Archivo)\b/i);
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
