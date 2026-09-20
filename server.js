const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  RequestError,
  createOrder,
  createReservation,
  menu,
  openDate,
  slots,
} = require("./api/_restaurant.cjs");

const root = __dirname;
const allowedFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/style.css", "style.css"],
  ["/app.mjs", "app.mjs"],
  ["/data/menu.json", "data/menu.json"],
  ["/favicon.ico", "assets/favicon.svg"],
  ["/assets/favicon.svg", "assets/favicon.svg"],
  ["/assets/hero.webp", "assets/hero.webp"],
  ["/assets/dining-room.webp", "assets/dining-room.webp"],
  ["/assets/scallops.webp", "assets/scallops.webp"],
  ["/assets/chef-mira.webp", "assets/chef-mira.webp"],
]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let raw = "";
  for await (const part of request) {
    raw += part;
    if (raw.length > 16000) throw new RequestError(400, "Request too large.");
  }
  return JSON.parse(raw || "{}");
}

async function handleApi(request, response, operation) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  try {
    const result = await operation(await readBody(request));
    return sendJson(response, 201, result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(response, 400, { error: "Invalid request." });
    }
    if (error instanceof RequestError) {
      return sendJson(response, error.status, { error: error.message });
    }
    console.error(error);
    return sendJson(response, 500, { error: "Something went wrong. Please try again." });
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/reservations") {
      return handleApi(request, response, createReservation);
    }
    if (pathname === "/api/orders") {
      return handleApi(request, response, createOrder);
    }
    if (pathname.startsWith("/api/")) {
      return sendJson(response, 404, { error: "Endpoint not found." });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return sendJson(response, 405, { error: "Method not allowed." });
    }

    const appRoute =
      /^\/(menu(?:\/[^/]+)?|reservations|order|about|contact)\/?$/.test(pathname);
    const dishSlug = pathname.match(/^\/menu\/([^/]+)\/?$/)?.[1];
    const missingDish = dishSlug && !menu.some((item) => item.slug === dishSlug);
    const file =
      allowedFiles.get(pathname) ||
      (appRoute ||
      (!path.extname(pathname) &&
        !pathname.startsWith("/assets/") &&
        !pathname.startsWith("/data/"))
        ? "index.html"
        : null);
    if (!file) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Not found");
    }

    let data = await fs.readFile(path.join(root, file));
    if (file === "index.html") {
      data = Buffer.from(
        data
          .toString("utf8")
          .replace("__MENU_JSON__", JSON.stringify(menu).replace(/</g, "\\u003c")),
      );
    }
    const status =
      file === "index.html" &&
      pathname !== "/" &&
      (!appRoute || missingDish) &&
      pathname !== "/index.html"
        ? 404
        : 200;
    response.writeHead(status, {
      "Content-Type": contentTypes[path.extname(file)],
      "Cache-Control": file.startsWith("assets/") ? "public, max-age=86400" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Something went wrong. Please try again." });
  }
});

server.openDate = openDate;
server.server = server;
server.slots = slots;

if (require.main === module) {
  server.listen(process.env.PORT || 3000, () =>
    console.log(`Sela listening on http://localhost:${process.env.PORT || 3000}`),
  );
}

module.exports = server;
