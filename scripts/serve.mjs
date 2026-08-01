/**
 * Serves the static release in out/ over http, because a browser cannot run a
 * modern site correctly from file://. Opening the files directly leaves React
 * unable to start, which silently breaks both the entrance animations and every
 * internal link.
 *
 * No dependencies. Node only.
 */
import { createServer } from 'node:http';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', 'out');
const PORT = Number(process.env.PORT ?? 4321);

if (!fs.existsSync(ROOT)) {
  console.error('No out/ folder found. Run `npm run export` first.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// The same three redirects the host would serve.
const MOVED = {
  '/imprint': '/impressum/',
  '/privacy': '/datenschutz/',
  '/accessibility': '/barrierefreiheit/',
};

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  // Never let a request escape the folder.
  const target = path.normalize(path.join(ROOT, clean));
  if (!target.startsWith(ROOT)) return null;

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const index = path.join(target, 'index.html');
    return fs.existsSync(index) ? index : null;
  }
  if (fs.existsSync(target)) return target;

  const withHtml = `${target}.html`;
  return fs.existsSync(withHtml) ? withHtml : null;
}

createServer((req, res) => {
  const url = req.url ?? '/';
  const bare = url.split('?')[0].replace(/\/$/, '');

  if (MOVED[bare]) {
    res.writeHead(301, { Location: MOVED[bare] });
    res.end();
    return;
  }

  const file = resolve(url);

  if (!file) {
    const notFound = path.join(ROOT, '404.html');
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  const address = `http://localhost:${PORT}`;
  console.log(`\n  boernergroup.de is running at ${address}`);
  console.log('  This is the exact folder that gets uploaded.');
  console.log('  Stop it with Ctrl+C.\n');

  const open =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${open} ${address}`);
});
