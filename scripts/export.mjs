/**
 * Builds the static release into out/.
 *
 * A static folder cannot answer a POST, so the contact endpoint is moved aside
 * for the duration of the build and put back afterwards. The forms already know
 * to fall back to a mailto link in this mode.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const API = path.join(ROOT, 'src', 'app', 'api');
const PARKED = path.join(ROOT, '.api.parked');
const OUT = path.join(ROOT, 'out');
const NEXT_CACHE = path.join(ROOT, '.next');

const MOVED = [
  ['/imprint', '/impressum/'],
  ['/privacy', '/datenschutz/'],
  ['/accessibility', '/barrierefreiheit/'],
];

function restore() {
  if (fs.existsSync(PARKED)) {
    fs.rmSync(API, { recursive: true, force: true });
    fs.renameSync(PARKED, API);
  }
}

process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(1);
});

try {
  fs.rmSync(OUT, { recursive: true, force: true });
  // Avoid stale generated route validators referencing API files while they
  // are parked for the static-only build.
  fs.rmSync(NEXT_CACHE, { recursive: true, force: true });
  if (fs.existsSync(API)) fs.renameSync(API, PARKED);

  execSync('next build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_STATIC: '1' },
  });
} finally {
  restore();
}

// Netlify, Cloudflare Pages and anything else that reads _redirects
fs.writeFileSync(
  path.join(OUT, '_redirects'),
  MOVED.map(([from, to]) => `${from}  ${to}  301`).join('\n') + '\n',
);

// Apache
fs.writeFileSync(
  path.join(OUT, '.htaccess'),
  [
    'Options -MultiViews',
    'RewriteEngine On',
    ...MOVED.map(([from, to]) => `RewriteRule ^${from.slice(1)}/?$ ${to} [R=301,L]`),
    '',
    '<IfModule mod_expires.c>',
    '  ExpiresActive On',
    '  ExpiresByType image/jpeg "access plus 1 year"',
    '  ExpiresByType image/png "access plus 1 year"',
    '  ExpiresByType font/woff2 "access plus 1 year"',
    '  ExpiresByType text/css "access plus 1 year"',
    '  ExpiresByType application/javascript "access plus 1 year"',
    '</IfModule>',
    '',
    '<IfModule mod_headers.c>',
    '  Header set X-Content-Type-Options "nosniff"',
    '  Header set Referrer-Policy "strict-origin-when-cross-origin"',
    '</IfModule>',
    '',
  ].join('\n'),
);

// Vercel, if the folder is uploaded rather than built there
fs.writeFileSync(
  path.join(OUT, 'vercel.json'),
  JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: true,
      redirects: MOVED.map(([source, destination]) => ({ source, destination, permanent: true })),
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          ],
        },
      ],
    },
    null,
    2,
  ) + '\n',
);

const html = fs
  .readdirSync(OUT, { recursive: true })
  .filter((f) => String(f).endsWith('.html')).length;
console.log(`\nStatic release in out/: ${html} pages, plus _redirects, .htaccess and vercel.json`);
