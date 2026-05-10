import { createClient } from "@supabase/supabase-js";
import { mediaKitLocations } from "../src/lib/media-kit";
import type { PricingBasis } from "../src/lib/supabase/types";
import { loadScriptEnv, supabaseHost } from "./load-env";

const loadedEnvFiles = loadScriptEnv();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parsePrice(label: string | null) {
  if (!label) return null;
  const match = label.match(/[\d,.]+/);
  if (!match) return null;

  const value = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  return /million/i.test(label) ? value * 1_000_000 : value;
}

function pricingBasisFor(label: string | null, category: string): PricingBasis {
  if (!label) return "on_request";
  return category === "digital" ? "slot" : "monthly";
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  console.log(`Using env: ${loadedEnvFiles.join(", ")} (${supabaseHost()})`);

  const rows = mediaKitLocations.map((location) => ({
    name: location.name,
    size: location.size,
    city: location.city,
    address: [location.from ? `From: ${location.from}` : null, location.toward ? `Towards: ${location.toward}` : null]
      .filter(Boolean)
      .join(" | ") || location.details,
    land_type: "crown",
    price_per_month: parsePrice(location.rent),
    price_label: location.rent,
    pricing_basis: pricingBasisFor(location.rent, location.category),
    facing_from: location.from,
    facing_towards: location.toward,
    media_category: location.category,
    source_slide: location.slide,
    public_image_path: location.image,
    is_active: true,
  }));

  const { error } = await supabase
    .from("locations")
    .upsert(rows, { onConflict: "source_slide" });

  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;

  console.log(`Seeded ${rows.length} media locations into locations.`);
  console.log(`Current locations count: ${count ?? 0}`);
  console.log("Run this after applying supabase/migrations/20260510000000_location_showcase_fields.sql.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
