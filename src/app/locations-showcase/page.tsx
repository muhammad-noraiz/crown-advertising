import type { Metadata } from "next";
import LocationsShowcaseClient from "./LocationsShowcaseClient";
import { getShowcaseLocations, summarizeShowcaseLocations } from "@/lib/location-showcase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Locations Showcase | Crown Advertising",
  description: "Public client showcase of Crown Advertising outdoor media locations, pricing, and live booking availability.",
};

export default async function LocationsShowcasePage() {
  const locations = await getShowcaseLocations();
  const summary = summarizeShowcaseLocations(locations);

  return (
    <LocationsShowcaseClient
      locations={locations}
      cities={summary.cities}
      usesFallbackData={summary.usesFallbackData}
    />
  );
}
