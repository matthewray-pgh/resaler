/**
 * Claude-powered eBay listing generation.
 *
 * Uses structured outputs (Zod schema) so responses are guaranteed valid
 * JSON — no manual "return ONLY a JSON object" prompting/parsing needed.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();
const MODEL = "claude-opus-4-8";

const CONDITIONS = [
  "New – Sealed", "New – Open Box", "Used – Like New",
  "Used – Good", "Used – Acceptable", "For Parts / Not Working",
];

const CATEGORIES = [
  "Small Kitchen Appliances", "Power Tools", "Vacuums & Floor Care",
  "Smart Home / Electronics", "Gaming & Accessories", "Fitness & Exercise",
  "Baby & Toys", "Laptops & Tablets", "Other",
];

const ListingSchema = z.object({
  title: z.string(),
  description: z.string(),
  suggestedPrice: z.number(),
  pricingStrategy: z.enum(["below_market", "at_market", "above_market"]),
  pricingLabel: z.string(),
  priceReasoning: z.string(),
  pricingActions: z.string(),
  shippingTip: z.string(),
  quickTips: z.string(),
});

/**
 * Generate an eBay listing (title/description) plus a pricing strategy
 * from a filled-out listing form, factoring in seller feedback and
 * competing listings.
 */
export async function generateListing(form) {
  const feedback = parseInt(form.feedbackScore) || 0;
  const competing = parseInt(form.competingListings) || 0;
  const lowestComp = parseFloat(form.lowestCompetitorPrice) || 0;

  const prompt = `You are an expert eBay reseller who writes high-converting listings. Generate an optimized eBay listing AND a smart pricing strategy for this item.

ITEM DETAILS:
- Brand: ${form.brand || "Unknown"}
- Product: ${form.productName}
- Model number: ${form.modelNumber || "N/A"}
- Category: ${form.category}
- Condition: ${form.condition}
- What's included: ${form.included || "Not specified — inspect before listing"}
- Defects or wear: ${form.defects || "None noted"}
- Retail price: ${form.retailPrice ? "$" + form.retailPrice : "Unknown"}
- My purchase cost: ${form.yourCost ? "$" + form.yourCost : "Not specified"}
- Extra notes: ${form.extraNotes || "None"}

EBAY MARKET CONTEXT:
- My feedback score: ${feedback} ${feedback < 20 ? "(new seller — low trust signal to buyers)" : feedback < 100 ? "(building reputation)" : "(established seller)"}
- Number of competing active listings: ${competing || "unknown"}
- Lowest competitor price: ${lowestComp ? "$" + lowestComp : "unknown"}

PRICING STRATEGY RULES TO APPLY:
- Feedback < 20: price 10-15% below lowest competitor to overcome trust gap
- Feedback 20-99: price 5-10% below lowest competitor or match if listing quality is superior
- Feedback 100+: price at market or slightly above if photos/description are best in category
- Competition > 15 listings: must be price-competitive to appear in search
- Competition < 5 listings: can price at or above market — scarcity works in your favour
- Always account for eBay fees (~13%) and shipping in the suggested price
- Never undercut so much that net profit drops below 20% margin

eBay LISTING BEST PRACTICES:
- Title: keyword-dense, brand + model + condition + key feature. No filler words. Max 80 chars.
- Description: structured sections, honest, specific about included/missing items. Use these labeled sections: CONDITION, WHAT'S INCLUDED, TESTED & VERIFIED, COSMETIC NOTES, SHIPPING & RETURNS.
- Trust builders: tested/verified working, fast handling, returns accepted
- Format pricingActions and quickTips as newline-separated bullet points, each starting with "-".`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(ListingSchema) },
  });

  if (!response.parsed_output) throw new Error("Claude returned an unparseable listing");
  return response.parsed_output;
}

const ParsedListingSchema = z.object({
  brand: z.string(),
  productName: z.string(),
  modelNumber: z.string(),
  condition: z.enum(CONDITIONS),
  category: z.enum(CATEGORIES),
  retailPrice: z.string(),
  extraNotes: z.string(),
});

/**
 * Extract listing form fields from raw pasted Mac.bid listing text.
 */
export async function parseListingText(pastedText) {
  const prompt = `Extract product details from this Mac.bid listing text:\n\n${pastedText}`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(ParsedListingSchema) },
  });

  if (!response.parsed_output) throw new Error("Claude returned an unparseable result");
  return response.parsed_output;
}
