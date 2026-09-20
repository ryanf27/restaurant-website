const { RequestError, createOrder, createReservation } = require("../api/_restaurant.cjs");

async function readBody(request) {
  if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString("utf8"));
  if (typeof request.body === "string") return JSON.parse(request.body);
  if (request.body && typeof request.body === "object") return request.body;
  let raw = "";
  for await (const part of request) {
    raw += part;
    if (raw.length > 16000) throw new RequestError(400, "Request too large.");
  }
  return JSON.parse(raw || "{}");
}

function makeHandler(kind) {
  return async function handler(request, response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return response.status(405).json({ error: "Method not allowed." });
    }
    try {
      const data = await readBody(request);
      const result =
        kind === "reservation" ? await createReservation(data) : await createOrder(data);
      return response.status(201).json(result);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return response.status(400).json({ error: "Invalid request." });
      }
      if (error instanceof RequestError) {
        return response.status(error.status).json({ error: error.message });
      }
      console.error(error);
      return response.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };
}

module.exports = { makeHandler };
