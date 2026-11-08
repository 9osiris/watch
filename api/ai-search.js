"use strict";

// Groq credentials and all provider calls stay in the server-only service.
// POST /api/ai-search supports version-2 plan/rank requests; { query } defaults to plan.
const { createService } = require("../lib/ai-search-service.cjs");
const service = createService();

module.exports = async function aiSearch(req, res) {
  // Set this before invoking the service, including all validation/error paths.
  res.setHeader("Cache-Control", "no-store");
  const result = await service.handle(req);
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  res.status(result.status).json(result.body);
};
