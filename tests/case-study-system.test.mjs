import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const cases = [
  'case-podonos.html', 'case-fxonline.html', 'case-smarttrade.html',
  'case-business.html', 'case-mashreq.html', 'case-googlehealth.html',
];

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
