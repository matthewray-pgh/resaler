/**
 * parseMacBid.js
 * Maps a Mac.bid API lot object → listing form fields
 * Also provides a Claude-powered parser for pasted Mac.bid text
 */

import { api } from "../hooks/useApi";

// ── Brand extraction (used for the watchlist-import path) ───────────────────

const KNOWN_BRANDS = [
  "Ninja", "KitchenAid", "Cuisinart", "Instant Pot", "Keurig", "Breville", "Nespresso",
  "DeWalt", "Milwaukee", "Makita", "Ryobi", "Black+Decker", "Bosch",
  "Dyson", "Shark", "iRobot", "Bissell", "Hoover", "Roomba",
  "Apple", "Samsung", "LG", "Sony", "Bose", "JBL", "Anker",
  "Ring", "Nest", "Arlo", "Amazon", "Google",
  "Nintendo", "PlayStation", "Xbox", "Razer", "Logitech",
  "Fitbit", "Garmin", "NordicTrack",
  "LEGO", "Fisher-Price", "Hasbro", "Mattel",
];

function extractBrand(text = "") {
  for (const brand of KNOWN_BRANDS) {
    if (text.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  // Fall back to first word if it looks like a brand (capitalized)
  const first = text.split(/\s+/)[0];
  return /^[A-Z]/.test(first) ? first : "";
}

function extractModel(text = "") {
  // Look for patterns like AF101, DCD777, etc.
  const match = text.match(/\b([A-Z]{1,4}[-\s]?[0-9]{2,6}[A-Z]?)\b/);
  return match ? match[1] : "";
}

// ── Category mapping ─────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  "kitchen":    "Small Kitchen Appliances",
  "appliance":  "Small Kitchen Appliances",
  "tool":       "Power Tools",
  "drill":      "Power Tools",
  "vacuum":     "Vacuums & Floor Care",
  "floor":      "Vacuums & Floor Care",
  "roomba":     "Vacuums & Floor Care",
  "smart":      "Smart Home / Electronics",
  "speaker":    "Smart Home / Electronics",
  "camera":     "Smart Home / Electronics",
  "gaming":     "Gaming & Accessories",
  "controller": "Gaming & Accessories",
  "fitness":    "Fitness & Exercise",
  "exercise":   "Fitness & Exercise",
  "baby":       "Baby & Toys",
  "toy":        "Baby & Toys",
  "laptop":     "Laptops & Tablets",
  "tablet":     "Laptops & Tablets",
  "ipad":       "Laptops & Tablets",
};

function guessCategory(text = "") {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return "Other";
}

// ── Condition mapping ────────────────────────────────────────────────────────

const CONDITION_MAP = {
  "LIKE NEW":  "Used – Like New",
  "OPEN BOX":  "New – Open Box",
  "DAMAGED":   "For Parts / Not Working",
  "NEW":       "New – Sealed",
  "GOOD":      "Used – Good",
  "FAIR":      "Used – Acceptable",
};

// ── Main mapper ──────────────────────────────────────────────────────────────

/**
 * Convert a Mac.bid API lot object to a listing form state object.
 */
export function macBidLotToForm(lot) {
  const name = lot.product_name || lot.title || "";

  return {
    brand:       extractBrand(name),
    productName: name,
    modelNumber: extractModel(name),
    condition:   CONDITION_MAP[lot.condition_name?.toUpperCase()] ?? "Used – Good",
    category:    guessCategory(`${name} ${lot.category ?? ""}`),
    included:    "",   // Not available from API — user fills in after inspection
    defects:     "",   // User fills in after inspection
    retailPrice: lot.retail_price?.toString()       ?? "",
    yourCost:    lot.winning_bid_amount?.toString() ?? "",
    extraNotes:  [
      lot.lot_number    ? `Mac.bid Lot ${lot.lot_number}` : "",
      lot.auction_number ? `Auction ${lot.auction_number}` : "",
      lot.quantity > 1  ? `Qty: ${lot.quantity}` : "",
      lot.warehouse_location ? `Warehouse: ${lot.warehouse_location}` : "",
    ].filter(Boolean).join(" · "),

    // Extra Mac.bid metadata (not shown in form but used for display)
    _macBid: {
      image:       lot.image_url         ?? null,
      lotId:       lot.auction_lot_id    ?? null,
      lotNumber:   lot.lot_number        ?? null,
      retail:      lot.retail_price      ?? 0,
      currentBid:  lot.winning_bid_amount ?? 0,
      totalBids:   lot.total_bids        ?? 0,
      condition:   lot.condition_name    ?? "UNKNOWN",
      daysLeft:    lot.expected_close_date
        ? Math.max(0, Math.round((new Date(lot.expected_close_date) - Date.now()) / 86400000))
        : null,
    },
  };
}

/**
 * Use Claude (via our backend) to parse pasted Mac.bid listing text into
 * form fields. The Anthropic API key stays server-side.
 */
export async function parsePastedMacBidText(pastedText) {
  return api.parseListingText(pastedText);
}
