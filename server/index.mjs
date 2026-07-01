/**
 * Mac.bid Research Tool — Express Backend
 *
 * Acts as a proxy between the React frontend and api.macdiscount.com
 * Handles all Mac.bid API calls (auth, watchlist, auctions, locations)
 * and stores session state in-memory per user session.
 */

import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import MacBid, { } from "macbid-ts-api";
import { searchActiveListings } from "./ebay.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production — refusing to start with a default secret");
}

// ── Middleware ──────────────────────────────────────────────────────────────

if (isProd) app.set("trust proxy", 1); // required for secure cookies behind a hosting provider's proxy

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-only-secret-do-not-use-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: isProd, // Express serves the built frontend itself in prod, so same-origin cookies work fine
    sameSite: "lax",
  },
}));

// ── Mac.bid API instance per session ───────────────────────────────────────
// We store auth state in the session and create a fresh MacBid instance
// each request (the library is stateless after authenticate())

function getMacBidInstance(req) {
  const api = new MacBid();
  return api;
}

async function ensureAuthenticated(req, res, next) {
  if (!req.session.authState?.token && !req.session.authState?.refresh_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// ── Auth Routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Step 1: provide email + password → triggers SMS 2FA code
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const api = getMacBidInstance(req);
  // Clear any previous partial state
  req.session.authState = {};

  try {
    const state = await api.authenticate({ email, password });
    req.session.authState = state;
    return res.json({ status: "authenticated", userId: state.user_id });
  } catch (err) {
    if (err.message?.includes("Validation code sent")) {
      // 2FA required — save the device_id so we can complete login
      const partialState = api.getAuthState();
      req.session.authState = { ...partialState, pendingEmail: email, pendingPassword: password };
      return res.json({ status: "2fa_required" });
    }
    return res.status(401).json({ error: err.message });
  }
});

/**
 * POST /api/auth/verify
 * Step 2: provide the SMS code to complete login
 */
app.post("/api/auth/verify", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Verification code required" });

  const partial = req.session.authState;
  if (!partial?.device_id) {
    return res.status(400).json({ error: "No pending login — start with /api/auth/login first" });
  }

  const api = getMacBidInstance(req);
  try {
    const state = await api.authenticate({
      email:           partial.pendingEmail,
      password:        partial.pendingPassword,
      validation_code: code,
      device_id:       partial.device_id,
    });
    req.session.authState = state;
    return res.json({ status: "authenticated", userId: state.user_id });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

/**
 * GET /api/auth/status
 * Check if current session is authenticated
 */
app.get("/api/auth/status", (req, res) => {
  const state = req.session.authState;
  const isAuthenticated = !!(state?.token || state?.refresh_token);
  res.json({ isAuthenticated, userId: state?.user_id });
});

/**
 * POST /api/auth/logout
 */
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ status: "logged_out" });
});

// ── Data Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/watchlist
 * Returns all items on the user's Mac.bid watchlist with full attributes
 */
app.get("/api/watchlist", ensureAuthenticated, async (req, res) => {
  const api = getMacBidInstance(req);
  try {
    const state = MacBid.parseAuthState(req.session.authState);
    await api.authenticate(state);

    const watchlist = await api.get_watchlist();
    // Persist any refreshed tokens
    req.session.authState = api.getAuthState();

    res.json({ watchlist: watchlist ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/locations
 * Returns all Mac.bid pickup locations (warehouses)
 */
app.get("/api/locations", ensureAuthenticated, async (req, res) => {
  const api = getMacBidInstance(req);
  try {
    const state = MacBid.parseAuthState(req.session.authState);
    await api.authenticate(state);

    const data = await api.get_locations();
    req.session.authState = api.getAuthState();

    const locations = Array.isArray(data) ? data : (data?.locations ?? []);
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auctions?locationId=X&limit=50
 * Browse active auction lots at a given location
 */
app.get("/api/auctions", ensureAuthenticated, async (req, res) => {
  const { locationId, limit = 50, sort = "expected_close_date" } = req.query;
  const api = getMacBidInstance(req);
  try {
    const state = MacBid.parseAuthState(req.session.authState);
    await api.authenticate(state);

    // Try several endpoint patterns (Mac.bid's API isn't documented)
    let auctions = [];
    const endpoints = [
      `/auctions?location_id=${locationId}&limit=${limit}&sort=${sort}`,
      `/auctions/location/${locationId}?limit=${limit}`,
      `/auctions?building_id=${locationId}&limit=${limit}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res2 = await api.get(endpoint);
        const json = await res2.json();
        const found = json?.auctions ?? json?.data ?? (Array.isArray(json) ? json : null);
        if (found?.length > 0) { auctions = found; break; }
      } catch { /* try next */ }
    }

    req.session.authState = api.getAuthState();
    res.json({ auctions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/active
 * Returns the user's active won items (awaiting pickup)
 */
app.get("/api/active", ensureAuthenticated, async (req, res) => {
  const api = getMacBidInstance(req);
  try {
    const state = MacBid.parseAuthState(req.session.authState);
    await api.authenticate(state);

    const data = await api.get_active();
    req.session.authState = api.getAuthState();

    res.json({ active: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── eBay Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/ebay/search?q=...
 * Looks up current active eBay listings for a query (Browse API — asking
 * prices, not sold prices). Gated behind Mac.bid auth so a public deployment
 * can't be used by strangers to burn through our shared eBay API quota.
 */
app.get("/api/ebay/search", ensureAuthenticated, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

  try {
    const result = await searchActiveListings(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Static frontend (production only — local dev uses the Vite dev server) ──

if (isProd) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅  Server running on port ${PORT} (${isProd ? "production" : "development"})`);
  if (!isProd) console.log(`    Start the React frontend with: npm run client\n`);
});
