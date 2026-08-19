import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('defines the shared visual and motion tokens', async () => {
  const css = await readFile('mockups/tokens.css', 'utf8');
  for (const declaration of [
    '--font-display: Switzer, system-ui, sans-serif',
    '--font-mono: "Geist Mono", ui-monospace, Menlo, "SF Mono", monospace',
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

test('shared controls do not use Arial or transition all', async () => {
  const css = await Promise.all([
    'mockups/nav.css',
    'mockups/buttons.css',
    'mockups/footer.css',
  ].map((file) => readFile(file, 'utf8')));
  assert.doesNotMatch(css.join('\n'), /font-family\s*:\s*Arial/i);
  assert.doesNotMatch(css.join('\n'), /transition\s*:\s*all(?:\s|;)/i);
});
