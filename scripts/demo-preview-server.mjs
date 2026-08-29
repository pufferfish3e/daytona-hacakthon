import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "demo", "resurrected-game");
const PORT = Number(process.env.DEMO_PREVIEW_PORT ?? 5174);

const server = createServer(async (request, response) => {
  const path = request.url === "/" || request.url === "" ? "/index.html" : request.url;
  const filePath = join(ROOT, path.replace(/\.\./g, ""));

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": path.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Demo preview app running at http://localhost:${PORT}`);
  console.log("Point Remember preview to http://localhost:3000/preview/live (with Next dev running).");
});
