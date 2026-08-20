import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import * as cheerio from 'cheerio';

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
    '$71M BOOKED.',
  ]) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, />\s*0 YEARS\./);
  assert.doesNotMatch(html, /\$71M IN REVENUE/i);
});

test('uses one canonical positioning statement', async () => {
  const canonical = 'Senior product designer for AI-native products.';
  for (const file of ['mockups/meadow-ship.html', 'mockups/beyond.html']) {
    assert.ok((await readFile(file, 'utf8')).includes(canonical), file);
  }
});

test('uses substantiated impact claims in the quick overview', async () => {
  const html = await readFile('mockups/quick.html', 'utf8');
  const text = cheerio.load(html).text().replace(/\s+/g, ' ');
  assert.ok(html.includes('$71M booked'));
  assert.ok(html.includes('262M AED'));
  assert.ok(text.includes('3×faster task completion'));
  assert.doesNotMatch(html, /\$71m impact/i);
  assert.doesNotMatch(html, /40%[^<]*faster approvals/i);
});

test('lab heading matches its fifteen playable experiments', async () => {
  const html = await readFile('mockups/lab.html', 'utf8');
  const $ = cheerio.load(html);
  assert.match($('h1').html().replace(/<br\s*\/?\s*>/i, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), /^fifteen playable ideas\./i);
  assert.equal((html.match(/^\s*\['[IVX]+'/gm) ?? []).length, 15);
});

test('shared footer names the typeface actually in use', async () => {
  const source = await readFile('mockups/footer.js', 'utf8');
  assert.match(source, /Satoshi \+ React/);
  assert.doesNotMatch(source, /switzer/i);
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

test('case studies keep openings and reflections concise and outcome-led', async () => {
  const cases = [
    'case-podonos.html',
    'case-fxonline.html',
    'case-smarttrade.html',
    'case-business.html',
    'case-mashreq.html',
    'case-googlehealth.html',
  ];
  const stalePhrases = [
    'The bet behind it.',
    'This wasn\'t',
    'And the work isn\'t finished',
    'not just screens',
    'designed for confidence',
    'designed for trust',
  ];

  for (const name of cases) {
    const html = await readFile(`mockups/${name}`, 'utf8');
    const $ = cheerio.load(html);
    const opening = $('#overview p').first().text().replace(/\s+/g, ' ').trim();
    assert.ok(opening.length > 0, `${name}: editorial opening`);
    assert.ok(opening.split(/\s+/).length <= 45, `${name}: opening exceeds 45 words`);

    const reflectionParagraphs = $('#reflection p')
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    assert.ok(reflectionParagraphs.length <= 2, `${name}: reflection exceeds two paragraphs`);
    for (const paragraph of reflectionParagraphs) {
      assert.ok(paragraph.split(/\s+/).length <= 50, `${name}: reflection paragraph exceeds 50 words`);
    }

    const narrativeParagraphs = $('section p')
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    for (const paragraph of narrativeParagraphs) {
      assert.ok(paragraph.split(/\s+/).length <= 50, `${name}: narrative paragraph exceeds 50 words`);
    }

    for (const phrase of stalePhrases) {
      assert.ok(!$.text().includes(phrase), `${name}: remove repeated phrase "${phrase}"`);
    }
  }
});
