export const ROUTE_MAP = Object.freeze([
  { urlPath: '/', outputPath: 'mockups/meadow-ship.html' },
  { urlPath: '/work.html', outputPath: 'mockups/work.html' },
  { urlPath: '/beyond.html', outputPath: 'mockups/beyond.html' },
  { urlPath: '/lab', outputPath: 'mockups/lab.html' },
  { urlPath: '/blog.html', outputPath: 'mockups/blog.html' },
  { urlPath: '/blog', outputPath: 'mockups/blog.html' },
  { urlPath: '/quick.html', outputPath: 'mockups/quick.html' },
  { urlPath: '/case-podonos.html', outputPath: 'mockups/case-podonos.html' },
  { urlPath: '/case-fxonline.html', outputPath: 'mockups/case-fxonline.html' },
  { urlPath: '/case-smarttrade.html', outputPath: 'mockups/case-smarttrade.html' },
  { urlPath: '/case-business.html', outputPath: 'mockups/case-business.html' },
  { urlPath: '/case-mashreq.html', outputPath: 'mockups/case-mashreq.html' },
  { urlPath: '/case-googlehealth.html', outputPath: 'mockups/case-googlehealth.html' },
  { urlPath: '/bridging', outputPath: 'mockups/bridging.html' },
  { urlPath: '/artofmaking', outputPath: 'mockups/making.html' },
  { urlPath: '/site-info', outputPath: 'mockups/site-info.html' },
  { urlPath: '/health', outputPath: 'mockups/gh-redesign.html' },
]);

export const ALLOWED_ROOTS = Object.freeze([
  'api',
  'assets',
  'mockups',
  'tests',
  'scripts',
  'docs',
]);

export const EXCLUDED_SEGMENTS = Object.freeze([
  '.agents',
  '.claude',
  '.superpowers',
  'Resumes',
  'job-search',
  '_fxcheck_tmp',
  '.archive',
  '.responsive-backup',
  '.unify-backup',
  '_backup-cinematic-20260722',
  '_migration-backup',
  'Mashreq screenshots',
]);

const ALLOWED_ROOT_FILES = new Set([
  '.gitignore',
  'README.md',
  'package-lock.json',
  'package.json',
  'recovery-report.json',
  'vercel.json',
]);

export function isAllowedOutput(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
  const segments = normalized.split('/');

  if (segments.some((part) => part.startsWith('.fuse_hidden'))) return false;
  if (EXCLUDED_SEGMENTS.some((part) => normalized === part || normalized.startsWith(`${part}/`))) {
    return false;
  }

  return ALLOWED_ROOTS.includes(segments[0]) || ALLOWED_ROOT_FILES.has(normalized);
}
