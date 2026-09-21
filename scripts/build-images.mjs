// Generates responsive image sizes (AVIF, WebP, JPEG) from src/assets/masters
// into src/img, plus a portrait crop for phones, and writes a manifest that the
// Eleventy `picture` shortcode reads. Run with `npm run images`.
import sharp from "sharp";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const MASTERS = path.join(ROOT, "src/assets/masters");
const OUT = path.join(ROOT, "src/img");
const MANIFEST = path.join(ROOT, "src/_data/imageManifest.json");

const LANDSCAPE_WIDTHS = [768, 1024, 1280, 1536, 1920, 2560];
const PORTRAIT_WIDTHS = [480, 720, 960];
const PORTRAIT_ASPECT = 4 / 5;

const photos = JSON.parse(await readFile(path.join(ROOT, "src/assets/photos.json"), "utf8")).images;
await mkdir(OUT, { recursive: true });

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function encode(pipeline, base, width) {
  const outputs = {};
  const jobs = [
    ["avif", (s) => s.avif({ quality: 55, effort: 4 })],
    ["webp", (s) => s.webp({ quality: 78 })],
    ["jpg", (s) => s.jpeg({ quality: 80, mozjpeg: true, progressive: true })],
  ];
  for (const [ext, fn] of jobs) {
    const file = `${base}-${width}.${ext}`;
    const target = path.join(OUT, file);
    if (!(await exists(target))) {
      await fn(pipeline.clone().resize({ width })).toFile(target);
    }
    outputs[ext] = file;
  }
  return outputs;
}

const manifest = {};
for (const [id, meta] of Object.entries(photos)) {
  const input = path.join(MASTERS, meta.file);
  const image = sharp(input, { failOn: "none" }).rotate();
  const { width, height } = await image.metadata();
  const entry = { width, height, focus: meta.focus, landscape: [], portrait: [] };

  const widths = LANDSCAPE_WIDTHS.filter((w) => w < width);
  widths.push(width);
  for (const w of widths) {
    entry.landscape.push({ width: w, ...(await encode(image, id, w)) });
  }

  // Portrait crop (4:5) around the focal point for phone screens.
  let cw, ch;
  if (width / height > PORTRAIT_ASPECT) { ch = height; cw = Math.round(height * PORTRAIT_ASPECT); }
  else { cw = width; ch = Math.round(width / PORTRAIT_ASPECT); }
  const fx = Math.round((meta.focus[0] / 100) * width);
  const fy = Math.round((meta.focus[1] / 100) * height);
  const left = Math.min(Math.max(fx - cw / 2, 0), width - cw);
  const top = Math.min(Math.max(fy - ch / 2, 0), height - ch);
  const portrait = image.clone().extract({ left: Math.round(left), top: Math.round(top), width: cw, height: ch });
  const pWidths = PORTRAIT_WIDTHS.filter((w) => w < cw);
  pWidths.push(cw);
  for (const w of pWidths) {
    entry.portrait.push({ width: w, ...(await encode(portrait, `${id}-portrait`, w)) });
  }
  entry.portraitHeight = ch; entry.portraitWidth = cw;

  // A tiny blurred placeholder to reserve space and soften loading.
  const tiny = await image.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  entry.placeholder = `data:image/webp;base64,${tiny.toString("base64")}`;
  manifest[id] = entry;
  console.log(`${id}: ${width}x${height} -> ${widths.length} landscape, ${pWidths.length} portrait sizes`);
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to ${path.relative(ROOT, MANIFEST)}`);
