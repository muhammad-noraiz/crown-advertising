import type { LocationDocumentType } from "@/lib/supabase/types";

/** The paperwork kinds a site can carry. Order drives the upload dropdown. */
export const DOCUMENT_TYPES: { value: LocationDocumentType; label: string }[] = [
  { value: "noc", label: "NOC" },
  { value: "stability_certificate", label: "Stability Certificate" },
  { value: "rental", label: "Rental / Lease Agreement" },
  { value: "tax", label: "Tax Document" },
  { value: "other", label: "Other" },
];

export const documentTypeLabel: Record<LocationDocumentType, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((type) => [type.value, type.label])
) as Record<LocationDocumentType, string>;

export function isDocumentType(value: string): value is LocationDocumentType {
  return DOCUMENT_TYPES.some((type) => type.value === value);
}
