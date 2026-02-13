-- Update estimate_complete view to include etcRep field in admin_data
DROP VIEW IF EXISTS jobs_complete;
DROP VIEW IF EXISTS estimate_complete;

CREATE VIEW estimate_complete AS
WITH phase_aggregations AS (
    be.notes,
    be.archived,
    be.deleted,
    json_build_object(
        'contractNumber', ad.contract_number,
        'estimator', ad.estimator,
        'etcRep', ad.etc_rep,
        'division', ad.division,
        'lettingDate', ad.bid_date,
        'owner', ad.owner,
        'county', ad.county::json,
        'srRoute', ad.sr_route,
        'location', ad.location,
        'dbe', ad.dbe,
        'startDate', ad.start_date,
        'endDate', ad.end_date,
        'winterStart', ad.winter_start,
        'winterEnd', ad.winter_end,
        'owTravelTimeMins', ad.ow_travel_time_mins,
        'owMileage', ad.ow_mileage,
        'fuelCostPerGallon', ad.fuel_cost_per_gallon,
        'emergencyJob', ad.emergency_job,
        'rated', ad.rated,
        'emergencyFields', ad.emergency_fields
    ) AS admin_data,
    CASE
        WHEN mpr.id IS NOT NULL THEN
            json_build_object(
                '_summary', json_build_object(
                    'revenue', mpr.revenue,
                    'grossProfit', mpr.gross_profit,
                    'cost', mpr.cost,
                    'hours', mpr.hours
                ),
                'targetMOIC', mpr.target_moic,
                'paybackPeriod', mpr.payback_period,
                'annualUtilization', mpr.annual_utilization,
                'dispatchFee', mpr.dispatch_fee,
                'mpgPerTruck', mpr.mpg_per_truck,
                'staticEquipmentInfo', COALESCE(mse.static_equipment_info, '[]'::json),
                'phases', COALESCE(phase_data.phases, '[]'::json)
            )
        ELSE NULL
    END AS mpt_rental,
    CASE
        WHEN ere.id IS NOT NULL THEN
            json_build_object(
                'items', COALESCE(er_items.items, '[]'::json),
                '_summary', json_build_object(
                    'revenue', COALESCE(er_summary.total_revenue, 0),
                    'grossProfit', COALESCE(er_summary.total_gross_profit, 0),
                    'cost', COALESCE(er_summary.total_cost, 0)
                )
            )
        ELSE NULL
    END AS equipment_rental,
    CASE
        WHEN fle.id IS NOT NULL THEN
            json_build_object(
                'standardPricing', fle.standard_pricing,
                'standardLumpSum', fle.standard_lump_sum,
                'numberTrucks', fle.number_trucks,
                'fuelEconomyMPG', fle.fuel_economy_mpg,
                'personnel', fle.personnel,
                'onSiteJobHours', fle.on_site_job_hours,
                'additionalEquipmentCost', fle.additional_equipment_cost,
                'fuelCostPerGallon', fle.fuel_cost_per_gallon,
                'truckDispatchFee', fle.truck_dispatch_fee,
                'workerComp', fle.worker_comp,
                'generalLiability', fle.general_liability,
                'markupRate', fle.markup_rate,
                'arrowBoards', json_build_object(
                    'cost', fle.arrow_boards_cost,
                    'quantity', fle.arrow_boards_quantity,
                    'includeInLumpSum', fle.arrow_boards_include_in_lump_sum
                ),
                'messageBoards', json_build_object(
                    'cost', fle.message_boards_cost,
                    'quantity', fle.message_boards_quantity,
                    'includeInLumpSum', fle.message_boards_include_in_lump_sum
                ),
                'TMA', json_build_object(
                    'cost', fle.tma_cost,
                    'quantity', fle.tma_quantity,
                    'includeInLumpSum', fle.tma_include_in_lump_sum
                ),
                '_summary', json_build_object(
                    'totalRevenue', fle.revenue,
                    'totalFlaggingCost', fle.cost,
                    'totalHours', fle.hours
                )
            )
        ELSE NULL
    END AS flagging,
    CASE
        WHEN swe.id IS NOT NULL THEN
            json_build_object(
                'standardPricing', swe.standard_pricing,
                'standardLumpSum', swe.standard_lump_sum,
                'numberTrucks', swe.number_trucks,
                'fuelEconomyMPG', swe.fuel_economy_mpg,
                'personnel', swe.personnel,
                'onSiteJobHours', swe.on_site_job_hours,
                'additionalEquipmentCost', swe.additional_equipment_cost,
                'fuelCostPerGallon', swe.fuel_cost_per_gallon,
                'truckDispatchFee', swe.truck_dispatch_fee,
                'workerComp', swe.worker_comp,
                'generalLiability', swe.general_liability,
                'markupRate', swe.markup_rate,
                'arrowBoards', json_build_object(
                    'cost', swe.arrow_boards_cost,
                    'quantity', swe.arrow_boards_quantity,
                    'includeInLumpSum', swe.arrow_boards_include_in_lump_sum
                ),
                'messageBoards', json_build_object(
                    'cost', swe.message_boards_cost,
                    'quantity', swe.message_boards_quantity,
                    'includeInLumpSum', swe.message_boards_include_in_lump_sum
                ),
                'TMA', json_build_object(
                    'cost', swe.tma_cost,
                    'quantity', swe.tma_quantity,
                    'includeInLumpSum', swe.tma_include_in_lump_sum
                ),
                '_summary', json_build_object(
                    'totalRevenue', swe.revenue,
                    'totalFlaggingCost', swe.cost,
                    'totalHours', swe.hours
                )
            )
        ELSE NULL
    END AS service_work,
    CASE
        WHEN sie.id IS NOT NULL THEN
            json_build_object(
                'items', COALESCE(si_items.items, '[]'::json),
                '_summary', json_build_object(
                    'totalRevenue', COALESCE(si_summary.total_revenue, 0),
                    'totalCost', COALESCE(si_summary.total_cost, 0),
                    'totalGrossProfit', COALESCE(si_summary.total_gross_profit, 0)
                )
            )
        ELSE NULL
    END AS sale_items,
    CASE
        WHEN pse.id IS NOT NULL THEN
            json_build_object(
                'signItems', COALESCE(ps_items.items, '[]'::json),
                'info', pse.permanent_signs_info
            )
        ELSE NULL
    END AS permanent_signs,
    pm.project_manager,
    pm.pm_email,
    pm.pm_phone,
    be.customer_contract_number,
    be.contractor_name,
    be.subcontractor_name,
    COALESCE(phase_agg.total_phases, 0) AS total_phases,
    COALESCE(phase_agg.total_days, 0) AS total_days,
    COALESCE(phase_agg.total_hours, 0) AS total_hours
FROM bid_estimates be
LEFT JOIN admin_data_entries ad ON be.id = ad.bid_estimate_id
LEFT JOIN mpt_rental_entries mpr ON be.id = mpr.bid_estimate_id
LEFT JOIN (
    SELECT
        mpt_rental_entry_id,
        json_agg(
            json_build_object(
                'type', equipment_type,
                'price', price,
                'discountRate', discount_rate,
                'usefulLife', useful_life,
                'paybackPeriod', payback_period
            )
        ) AS static_equipment_info
    FROM mpt_static_equipment_info
    GROUP BY mpt_rental_entry_id
) mse ON mpr.id = mse.mpt_rental_entry_id
LEFT JOIN (
    SELECT
        mpt_rental_entry_id,
        json_agg(
            json_build_object(
                'index', phase_index,
                'name', name,
                'startDate', start_date,
                'endDate', end_date,
                'personnel', personnel,
                'days', days,
                'numberTrucks', number_trucks,
                'additionalRatedHours', additional_rated_hours,
                'additionalNonRatedHours', additional_non_rated_hours,
                'maintenanceTrips', maintenance_trips,
                'standardEquipment', json_build_object(
                    'HIVP', json_build_object('quantity', hivp_quantity),
                    'post', json_build_object('quantity', post_quantity),
                    'covers', json_build_object('quantity', covers_quantity),
                    'hStand', json_build_object('quantity', h_stand_quantity),
                    'sharps', json_build_object('quantity', sharps_quantity),
                    'BLights', json_build_object('quantity', b_lights_quantity),
                    'sandbag', json_build_object('quantity', sandbag_quantity),
                    'ACLights', json_build_object('quantity', ac_lights_quantity),
                    'TypeXIVP', json_build_object('quantity', type_xivp_quantity),
                    'metalStands', json_build_object('quantity', metal_stands_quantity),
                    'sixFootWings', json_build_object('quantity', six_foot_wings_quantity),
                    'fourFootTypeIII', json_build_object('quantity', four_foot_type_iii_quantity)
                ),
                'customLightAndDrumItems', custom_light_and_drum_items,
                'emergency', emergency,
                'signs', COALESCE(phase_signs.signs, '[]'::json)
            )
        ) AS phases,
        COUNT(*) AS total_phases,
        SUM(days) AS total_days,
        SUM(
            (personnel * days * 8) +
            additional_rated_hours +
            additional_non_rated_hours +
            (maintenance_trips * 0.5)
        ) AS total_hours
    FROM mpt_phases
    LEFT JOIN (
        SELECT
            phase_id,
            json_agg(
                json_build_object(
                    'id', sign_id,
                    'width', width,
                    'height', height,
                    'quantity', quantity,
                    'sheeting', sheeting,
                    'isCustom', is_custom,
                    'designation', designation,
                    'description', description,
                    'associatedStructure', associated_structure,
                    'displayStructure', display_structure,
                    'substrate', substrate,
                    'bLightsColor', b_lights_color,
                    'stiffener', stiffener,
                    'bLights', b_lights,
                    'cover', covers,
                    'primarySignId', primary_sign_id
                )
            ) AS signs
        FROM (
            SELECT
                mps.phase_id,
                mps.sign_id,
                mps.width,
                mps.height,
                mps.quantity,
                mps.sheeting,
                mps.is_custom,
                mps.designation,
                mps.description,
                mps.associated_structure,
                mps.display_structure,
                mps.substrate,
                mps.b_lights_color,
                mps.stiffener,
                mps.b_lights,
                mps.covers,
                NULL AS primary_sign_id
            FROM mpt_primary_signs mps
            UNION ALL
            SELECT
                mss.phase_id,
                mss.sign_id,
                mss.width,
                mss.height,
                NULL AS quantity,
                mss.sheeting,
                mss.is_custom,
                mss.designation,
                mss.description,
                NULL AS associated_structure,
                NULL AS display_structure,
                mss.substrate,
                NULL AS b_lights_color,
                NULL AS stiffener,
                NULL AS b_lights,
                NULL AS covers,
                mss.primary_sign_id
            FROM mpt_secondary_signs mss
        ) combined_signs
        GROUP BY phase_id
    ) phase_signs ON mpt_phases.id = phase_signs.phase_id
    GROUP BY mpt_rental_entry_id
) phase_agg ON mpr.id = phase_agg.mpt_rental_entry_id
LEFT JOIN equipment_rental_entries ere ON be.id = ere.bid_estimate_id
LEFT JOIN (
    SELECT
        bid_estimate_id,
        json_agg(
            json_build_object(
                'name', name,
                'itemNumber', item_number,
                'quantity', quantity,
                'notes', notes,
                'months', months,
                'rentPrice', rent_price,
                'reRentPrice', re_rent_price,
                'reRentForCurrentJob', re_rent_for_current_job,
                'totalCost', total_cost,
                'usefulLifeYrs', useful_life_yrs,
                'revenue', revenue,
                'grossProfit', gross_profit,
                'grossProfitMargin', gross_profit_margin
            )
        ) AS items,
        SUM(revenue) AS total_revenue,
        SUM(gross_profit) AS total_gross_profit,
        SUM(total_cost) AS total_cost
    FROM equipment_rental_entries
    GROUP BY bid_estimate_id
) er_items ON be.id = er_items.bid_estimate_id
LEFT JOIN (
    SELECT
        bid_estimate_id,
        SUM(revenue) AS total_revenue,
        SUM(gross_profit) AS total_gross_profit,
        SUM(cost) AS total_cost
    FROM equipment_rental_entries
    GROUP BY bid_estimate_id
) er_summary ON be.id = er_summary.bid_estimate_id
LEFT JOIN flagging_entries fle ON be.id = fle.bid_estimate_id
LEFT JOIN service_work_entries swe ON be.id = swe.bid_estimate_id
LEFT JOIN sale_item_entries sie ON be.id = sie.bid_estimate_id
LEFT JOIN (
    SELECT
        bid_estimate_id,
        json_agg(
            json_build_object(
                'name', name,
                'quantity', quantity,
                'itemNumber', item_number,
                'displayName', display_name,
                'notes', notes,
                'totalCost', total_cost,
                'revenue', revenue,
                'grossProfit', gross_profit,
                'grossProfitMargin', gross_profit_margin
            )
        ) AS items,
        SUM(revenue) AS total_revenue,
        SUM(total_cost) AS total_cost,
        SUM(gross_profit) AS total_gross_profit
    FROM sale_item_entries
    GROUP BY bid_estimate_id
) si_items ON be.id = si_items.bid_estimate_id
LEFT JOIN (
    SELECT
        bid_estimate_id,
        SUM(revenue) AS total_revenue,
        SUM(total_cost) AS total_cost,
        SUM(gross_profit) AS total_gross_profit
    FROM sale_item_entries
    GROUP BY bid_estimate_id
) si_summary ON be.id = si_summary.bid_estimate_id
LEFT JOIN permanent_signs_entries pse ON be.id = pse.bid_estimate_id
LEFT JOIN (
    SELECT
        permanent_signs_entry_id,
        json_agg(
            json_build_object(
                'itemNumber', item_number,
                'personnel', personnel,
                'numberTrucks', number_trucks,
                'numberTrips', number_trips,
                'installHoursRequired', install_hours_required,
                'quantity', quantity,
                'permSignBolts', perm_sign_bolts,
                'productivityRate', productivity_rate,
                'type', type,
                'signSqFootage', sign_sq_footage,
                'permSignPriceSqFt', perm_sign_price_sq_ft,
                'standardPricing', standard_pricing,
                'customMargin', custom_margin,
                'separateMobilization', separate_mobilization,
                'permSignCostSqFt', perm_sign_cost_sq_ft,
                'hiReflectiveStrips', hi_reflective_strips,
                'fygReflectiveStrips', fyg_reflective_strips,
                'jennyBrackets', jenny_brackets,
                'stiffenerInches', stiffener_inches,
                'tmzBrackets', tmz_brackets,
                'antiTheftBolts', anti_theft_bolts,
                'chevronBrackets', chevron_brackets,
                'streetNameCrossBrackets', street_name_cross_brackets,
                'isRemove', is_remove,
                'flexibleDelineatorCost', flexible_delineator_cost,
                'additionalItems', additional_items
            )
        ) AS items
    FROM permanent_signs
    GROUP BY permanent_signs_entry_id
) ps_items ON pse.id = ps_items.permanent_signs_entry_id
LEFT JOIN project_metadata pm ON be.id = pm.bid_estimate_id;

-- Recreate jobs_complete view
CREATE VIEW jobs_complete AS
WITH estimate_data AS (
    SELECT estimate_complete.id,
        estimate_complete.status,
        estimate_complete.total_revenue,
        estimate_complete.total_cost,
        estimate_complete.total_gross_profit,
        estimate_complete.created_at,
        estimate_complete.archived,
        estimate_complete.deleted,
        estimate_complete.notes,
        estimate_complete.admin_data,
        estimate_complete.mpt_rental,
        estimate_complete.equipment_rental,
        estimate_complete.flagging,
        estimate_complete.service_work,
        estimate_complete.sale_items,
        estimate_complete.permanent_signs,
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
    e.created_at AS estimate_created_at,
    COALESCE(
        CASE
            WHEN j.archived THEN NULL
            ELSE e.admin_data
        END,
        e.admin_data
    ) AS admin_data,
    e.mpt_rental,
    e.total_hours,
    json_build_object(
        'jobNumber', jn.job_number,
        'contractNumber', COALESCE(ade_job.contract_number, (e.admin_data ->> 'contractNumber'::text)::character varying),
        'estimator', COALESCE(ade_job.estimator, (e.admin_data ->> 'estimator'::text)::character varying),
        'etcRep', COALESCE(ade_job.etc_rep, (e.admin_data ->> 'etcRep'::text)),
        'owner', COALESCE(ade_job.owner::text, (e.admin_data ->> 'owner'::text)),
        'county', COALESCE(ade_job.county, (e.admin_data -> 'county'::text)::jsonb),
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
LEFT JOIN estimate_data e ON j.estimate_id = e.id
LEFT JOIN job_numbers jn ON j.job_number_id = jn.id
LEFT JOIN admin_data_entries ade_job ON ade_job.job_id = j.id
LEFT JOIN project_metadata pm_job ON pm_job.job_id = j.id;