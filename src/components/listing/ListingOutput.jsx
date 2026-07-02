import { useState } from "react";
import TitleMeter from "./TitleMeter";

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-xs px-2.5 py-1 rounded border transition-all duration-150 font-medium ${
        copied
          ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
          : "bg-surface-600 border-surface-500 text-slate-400 hover:text-slate-200 hover:border-surface-400"
      }`}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

function Section({ label, content, mono = false, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {content && <CopyBtn text={content} />}
      </div>
      {content && (
        <div className={`bg-surface-800 border border-surface-500 rounded-lg px-3.5 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words ${mono ? "mono" : ""}`}>
          {content}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Main output ───────────────────────────────────────────────────────────────

export default function ListingOutput({ result, onReset }) {
  const [editableTitle, setEditableTitle] = useState(result.title);

  function copyAll() {
    const full = [
      `TITLE:\n${editableTitle}`,
      `\nDESCRIPTION:\n${result.description}`,
      `\nSUGGESTED PRICE: $${result.suggestedPrice}`,
      `\nSHIPPING: ${result.shippingTip}`,
    ].join("\n");
    navigator.clipboard.writeText(full);
  }

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-100">Generated Listing</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyAll} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy all
          </button>
          <button onClick={onReset} className="btn-ghost text-xs px-3 py-1.5">
            ← New listing
          </button>
        </div>
      </div>

      {/* Editable title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="stat-label">eBay Title <span className="normal-case font-normal tracking-normal text-slate-600">(editable)</span></span>
          <CopyBtn text={editableTitle} />
        </div>
        <input
          className="input mono text-sm"
          value={editableTitle}
          onChange={e => setEditableTitle(e.target.value)}
          maxLength={80}
        />
        <TitleMeter title={editableTitle} />
      </div>

      {/* Description */}
      <Section label="Item Description" content={result.description} mono />

      {/* Pricing strategy banner */}
      {result.pricingStrategy && (() => {
        const strategyStyles = {
          below_market: { bg: "bg-accent-amber/8",  border: "border-accent-amber/25", badge: "bg-accent-amber/15 text-accent-amber border-accent-amber/30",  icon: "↓", iconColor: "text-accent-amber"  },
          at_market:    { bg: "bg-accent-blue/8",   border: "border-accent-blue/25",  badge: "bg-accent-blue/15  text-accent-blue  border-accent-blue/30",    icon: "→", iconColor: "text-accent-blue"   },
          above_market: { bg: "bg-accent-green/8",  border: "border-accent-green/25", badge: "bg-accent-green/15 text-accent-green border-accent-green/30",  icon: "↑", iconColor: "text-accent-green" },
        };
        const s = strategyStyles[result.pricingStrategy] ?? strategyStyles.at_market;
        return (
          <div className={`${s.bg} border ${s.border} rounded-xl p-4 space-y-3`}>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`text-lg font-bold ${s.iconColor}`}>{s.icon}</span>
                <div>
                  <div className="stat-label">Pricing Strategy</div>
                  <div className={`text-sm font-bold mt-0.5 ${s.iconColor}`}>{result.pricingLabel}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="stat-label mb-0.5">List at</div>
                <div className="mono text-2xl font-black text-slate-100">${result.suggestedPrice}</div>
              </div>
            </div>

            {/* Reasoning */}
            <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
              {result.priceReasoning}
            </p>

            {/* Action steps */}
            {result.pricingActions && (
              <div className="space-y-1.5">
                <div className="stat-label">Action steps</div>
                {result.pricingActions
                  .split("\n")
                  .filter(Boolean)
                  .map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className={`${s.iconColor} font-bold mt-0.5 shrink-0`}>›</span>
                      <span className="leading-relaxed">{step.replace(/^[-•·*]\s*/, "")}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Shipping */}
      <div className="bg-surface-800 border border-surface-500 rounded-lg p-3">
        <div className="stat-label mb-1">Shipping Recommendation</div>
        <p className="text-xs text-slate-300 leading-relaxed">{result.shippingTip}</p>
      </div>

      {/* Quick tips */}
      <Section label="Seller Tips">
        <div className="bg-surface-800 border border-surface-500 rounded-lg px-3.5 py-3 space-y-1.5">
          {result.quickTips
            .split("\n")
            .filter(Boolean)
            .map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-accent-blue mt-0.5 shrink-0">›</span>
                <span className="leading-relaxed">{tip.replace(/^[-•·*]\s*/, "")}</span>
              </div>
            ))}
        </div>
      </Section>

      {/* eBay ready badge */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-600 text-xs text-slate-500">
        <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ready to paste into eBay. Edit the title above if needed before copying.
      </div>
    </div>
  );
}
