import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableCellsLarge, faList } from "@fortawesome/free-solid-svg-icons";
import { api } from "../hooks/useApi";
import { useSettings } from "../hooks/useSettings";
import ItemCard from "./ItemCard";
import { analyzeLot } from "../utils/profitCalc";

const SORTS = {
  margin: (a, b) => b._margin - a._margin,
  profit: (a, b) => b._netProfit - a._netProfit,
  closing: (a, b) => (a._daysLeft ?? Infinity) - (b._daysLeft ?? Infinity),
  nameAsc: (a, b) => a._name.localeCompare(b._name),
  nameDesc: (a, b) => b._name.localeCompare(a._name),
};

export default function WatchlistTab() {
  const [settings, updateSettings] = useSettings();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("margin");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getWatchlist()
      .then(res => { if (!cancelled) setItems(res.watchlist ?? []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { sorted, summary } = useMemo(() => {
    if (!items) return { sorted: [], summary: null };

    const analyzed = items.map(item => {
      const a = analyzeLot(item);
      const name = item.product_name ?? item.title ?? "";
      return { item, _margin: a.margin, _netProfit: a.netProfit, _daysLeft: a.daysLeft, _name: name };
    });
    analyzed.sort(SORTS[sortBy]);

    const good = analyzed.filter(x => x._margin >= 25).length;
    const avgMargin = analyzed.length
      ? analyzed.reduce((sum, x) => sum + x._margin, 0) / analyzed.length
      : 0;

    return {
      sorted: analyzed.map(x => x.item),
      summary: { total: analyzed.length, good, avgMargin },
    };
  }, [items, sortBy]);

  if (loading) {
    return <div className="text-slate-500 text-sm py-12 text-center">Loading watchlist…</div>;
  }

  if (error) {
    return (
      <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3 text-accent-red text-sm">
        Failed to load watchlist: {error}
      </div>
    );
  }

  if (!sorted.length) {
    return <div className="text-slate-500 text-sm py-12 text-center">Your Mac.bid watchlist is empty.</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <div className="stat-label mb-0.5">Watched items</div>
          <div className="mono text-lg font-semibold">{summary.total}</div>
        </div>
        <div>
          <div className="stat-label mb-0.5">Good+ deals</div>
          <div className="mono text-lg font-semibold text-accent-green">{summary.good}</div>
        </div>
        <div>
          <div className="stat-label mb-0.5">Avg margin</div>
          <div className="mono text-lg font-semibold">{summary.avgMargin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input w-auto text-sm py-1.5"
        >
          <option value="margin">Sort: Margin</option>
          <option value="profit">Sort: Net profit</option>
          <option value="closing">Sort: Closing soon</option>
          <option value="nameAsc">Sort: Name A→Z</option>
          <option value="nameDesc">Sort: Name Z→A</option>
        </select>

        <div className="flex items-center rounded-lg border border-surface-500 overflow-hidden">
          <button
            onClick={() => updateSettings({ watchlistView: "card" })}
            title="Card view"
            aria-label="Card view"
            aria-pressed={settings.watchlistView === "card"}
            className={`px-3 py-1.5 transition-colors ${
              settings.watchlistView === "card"
                ? "bg-accent-blue text-white"
                : "text-slate-400 hover:bg-surface-600 hover:text-slate-100"
            }`}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateSettings({ watchlistView: "list" })}
            title="List view"
            aria-label="List view"
            aria-pressed={settings.watchlistView === "list"}
            className={`px-3 py-1.5 transition-colors ${
              settings.watchlistView === "list"
                ? "bg-accent-blue text-white"
                : "text-slate-400 hover:bg-surface-600 hover:text-slate-100"
            }`}
          >
            <FontAwesomeIcon icon={faList} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={
        settings.watchlistView === "list"
          ? "flex flex-col gap-2"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      }>
        {sorted.map(item => (
          <ItemCard
            key={item.id ?? `${item.auction_number}-${item.lot_number}`}
            item={item}
            variant={settings.watchlistView}
          />
        ))}
      </div>
    </div>
  );
}
