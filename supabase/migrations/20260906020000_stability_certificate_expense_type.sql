-- Stability certificates are both paperwork filed against a site and a cost
-- incurred on it, so the expense sheet needs its own category for them.
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'stability_certificate';
