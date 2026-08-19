import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = [
  'mockups/meadow-ship.html',
  'mockups/work.html',
  'mockups/beyond.html',
  'mockups/blog.html',
];

test('uses canonical global navigation language', async () => {
  for (const file of core) {
    const html = await readFile(file, 'utf8');
    for (const label of ['work', 'about', 'art lab']) {
      assert.ok(html.toLowerCase().includes(label), `${file}: ${label}`);
    }
    assert.doesNotMatch(html, />\s*lil(?:&nbsp;|\s)+about(?:&nbsp;|\s)+me\s*</i);
  }
});

test('ships final credibility values in initial HTML', async () => {
  const html = await readFile('mockups/meadow-ship.html', 'utf8');
  for (const value of [
    '6 YEARS.',
    '3 COUNTRIES.',
    '15+ PROJECTS.',
    '$71M IN REVENUE.',
  ]) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, />\s*0 YEARS\./);
});

test('uses one canonical positioning statement', async () => {
  const canonical = 'Design engineer building AI-native products—from research and product design through working code.';
  for (const file of ['mockups/meadow-ship.html', 'mockups/beyond.html']) {
    assert.ok((await readFile(file, 'utf8')).includes(canonical), file);
  }
});
