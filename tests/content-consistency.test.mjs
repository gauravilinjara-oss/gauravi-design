import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

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
  const canonical = 'Design engineer building AI-native products, from research and product design through working code.';
  for (const file of ['mockups/meadow-ship.html', 'mockups/beyond.html']) {
    assert.ok((await readFile(file, 'utf8')).includes(canonical), file);
  }
});

test('does not use em dashes in portfolio copy or metadata', async () => {
  const roots = ['mockups', 'assets'];
  const failures = [];
  const emDash = String.fromCodePoint(0x2014);
  const namedEntity = `&m${'dash'};`;
  const numericEntity = /&#(?:0*8212|x0*2014);/i;

  for (const root of roots) {
    const entries = await readdir(root, { recursive: true });
    for (const entry of entries) {
      if (!/\.(?:html|css|js|json|md)$/i.test(entry)) continue;
      const file = `${root}/${entry}`;
      const source = await readFile(file, 'utf8');
      if (source.includes(emDash) || source.includes(namedEntity) || numericEntity.test(source)) {
        failures.push(file);
      }
    }
  }

  assert.deepEqual(failures, []);
});
