const app = document.querySelector("#app");
let menu = [];
let cart = loadCart();
let activeFilter = "All";
const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const prettyDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
const formatTime = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};
const photo = (src, alt, extra = "") =>
  `<img src="${src}" alt="${alt}" ${extra}>`;
const link = (href, label, cls = "text-link") =>
  `<a class="${cls}" href="${href}">${label}<span aria-hidden="true"> ↗</span></a>`;
const navLinks = [
  ["/menu", "Menu"],
  ["/about", "Our Story"],
  ["/reservations", "Reservations"],
  ["/contact", "Contact"],
];
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("sela-cart")) || {};
  } catch {
    return {};
  }
}
function saveCart() {
  localStorage.setItem("sela-cart", JSON.stringify(cart));
  updateCartCount();
}
function cartEntries() {
  return Object.entries(cart)
    .map(([id, quantity]) => ({
      dish: menu.find((item) => item.id === id),
      quantity,
    }))
    .filter(
      (entry) =>
        entry.dish?.available &&
        entry.dish?.takeawayAvailable &&
        entry.quantity > 0,
    );
}
function cartTotal() {
  return cartEntries().reduce(
    (sum, { dish, quantity }) => sum + dish.price * quantity,
    0,
  );
}
function updateCartCount() {
  document
    .querySelectorAll("[data-cart-count]")
    .forEach(
      (el) =>
        (el.textContent = cartEntries().reduce(
          (sum, item) => sum + item.quantity,
          0,
        )),
    );
}
function shell(content) {
  const path = location.pathname;
  return `<a href="#main" class="skip-link">Skip to content</a><header class="site-header"><div class="container header-inner"><a class="wordmark" href="/" aria-label="Sela, home">Sela<span class="wordmark-dot">.</span></a><nav class="desktop-nav" aria-label="Main navigation">${navLinks.map(([href, label]) => `<a href="${href}" ${path === href ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="header-actions"><a class="order-link" href="/order">Order pickup <span class="count" data-cart-count>0</span></a><a class="button button-small" href="/reservations">Reserve a table</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span></button></div></div><nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden>${navLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}<a href="/order">Order pickup <span data-cart-count>0</span></a></nav></header><main id="main">${content}</main><footer class="site-footer"><div class="container footer-grid"><div><a class="footer-wordmark" href="/">Sela<span>.</span></a><p>Seasonal cooking, made for sharing.<br>Jakarta, Indonesia.</p></div><div><p class="eyebrow">Explore</p>${navLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}<a href="/order">Order Pickup</a></div><div><p class="eyebrow">Visit</p><p>18 Jalan Senopati<br>Jakarta Selatan, 12190</p><a href="https://www.google.com/maps/search/?api=1&query=Jalan+Senopati+Jakarta" target="_blank" rel="noopener noreferrer">Get directions ↗</a></div><div><p class="eyebrow">Hours & contact</p><p>Tue–Thu 17:30–22:00<br>Fri–Sat 17:30–23:00<br>Sun 17:00–21:30<br>Monday closed</p><a href="tel:+62215550188">+62 21 555 0188</a><a href="mailto:hello@sela.example">hello@sela.example</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Sela. Portfolio concept.</span><span>Thoughtfully made for the table.</span></div></footer><div class="mobile-action-bar"><a href="/menu">View menu</a><a href="/reservations">Reserve a table</a></div>`;
}
function heading(kicker, title, copy = "") {
  return `<div class="section-heading"><p class="eyebrow">${kicker}</p><h2>${title}</h2>${copy ? `<p>${copy}</p>` : ""}</div>`;
}
function hours() {
  return `<div class="hours-list"><div><span>Tuesday — Thursday</span><strong>17:30 — 22:00</strong></div><div><span>Friday — Saturday</span><strong>17:30 — 23:00</strong></div><div><span>Sunday</span><strong>17:00 — 21:30</strong></div><div><span>Monday</span><strong>Closed</strong></div></div>`;
}
function signature(dish, index) {
  return `<article class="signature ${index % 2 ? "reverse" : ""}"><a class="signature-image image-frame" href="/menu/${dish.slug}">${photo(dish.image, dish.name + " plated on ceramic tableware", 'loading="lazy"')}</a><div class="signature-copy"><p class="eyebrow">Signature ${String(index + 1).padStart(2, "0")} / Seasonal menu</p><h3>${dish.name}</h3><p>${dish.story}</p><p class="ingredients">${dish.description}</p><div class="signature-foot"><span>${rupiah(dish.price)}</span>${link(`/menu/${dish.slug}`, "Explore the dish")}</div></div></article>`;
}
function home() {
  const featured = menu.filter((item) => item.featured);
  return `<section class="hero"><div class="hero-photo">${photo("/assets/hero.webp", "Dry aged duck with cherry jus on a candlelit table", 'fetchpriority="high"')}</div><div class="hero-shade"></div><div class="container hero-content"><p class="eyebrow">Jakarta / Seasonal dining</p><h1>Good food.<br><em>Good company.</em><br>Stay awhile.</h1><p>Seasonal cooking shaped by fire, produce, and the people who grow it.</p><div class="hero-actions"><a class="button" href="/reservations">Reserve a table <span aria-hidden="true">↗</span></a><a class="button-quiet" href="/menu">Explore the menu ↗</a></div></div><div class="hero-bottom container"><span>Dinner · Tuesday — Sunday</span><span>Senopati, Jakarta</span><span>Scroll to discover ↓</span></div></section><section class="intro section-pad"><div class="container intro-grid"><p class="eyebrow">01 / At the table</p><div><h2>A slower kind<br>of evening.</h2><p>There is room here for the first glass, the second story, and one more plate for the table. We cook with the season and serve with ease.</p>${link("/about", "Discover our story")}</div></div></section><section class="signature-section section-pad"><div class="container">${heading("02 / From the kitchen", "A few reasons to linger.", "Familiar ingredients, seen in a new light. Our menu follows what is best right now.")}${featured.map(signature).join("")}<div class="center-link">${link("/menu", "See the full menu")}</div></div></section><section class="experience"><div class="experience-image image-frame">${photo("/assets/dining-room.webp", "Warm Sela dining room at dusk", 'loading="lazy"')}</div><div class="experience-copy"><p class="eyebrow">03 / The room</p><h2>Come in.<br>Settle in.</h2><p>Low light, open conversation, and a room that lets the night unfold at its own pace.</p>${link("/about", "Inside Sela")}</div></section><section class="menu-preview section-pad"><div class="container preview-grid"><div>${heading("04 / The menu", "The season sets the table.", "Small plates to begin, something substantial to share, and a final sweet note.")}${link("/menu", "Browse the full menu")}</div><div class="preview-list">${menu
    .filter((item) =>
      ["Starters", "Mains", "Pasta", "Desserts"].includes(item.category),
    )
    .slice(0, 5)
    .map(
      (item) =>
        `<a href="/menu/${item.slug}"><span><small>${item.category}</small><strong>${item.name}</strong></span><span>${rupiah(item.price)} ↗</span></a>`,
    )
    .join(
      "",
    )}</div></div></section><section class="reservation-band"><div class="container"><p class="eyebrow">An evening at Sela</p><h2>We'll save you a seat.</h2><p>For date nights, long dinners, and everything in between.</p><a class="button button-light" href="/reservations">Reserve a table ↗</a></div></section><section class="visit-section section-pad"><div class="container visit-grid"><div>${heading("05 / Find us", "Around the corner, away from the rush.")}<p>18 Jalan Senopati<br>Jakarta Selatan, 12190</p>${link("/contact", "Plan your visit")}</div><div><p class="eyebrow">Dinner service</p>${hours()}</div></div></section>`;
}
function menuRow(item) {
  return `<article class="menu-row"><div><div class="menu-row-heading"><h3><a href="/menu/${item.slug}">${item.name}</a></h3>${item.featured ? '<span class="mini-label">Signature</span>' : ""}</div><p>${item.description}</p><small>${item.dietaryTags.join(" · ")}</small></div><span>${rupiah(item.price)}</span></article>`;
}
function menuPage() {
  const categories = [
    "All",
    "Starters",
    "Mains",
    "Pasta",
    "Desserts",
    "Cocktails",
    "Wine",
    "Non-Alcoholic",
  ];
  const group = activeFilter === "All" ? categories.slice(1) : [activeFilter];
  return `<div class="page-intro menu-intro container"><p class="eyebrow">The kitchen / Seasonal selection</p><h1>The menu<span class="period">.</span></h1><p>Made for the table. Guided by what is fresh, local, and worth waiting for.</p></div><div class="container menu-content"><div class="filter-tabs" role="group" aria-label="Filter menu by category">${categories.map((category) => `<button type="button" data-filter="${category}" class="${activeFilter === category ? "active" : ""}" aria-pressed="${activeFilter === category}">${category}</button>`).join("")}</div><div id="menu-results" aria-live="polite">${
    group
      .map((category) => {
        const items = menu.filter(
          (item) => item.category === category && item.available,
        );
        return items.length
          ? `<section class="menu-category"><div class="category-heading"><p class="eyebrow">${String(categories.indexOf(category)).padStart(2, "0")} / Menu</p><h2>${category}</h2></div><div>${items.map(menuRow).join("")}</div></section>`
          : "";
      })
      .join("") ||
    '<p class="empty-state">No dishes are available in this category today.</p>'
  }</div><p class="menu-note">Please tell us about allergies when booking. Menu and availability may change with the season. All prices are in IDR.</p></div><div class="soft-cta container"><div><p class="eyebrow">At your table</p><h2>Make an evening of it.</h2></div><a class="button" href="/reservations">Reserve a table ↗</a></div>`;
}
function dishPage(slug) {
  const dish = menu.find((item) => item.slug === slug);
  if (!dish) return notFound();
  return `<div class="container breadcrumb"><a href="/menu">Menu</a><span>/</span><span>${dish.name}</span></div><article class="dish-detail container"><div class="dish-detail-media ${dish.image ? "image-frame" : "dish-placeholder"}">${dish.image ? photo(dish.image, dish.name + " plated at Sela") : `<span>${dish.category}</span>`}</div><div class="dish-detail-copy"><p class="eyebrow">${dish.category} / ${dish.featured ? "Signature dish" : "The menu"}</p><h1>${dish.name}</h1><p class="dish-lead">${dish.story || dish.description}</p><div class="detail-line"><span>On the plate</span><strong>${dish.description}</strong></div><div class="detail-line"><span>Dietary</span><strong>${dish.dietaryTags.length ? dish.dietaryTags.join(", ") : "Ask our team"}</strong></div><div class="detail-line"><span>Allergens</span><strong>${dish.allergens.length ? dish.allergens.join(", ") : "None listed"}</strong></div><div class="detail-price">${rupiah(dish.price)}</div>${dish.available ? (dish.takeawayAvailable ? `<button class="button" type="button" data-add="${dish.id}">Add for pickup ↗</button>` : `<a class="button" href="/reservations">Enjoy it at Sela ↗</a>`) : "<p>Currently unavailable.</p>"}<p class="fine-print">Please tell our team about any allergies before ordering.</p><a class="text-link back-link" href="/menu">← Back to menu</a></div></article>`;
}
function reservationPage() {
  return `<div class="page-intro container"><p class="eyebrow">An evening at Sela</p><h1>Make it a date<span class="period">.</span></h1><p>Choose a time and leave the rest to us. For parties of more than eight, please call.</p></div><section class="container form-layout"><div class="form-panel"><form id="reservation-form" novalidate><div class="form-group-title"><span>01</span><h2>Your table</h2></div><div class="form-grid"><label>Date<input type="date" name="date" required min="${today()}"></label><label>Guests<select name="partySize" required>${Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}" ${i === 1 ? "selected" : ""}>${i + 1} ${i === 0 ? "guest" : "guests"}</option>`).join("")}</select></label></div><fieldset class="time-field"><legend>Available times</legend><div class="time-slots">${["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"].map((time, i) => `<label><input type="radio" name="time" value="${time}" ${i === 3 ? "checked" : ""}><span>${formatTime(time)}</span></label>`).join("")}</div></fieldset><div class="form-group-title"><span>02</span><h2>Your details</h2></div><div class="form-grid"><label>Full name<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label><label>Email address<input type="email" name="email" autocomplete="email" required maxlength="120"></label><label>Phone number<input type="tel" name="phone" autocomplete="tel" required minlength="7" maxlength="22"></label><label class="span-2">Special requests <span class="optional">Optional</span><textarea name="requests" rows="3" maxlength="500" placeholder="A celebration, accessibility needs, or anything we should know"></textarea></label></div><p class="form-error" role="alert" hidden></p><button class="button submit-button" type="submit">Confirm reservation ↗</button><p class="fine-print">This portfolio demo stores bookings locally. No confirmation email is sent.</p></form></div><aside class="form-aside"><div class="aside-image image-frame">${photo("/assets/dining-room.webp", "A warmly lit dining room at Sela", 'loading="lazy"')}</div><p class="eyebrow">Dinner with us</p><h3>A table to return to.</h3><p>Come as you are. We'll take care of the evening.</p><p class="fine-print">Need to change a booking? Call <a href="tel:+62215550188">+62 21 555 0188</a>.</p></aside></section>`;
}
function orderCard(item) {
  return `<article class="pickup-item"><div><p class="eyebrow">${item.category}</p><h3><a href="/menu/${item.slug}">${item.name}</a></h3><p>${item.description}</p><span>${rupiah(item.price)}</span></div><button class="button-outline" type="button" data-add="${item.id}">Add +</button></article>`;
}
function cartMarkup() {
  const entries = cartEntries();
  return entries.length
    ? `<div class="cart-items">${entries.map(({ dish, quantity }) => `<div class="cart-item"><div><strong>${dish.name}</strong><small>${rupiah(dish.price)} each</small><button class="remove-button" type="button" data-remove="${dish.id}">Remove</button></div><div class="quantity"><button type="button" data-decrease="${dish.id}" aria-label="Decrease ${dish.name} quantity">−</button><span>${quantity}</span><button type="button" data-increase="${dish.id}" aria-label="Increase ${dish.name} quantity">+</button></div></div>`).join("")}</div><div class="cart-total"><span>Subtotal</span><strong>${rupiah(cartTotal())}</strong></div><p class="fine-print">Pay at pickup. No delivery or online payment.</p>`
    : `<div class="empty-cart"><p>Your basket is empty.</p><a class="text-link" href="#pickup-menu">Explore pickup menu ↗</a></div>`;
}
function orderPage() {
  return `<div class="page-intro container"><p class="eyebrow">Sela at home</p><h1>Pickup, made simple<span class="period">.</span></h1><p>A small selection from our kitchen, ready to take home. Order now and pay when you collect.</p></div><div class="container order-layout"><section id="pickup-menu"><div class="section-heading small"><p class="eyebrow">The takeaway selection</p><h2>For the way home.</h2></div><div class="pickup-list">${menu
    .filter((item) => item.available && item.takeawayAvailable)
    .map(orderCard)
    .join(
      "",
    )}</div></section><aside class="order-aside"><h2>Your basket <span class="count" data-cart-count>0</span></h2><div id="cart-content">${cartMarkup()}</div><form id="order-form" novalidate><h3>Pickup details</h3><label>Full name<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label><label>Email address<input type="email" name="email" autocomplete="email" required maxlength="120"></label><label>Phone number<input type="tel" name="phone" autocomplete="tel" required minlength="7" maxlength="22"></label><div class="form-grid"><label>Pickup date<input type="date" name="pickupDate" required min="${today()}"></label><label>Pickup time<select name="pickupTime" required><option value="">Choose a time</option>${["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"].map((time) => `<option value="${time}">${formatTime(time)}</option>`).join("")}</select></label></div><label>Notes <span class="optional">Optional</span><textarea name="notes" rows="2" maxlength="500" placeholder="Anything the kitchen should know?"></textarea></label><p class="form-error" role="alert" hidden></p><button class="button submit-button" type="submit" ${cartEntries().length ? "" : "disabled"}>Place pickup order ↗</button><p class="fine-print">This portfolio demo stores orders locally. Please do not use it for a real pickup.</p></form></aside></div>`;
}
function aboutPage() {
  return `<div class="page-intro container"><p class="eyebrow">The story / Sela</p><h1>A place to pause<span class="period">.</span></h1><p>Good ingredients and an open table. That's where we begin.</p></div><section class="story-hero image-frame">${photo("/assets/dining-room.webp", "Tables set for dinner in the Sela dining room")}</section><section class="section-pad"><div class="container story-grid"><p class="eyebrow">01 / Our approach</p><div><h2>Let the ingredient lead.</h2><p>We cook with the seasons, work closely with small producers, and keep the plate clear enough to taste what matters. Fire, acid, patience, and a little curiosity do the rest.</p><p>The menu moves as produce changes. Some dishes stay for a while; others are here only for a few evenings.</p></div></div></section><section class="story-split"><div class="image-frame">${photo("/assets/chef-mira.webp", "Portrait of fictional executive chef Mira Adisurya", 'loading="lazy"')}</div><div><p class="eyebrow">02 / The kitchen</p><h2>Care in every detail.</h2><p>Chef Mira Adisurya leads the kitchen with a simple idea: make food that feels considered, generous, and grounded in place. Her cooking draws on local markets and the shared rituals of a long dinner.</p><p>At Sela, the best compliment is an empty plate and a reason to stay for one more glass.</p>${link("/menu", "Explore the menu")}</div></section><section class="reservation-band"><div class="container"><p class="eyebrow">Come by</p><h2>There is a place for you.</h2><a class="button button-light" href="/reservations">Reserve a table ↗</a></div></section>`;
}
function contactPage() {
  return `<div class="page-intro container"><p class="eyebrow">Find us / Jakarta</p><h1>See you soon<span class="period">.</span></h1><p>Just off the pace of the city, with a table waiting inside.</p></div><section class="container contact-grid"><div><div class="contact-block"><p class="eyebrow">Address</p><h2>18 Jalan Senopati<br>Jakarta Selatan, 12190</h2><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=Jalan+Senopati+Jakarta" target="_blank" rel="noopener noreferrer">Open map ↗</a></div><div class="contact-block"><p class="eyebrow">Talk to us</p><a class="contact-large" href="tel:+62215550188">+62 21 555 0188</a><a class="contact-large" href="mailto:hello@sela.example">hello@sela.example</a><p>For private dining, write to <a href="mailto:events@sela.example">events@sela.example</a>.</p></div><a class="button" href="/reservations">Reserve a table ↗</a></div><div><div class="contact-photo image-frame">${photo("/assets/dining-room.webp", "Sela dining room ready for service", 'loading="lazy"')}</div><p class="eyebrow">Opening hours</p>${hours()}</div></section>`;
}
function notFound() {
  return `<section class="not-found container"><p class="eyebrow">404 / A wrong turn</p><h1>There's no table here.</h1><p>The page you were looking for has moved or never existed.</p><a class="button" href="/">Back to Sela ↗</a></section>`;
}
function render() {
  const path = decodeURIComponent(location.pathname).replace(/\/$/, "") || "/";
  let content, title;
  if (path === "/") {
    content = home();
    title = "Sela | Seasonal dining in Jakarta";
  } else if (path === "/menu") {
    content = menuPage();
    title = "The Menu | Sela";
  } else if (path.startsWith("/menu/") && !path.slice(6).includes("/")) {
    content = dishPage(path.slice(6));
    title = `${menu.find((item) => item.slug === path.slice(6))?.name || "Dish not found"} | Sela`;
  } else if (path === "/reservations") {
    content = reservationPage();
    title = "Reserve a Table | Sela";
  } else if (path === "/order") {
    content = orderPage();
    title = "Order Pickup | Sela";
  } else if (path === "/about") {
    content = aboutPage();
    title = "Our Story | Sela";
  } else if (path === "/contact") {
    content = contactPage();
    title = "Contact & Hours | Sela";
  } else {
    content = notFound();
    title = "Page Not Found | Sela";
  }
  document.title = title;
  app.innerHTML = shell(content);
  updateCartCount();
}
function showError(form, message) {
  const box = form.querySelector(".form-error");
  box.textContent = message;
  box.hidden = false;
  box.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function clearError(form) {
  const box = form.querySelector(".form-error");
  box.hidden = true;
  box.textContent = "";
}
function validateDate(date, time) {
  if (!date || !time) return "Choose a date and time.";
  const picked = new Date(`${date}T12:00:00Z`);
  if (
    Number.isNaN(picked.getTime()) ||
    picked.toISOString().slice(0, 10) !== date
  )
    return "Choose a valid date.";
  if (picked.getUTCDay() === 1)
    return "We are closed on Mondays. Please choose another date.";
  const nowDate = today();
  if (date < nowDate) return "Choose today or a future date.";
  if (date === nowDate) {
    const nowTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    if (time <= nowTime) return "Choose a time later today or another date.";
  }
  return "";
}
async function submitForm(event, type) {
  event.preventDefault();
  const form = event.target;
  clearError(form);
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  if (!/^[+()\d\s-]{7,22}$/.test(values.phone) || values.phone.replace(/\D/g, "").length < 7) {
    return showError(form, "Enter a valid phone number with at least seven digits.");
  }
  const dateError = validateDate(
    type === "reservation" ? values.date : values.pickupDate,
    type === "reservation" ? values.time : values.pickupTime,
  );
  if (dateError) return showError(form, dateError);
  const payload =
    type === "reservation"
      ? { ...values, partySize: Number(values.partySize) }
      : {
          ...values,
          items: cartEntries().map(({ dish, quantity }) => ({
            id: dish.id,
            quantity,
          })),
        };
  if (type === "order" && !payload.items.length)
    return showError(form, "Add something to your basket first.");
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.textContent = type === "reservation" ? "Reserving…" : "Placing order…";
  try {
    const response = await fetch(
      type === "reservation" ? "/api/reservations" : "/api/orders",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "Something went wrong. Please try again.",
      );
    if (type === "order") {
      cart = {};
      saveCart();
    }
    const title =
      type === "reservation"
        ? "Reservation confirmed"
        : "Pickup order received";
    const summary =
      type === "reservation"
        ? `<p>${prettyDate(result.date)}<br>${formatTime(result.time)} · Table for ${result.partySize}</p>`
        : `<p>${prettyDate(result.pickupDate)}<br>${formatTime(result.pickupTime)} · ${rupiah(result.total)}</p>`;
    form.parentElement.innerHTML = `<div class="confirmation" role="status"><p class="eyebrow">${result.id}</p><h2>${title}.</h2>${summary}<p>${type === "reservation" ? "We look forward to seeing you." : "Pay at pickup when you collect."}</p><p class="fine-print">Portfolio demo: no email or restaurant notification is sent.</p><a class="button" href="/">Back to Sela ↗</a></div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showError(form, error.message);
    button.disabled = false;
    button.textContent =
      type === "reservation" ? "Confirm reservation ↗" : "Place pickup order ↗";
  }
}
app.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry]")) {
    location.reload();
    return;
  }
  const toggle = event.target.closest(".menu-toggle");
  if (toggle) {
    const nav = document.querySelector("#mobile-nav");
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    nav.hidden = open;
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    render();
    document.querySelector(".filter-tabs")?.scrollIntoView({ block: "start" });
    return;
  }
  const add = event.target.closest("[data-add]");
  if (add) {
    const id = add.dataset.add;
    cart[id] = Math.min((cart[id] || 0) + 1, 20);
    saveCart();
    if (location.pathname === "/order")
      document.querySelector("#cart-content").innerHTML = cartMarkup();
    const submit = document.querySelector('#order-form [type="submit"]');
    if (submit) submit.disabled = false;
    add.textContent = "Added ✓";
    setTimeout(() => {
      if (add.isConnected)
        add.textContent =
          location.pathname === "/order" ? "Add +" : "Add for pickup ↗";
    }, 1200);
    return;
  }
  const plus = event.target.closest("[data-increase]");
  const minus = event.target.closest("[data-decrease]");
  const remove = event.target.closest("[data-remove]");
  if (plus || minus || remove) {
    const id = (plus || minus || remove).dataset[
      plus ? "increase" : minus ? "decrease" : "remove"
    ];
    cart[id] = remove
      ? 0
      : Math.max(0, Math.min(20, (cart[id] || 0) + (plus ? 1 : -1)));
    if (!cart[id]) delete cart[id];
    saveCart();
    document.querySelector("#cart-content").innerHTML = cartMarkup();
    document.querySelector('#order-form [type="submit"]').disabled =
      !cartEntries().length;
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id === "reservation-form") submitForm(event, "reservation");
  if (event.target.id === "order-form") submitForm(event, "order");
});
try {
  menu = JSON.parse(document.querySelector("#menu-data").textContent);
  render();
} catch {
  app.innerHTML =
    '<div class="load-error"><h1>We could not load the menu.</h1><p>Please refresh the page and try again.</p><button type="button" data-retry>Retry</button></div>';
}
