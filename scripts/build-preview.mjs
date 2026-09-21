// Builds a flattened copy of the site in _preview/ with relative links and a
// reduced image set, so it can be opened from disk or hosted under any path
// (used for the review preview). The normal build in _site/ is unaffected.
import { execSync } from "node:child_process";
import { readdir, readFile, writeFile, rm, rename, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = path.join(ROOT, "_preview");
const run = (cmd, env = {}) => execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });

await rm(OUT, { recursive: true, force: true });
run("node scripts/build-images.mjs", { PREVIEW: "1" });
run(`npx @11ty/eleventy --output=_preview --quiet`, { IMG_DIR: "src/img-preview" });
run("node scripts/build-images.mjs"); // restore the full manifest for normal builds

// Flatten /about/index.html -> about.html and rewrite root-absolute URLs to relative ones.
const pages = [];
for (const entry of await readdir(OUT, { withFileTypes: true })) {
  if (entry.isDirectory() && (await stat(path.join(OUT, entry.name, "index.html")).catch(() => null))) {
    await rename(path.join(OUT, entry.name, "index.html"), path.join(OUT, `${entry.name}.html`));
    await rm(path.join(OUT, entry.name), { recursive: true });
    pages.push(`${entry.name}.html`);
  }
}
pages.push("index.html");
for (const file of pages) {
  let html = await readFile(path.join(OUT, file), "utf8");
  html = html
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/href="\/([a-z-]+)\/"/g, 'href="$1.html"')
    .replace(/(href|src)="\/(css|js|fonts|favicon\.svg)/g, '$1="$2')
    .replace(/(["\s,])\/img\//g, "$1img/");
  await writeFile(path.join(OUT, file), html);
}
const fontsCss = path.join(OUT, "css/fonts.css");
await writeFile(fontsCss, (await readFile(fontsCss, "utf8")).replace(/url\('\/fonts\//g, "url('../fonts/"));
console.log(`Preview written to _preview/ (${pages.join(", ")})`);
