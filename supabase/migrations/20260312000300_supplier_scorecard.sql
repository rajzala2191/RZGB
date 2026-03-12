CREATE OR REPLACE VIEW supplier_scorecard AS
SELECT
  p.id AS supplier_id,
  p.company_name,
  p.email,
  -- On-Time Delivery
  COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) AS total_delivered,
  COUNT(CASE WHEN o.order_status = 'DELIVERED' AND o.updated_at <= o.deadline THEN 1 END) AS on_time_delivered,
  CASE WHEN COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) > 0
    THEN ROUND(100.0 * COUNT(CASE WHEN o.order_status = 'DELIVERED' AND o.updated_at <= o.deadline THEN 1 END) / COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END), 1)
    ELSE NULL END AS on_time_pct,
  -- NCR Rate
  COUNT(DISTINCT ncr.id) AS ncr_count,
  CASE WHEN COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) > 0
    THEN ROUND(100.0 * COUNT(DISTINCT ncr.id) / NULLIF(COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END), 0), 1)
    ELSE NULL END AS ncr_rate_pct,
  -- Bid Response Rate
  COUNT(DISTINCT b.id) AS total_bids,
  COUNT(DISTINCT CASE WHEN b.status = 'AWARDED' THEN b.id END) AS won_bids
FROM profiles p
LEFT JOIN orders o ON o.supplier_id = p.id
LEFT JOIN ncr_reports ncr ON ncr.supplier_id = p.id
LEFT JOIN bid_submissions b ON b.supplier_id = p.id
WHERE p.role = 'supplier'
GROUP BY p.id, p.company_name, p.email;
