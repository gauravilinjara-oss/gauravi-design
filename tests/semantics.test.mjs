import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

for (const file of [
  'mockups/meadow-ship.html',
  'mockups/beyond.html',
  'mockups/lab.html',
  'mockups/blog.html',
  'mockups/case-googlehealth.html',
]) {
  test(`${file} has coherent landmarks and names`, async () => {
    const $ = cheerio.load(await readFile(file, 'utf8'));
    assert.equal($('h1').length, 1, 'one H1');
    assert.equal($('main').length, 1, 'one main');
    assert.ok($('footer').length <= 1, 'at most one footer');
    $('a,button,input,textarea,select,[role="button"]').each((_, element) => {
      const node = $(element);
      const name = `${node.text()} ${node.attr('aria-label') ?? ''} ${node.attr('title') ?? ''}`.trim();
      assert.ok(name, `${element.tagName} is unnamed`);
    });
  });
}
