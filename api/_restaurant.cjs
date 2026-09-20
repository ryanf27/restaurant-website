const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

const menu = require("../public/data/menu.json");
const slots = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const pickupSlots = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];
const dataDir =
  process.env.SELA_DATA_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), "sela") : path.join(__dirname, "..", "data"));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{7,22}$/;
let writes = Promise.resolve();

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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
const validGuest = (data) =>
  clean(data.name, 80).length >= 2 &&
  emailPattern.test(clean(data.email, 120)) &&
  phonePattern.test(clean(data.phone, 30)) &&
  clean(data.phone, 30).replace(/\D/g, "").length >= 7;
const afterNow = (date, time) =>
  date > jakartaDate() || (date === jakartaDate() && time > jakartaTime());

async function readRecords(filename) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function saveRecords(filename, records) {
  const target = path.join(dataDir, filename);
  const temp = `${target}.${crypto.randomUUID()}.tmp`;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(temp, JSON.stringify(records, null, 2));
  await fs.rename(temp, target);
}

function queueWrite(task) {
  const result = writes.then(task);
  writes = result.catch(() => {});
  return result;
}

function validateObject(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new RequestError(400, "Invalid request.");
  }
}

async function createReservation(data) {
  validateObject(data);
  if (
    !validGuest(data) ||
    !openDate(data.date) ||
    !afterNow(data.date, data.time) ||
    !slots.includes(data.time) ||
    !Number.isInteger(data.partySize) ||
    data.partySize < 1 ||
    data.partySize > 8
  ) {
    throw new RequestError(400, "Please check the date, time, party size, and contact details.");
  }

  return queueWrite(async () => {
    const records = await readRecords("reservations.json");
    if (records.filter((item) => item.date === data.date && item.time === data.time).length >= 8) {
      throw new RequestError(409, "This time is fully booked. Please choose another slot.");
    }
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
    return { id: record.id, date: record.date, time: record.time, partySize: record.partySize };
  });
}

async function createOrder(data) {
  validateObject(data);
  if (
    !validGuest(data) ||
    !openDate(data.pickupDate) ||
    !afterNow(data.pickupDate, data.pickupTime) ||
    !pickupSlots.includes(data.pickupTime) ||
    !Array.isArray(data.items) ||
    data.items.length === 0 ||
    data.items.length > 20
  ) {
    throw new RequestError(400, "Please check your basket, pickup time, and contact details.");
  }

  const items = [];
  for (const item of data.items) {
    const dish = menu.find(
      (entry) => entry.id === item.id && entry.available && entry.takeawayAvailable,
    );
    if (
      !dish ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20 ||
      items.some((entry) => entry.id === item.id)
    ) {
      throw new RequestError(400, "One or more basket items are unavailable.");
    }
    items.push({ id: dish.id, name: dish.name, quantity: item.quantity, unitPrice: dish.price });
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
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
  return { id: record.id, total, pickupDate: record.pickupDate, pickupTime: record.pickupTime };
}

module.exports = { RequestError, createOrder, createReservation, menu, openDate, slots };
