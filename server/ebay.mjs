/**
 * eBay Browse API client — app-only OAuth (client credentials grant).
 *
 * Note: the Browse API returns ACTIVE listing (asking) prices, not sold prices.
 * Real sold comps require eBay's Marketplace Insights API, which needs special
 * limited-release approval that most developer accounts don't have.
 */

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing EBAY_CLIENT_ID / EBAY_CLIENT_SECRET — set them in .env");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: SCOPE }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

function median(nums) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Search current active eBay listings for a query string.
 * Returns summary stats plus a handful of raw listings.
 */
export async function searchActiveListings(query, { limit = 20 } = {}) {
  const token = await getAccessToken();
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const items = data.itemSummaries ?? [];
  const prices = items
    .map(i => Number(i.price?.value))
    .filter(n => Number.isFinite(n));

  return {
    query,
    count: items.length,
    medianPrice: median(prices),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    listings: items.slice(0, 10).map(i => ({
      title: i.title,
      price: Number(i.price?.value) || null,
      condition: i.condition ?? null,
      url: i.itemWebUrl,
      imageUrl: i.image?.imageUrl ?? null,
    })),
  };
}
