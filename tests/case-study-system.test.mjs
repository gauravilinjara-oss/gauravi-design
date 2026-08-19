import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const cases = [
  'case-podonos.html', 'case-fxonline.html', 'case-smarttrade.html',
  'case-business.html', 'case-mashreq.html', 'case-googlehealth.html',
];

test('shared shell applies only one desktop content offset', async () => {
  const css = await readFile('mockups/case-editorial.css', 'utf8');
  assert.match(css, /\.case-study\s*\{[^}]*padding-left:0;/s,
    'editorial body neutralizes the legacy sidebar padding');
  assert.match(css, /\.case-study main\{margin-left:var\(--case-rail\)\}/,
    'the variable-driven main offset remains authoritative');
});

test('project accent is inherited and consumed by editorial chrome', async () => {
  const css = await readFile('mockups/case-editorial.css', 'utf8');
  assert.doesNotMatch(css, /--case-accent\s*:/,
    'shared body must not shadow the project root accent');
  assert.match(css,
    /\.case-study\[data-case-accent\] header\.hero \.eyebrow\{color:var\(--case-accent\)\}/,
    'the inherited project accent is visible in introduction chrome');
});

test('editorial cards stay flat after the sidebar stylesheet loads', async () => {
  const css = await readFile('mockups/case-editorial.css', 'utf8');
  assert.match(css,
    /\.case-study\[data-case-accent\] :is\(\.cards \.card,\.themes \.theme,\.voices \.voice\)\{background:#fff;box-shadow:none\}/,
    'generic editorial cards override later decorative surfaces');
  assert.match(css,
    /\.case-study\[data-case-accent\] :is\(\.cards \.card,\.themes \.theme,\.voices \.voice\):hover\{background:#fff;box-shadow:none;transform:none\}/,
    'generic editorial cards do not lift on hover');
  assert.match(css,
    /\.case-study\[data-case-accent\] \.impact-sky \.imp\{background:#fff;box-shadow:none\}/,
    'impact cards override the later elevated base state');
  assert.match(css,
    /\.case-study\[data-case-accent\] \.impact-sky \.imp:hover\{background:#fff;box-shadow:none;transform:none\}/,
    'impact hover cannot restore gradient, shadow, or lift');
});

for (const name of cases) {
  test(`${name} uses the shared editorial shell`, async () => {
    const html = await readFile(`mockups/${name}`, 'utf8');
    const $ = cheerio.load(html);
    assert.ok($('body').hasClass('case-study'), 'case-study body class');
    assert.equal($('link[href^="case-editorial.css"]').length, 1, 'editorial stylesheet');
    assert.equal($('header.hero[data-nav-label="Overview"]').length, 1, 'one editorial introduction');
    assert.ok($('section .sec-head').length >= 6, 'narrative chapters');
    assert.ok($('[data-case-accent]').length === 1, 'one project accent hook');
    assert.equal(new Set($('section[id]').map((_, el) => $(el).attr('id')).get()).size,
      $('section[id]').length, 'unique section ids');
  });
}
