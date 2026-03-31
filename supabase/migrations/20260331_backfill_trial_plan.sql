UPDATE brands
SET
  plan = 'TRIAL',
  subscription_status = CASE
    WHEN trial_end_date > NOW() AND COALESCE(subscription_status::text, '') IN ('', 'expired') THEN 'active'
    WHEN trial_end_date <= NOW() AND COALESCE(subscription_status::text, '') IN ('', 'expired') THEN 'expired'
    ELSE subscription_status
  END,
  next_payment_date = COALESCE(next_payment_date, trial_end_date)
WHERE trial_end_date IS NOT NULL
  AND COALESCE(plan::text, 'BASIC') <> 'TRIAL'
  AND (
    COALESCE(trial_payment_status, '') = 'active'
    OR COALESCE(subscription_status::text, '') NOT IN ('active', 'expiring_soon')
  );
