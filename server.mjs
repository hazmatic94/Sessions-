import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const publicDir = join(root, "public");
const pagesDir = join(root, "src");
const designSystemDir = join(root, "node_modules/@sessions/design-system");
const port = Number(process.env.PORT) || 43123;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

function resolveInside(base, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const full = resolve(base, `.${normalize(decoded)}`);
  if (full !== base && !full.startsWith(`${base}/`)) return null;
  return full;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    ...headers,
  });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let pathname = url.pathname;
  if (pathname.endsWith("/") && pathname !== "/") pathname = pathname.slice(0, -1);
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/calendar") pathname = "/calendar.html";

  const fromDesignSystem = pathname === "/ds" || pathname.startsWith("/ds/");
  const fromPages = pathname === "/src" || pathname.startsWith("/src/");
  const file = fromDesignSystem
    ? resolveInside(designSystemDir, pathname.slice(3) || "/")
    : fromPages
      ? resolveInside(pagesDir, pathname.slice(4) || "/")
      : resolveInside(publicDir, pathname);

  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });
  createReadStream(file).pipe(res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Sessions http://127.0.0.1:${port}`);
});
