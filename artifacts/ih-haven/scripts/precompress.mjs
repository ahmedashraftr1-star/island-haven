// Pre-compress the built SPA at BUILD time, using only Node's built-in zlib —
// no new dependency, and zero CPU per request at runtime (unlike on-the-fly
// gzip). For every text asset in dist/public we emit a `.br` and a `.gz` twin;
// api-server's precompressed middleware serves whichever the client accepts.
//
// Why this matters: the app server previously shipped JS/CSS RAW — a cold
// homepage pulled ~1.1 MB of uncompressed text. Brotli takes that to ~230 KB.
// It also means compression no longer DEPENDS on nginx being configured right.
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { brotliCompress, gzip, constants } from "node:zlib";
import { promisify } from "node:util";

const br = promisify(brotliCompress);
const gz = promisify(gzip);

const DIST = new URL("../dist/public/", import.meta.url).pathname;
const COMPRESSIBLE = new Set([
  ".js", ".mjs", ".css", ".html", ".json", ".svg", ".xml", ".txt", ".webmanifest", ".map",
]);
// Below this, compression headers cost more than they save.
const MIN_BYTES = 1024;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let files = 0;
let raw = 0;
let brTotal = 0;
let gzTotal = 0;

for await (const file of walk(DIST)) {
  const ext = extname(file);
  if (!COMPRESSIBLE.has(ext)) continue;
  if (file.endsWith(".br") || file.endsWith(".gz")) continue;
  const { size } = await stat(file);
  if (size < MIN_BYTES) continue;

  const buf = await readFile(file);
  const [b, g] = await Promise.all([
    br(buf, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11, // max — build-time, so cost is fine
        [constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
      },
    }),
    gz(buf, { level: 9 }),
  ]);

  // Only keep a twin if it actually wins.
  if (b.length < size) {
    await writeFile(file + ".br", b);
    brTotal += b.length;
  } else brTotal += size;
  if (g.length < size) {
    await writeFile(file + ".gz", g);
    gzTotal += g.length;
  } else gzTotal += size;

  files++;
  raw += size;
}

const kb = (n) => (n / 1024).toFixed(1);
console.log(
  `precompress: ${files} files · raw ${kb(raw)} KB → br ${kb(brTotal)} KB · gz ${kb(gzTotal)} KB ` +
    `(brotli saves ${(100 - (brTotal / raw) * 100).toFixed(0)}%)`,
);
