import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = {
  "/": ["app/index.html", "text/html; charset=utf-8"],
  "/index.html": ["app/index.html", "text/html; charset=utf-8"],
  "/styles.css": ["app/styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app/app.js", "text/javascript; charset=utf-8"],
  "/manifest.webmanifest": ["app/manifest.webmanifest", "application/manifest+json"],
  "/icon.svg": ["app/icon.svg", "image/svg+xml"],
  "/service-worker.js": ["app/service-worker.js", "text/javascript; charset=utf-8"]
};

const assets = {};
for (const [route, [path, type]] of Object.entries(files)) assets[route] = { body: await readFile(join(root, path), "utf8"), type };

const worker = `const assets = ${JSON.stringify(assets)};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];
    if (!asset) return new Response("Not found", { status: 404 });
    return new Response(asset.body, { headers: { "content-type": asset.type, "cache-control": url.pathname === "/service-worker.js" ? "no-cache" : "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
};\n`;

await rm(join(root, "dist"), { recursive: true, force: true });
await mkdir(join(root, "dist/server"), { recursive: true });
await mkdir(join(root, "dist/.openai"), { recursive: true });
await writeFile(join(root, "dist/server/index.js"), worker);
await writeFile(join(root, "dist/.openai/hosting.json"), await readFile(join(root, ".openai/hosting.json")));
console.log(`Built ${join(root, "dist")}`);
