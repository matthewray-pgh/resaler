// ── Constants ────────────────────────────────────────────────────────────────

export const BUYER_PREMIUM_PCT  = 0.18;  // Mac.bid buyer's premium
export const EBAY_FEE_PCT       = 0.13;  // eBay final value fee (~13%)
export const SHIP_SUPPLY_COST   = 8;     // Avg packaging + label cost
export const TARGET_MARGIN_PCT  = 25;    // Minimum acceptable margin

export const TRANSFER_FEE = 10; // Charged unless the lot is already at a no-fee pickup location
export const NO_TRANSFER_FEE_LOCATIONS = ["Monroeville", "Pittsburgh Mills"];

function needsTransferFee(warehouseLocation) {
  const loc = (warehouseLocation ?? "").toLowerCase();
  return !NO_TRANSFER_FEE_LOCATIONS.some(name => loc.includes(name.toLowerCase()));
}

// Conservative eBay resale multiplier vs. retail price, by condition
export const RESALE_MULTIPLIERS = {
  "LIKE NEW":  0.55,
  "OPEN BOX":  0.45,
  "DAMAGED":   0.20,
  "UNKNOWN":   0.35,
};

// ── Core calculations ────────────────────────────────────────────────────────

/**
 * Given a lot from the Mac.bid API, compute all profit metrics.
 * @param {object} item              Mac.bid auction lot
 * @param {number} [overrideSalePrice]  Real eBay price to use instead of the heuristic estimate
 * @returns {object}     Profit analysis
 */
export function analyzeLot(item, overrideSalePrice) {
  const retail      = item.retail_price      ?? 0;
  const currentBid  = item.winning_bid_amount ?? 0;
  const condition   = item.condition_name    ?? "UNKNOWN";
  const multiplier  = RESALE_MULTIPLIERS[condition] ?? RESALE_MULTIPLIERS["UNKNOWN"];

  // Estimated eBay sale price — a real number from eBay overrides the heuristic guess
  const estimatedSale = overrideSalePrice ?? (retail * multiplier);
  const isEstimated   = overrideSalePrice == null;

  // Transfer fee applies unless the lot is already sitting at a no-fee location
  const transferFee = needsTransferFee(item.warehouse_location) ? TRANSFER_FEE : 0;

  // Total cost if you win at current bid
  const totalCost = currentBid * (1 + BUYER_PREMIUM_PCT) + transferFee;

  // Selling costs
  const sellCosts = estimatedSale * EBAY_FEE_PCT + SHIP_SUPPLY_COST;

  // Net profit and margin
  const netProfit = estimatedSale - sellCosts - totalCost;
  const margin    = estimatedSale > 0 ? (netProfit / estimatedSale) * 100 : 0;
  const roi       = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Maximum bid to hit target margin (backed out of the flat transfer fee too)
  const targetNet  = estimatedSale * (1 - EBAY_FEE_PCT) - SHIP_SUPPLY_COST;
  const maxBid     = Math.max(
    (targetNet * (1 - TARGET_MARGIN_PCT / 100) - transferFee) / (1 + BUYER_PREMIUM_PCT),
    0
  );

  // Current bid as % of retail (how competitive the lot is)
  const bidRatio = retail > 0 ? (currentBid / retail) * 100 : 0;

  // Days until auction closes
  const daysLeft = item.expected_close_date
    ? Math.max(0, Math.round((new Date(item.expected_close_date) - Date.now()) / 86400000))
    : null;

  return {
    estimatedSale,
    isEstimated,
    transferFee,
    totalCost,
    sellCosts,
    netProfit,
    margin,
    roi,
    maxBid,
    bidRatio,
    daysLeft,
    condition,
  };
}

/**
 * Return a rating label and color class based on margin.
 */
export function getRating(margin) {
  if (margin >= 35)               return { label: "GREAT",  color: "text-accent-green",  bg: "bg-accent-green/10",  border: "border-accent-green/30"  };
  if (margin >= TARGET_MARGIN_PCT) return { label: "GOOD",   color: "text-accent-blue",   bg: "bg-accent-blue/10",   border: "border-accent-blue/30"   };
  if (margin >= 10)               return { label: "THIN",   color: "text-accent-amber",  bg: "bg-accent-amber/10",  border: "border-accent-amber/30"  };
  return                                  { label: "SKIP",   color: "text-accent-red",    bg: "bg-accent-red/10",    border: "border-accent-red/30"    };
}

/**
 * Format a number as USD currency string.
 */
export const formatCurrency = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "—";

/**
 * Format a percentage.
 */
export const formatPct = (n) =>
  typeof n === "number" ? `${n.toFixed(1)}%` : "—";
