-- Then create it with the new structure including letting_date
CREATE VIEW jobs_list AS
SELECT
  j.id,
  j.billing_status,
  j.project_status,
  j.overdays,
  j.bid_number,
  j.certified_payroll,
  j.created_at,
  j.archived,
  jn.job_number,
  jn.branch_code,
  jn.owner_type,
  e.contract_number,
  e.estimator,
  e.letting_date,
  e.owner,
  e.county,
  e.branch,
  e.start_date,
  e.end_date,
  e.project_days,
  e.total_hours,
  e.total_revenue,
  e.total_cost,
  e.total_gross_profit,
  e.contractor,
  e.subcontractor,
  e.project_manager,
  CASE 
    WHEN e.total_revenue > 0 
    THEN ROUND((e.total_gross_profit / e.total_revenue * 100)::numeric, 2)
    ELSE 0 
  END as gross_margin_percent
FROM jobs j
LEFT JOIN job_numbers jn ON j.job_number_id = jn.id
LEFT JOIN (
  SELECT 
    be.id,
    ad.contract_number,
    ad.estimator,
    ad.bid_date as letting_date,
    ad.owner,
    ad.county::json->>'name' as county,
    ad.county::json->>'branch' as branch,
    ad.start_date,
    ad.end_date,
    be.total_revenue,
    be.total_cost,
    be.total_gross_profit,
    pm.project_manager,
    c.name as contractor,
    s.name as subcontractor,
    pa.total_days as project_days,
    pa.total_rated_hours + pa.total_non_rated_hours as total_hours
  FROM bid_estimates be
  LEFT JOIN admin_data_entries ad ON be.id = ad.bid_estimate_id
  LEFT JOIN project_metadata pm ON be.id = pm.bid_estimate_id
  LEFT JOIN contractors c ON pm.contractor_id = c.id
  LEFT JOIN subcontractors s ON pm.subcontractor_id = s.id
  LEFT JOIN (
    SELECT 
      mpt_rental_entry_id,
      SUM(days) as total_days,
      SUM(additional_rated_hours) as total_rated_hours,
      SUM(additional_non_rated_hours) as total_non_rated_hours
    FROM mpt_phases
    GROUP BY mpt_rental_entry_id
  ) pa ON pa.mpt_rental_entry_id = (
    SELECT id FROM mpt_rental_entries WHERE bid_estimate_id = be.id
  )
) e ON j.estimate_id = e.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_complete_created ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_complete_status ON jobs(project_status);
CREATE INDEX IF NOT EXISTS idx_jobs_complete_billing ON jobs(billing_status);