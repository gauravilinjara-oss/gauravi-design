import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { ROUTE_MAP } from '../scripts/recovery-manifest.mjs';

for (const { urlPath, outputPath } of ROUTE_MAP) {
  test(`recovers ${urlPath} as ${outputPath}`, async () => {
    await access(outputPath);
    const html = await readFile(outputPath, 'utf8');
    assert.match(html, /<!doctype html>|<html/i);
  });
}
