const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const dataDir = path.join(os.tmpdir(), `sela-vercel-test-${process.pid}`);
process.env.SELA_DATA_DIR = dataDir;

function futureDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 10);
  while (date.getUTCDay() === 1) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test.after(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("Vercel functions provide default handlers and accept submissions", async () => {
  const reservationModule = await import(
    pathToFileURL(path.join(__dirname, "../api/reservations.mjs")).href
  );
  const orderModule = await import(
    pathToFileURL(path.join(__dirname, "../api/orders.mjs")).href
  );
  assert.equal(typeof reservationModule.default, "function");
  assert.equal(typeof orderModule.default, "function");

  const reservationResponse = mockResponse();
  await reservationModule.default(
    {
      method: "POST",
      body: {
        date: futureDate(),
        time: "19:00",
        partySize: 2,
        name: "Ayu Santoso",
        email: "ayu@example.com",
        phone: "+62 812 1234 5678",
        requests: "",
      },
    },
    reservationResponse,
  );
  assert.equal(reservationResponse.statusCode, 201);
  assert.match(reservationResponse.payload.id, /^S-/);

  const methodResponse = mockResponse();
  await orderModule.default({ method: "GET" }, methodResponse);
  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.headers.allow, "POST");
});
