const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const menu = require("../data/menu.json");
const app = {
  innerHTML: "",
  listeners: {},
  addEventListener(type, handler) {
    this.listeners[type] = handler;
  },
};
global.document = {
  title: "",
  querySelector(selector) {
    if (selector === "#app") return app;
    if (selector === "#menu-data") return { textContent: JSON.stringify(menu) };
    return null;
  },
  querySelectorAll() {
    return [];
  },
};
global.location = { pathname: "/" };
global.localStorage = {
  getItem() {
    return null;
  },
  setItem() {},
};
test("client renders each app view from its route", async () => {
  const base = pathToFileURL(path.join(__dirname, "../app.mjs")).href;
  const cases = [
    ["/", "Good food."],
    ["/menu", "The menu"],
    ["/menu/dry-aged-duck", "Dry Aged Duck"],
    ["/reservations", "Confirm reservation"],
    ["/order", "Pickup, made simple"],
    ["/about", "A place to pause"],
    ["/contact", "See you soon"],
    ["/menu/unknown", "no table here"],
  ];
  for (const [route, expected] of cases) {
    location.pathname = route;
    await import(`${base}?route=${encodeURIComponent(route)}`);
    assert.ok(app.innerHTML.includes(expected), `${route} missing ${expected}`);
    if (route === "/reservations" || route === "/order") {
      assert.doesNotMatch(app.innerHTML, /pattern=/);
    }
    assert.ok(document.title.includes("Sela"));
  }
});
test("reservation submit uses the form and shows confirmation", async () => {
  const base = pathToFileURL(path.join(__dirname, "../app.mjs")).href;
  location.pathname = "/reservations";
  await import(`${base}?submit-test`);
  global.FormData = class {
    constructor(form) {
      return Object.entries(form.values);
    }
  };
  global.window = { scrollTo() {} };
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 10);
  while (date.getUTCDay() === 1) date.setUTCDate(date.getUTCDate() + 1);
  const dateString = date.toISOString().slice(0, 10);
  let posted;
  global.fetch = async (url, options) => {
    assert.equal(url, "/api/reservations");
    posted = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: "S-TEST1234",
        date: dateString,
        time: "19:00",
        partySize: 2,
      }),
    };
  };
  const error = { hidden: true, textContent: "", scrollIntoView() {} };
  const button = { disabled: false, textContent: "Confirm reservation" };
  let validityChecked = false;
  const form = {
    id: "reservation-form",
    values: {
      date: dateString,
      time: "19:00",
      partySize: "2",
      name: "Ayu Santoso",
      email: "ayu@example.com",
      phone: "+62 812 1234 5678",
      requests: "",
    },
    parentElement: { innerHTML: "" },
    reportValidity() {
      validityChecked = true;
      return true;
    },
    querySelector(selector) {
      return selector === ".form-error" ? error : button;
    },
  };
  const event = {
    target: form,
    currentTarget: app,
    preventDefault() {},
  };
  app.listeners.submit(event);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(validityChecked, true);
  assert.equal(posted.partySize, 2);
  assert.match(form.parentElement.innerHTML, /Reservation confirmed/);
  assert.equal(error.hidden, true);
});
test("menu images and local assets exist", async () => {
  for (const item of menu) {
    if (item.image) {
      const filename = path.join(__dirname, "..", item.image);
      assert.ok((await fs.stat(filename)).size > 1000, item.image);
    }
  }
});
