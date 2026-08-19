import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPaths } from '../scripts/audit-tracked-files.mjs';

test('reports secrets and excluded source paths', () => {
  const result = auditPaths([
    'mockups/work.html',
    '.env.local',
    'Resumes/private.pdf',
    '.agents/config.md',
  ]);

  assert.deepEqual(result.violations, [
    '.env.local',
    'Resumes/private.pdf',
    '.agents/config.md',
  ]);
});

test('allows the explicit reproducible project files', () => {
  const result = auditPaths([
    'api/chat.js',
    'assets/favicon.svg',
    'mockups/meadow-ship.html',
    'playwright.config.mjs',
    'recovery-report.json',
    'vercel.json',
  ]);

  assert.deepEqual(result.violations, []);
});
