import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { isAllowedOutput } from './recovery-manifest.mjs';

const SENSITIVE_PATH_PATTERNS = Object.freeze([
  /(?:^|\/)\.env(?:\.|$)/i,
  /(?:^|\/)(?:id_rsa|id_ed25519)(?:\.|$)/i,
  /(?:^|\/)[^/]*(?:^|[-_.])(?:secret|credentials?|api[-_]?key|access[-_]?token)(?:[-_.]|$)[^/]*$/i,
  /\.(?:key|p12|pem|pfx)$/i,
]);

export function auditPaths(paths) {
  const violations = [];

  for (const path of paths) {
    const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '');
    const isSensitive = SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
    if (isSensitive || !isAllowedOutput(normalized)) violations.push(path);
  }

  return { violations };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  const { violations } = auditPaths(paths);

  if (violations.length > 0) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Privacy audit passed (${paths.length} tracked files).\n`);
  }
}
