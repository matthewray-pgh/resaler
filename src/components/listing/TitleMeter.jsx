/**
 * TitleMeter — live character counter for eBay title field.
 * eBay sweet spot is 60–80 characters.
 */
export default function TitleMeter({ title = "" }) {
  const len  = title.length;
  const pct  = Math.min((len / 80) * 100, 100);

  const { color, label, textClass } =
    len >= 60 && len <= 80 ? { color: "#10b981", label: "Optimal",  textClass: "text-accent-green" } :
    len > 80               ? { color: "#ef4444", label: "Too long", textClass: "text-accent-red"   } :
    len > 0                ? { color: "#f59e0b", label: "Too short", textClass: "text-accent-amber" } :
                             { color: "#374151", label: "Empty",    textClass: "text-slate-500"    };

  return (
    <div className="mt-1.5">
      <div className="h-1 bg-surface-500 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs font-medium ${textClass}`}>{label}</span>
        <span className="text-xs text-slate-500 mono">{len} / 80 chars</span>
      </div>
    </div>
  );
}
