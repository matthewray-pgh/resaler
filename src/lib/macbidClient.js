/**
 * macbidClient — direct browser client for the Mac.bid API.
 *
 * Mac.bid's API (api.macdiscount.com) sends `Access-Control-Allow-Origin: *`,
 * so it can be called straight from the browser — no server proxy needed.
 * Auth state (tokens, device_id) is kept in localStorage instead of a
 * server-side session; nothing here ever stores the account password.
 */

const API_ROOT = "https://api.macdiscount.com";
const AUTH_KEY = "resaler:auth";

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function isExpired(isoString) {
  if (!isoString) return true;
  const bufferMs = 5 * 60 * 1000; // refresh 5 min early
  return Date.now() >= new Date(isoString).getTime() - bufferMs;
}

async function ensureValidToken() {
  const auth = loadAuth();
  if (!auth.token) throw new Error("Not authenticated");
  if (!isExpired(auth.token_expiration)) return auth;

  if (!auth.refresh_token || !auth.device_id) throw new Error("Session expired — please sign in again");

  const res = await fetch(`${API_ROOT}/auth/refresh-token`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: auth.refresh_token,
      device_id: auth.device_id,
      remember_me: true,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error || !json.access_token) {
    clearAuth();
    throw new Error(json.error || "Session expired — please sign in again");
  }

  const next = {
    ...auth,
    token: json.access_token,
    token_expiration: new Date(json.expires * 1000).toISOString(),
    ...(json.refresh_token ? { refresh_token: json.refresh_token } : {}),
    ...(json.expiration_refresh ? { refresh_token_expiration: new Date(json.expiration_refresh * 1000).toISOString() } : {}),
  };
  saveAuth(next);
  return next;
}

async function authedGet(path) {
  const auth = await ensureValidToken();
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { Authorization: auth.token },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────

/**
 * Step 1: submit email + password. Mac.bid always responds by texting a
 * verification code, so this always resolves to "2fa_required" on success.
 */
async function login(email, password) {
  const device_id = crypto.randomUUID();

  const res = await fetch(`${API_ROOT}/auth/auth-validation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id, email, password,
      ref_code: null, ref_r: null, remember_me: true,
      utm_campaign: null, utm_medium: null, utm_source: null,
    }),
  });
  const json = await res.json();

  if (json.message !== "Login validation code sent") {
    throw new Error(json.message || json.error || "Login failed");
  }

  saveAuth({ device_id });
  return { status: "2fa_required" };
}

/** Step 2: submit the SMS code to complete login. */
async function verify(code) {
  const auth = loadAuth();
  if (!auth.device_id) throw new Error("No pending login — start with login() first");

  const res = await fetch(`${API_ROOT}/auth/validate-access-code`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, device_id: auth.device_id, new_password: "", remember_me: false }),
  });
  const json = await res.json();

  const errorMessage = json.error || json.message || "";
  const failed = res.status !== 200 || json.error || (typeof errorMessage === "string" && errorMessage.includes("Missing"));
  if (failed || !json.access_token) {
    throw new Error(errorMessage || "Verification failed");
  }

  saveAuth({
    device_id: auth.device_id,
    token: json.access_token,
    refresh_token: json.refresh_token,
    token_expiration: new Date(json.expires * 1000).toISOString(),
    refresh_token_expiration: new Date(json.expiration_refresh * 1000).toISOString(),
    user_id: String(json.user_id),
  });
  return { status: "authenticated", userId: String(json.user_id) };
}

function checkStatus() {
  const auth = loadAuth();
  return Promise.resolve({ isAuthenticated: !!(auth.token || auth.refresh_token), userId: auth.user_id });
}

function logout() {
  clearAuth();
  return Promise.resolve({ status: "logged_out" });
}

// ── Data ─────────────────────────────────────────────────────────────────

async function getWatchlist() {
  const auth = await ensureValidToken();
  const json = await authedGet(`/auctions/customer/${auth.user_id}/active-auctions`);
  return { watchlist: json.watchlist_full ?? [] };
}

async function getLocations() {
  const locations = await authedGet("/locations");
  return { locations: Array.isArray(locations) ? locations : (locations?.locations ?? []) };
}

async function getActive() {
  const auth = await ensureValidToken();
  const active = await authedGet(`/user/${auth.user_id}/active`);
  return { active: active ?? [] };
}

async function getAuctions(locationId, limit = 50, sort = "expected_close_date") {
  const auth = await ensureValidToken();
  const endpoints = [
    `/auctions?location_id=${locationId}&limit=${limit}&sort=${sort}`,
    `/auctions/location/${locationId}?limit=${limit}`,
    `/auctions?building_id=${locationId}&limit=${limit}`,
  ];

  let auctions = [];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${API_ROOT}${endpoint}`, { headers: { Authorization: auth.token } });
      const json = await res.json();
      const found = json?.auctions ?? json?.data ?? (Array.isArray(json) ? json : null);
      if (found?.length > 0) { auctions = found; break; }
    } catch {
      // try next endpoint pattern
    }
  }
  return { auctions };
}

export const macbid = {
  checkStatus, login, verify, logout,
  getWatchlist, getLocations, getAuctions, getActive,
};
