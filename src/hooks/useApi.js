/**
 * useApi — thin wrapper around fetch calls to our Express backend.
 * All Mac.bid API calls go through here.
 */

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
  return json;
}

export const api = {
  // Auth
  checkStatus:  ()             => request("/auth/status"),
  login:        (email, pw)    => request("/auth/login",  { method: "POST", body: JSON.stringify({ email, password: pw }) }),
  verify:       (code)         => request("/auth/verify", { method: "POST", body: JSON.stringify({ code }) }),
  logout:       ()             => request("/auth/logout", { method: "POST" }),

  // Data
  getWatchlist: ()             => request("/watchlist"),
  getLocations: ()             => request("/locations"),
  getAuctions:  (locationId)   => request(`/auctions?locationId=${locationId}`),
  getActive:    ()             => request("/active"),

  // eBay
  getEbayComps: (query)        => request(`/ebay/search?q=${encodeURIComponent(query)}`),
};
