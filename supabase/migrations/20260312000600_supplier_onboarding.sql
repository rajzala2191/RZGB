ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'approved';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;
-- Default existing suppliers to 'approved' so they aren't blocked
UPDATE profiles SET onboarding_status = 'approved' WHERE role = 'supplier' AND onboarding_status IS NULL;
