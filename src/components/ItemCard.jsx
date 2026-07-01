import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { analyzeLot, getRating, formatCurrency, formatPct } from "../utils/profitCalc";
import { api } from "../hooks/useApi";

const HIGH_RISK = ["Clothing", "Shoes", "Jewelry", "Printer"];

function StatBlock({ label, value, valueClass = "", align = "left", badge = null }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className={`stat-label mb-0.5 flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        {badge}
      </div>
      <div className={`mono text-sm font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function SourceBadge({ isEstimated }) {
  return isEstimated ? (
    <span className="px-1 py-px rounded text-[9px] font-bold bg-surface-600 text-slate-500 border border-surface-500">
      EST
    </span>
  ) : (
    <span className="px-1 py-px rounded text-[9px] font-bold bg-accent-green/15 text-accent-green border border-accent-green/30">
      LIVE
    </span>
  );
}

function TransferFeeBadge({ fee }) {
  if (!fee) return null;
  return (
    <span
      title="Added because this lot isn't at Monroeville or Pittsburgh Mills"
      className="px-1 py-px rounded text-[9px] font-bold bg-accent-amber/15 text-accent-amber border border-accent-amber/30"
    >
      +{formatCurrency(fee)} xfer
    </span>
  );
}

export default function ItemCard({ item, variant = "card" }) {
  const [ebay, setEbay] = useState(null); // null | { loading } | { data } | { error }
  const a       = analyzeLot(item, ebay?.data?.medianPrice ?? undefined);
  const rating  = getRating(a.margin);
  const isRisky = HIGH_RISK.some(c => (item.category ?? "").includes(c));

  const closingLabel = a.daysLeft === null ? null
    : a.daysLeft === 0 ? "Closes today"
    : `${a.daysLeft}d left`;

  async function checkEbay() {
    setEbay({ loading: true });
    try {
      const query = item.product_name ?? item.title ?? "";
      const data = await api.getEbayComps(query);
      setEbay({ data });
    } catch (err) {
      setEbay({ error: err.message });
    }
  }

  if (variant === "list") {
    return (
      <div className={`card px-4 py-3 flex flex-col gap-2.5 border ${rating.border}`}>
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-slate-100 truncate">
                {item.product_name ?? item.title ?? "Unknown Item"}
              </p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${rating.bg} ${rating.color} border ${rating.border}`}>
                {rating.label}
              </span>
              {item.category && (
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${isRisky ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30" : "bg-surface-600 text-slate-400 border-surface-500"}`}>
                  {item.category}{isRisky ? " ⚠" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Lot {item.lot_number} · {item.auction_number}
              {item.condition_name && ` · ${item.condition_name}`}
              {closingLabel && ` · ${closingLabel}`}
              {item.warehouse_location && ` · ${item.warehouse_location}`}
            </p>
          </div>

          <button
            onClick={checkEbay}
            title="Check eBay listings"
            className="btn-ghost text-xs px-2 py-1.5 shrink-0 flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3 h-3" />
            <span className="hidden md:inline">
              {ebay?.loading ? "Checking…" : ebay?.data ? "Refresh" : "Check eBay"}
            </span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2 pt-2 border-t border-surface-500">
          <StatBlock label="Retail"      value={formatCurrency(item.retail_price)} />
          <StatBlock label="Bid"         value={formatCurrency(item.winning_bid_amount)} />
          <StatBlock
            label={a.isEstimated ? "Est. sale" : "Sale (live)"}
            value={formatCurrency(a.estimatedSale)}
            valueClass="text-slate-300"
            badge={<SourceBadge isEstimated={a.isEstimated} />}
          />
          <StatBlock
            label="Total cost"
            value={formatCurrency(a.totalCost)}
            badge={<TransferFeeBadge fee={a.transferFee} />}
          />
          <StatBlock
            label="Net profit"
            value={formatCurrency(a.netProfit)}
            valueClass={a.netProfit >= 0 ? "text-accent-green" : "text-accent-red"}
          />
          <StatBlock label="Margin"  value={formatPct(a.margin)} valueClass={rating.color} />
          <StatBlock label="Max bid" value={formatCurrency(a.maxBid)} valueClass="text-accent-blue" />
        </div>

        {/* Bid competition + eBay lookup status */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{item.total_bids ?? 0} bids · {item.unique_bidders ?? 0} bidders · {formatPct(a.bidRatio)} of retail</span>
          {ebay?.error && <span className="text-accent-red">eBay lookup failed: {ebay.error}</span>}
          {ebay?.data && (
            <span>
              {ebay.data.medianPrice != null
                ? `${ebay.data.count} active eBay listings`
                : "No active eBay listings found"}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 flex flex-col gap-3 border ${rating.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-100 leading-tight truncate">
            {item.product_name ?? item.title ?? "Unknown Item"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Lot {item.lot_number} · {item.auction_number}
            {item.condition_name && ` · ${item.condition_name}`}
          </p>
        </div>
        <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${rating.bg} ${rating.color} border ${rating.border}`}>
          {rating.label}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {item.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${isRisky ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30" : "bg-surface-600 text-slate-400 border-surface-500"}`}>
            {item.category}{isRisky ? " ⚠" : ""}
          </span>
        )}
        {closingLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 border border-surface-500 text-slate-400">
            🕐 {closingLabel}
          </span>
        )}
        {item.warehouse_location && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 border border-surface-500 text-slate-400">
            📦 {item.warehouse_location}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 border-t border-surface-500">
        <StatBlock label="Retail price"    value={formatCurrency(item.retail_price)} />
        <StatBlock label="Current bid"     value={formatCurrency(item.winning_bid_amount)} />
        <StatBlock
          label={a.isEstimated ? "Est. eBay sale" : "eBay sale (live)"}
          value={formatCurrency(a.estimatedSale)}
          valueClass="text-slate-300"
          badge={<SourceBadge isEstimated={a.isEstimated} />}
        />
        <StatBlock
          label="Total cost"
          value={formatCurrency(a.totalCost)}
          badge={<TransferFeeBadge fee={a.transferFee} />}
        />
        <StatBlock
          label="Net profit"
          value={formatCurrency(a.netProfit)}
          valueClass={a.netProfit >= 0 ? "text-accent-green" : "text-accent-red"}
        />
        <StatBlock
          label="Margin"
          value={formatPct(a.margin)}
          valueClass={rating.color}
        />
      </div>

      {/* Max bid callout */}
      <div className="bg-surface-800 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Max bid for 25% margin</span>
        <span className="mono text-sm font-bold text-accent-blue">{formatCurrency(a.maxBid)}</span>
      </div>

      {/* Bid competition */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{item.total_bids ?? 0} bids · {item.unique_bidders ?? 0} bidders</span>
        <span>{formatPct(a.bidRatio)} of retail</span>
      </div>

      {/* eBay live lookup (active listings, not sold comps) */}
      <div className="border-t border-surface-500 pt-2">
        {!ebay && (
          <button
            onClick={checkEbay}
            className="btn-ghost text-xs w-full flex items-center justify-center gap-1.5"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3 h-3" />
            Check eBay listings
          </button>
        )}
        {ebay?.loading && (
          <div className="text-xs text-slate-500 text-center py-1">Checking eBay…</div>
        )}
        {ebay?.error && (
          <div className="text-xs text-accent-red text-center py-1">eBay lookup failed: {ebay.error}</div>
        )}
        {ebay?.data && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {ebay.data.medianPrice != null
                ? `eBay active listings (${ebay.data.count}) — median above`
                : "No active listings found."}
            </span>
            <button onClick={checkEbay} className="text-accent-blue hover:underline">Refresh</button>
          </div>
        )}
      </div>
    </div>
  );
}
