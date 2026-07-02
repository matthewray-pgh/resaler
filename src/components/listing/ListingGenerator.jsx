import { useState } from "react";
import { api } from "../../hooks/useApi";
import MacBidImporter from "./MacBidImporter";
import ListingForm from "./ListingForm";
import ListingOutput from "./ListingOutput";

const EMPTY_FORM = {
  brand: "", productName: "", modelNumber: "",
  condition: "New – Open Box", category: "Small Kitchen Appliances",
  included: "", defects: "", retailPrice: "", yourCost: "", extraNotes: "",
  feedbackScore: "", competingListings: "", lowestCompetitorPrice: "",
  _macBid: null,
};

// ── Main component ───────────────────────────────────────────────────────────

export default function ListingGenerator({ isAuthenticated = false }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function handleImport(importedForm) {
    setForm(importedForm);
    setResult(null);
    setError(null);
    // Scroll to form
    setTimeout(() => document.getElementById("listing-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  async function handleGenerate() {
    if (!form.productName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const generated = await api.generateListing(form);
      setResult(generated);
      setTimeout(() => document.getElementById("listing-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.message || "Failed to generate listing. Check the form and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  const canGenerate = form.productName.trim().length > 0 && !loading;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">eBay Listing Generator</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Import a Mac.bid lot or enter details manually — Claude writes a ready-to-post eBay listing.
        </p>
      </div>

      {/* Mac.bid importer */}
      <MacBidImporter onImport={handleImport} isAuthenticated={isAuthenticated} />

      {/* Form */}
      <div id="listing-form">
        <ListingForm form={form} onChange={setForm} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3 text-accent-red text-sm">
          {error}
        </div>
      )}

      {/* Generate button */}
      {!result && (
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Writing your listing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate eBay Listing
            </>
          )}
        </button>
      )}

      {/* Output */}
      {result && (
        <div id="listing-output">
          <ListingOutput result={result} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}
