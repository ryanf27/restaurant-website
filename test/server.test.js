const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const dataDir = path.join(os.tmpdir(), `sela-test-${process.pid}`);
process.env.SELA_DATA_DIR = dataDir;
const { server, openDate } = require("../server");
let base;
const futureDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 10);
  while (date.getUTCDay() === 1) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};
test.before(async () => {
  await fs.mkdir(dataDir, { recursive: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(dataDir, { recursive: true, force: true });
});
test("restaurant routes and assets are served", async () => {
  for (const route of [
    "/",
    "/menu",
    "/menu/dry-aged-duck",
    "/reservations",
    "/order",
    "/about",
    "/contact",
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /Sela/);
    assert.match(html, /Brown Butter Scallops/);
    assert.doesNotMatch(html, /__MENU_JSON__/);
  }
  assert.equal((await fetch(base + "/assets/hero.webp")).status, 200);
  const script = await fetch(base + "/assets/client.mjs");
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  assert.equal((await fetch(base + "/missing-page")).status, 404);
  assert.equal((await fetch(base + "/menu/missing-dish")).status, 404);
});
test("date rules reject Mondays", () => {
  assert.equal(openDate("2026-09-21"), false);
  assert.equal(openDate("2026-09-22"), true);
  assert.equal(openDate("2026-02-30"), false);
});
test("reservation validates and stores a booking", async () => {
  const date = futureDate();
  const input = {
    date,
    time: "19:00",
    partySize: 2,
    name: "Ayu Santoso",
    email: "ayu@example.com",
    phone: "+62 812 1234 5678",
    requests: "Window table",
  };
  const bad = await fetch(base + "/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, partySize: 0 }),
  });
  assert.equal(bad.status, 400);
  const badPhone = await fetch(base + "/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, phone: "+++++++" }),
  });
  assert.equal(badPhone.status, 400);
  const result = await fetch(base + "/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(result.status, 201);
  const body = await result.json();
  assert.match(body.id, /^S-/);
  assert.equal(body.partySize, 2);
  const records = JSON.parse(
    await fs.readFile(path.join(dataDir, "reservations.json")),
  );
  assert.equal(records.length, 1);
});
test("pickup order uses menu prices and rejects ineligible dishes", async () => {
  const pickupDate = futureDate();
  const input = {
    pickupDate,
    pickupTime: "19:00",
    name: "Ayu Santoso",
    email: "ayu@example.com",
    phone: "+62 812 1234 5678",
    notes: "",
    items: [
      { id: "mushroom-pasta", quantity: 2 },
      { id: "tea", quantity: 1 },
    ],
  };
  const invalid = await fetch(base + "/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, items: [{ id: "duck", quantity: 1 }] }),
  });
  assert.equal(invalid.status, 400);
  const response = await fetch(base + "/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.total, 585000);
  const orders = JSON.parse(
    await fs.readFile(path.join(dataDir, "orders.json")),
  );
  assert.equal(orders.length, 1);
  assert.equal(orders[0].items[0].unitPrice, 260000);
});
