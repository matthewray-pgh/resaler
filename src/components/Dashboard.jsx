import { useState } from "react";
import WatchlistTab from "./WatchlistTab";
import AuctionsTab from "./AuctionsTab";
import SettingsTab from "./SettingsTab";

const TABS = [
  { id: "watchlist", label: "Watchlist" },
  { id: "auctions", label: "Browse Auctions" },
  { id: "settings", label: "Settings" },
];

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("watchlist");

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-surface-500 bg-surface-800/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-accent-blue rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-sm hidden sm:inline">Mac.bid Research</span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-accent-blue text-white"
                    : "text-slate-400 hover:bg-surface-600 hover:text-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="btn-ghost text-sm shrink-0">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "watchlist" && <WatchlistTab />}
        {tab === "auctions" && <AuctionsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
