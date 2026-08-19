import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import {
  DYNAMIC_PUBLIC_PATHS,
  ROUTE_MAP,
  isAllowedOutput,
} from './recovery-manifest.mjs';

const HTML_ATTRIBUTES = Object.freeze([
  ['a', 'href'],
  ['audio', 'src'],
  ['iframe', 'src'],
  ['img', 'src'],
  ['link', 'href'],
  ['script', 'src'],
  ['source', 'src'],
  ['track', 'src'],
  ['video', 'poster'],
  ['video', 'src'],
]);

function normalizeReference(raw, baseUrl) {
  if (!raw || /^(?:data|blob|mailto|tel|javascript):/i.test(raw)) return null;

  try {
    const url = new URL(raw, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== baseUrl.origin) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function collectCssReferences(css, baseUrl) {
  const references = [];
  const pattern = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

  for (const match of css.matchAll(pattern)) {
    const reference = normalizeReference(match[2], baseUrl);
    if (reference) references.push(reference);
  }

  return references;
}

export function collectReferences(content, contentType, baseUrl) {
  const references = [];

  if (/text\/css/i.test(contentType)) {
    return collectCssReferences(content, baseUrl);
  }

  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) return references;

  const $ = cheerio.load(content);
  for (const [selector, attribute] of HTML_ATTRIBUTES) {
    $(selector).each((_, element) => {
      const reference = normalizeReference($(element).attr(attribute), baseUrl);
      if (reference) references.push(reference);
    });
  }

  $('[srcset]').each((_, element) => {
    const candidates = ($(element).attr('srcset') ?? '').split(',');
    for (const candidate of candidates) {
      const reference = normalizeReference(candidate.trim().split(/\s+/)[0], baseUrl);
      if (reference) references.push(reference);
    }
  });

  $('[style]').each((_, element) => {
    references.push(...collectCssReferences($(element).attr('style') ?? '', baseUrl));
  });

  return [...new Map(references.map((reference) => [reference.href, reference])).values()];
}

function outputPathFor(url, routeMap) {
  const mappedRoute = routeMap.find(({ urlPath }) => urlPath === url.pathname);
  if (mappedRoute) return mappedRoute.outputPath;

  const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (decodedPath.startsWith('assets/') || decodedPath.startsWith('mockups/')) {
    return decodedPath;
  }

  if (/^[^/]+\.(?:css|html|js|json|svg|webmanifest)$/i.test(decodedPath)) {
    return `mockups/${decodedPath}`;
  }
  return null;
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--origin') options.origin = value;
    if (key === '--destination') options.destination = value;
  }
  return options;
}

export async function mirrorSite({
  origin,
  destination,
  routeMap = ROUTE_MAP,
  assetPaths = routeMap === ROUTE_MAP ? DYNAMIC_PUBLIC_PATHS : [],
  fetchImpl = fetch,
  requestTimeoutMs = 20_000,
}) {
  const siteOrigin = new URL(origin);
  const queue = [
    ...routeMap.map(({ urlPath }) => new URL(urlPath, siteOrigin)),
    ...assetPaths.map((urlPath) => new URL(urlPath, siteOrigin)),
  ];
  const visited = new Set();
  const report = { written: [], failed: [], external: [], excluded: [] };

  while (queue.length > 0) {
    const url = queue.shift();
    url.hash = '';
    const requestKey = url.href;
    if (visited.has(requestKey)) continue;
    visited.add(requestKey);

    const relativeOutput = outputPathFor(url, routeMap);
    if (!relativeOutput || !isAllowedOutput(relativeOutput)) {
      report.excluded.push(url.href);
      continue;
    }

    const controller = new AbortController();
    let timeout;
    let loaded;
    try {
      loaded = await Promise.race([
        (async () => {
          const response = await fetchImpl(url.href, { signal: controller.signal });
          if (!response.ok) return { response };

          const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
          const isText = /^text\/|javascript|json|xml/i.test(contentType);
          const body = isText
            ? await response.text()
            : new Uint8Array(await response.arrayBuffer());
          return { response, contentType, isText, body };
        })(),
        new Promise((_, reject) => {
          timeout = setTimeout(() => {
            const error = new Error(`Request timed out after ${requestTimeoutMs}ms`);
            controller.abort(error);
            reject(error);
          }, requestTimeoutMs);
        }),
      ]);
    } catch (error) {
      report.failed.push({ url: url.href, reason: error.message });
      continue;
    } finally {
      clearTimeout(timeout);
    }

    if (!loaded.response.ok) {
      report.failed.push({ url: url.href, status: loaded.response.status });
      continue;
    }

    const outputFile = path.resolve(destination, relativeOutput);
    await mkdir(path.dirname(outputFile), { recursive: true });

    if (loaded.isText) {
      await writeFile(outputFile, loaded.body, 'utf8');
      for (const reference of collectReferences(loaded.body, loaded.contentType, url)) {
        const referenceOutput = outputPathFor(reference, routeMap);
        if (referenceOutput && isAllowedOutput(referenceOutput)) queue.push(reference);
        else report.excluded.push(reference.href);
      }
    } else {
      await writeFile(outputFile, loaded.body);
    }

    report.written.push(relativeOutput);
  }

  report.written = [...new Set(report.written)].sort();
  report.failed = report.failed.sort((left, right) => left.url.localeCompare(right.url));
  report.excluded = [...new Set(report.excluded)].sort();
  await writeFile(
    path.resolve(destination, 'recovery-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { origin, destination } = parseArguments(process.argv.slice(2));
  if (!origin || !destination) {
    throw new Error('Usage: node scripts/mirror-live-site.mjs --origin <url> --destination <path>');
  }

  const report = await mirrorSite({ origin, destination });
  process.stdout.write(`${JSON.stringify({
    written: report.written.length,
    failed: report.failed.length,
    excluded: report.excluded.length,
  })}\n`);
  if (report.failed.length > 0) process.exitCode = 1;
}
