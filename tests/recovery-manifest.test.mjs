import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUTE_MAP,
  isAllowedOutput,
  EXCLUDED_SEGMENTS,
} from '../scripts/recovery-manifest.mjs';

test('maps every production route to an authored file', () => {
  const routes = new Map(ROUTE_MAP.map(({ urlPath, outputPath }) => [urlPath, outputPath]));

  assert.equal(routes.get('/'), 'mockups/meadow-ship.html');
  assert.equal(routes.get('/work.html'), 'mockups/work.html');
  assert.equal(routes.get('/beyond.html'), 'mockups/beyond.html');
  assert.equal(routes.get('/lab'), 'mockups/lab.html');
  assert.equal(routes.get('/blog.html'), 'mockups/blog.html');
  assert.equal(routes.get('/blog'), 'mockups/blog.html');
  assert.equal(routes.get('/case-googlehealth.html'), 'mockups/case-googlehealth.html');
});

test('rejects private and temporary deployment paths', () => {
  for (const segment of EXCLUDED_SEGMENTS) {
    assert.equal(isAllowedOutput(`${segment}/private.txt`), false, segment);
  }

  assert.equal(isAllowedOutput('mockups/work.html'), true);
  assert.equal(isAllowedOutput('assets/images/work.webp'), true);
  assert.equal(isAllowedOutput('api/chat.js'), true);
});
