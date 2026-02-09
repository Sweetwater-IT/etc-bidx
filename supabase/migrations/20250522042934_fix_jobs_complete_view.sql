

DROP VIEW jobs_complete

CREATE VIEW jobs_complete AS
WITH estimate_data AS (
    SELECT 
        estimate_complete.id,
        estimate_complete.status,
        estimate_complete.total_revenue,
        estimate_complete.total_cost,
        estimate_complete.total_gross_profit,
        estimate_complete.created_at,
        estimate_complete.archived,
        estimate_complete.admin_data,
        estimate_complete.mpt_rental,
        estimate_complete.equipment_rental,
        estimate_complete.flagging,
        estimate_complete.service_work,
        estimate_complete.sale_items,
        estimate_complete.project_manager,
        estimate_complete.pm_email,
        estimate_complete.pm_phone,
        estimate_complete.customer_contract_number,
        estimate_complete.contractor_name,
        estimate_complete.subcontractor_name,
        estimate_complete.total_phases,
        estimate_complete.total_days,
        estimate_complete.total_hours
    FROM estimate_complete
)
SELECT 
    j.id,
    j.billing_status,
    j.project_status,
    j.overdays,
    j.notes,
    j.bid_number,
    j.certified_payroll,
    j.created_at,
    j.archived,
    jn.job_number,
    jn.branch_code,
    jn.owner_type,
    jn.year AS job_year,
    jn.sequential_number,
    e.id AS estimate_id,
    e.status AS estimate_status,
    e.total_revenue,
    e.total_cost,
    e.total_gross_profit,
    e.created_at AS estimate_created_at,
    -- Use job-specific admin_data if it exists, otherwise fall back to estimate admin_data
    COALESCE(
        CASE WHEN ade_job.id IS NOT NULL THEN
            json_build_object(
                'contractNumber', ade_job.contract_number,
                'estimator', ade_job.estimator,
                'division', ade_job.division::text,
                'lettingDate', ade_job.bid_date,
                'owner', ade_job.owner::text,
                'county', ade_job.county,
                'srRoute', ade_job.sr_route,
                'location', ade_job.location,
                'dbe', ade_job.dbe,
                'startDate', ade_job.start_date,
                'endDate', ade_job.end_date,
                'winterStart', ade_job.winter_start,
                'winterEnd', ade_job.winter_end,
                'owTravelTimeMins', ade_job.ow_travel_time_mins,
                'owMileage', ade_job.ow_mileage,
                'fuelCostPerGallon', ade_job.fuel_cost_per_gallon,
                'emergencyJob', ade_job.emergency_job,
                'rated', ade_job.rated::text,
                'emergencyFields', ade_job.emergency_fields
            )
        END,
        e.admin_data
    ) AS admin_data,
    e.mpt_rental,
    e.equipment_rental,
    e.flagging,
    e.service_work,
    e.sale_items,
    -- Use job-specific project_metadata if it exists, otherwise fall back to estimate project_manager fields
    COALESCE(pm_job.project_manager, e.project_manager) AS project_manager,
    COALESCE(pm_job.pm_email, e.pm_email) AS pm_email,
    COALESCE(pm_job.pm_phone, e.pm_phone) AS pm_phone,
    COALESCE(pm_job.customer_contract_number, e.customer_contract_number) AS customer_contract_number,
    e.contractor_name,
    e.subcontractor_name,
    e.total_phases,
    e.total_days,
    e.total_hours,
    json_build_object(
        'jobNumber', jn.job_number,
        'contractNumber', COALESCE(ade_job.contract_number, (e.admin_data ->> 'contractNumber'::text)),
        'estimator', COALESCE(ade_job.estimator, (e.admin_data ->> 'estimator'::text)),
        'owner', COALESCE(ade_job.owner::text, (e.admin_data ->> 'owner'::text)),
        'county', COALESCE(ade_job.county, (e.admin_data -> 'county')::jsonb),
        'branch', jn.branch_code,
        'startDate', COALESCE(ade_job.start_date::text, (e.admin_data ->> 'startDate'::text)),
        'endDate', COALESCE(ade_job.end_date::text, (e.admin_data ->> 'endDate'::text)),
        'projectDays', e.total_days,
        'totalHours', e.total_hours,
        'revenue', e.total_revenue,
        'cost', e.total_cost,
        'grossProfit', e.total_gross_profit,
        'jobStatus', j.project_status,
        'billingStatus', j.billing_status,
        'certifiedPayroll', j.certified_payroll,
        'overdays', j.overdays
    ) AS job_summary
FROM jobs j
LEFT JOIN job_numbers jn ON (j.job_number_id = jn.id)
LEFT JOIN estimate_data e ON (j.estimate_id = e.id)
-- Join admin_data_entries for the job first (priority)
LEFT JOIN admin_data_entries ade_job ON (ade_job.job_id = j.id)
-- Join project_metadata for the job first (priority)
LEFT JOIN project_metadata pm_job ON (pm_job.job_id = j.id)
ORDER BY j.created_at DESC;