-- Align location expense types with the categories from the expense sheet.
-- Existing databases keep old enum values for historical rows, but new UI entries
-- use only the values added here.
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'rent';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'electricity_bills_lights_charges';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'pr_commission';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'noc_fees';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'labour_installation_cost';
