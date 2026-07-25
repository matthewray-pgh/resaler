import { useState, useEffect, useMemo } from "react";
import { api } from "../hooks/useApi";
import { useSettings } from "../hooks/useSettings";
import { getLocationName, groupLocationsByState } from "../utils/locations";
import { DEFAULT_TRANSFER_FEE, DEFAULT_NO_TRANSFER_FEE_LOCATIONS } from "../utils/profitCalc";

function TransferFeesSection({ settings, updateSettings }) {
  const [locationsText, setLocationsText] = useState(
    (settings.noTransferFeeLocations ?? DEFAULT_NO_TRANSFER_FEE_LOCATIONS).join(", ")
  );

  function commitLocations(text) {
    const parsed = text.split(",").map(s => s.trim()).filter(Boolean);
    updateSettings({ noTransferFeeLocations: parsed });
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-100 mb-1">Transfer & Fees</h2>
      <p className="text-xs text-slate-500 mb-3">
        Used in the profit calculation for every lot. Mac.bid's own per-auction lot fee and
        buyer's premium (when the API provides one) always take priority over these defaults.
      </p>

      <div className="flex flex-col gap-3 max-w-sm">
        <div>
          <label className="stat-label block mb-1.5">Transfer fee ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input text-sm"
            value={settings.transferFee ?? DEFAULT_TRANSFER_FEE}
            onChange={e => updateSettings({ transferFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="stat-label block mb-1.5">No-fee pickup locations</label>
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. Monroeville, Pittsburgh Mills"
            value={locationsText}
            onChange={e => setLocationsText(e.target.value)}
            onBlur={e => commitLocations(e.target.value)}
          />
          <p className="text-xs text-slate-600 mt-1">
            Comma-separated. Matched against each lot's warehouse location — no transfer fee is
            charged when a match is found.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, updateSettings] = useSettings();

  useEffect(() => {
    let cancelled = false;
    api.getLocations()
      .then(res => { if (!cancelled) setLocations(res.locations ?? []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const enabledIds = useMemo(() => {
    if (settings.enabledLocationIds) return new Set(settings.enabledLocationIds);
    return new Set(locations.map(l => String(l.id)));
  }, [settings.enabledLocationIds, locations]);

  const groups = useMemo(() => groupLocationsByState(locations), [locations]);

  function toggle(id) {
    const idStr = String(id);
    const next = new Set(enabledIds);
    if (next.has(idStr)) next.delete(idStr); else next.add(idStr);
    updateSettings({ enabledLocationIds: Array.from(next) });
  }

  function setGroup(ids, enabled) {
    const next = new Set(enabledIds);
    for (const id of ids) {
      if (enabled) next.add(id); else next.delete(id);
    }
    updateSettings({ enabledLocationIds: Array.from(next) });
  }

  function selectAll() {
    updateSettings({ enabledLocationIds: locations.map(l => String(l.id)) });
  }

  function selectNone() {
    updateSettings({ enabledLocationIds: [] });
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <TransferFeesSection settings={settings} updateSettings={updateSettings} />

      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 mb-1">Location filter</h2>
          <p className="text-xs text-slate-500">
            Choose which Mac.bid locations show up in the "Browse Auctions" location dropdown.
          </p>
        </div>

        {loading ? (
          <div className="text-slate-500 text-sm py-12 text-center">Loading locations…</div>
        ) : error ? (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3 text-accent-red text-sm">
            Failed to load locations: {error}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="btn-ghost text-xs py-1 px-2">Select all</button>
              <button onClick={selectNone} className="btn-ghost text-xs py-1 px-2">Select none</button>
              <span className="text-xs text-slate-500 ml-auto">
                {enabledIds.size} of {locations.length} selected
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {groups.map(({ state, locations: locs }) => {
                const idsInGroup = locs.map(l => String(l.id));
                const selectedInGroup = idsInGroup.filter(id => enabledIds.has(id)).length;
                return (
                  <details key={state} className="card overflow-hidden" open>
                    <summary className="flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer select-none">
                      <span className="text-sm font-semibold text-slate-200">{state}</span>
                      <span className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedInGroup}/{locs.length}</span>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setGroup(idsInGroup, true); }}
                          className="btn-ghost py-0.5 px-1.5"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setGroup(idsInGroup, false); }}
                          className="btn-ghost py-0.5 px-1.5"
                        >
                          None
                        </button>
                      </span>
                    </summary>
                    <div className="divide-y divide-surface-500 border-t border-surface-500">
                      {locs.map(loc => {
                        const idStr = String(loc.id);
                        const checked = enabledIds.has(idStr);
                        return (
                          <label
                            key={loc.id}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-600/50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(loc.id)}
                              className="w-4 h-4 rounded accent-accent-blue"
                            />
                            <span className="text-sm text-slate-200">
                              {getLocationName(loc)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
              {!locations.length && (
                <div className="card px-4 py-6 text-center text-sm text-slate-500">No locations found.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
