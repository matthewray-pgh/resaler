import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { macBidLotToForm, parsePastedMacBidText } from "../../utils/parseMacBid";
import { formatCurrency, getRating, analyzeLot } from "../../utils/profitCalc";

// ── Watchlist lot card ────────────────────────────────────────────────────────

function LotCard({ lot, onSelect, selected }) {
  const analysis = analyzeLot(lot);
  const rating   = getRating(analysis.margin);

  return (
    <button
      onClick={() => onSelect(lot)}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
        selected
          ? "border-accent-blue bg-accent-blue/10"
          : "border-surface-500 bg-surface-800 hover:border-surface-400 hover:bg-surface-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-slate-100 leading-tight line-clamp-2 flex-1">
          {lot.product_name || lot.title || "Unknown Item"}
        </p>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${rating.bg} ${rating.color} border ${rating.border}`}>
          {rating.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{lot.condition_name ?? "?"}</span>
        <span>·</span>
        <span>Retail {formatCurrency(lot.retail_price)}</span>
        <span>·</span>
        <span>Bid {formatCurrency(lot.winning_bid_amount)}</span>
        {analysis.daysLeft !== null && (
          <>
            <span>·</span>
            <span className={analysis.daysLeft <= 1 ? "text-accent-red font-medium" : ""}>
              {analysis.daysLeft === 0 ? "Closes today" : `${analysis.daysLeft}d left`}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

// ── Main importer ─────────────────────────────────────────────────────────────

export default function MacBidImporter({ onImport, isAuthenticated }) {
  const [tab, setTab]             = useState("watchlist"); // "watchlist" | "paste"
  const [watchlist, setWatchlist] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);

  const [pasteText, setPasteText]   = useState("");
  const [parsing, setParsing]       = useState(false);
  const [parseError, setParseError] = useState(null);

  const [search, setSearch] = useState("");

  // Load watchlist when tab is selected and user is authenticated
  useEffect(() => {
    if (tab === "watchlist" && isAuthenticated && watchlist.length === 0) {
      fetchWatchlist();
    }
  }, [tab, isAuthenticated]);

  async function fetchWatchlist() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.watchlist ?? []);
    } catch (err) {
      setListError("Could not load watchlist. Make sure you're signed in.");
    } finally {
      setLoadingList(false);
    }
  }

  function handleSelectLot(lot) {
    setSelectedLot(lot);
    onImport(macBidLotToForm(lot));
  }

  async function handleParse() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      const parsed = await parsePastedMacBidText(pasteText);
      onImport({ ...parsed, included: "", defects: "", yourCost: "", _macBid: null });
    } catch {
      setParseError("Couldn't parse that text. Try pasting more detail from the Mac.bid listing page.");
    } finally {
      setParsing(false);
    }
  }

  const filtered = watchlist.filter(lot =>
    !search || (lot.product_name ?? lot.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-accent-blue/20 rounded flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-100">Import from Mac.bid</span>
        <span className="text-xs text-slate-500 ml-auto">Pre-fills the form automatically</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 rounded-lg p-1 mb-4">
        {[
          { id: "watchlist", label: "From Watchlist" },
          { id: "paste",     label: "Paste Listing Text" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === t.id
                ? "bg-surface-600 text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Watchlist tab ── */}
      {tab === "watchlist" && (
        <div>
          {!isAuthenticated ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              <p>Sign in to import directly from your Mac.bid watchlist.</p>
            </div>
          ) : loadingList ? (
            <div className="flex items-center justify-center py-8 gap-3 text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-surface-500 border-t-accent-blue rounded-full animate-spin" />
              Loading watchlist…
            </div>
          ) : listError ? (
            <div className="text-accent-red text-sm text-center py-4">
              {listError}
              <button onClick={fetchWatchlist} className="block mx-auto mt-2 text-xs text-slate-400 hover:text-slate-200 underline">
                Try again
              </button>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              <p>No items in your watchlist yet.</p>
              <p className="text-xs mt-1">Star items on Mac.bid to add them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Search */}
              <input
                className="input text-sm mb-1"
                placeholder="Search watchlist…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filtered.map(lot => (
                  <LotCard
                    key={lot.auction_lot_id ?? lot.lot_number}
                    lot={lot}
                    onSelect={handleSelectLot}
                    selected={selectedLot?.auction_lot_id === lot.auction_lot_id}
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-3">No results for "{search}"</p>
                )}
              </div>
              {selectedLot && (
                <div className="text-xs text-accent-green mt-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Imported — review and edit the form below, then generate your listing.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Paste tab ── */}
      {tab === "paste" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Copy the product title, specs, or description from a Mac.bid lot page and paste it below.
            Claude will extract the details and pre-fill the form.
          </p>
          <textarea
            className="input text-sm"
            style={{ minHeight: 100, resize: "vertical" }}
            placeholder="Paste Mac.bid listing text here…"
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          {parseError && (
            <p className="text-accent-red text-xs">{parseError}</p>
          )}
          <button
            onClick={handleParse}
            disabled={!pasteText.trim() || parsing}
            className="btn-primary text-sm py-2 w-full"
          >
            {parsing ? "Parsing…" : "Parse & pre-fill form"}
          </button>
        </div>
      )}
    </div>
  );
}
