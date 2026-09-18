const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const dataDir = process.env.SELA_DATA_DIR || path.join(root, "data");
const menu = require("./data/menu.json");
const slots = [
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];
const pickupSlots = [
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
];
const allowedFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/style.css", "style.css"],
  ["/app.mjs", "app.mjs"],
  ["/data/menu.json", "data/menu.json"],
  ["/assets/favicon.svg", "assets/favicon.svg"],
  ["/assets/hero.webp", "assets/hero.webp"],
  ["/assets/dining-room.webp", "assets/dining-room.webp"],
  ["/assets/scallops.webp", "assets/scallops.webp"],
  ["/assets/chef-mira.webp", "assets/chef-mira.webp"],
]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{7,22}$/;
const jakartaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const jakartaTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const openDate = (value) =>
  validDate(value) && new Date(`${value}T12:00:00Z`).getUTCDay() !== 1;
const clean = (value, max = 250) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
const readRecords = async (filename) => {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};
const saveRecords = async (filename, records) => {
  const target = path.join(dataDir, filename);
  const temp = `${target}.${crypto.randomUUID()}.tmp`;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(temp, JSON.stringify(records, null, 2));
  await fs.rename(temp, target);
};
let writes = Promise.resolve();
function queueWrite(task) {
  const result = writes.then(task);
  writes = result.catch(() => {});
  return result;
}
function validGuest(data) {
  return (
    clean(data.name, 80).length >= 2 &&
    emailPattern.test(clean(data.email, 120)) &&
    phonePattern.test(clean(data.phone, 30)) &&
    clean(data.phone, 30).replace(/\D/g, "").length >= 7
  );
}
function afterNow(date, time) {
  return (
    date > jakartaDate() || (date === jakartaDate() && time > jakartaTime())
  );
}
async function body(req) {
  let raw = "";
  for await (const part of req) {
    raw += part;
    if (raw.length > 16000) throw new Error("Request too large");
  }
  return JSON.parse(raw);
}
async function reservation(req, res) {
  const data = await body(req);
  if (!data || typeof data !== "object" || Array.isArray(data))
    return json(res, 400, { error: "Invalid request." });
  if (
    !validGuest(data) ||
    !openDate(data.date) ||
    !afterNow(data.date, data.time) ||
    !slots.includes(data.time) ||
    !Number.isInteger(data.partySize) ||
    data.partySize < 1 ||
    data.partySize > 8
  )
    return json(res, 400, {
      error: "Please check the date, time, party size, and contact details.",
    });
  const result = await queueWrite(async () => {
    const records = await readRecords("reservations.json");
    if (
      records.filter(
        (item) => item.date === data.date && item.time === data.time,
      ).length >= 8
    )
      return {
        status: 409,
        error: "This time is fully booked. Please choose another slot.",
      };
    const record = {
      id: `S-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      name: clean(data.name, 80),
      email: clean(data.email, 120),
      phone: clean(data.phone, 30),
      requests: clean(data.requests, 500),
      createdAt: new Date().toISOString(),
    };
    records.push(record);
    await saveRecords("reservations.json", records);
    return { status: 201, record };
  });
  return json(
    res,
    result.status,
    result.error
      ? { error: result.error }
      : {
          id: result.record.id,
          date: result.record.date,
          time: result.record.time,
          partySize: result.record.partySize,
        },
  );
}
async function order(req, res) {
  const data = await body(req);
  if (!data || typeof data !== "object" || Array.isArray(data))
    return json(res, 400, { error: "Invalid request." });
  if (
    !validGuest(data) ||
    !openDate(data.pickupDate) ||
    !afterNow(data.pickupDate, data.pickupTime) ||
    !pickupSlots.includes(data.pickupTime) ||
    !Array.isArray(data.items) ||
    data.items.length === 0 ||
    data.items.length > 20
  )
    return json(res, 400, {
      error: "Please check your basket, pickup time, and contact details.",
    });
  const items = [];
  for (const item of data.items) {
    const dish = menu.find(
      (entry) =>
        entry.id === item.id && entry.available && entry.takeawayAvailable,
    );
    if (
      !dish ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20 ||
      items.some((entry) => entry.id === item.id)
    )
      return json(res, 400, {
        error: "One or more basket items are unavailable.",
      });
    items.push({
      id: dish.id,
      name: dish.name,
      quantity: item.quantity,
      unitPrice: dish.price,
    });
  }
  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const record = {
    id: `P-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    name: clean(data.name, 80),
    email: clean(data.email, 120),
    phone: clean(data.phone, 30),
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    notes: clean(data.notes, 500),
    items,
    total,
    createdAt: new Date().toISOString(),
  };
  await queueWrite(async () => {
    const records = await readRecords("orders.json");
    records.push(record);
    await saveRecords("orders.json", records);
  });
  return json(res, 201, {
    id: record.id,
    total: record.total,
    pickupDate: record.pickupDate,
    pickupTime: record.pickupTime,
  });
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (req.method === "POST" && pathname === "/api/reservations")
      return await reservation(req, res);
    if (req.method === "POST" && pathname === "/api/orders")
      return await order(req, res);
    if (pathname.startsWith("/api/"))
      return json(res, 404, { error: "Endpoint not found." });
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(res, 405, { error: "Method not allowed." });
    const appRoute =
      /^\/(menu(?:\/[^/]+)?|reservations|order|about|contact)\/?$/.test(
        pathname,
      );
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
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    let data = await fs.readFile(path.join(root, file));
    if (file === "index.html") {
      data = Buffer.from(
        data
          .toString("utf8")
          .replace("__MENU_JSON__", JSON.stringify(menu).replace(/</g, "\\u003c")),
      );
    }
    res.writeHead(
      file === "index.html" &&
        pathname !== "/" &&
        (!appRoute || missingDish) &&
        pathname !== "/index.html"
        ? 404
        : 200,
      {
        "Content-Type": contentTypes[path.extname(file)],
        "Cache-Control": file.startsWith("assets/")
          ? "public, max-age=86400"
          : "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    );
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    if (error instanceof SyntaxError || error.message === "Request too large")
      return json(res, 400, { error: "Invalid request." });
    console.error(error);
    json(res, 500, { error: "Something went wrong. Please try again." });
  }
});
if (require.main === module)
  server.listen(process.env.PORT || 3000, () =>
    console.log(
      `Sela listening on http://localhost:${process.env.PORT || 3000}`,
    ),
  );
module.exports = { server, validDate, openDate, slots };
