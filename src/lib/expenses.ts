import type { ExpenseType } from "@/lib/supabase/types";

/** Cost categories recorded against a site. Order drives the expense dropdowns. */
export const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: "rent", label: "RENT" },
  { value: "tax", label: "TAX" },
  { value: "electricity_bills_lights_charges", label: "Electricity Bills / Lights Charges" },
  { value: "pr_commission", label: "PR Commission" },
  { value: "noc_fees", label: "NOC Fees" },
  { value: "stability_certificate", label: "Stability Certificate" },
  { value: "labour_installation_cost", label: "Labour / Installation Cost" },
];

/** Includes enum values retired before the sheet categories landed, so old rows still read properly. */
export const expenseTypeLabel: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_TYPES.map((type) => [type.value, type.label])),
  installation: "Labour / Installation Cost",
  land_rent: "RENT",
};
