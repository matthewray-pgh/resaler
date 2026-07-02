import { formatCurrency } from "../../utils/profitCalc";

const CONDITIONS = [
  "New – Sealed", "New – Open Box", "Used – Like New",
  "Used – Good", "Used – Acceptable", "For Parts / Not Working",
];

const CATEGORIES = [
  "Small Kitchen Appliances", "Power Tools", "Vacuums & Floor Care",
  "Smart Home / Electronics", "Gaming & Accessories", "Fitness & Exercise",
  "Baby & Toys", "Laptops & Tablets", "Other",
];

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="stat-label block mb-1.5">
        {label}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-600 ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function ListingForm({ form, onChange }) {
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value });
  const mb  = form._macBid;

  return (
    <div className="card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Item Details</h2>

      {/* Mac.bid context banner — shown when imported from a lot */}
      {mb && (
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            {mb.image && (
              <img src={mb.image} alt="" className="w-12 h-12 object-cover rounded-md bg-surface-700 shrink-0" onError={e => e.target.style.display = "none"} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-accent-blue uppercase tracking-wide mb-1">Imported from Mac.bid</p>
              <p className="text-xs text-slate-400">
                Lot {mb.lotNumber} · {mb.condition}
                {mb.daysLeft !== null && ` · ${mb.daysLeft === 0 ? "Closes today" : `${mb.daysLeft}d left`}`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-accent-blue/10">
            <div>
              <div className="stat-label">Retail</div>
              <div className="mono text-xs text-slate-300">{formatCurrency(mb.retail)}</div>
            </div>
            <div>
              <div className="stat-label">Current bid</div>
              <div className="mono text-xs text-slate-300">{formatCurrency(mb.currentBid)}</div>
            </div>
            <div>
              <div className="stat-label">Total bids</div>
              <div className="mono text-xs text-slate-300">{mb.totalBids}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            ✏️ Fill in <strong className="text-slate-400">What's Included</strong> and <strong className="text-slate-400">Defects</strong> after you physically inspect the item.
          </p>
        </div>
      )}

      {/* Brand + Model */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand">
          <input className="input" placeholder="e.g. Ninja, DeWalt" value={form.brand} onChange={set("brand")} />
        </Field>
        <Field label="Model No." hint="optional">
          <input className="input" placeholder="e.g. AF101" value={form.modelNumber} onChange={set("modelNumber")} />
        </Field>
      </div>

      {/* Product name */}
      <Field label="Product Name" hint="required">
        <input className="input" placeholder="e.g. Air Fryer, Cordless Drill" value={form.productName} onChange={set("productName")} />
      </Field>

      {/* Condition + Category */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Condition">
          <select className="input" value={form.condition} onChange={set("condition")}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={set("category")}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {/* Included */}
      <Field label="What's Included" hint="list every item in the box">
        <textarea
          className="input"
          style={{ resize: "vertical", minHeight: 72 }}
          placeholder="e.g. Main unit, power cord, 2 attachments, original box. Missing: remote."
          value={form.included}
          onChange={set("included")}
        />
      </Field>

      {/* Defects */}
      <Field label="Defects / Wear" hint="honest = fewer returns">
        <textarea
          className="input"
          style={{ resize: "vertical", minHeight: 56 }}
          placeholder="e.g. Light scratch on lid. Or: None — tested and works perfectly."
          value={form.defects}
          onChange={set("defects")}
        />
      </Field>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Retail Price $" hint="optional">
          <input className="input" type="number" placeholder="89.99" value={form.retailPrice} onChange={set("retailPrice")} />
        </Field>
        <Field label="Your Cost $" hint="for pricing guidance">
          <input className="input" type="number" placeholder="22.50" value={form.yourCost} onChange={set("yourCost")} />
        </Field>
      </div>

      {/* Extra notes */}
      <Field label="Extra Notes" hint="optional">
        <textarea
          className="input"
          style={{ resize: "vertical", minHeight: 48 }}
          placeholder="Anything else worth mentioning in the listing…"
          value={form.extraNotes}
          onChange={set("extraNotes")}
        />
      </Field>

      {/* Divider */}
      <div className="border-t border-surface-500 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          eBay Market Context
          <span className="normal-case tracking-normal font-normal text-slate-600 ml-1.5">— for smart pricing strategy</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Your eBay Feedback Score" hint="0 if new">
            <input
              className="input"
              type="number"
              placeholder="e.g. 0, 45, 200"
              value={form.feedbackScore}
              onChange={set("feedbackScore")}
            />
          </Field>
          <Field label="Competing Listings" hint="check eBay active listings">
            <input
              className="input"
              type="number"
              placeholder="e.g. 3, 12, 40"
              value={form.competingListings}
              onChange={set("competingListings")}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Lowest competitor price $" hint="from eBay active listings">
            <input
              className="input"
              type="number"
              placeholder="e.g. 54.99"
              value={form.lowestCompetitorPrice}
              onChange={set("lowestCompetitorPrice")}
            />
          </Field>
        </div>

        <div className="mt-3 bg-surface-800 rounded-lg px-3 py-2.5 text-xs text-slate-500 leading-relaxed">
          💡 Open eBay, search your item, filter to <strong className="text-slate-400">Active listings</strong> — count how many and note the lowest price. Then filter to <strong className="text-slate-400">Sold listings</strong> for real sale data.
        </div>
      </div>
    </div>
  );
}
