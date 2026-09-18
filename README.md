# Sela

A fictional contemporary restaurant website built with semantic HTML, CSS, browser JavaScript, and a small dependency-free Node server. The original one-page template has been refactored into routed views for the menu, dishes, reservations, pickup orders, story, and contact details.

## Run

Requires Node 18 or newer.

```sh
npm start
```

Open http://localhost:3000. Run `npm run check` for syntax checks and API tests. There is no compile step or third-party runtime dependency.

## Data and demo behavior

Menu content lives in `data/menu.json`. Reservation and pickup submissions are checked on the server, then saved to local JSON files in `data/` (ignored by Git). The API calculates order totals from menu prices. Bookings are capped at eight per time slot and party size at eight. This is a portfolio demo: no emails, restaurant notifications, or payment processing are sent. The restaurant, address, contact details, and chef are fictional.

To use a separate data directory, set `SELA_DATA_DIR` before starting the server. The process needs write access to that directory. Local JSON storage suits a single Node instance and is not intended for multiple server replicas.

## Imagery

The four WebP images in `assets/` were generated for this fictional brand and are referenced from the page and menu data. Replace them in place or update the paths in `data/menu.json` and `app.js`.
