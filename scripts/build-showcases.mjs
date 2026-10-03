import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const tmp = path.join(root, ".showcase-src");

const repos = {
  elsharaby: "https://github.com/aamrabdelhay/ElSharaby-Law.git",
  hossam: "https://github.com/aamrabdelhay/dr.hossam-lotfy.git",
  loutfi: "https://github.com/aamrabdelhay/loutfifirm.git",
  safa: "https://github.com/aamrabdelhay/SAFA.git",
};

async function rm(p) { await fs.rm(p, { recursive: true, force: true }); }
async function cp(src, dest) {
  await rm(dest);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}
function run(cmd, args, cwd, allowFailure = false) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (r.status !== 0 && !allowFailure) process.exit(r.status ?? 1);
  return r.status ?? 1;
}
function clone(url, dir) {
  if (existsSync(path.join(dir, ".git"))) return;
  run("git", ["clone", "--depth", "1", url, dir], root);
}
function lockHtml(file) {
  let html = require("node:fs").readFileSync(file, "utf8");
  const lock = `<style id="portfolio-static-lock">
html{scroll-behavior:auto!important}
a,button,input,select,textarea,[role="button"],[tabindex]{pointer-events:none!important;cursor:default!important}
form{pointer-events:none!important}
</style>`;
  html = html.includes("portfolio-static-lock") ? html : html.replace("</head>", lock + "</head>");
  require("node:fs").writeFileSync(file, html, "utf8");
}

await rm(tmp);
await fs.mkdir(tmp, { recursive: true });

for (const [id, url] of Object.entries(repos)) clone(url, path.join(tmp, id));

// El Sharaby — build the exact Vite/React source with its single-file plugin.
{
  const dir = path.join(tmp, "elsharaby");
  run("npm", ["ci"], dir);
  run("npm", ["run", "build", "--", "--base", "./"], dir);
  await cp(path.join(dir, "dist"), path.join(root, "previews/elsharaby"));
  const index = path.join(root, "previews/elsharaby/index.html");
  if (existsSync(index)) lockHtml(index);
}

// SAFA — build the actual Vite storefront source; keep it static-only in the portfolio.
{
  const dir = path.join(tmp, "safa");
  run("npm", ["ci"], dir);
  run("npm", ["run", "build", "--", "--base", "./"], dir);
  await cp(path.join(dir, "dist"), path.join(root, "previews/safa"));
  const index = path.join(root, "previews/safa/index.html");
  if (existsSync(index)) lockHtml(index);
}

// Loutfi — the tracked HTML is a prerendered homepage from the original Next app.
// Build the original source here to refresh its generated CSS/static assets,
// then wire those assets into the local snapshot.
{
  const dir = path.join(tmp, "loutfi");
  run("npm", ["ci"], dir, true);
  run("npm", ["run", "build"], dir, true);

  if (existsSync(path.join(dir, ".next", "static"))) {
    await cp(path.join(dir, ".next", "static"), path.join(root, "previews/loutfi/_next/static"));
  }
  if (existsSync(path.join(dir, "public", "img"))) {
    await cp(path.join(dir, "public", "img"), path.join(root, "previews/loutfi/img"));
  }

  const index = path.join(root, "previews/loutfi/index.html");
  if (existsSync(index)) {
    let html = await fs.readFile(index, "utf8");
    html = html
      .replaceAll('href="/_next/', 'href="./_next/')
      .replaceAll('src="/_next/', 'src="./_next/')
      .replaceAll('href="/img/', 'href="./img/')
      .replaceAll('src="/img/', 'src="./img/')
      .replaceAll('src="https://loutfifirm.vercel.app/img/', 'src="./img/');
    await fs.writeFile(index, html, "utf8");
    lockHtml(index);
  }
}

// Hossam — keep the portfolio's dedicated Feed/Home snapshot, but sync the
// original public branding assets from the real source repository.
{
  const dir = path.join(tmp, "hossam");
  if (existsSync(path.join(dir, "public"))) {
    await cp(path.join(dir, "public"), path.join(root, "previews/hossam/assets"));
  }
  const index = path.join(root, "previews/hossam/index.html");
  if (existsSync(index)) lockHtml(index);
}

// MO is private, so GitHub Pages cannot read it with its normal GITHUB_TOKEN.
// When MO_READ_TOKEN exists, build directly from the real private repo.
// Otherwise preserve the already-tracked static source snapshot.
if (process.env.MO_READ_TOKEN) {
  const moDir = path.join(tmp, "mo");
  run("git", ["clone", "--depth", "1", "https://x-access-token:" + process.env.MO_READ_TOKEN + "@github.com/aamrabdelhay/mo.git", moDir], root);
  run("npm", ["ci"], moDir);
  run("npm", ["run", "build", "--", "--base", "./"], moDir);
  await cp(path.join(moDir, "dist"), path.join(root, "previews/mo"));
  const index = path.join(root, "previews/mo/index.html");
  if (existsSync(index)) lockHtml(index);
} else {
  console.log("[showcase] MO_READ_TOKEN is not configured; keeping the tracked MO showcase snapshot.");
}

// Never publish the temporary source checkouts.
await rm(tmp);
