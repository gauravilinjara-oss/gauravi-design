import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('Google Health manifest references existing local icons', async () => {
  const manifestPath = resolve(root, 'mockups/gh-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  for (const icon of manifest.icons) {
    assert.doesNotMatch(icon.src, /^(?:https?:)?\/\//, 'manifest icons must remain local');
    await access(resolve(dirname(manifestPath), icon.src));
  }
});
