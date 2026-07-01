import { useState, useEffect } from "react";
import { api } from "../hooks/useApi";
import { useSettings } from "../hooks/useSettings";
import { getLocationName, sortLocationsByName } from "../utils/locations";
import ItemCard from "./ItemCard";

export default function AuctionsTab() {
  const [settings] = useSettings();
  const [locations, setLocations] = useState([]);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locationId, setLocationId] = useState("");

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getLocations()
      .then(res => {
        if (cancelled) return;
        const all = res.locations ?? [];
        const filtered = settings.enabledLocationIds
          ? all.filter(l => settings.enabledLocationIds.includes(String(l.id)))
          : all;
        // If the saved filter excludes every location, fall back to showing all
        // rather than leaving the dropdown empty.
        const locs = sortLocationsByName(filtered.length ? filtered : all);
        setLocations(locs);
        if (locs.length) setLocationId(String(locs[0].id));
      })
      .catch(err => { if (!cancelled) setLocError(err.message); })
      .finally(() => { if (!cancelled) setLocLoading(false); });
    return () => { cancelled = true; };
  }, [settings.enabledLocationIds]);

  useEffect(() => {
    if (!locationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getAuctions(locationId)
      .then(res => { if (!cancelled) setAuctions(res.auctions ?? []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locationId]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="stat-label mb-0.5">Location</div>
          {locLoading ? (
            <div className="text-sm text-slate-500">Loading locations…</div>
          ) : locError ? (
            <div className="text-sm text-accent-red">{locError}</div>
          ) : (
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="input w-auto text-sm py-1.5"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {getLocationName(loc)}
                </option>
              ))}
            </select>
          )}
        </div>

        {!loading && !error && (
          <div className="text-sm text-slate-500">{auctions.length} lots</div>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Loading auctions…</div>
      ) : error ? (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3 text-accent-red text-sm">
          Failed to load auctions: {error}
        </div>
      ) : !auctions.length ? (
        <div className="text-slate-500 text-sm py-12 text-center">No active lots at this location.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map(item => (
            <ItemCard key={item.id ?? `${item.auction_number}-${item.lot_number}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
