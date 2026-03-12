ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP';
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS exchange_rate_at_submission NUMERIC(10,6);
