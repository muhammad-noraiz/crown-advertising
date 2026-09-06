import type { Client } from "@/lib/supabase/types";

/**
 * Clients are identified by the company they buy for, with the person we deal
 * with shown underneath. Sole traders have no company, so their own name leads
 * and the second line says as much rather than repeating it.
 */
export function clientDisplayNames(client: Pick<Client, "name" | "company">): { primary: string; secondary: string } {
  const company = client.company?.trim();
  const person = client.name?.trim();
  if (!company || company.toLowerCase() === person?.toLowerCase()) {
    return { primary: person || "Unnamed client", secondary: "Independent advertiser" };
  }
  return { primary: company, secondary: person || "No contact person" };
}
