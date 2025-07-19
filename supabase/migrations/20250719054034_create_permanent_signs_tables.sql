CREATE TABLE permanent_signs_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER NOT NULL REFERENCES bid_estimates(id) ON DELETE CASCADE,
    permanent_signs_info JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(bid_estimate_id)
);

CREATE INDEX idx_permanent_signs_entries_estimate_id ON permanent_signs_entries(bid_estimate_id);

CREATE TABLE permanent_signs (
    id SERIAL PRIMARY KEY,
    permanent_signs_entry_id INTEGER NOT NULL REFERENCES permanent_signs_entries(id) ON DELETE CASCADE,
    
    -- Item type and identification
    item_type VARCHAR(30) NOT NULL,
    item_number VARCHAR(100),
    
    -- Base PermanentSignItem fields
    personnel INTEGER DEFAULT 0,
    number_trucks INTEGER DEFAULT 0,
    number_trips INTEGER DEFAULT 0,
    install_hours_required DECIMAL(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    perm_sign_bolts INTEGER,
    productivity_rate DECIMAL(10,4),
    
    -- PostMountedInstall fields (Type B/F)
    type CHAR(1), -- 'B' or 'F'
    sign_sq_footage DECIMAL(10,2),
    perm_sign_price_sq_ft DECIMAL(10,2),
    standard_pricing BOOLEAN DEFAULT true,
    custom_margin DECIMAL(8,4),
    separate_mobilization BOOLEAN DEFAULT false,
    perm_sign_cost_sq_ft DECIMAL(10,2),
    hi_reflective_strips INTEGER,
    fyg_reflective_strips INTEGER,
    jenny_brackets INTEGER,
    stiffener_sq_inches DECIMAL(10,2),
    tmz_brackets INTEGER,
    anti_theft_bolts INTEGER,
    chevron_brackets INTEGER,
    street_name_cross_brackets INTEGER,
    
    -- PostMountedResetOrRemove fields
    is_remove BOOLEAN,
    
    -- InstallFlexibleDelineators fields
    flexible_delineator_cost DECIMAL(10,2),
    
    -- Additional items as JSON
    additional_items JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_item_type CHECK (item_type IN (
        'pmsTypeB', 'pmsTypeF', 'resetTypeB', 'resetTypeF', 
        'removeTypeB', 'removeTypeF', 'pmsTypeC', 'flexibleDelineator'
    )),
    CONSTRAINT valid_type_field CHECK (type IN ('B', 'F') OR type IS NULL)
);

-- Indexes for querying
CREATE INDEX idx_permanent_signs_entry_id ON permanent_signs(permanent_signs_entry_id);
CREATE INDEX idx_permanent_signs_item_type ON permanent_signs(item_type);
CREATE INDEX idx_permanent_signs_type ON permanent_signs(type);
CREATE INDEX idx_permanent_signs_quantity ON permanent_signs(quantity);
CREATE INDEX idx_permanent_signs_sign_sq_footage ON permanent_signs(sign_sq_footage);

-- Drop and recreate estimate_complete view with permanent signs
DROP VIEW IF EXISTS jobs_complete;
DROP VIEW IF EXISTS estimate_complete;

CREATE VIEW estimate_complete AS
WITH phase_aggregations AS (
    SELECT mpt_phases.mpt_rental_entry_id,
        count(*) AS phase_count,
        sum(mpt_phases.days) AS total_days,
        sum(mpt_phases.additional_rated_hours) AS total_rated_hours,
        sum(mpt_phases.additional_non_rated_hours) AS total_non_rated_hours,
        json_agg(json_build_object('id', mpt_phases.id, 'name', mpt_phases.name, 'startDate', mpt_phases.start_date, 'endDate', mpt_phases.end_date, 'personnel', mpt_phases.personnel, 'days', mpt_phases.days, 'numberTrucks', mpt_phases.number_trucks, 'additionalRatedHours', mpt_phases.additional_rated_hours, 'additionalNonRatedHours', mpt_phases.additional_non_rated_hours, 'maintenanceTrips', mpt_phases.maintenance_trips, 'standardEquipment', json_build_object('fourFootTypeIII', json_build_object('quantity', mpt_phases.four_foot_type_iii_quantity), 'hStand', json_build_object('quantity', mpt_phases.h_stand_quantity), 'sixFootWings', json_build_object('quantity', mpt_phases.six_foot_wings_quantity), 'post', json_build_object('quantity', mpt_phases.post_quantity), 'sandbag', json_build_object('quantity', mpt_phases.sandbag_quantity), 'covers', json_build_object('quantity', mpt_phases.covers_quantity), 'metalStands', json_build_object('quantity', mpt_phases.metal_stands_quantity), 'HIVP', json_build_object('quantity', mpt_phases.hivp_quantity), 'TypeXIVP', json_build_object('quantity', mpt_phases.type_xivp_quantity), 'BLights', json_build_object('quantity', mpt_phases.b_lights_quantity), 'ACLights', json_build_object('quantity', mpt_phases.ac_lights_quantity), 'sharps', json_build_object('quantity', mpt_phases.sharps_quantity)), 'customLightAndDrumItems', mpt_phases.custom_light_and_drum_items, 'signs', COALESCE(phase_signs.all_signs, '[]'::json)) ORDER BY mpt_phases.phase_index) AS phases
    FROM mpt_phases
        LEFT JOIN ( SELECT p.id AS phase_id,
                ( SELECT json_agg(combined.combined_signs) AS json_agg
                    FROM ( SELECT json_build_object('id', ps.sign_id, 'width', ps.width, 'height', ps.height, 'quantity', ps.quantity, 'sheeting', ps.sheeting, 'isCustom', ps.is_custom, 'designation', ps.designation, 'description', ps.description, 'associatedStructure', ps.associated_structure, 'displayStructure', ps.display_structure, 'bLights', ps.b_lights, 'bLightsColor', ps.b_lights_color, 'covers', ps.covers, 'substrate', ps.substrate, 'stiffener', ps.stiffener) AS combined_signs
                            FROM mpt_primary_signs ps
                            WHERE ps.phase_id = p.id
                        UNION ALL
                            SELECT json_build_object('id', ss.sign_id, 'width', ss.width, 'height', ss.height, 'sheeting', ss.sheeting, 'isCustom', ss.is_custom, 'designation', ss.designation, 'description', ss.description, 'primarySignId', ss.primary_sign_id, 'substrate', ss.substrate) AS combined_signs
                            FROM mpt_secondary_signs ss
                            WHERE ss.phase_id = p.id) combined) AS all_signs
                FROM mpt_phases p
                WHERE p.mpt_rental_entry_id IS NOT NULL
                GROUP BY p.id) phase_signs ON mpt_phases.id = phase_signs.phase_id
    GROUP BY mpt_phases.mpt_rental_entry_id
), static_equipment_json AS (
    SELECT mpt_static_equipment_info.mpt_rental_entry_id,
        json_object_agg(mpt_static_equipment_info.equipment_type, json_build_object('price', mpt_static_equipment_info.price, 'discountRate', mpt_static_equipment_info.discount_rate, 'usefulLife', mpt_static_equipment_info.useful_life, 'paybackPeriod', mpt_static_equipment_info.payback_period)) AS static_equipment_info
    FROM mpt_static_equipment_info
    GROUP BY mpt_static_equipment_info.mpt_rental_entry_id
)
SELECT be.id,
    be.status,
    be.total_revenue,
    be.total_cost,
    be.total_gross_profit,
    be.created_at,
    be.archived,
    be.deleted,
    be.notes,
    json_build_object('contractNumber', ad.contract_number, 'estimator', ad.estimator, 'division', ad.division, 'lettingDate', ad.bid_date, 'owner', ad.owner, 'county', ad.county::json, 'srRoute', ad.sr_route, 'location', ad.location, 'dbe', ad.dbe, 'startDate', ad.start_date, 'endDate', ad.end_date, 'winterStart', ad.winter_start, 'winterEnd', ad.winter_end, 'owTravelTimeMins', ad.ow_travel_time_mins, 'owMileage', ad.ow_mileage, 'fuelCostPerGallon', ad.fuel_cost_per_gallon, 'emergencyJob', ad.emergency_job, 'rated', ad.rated, 'emergencyFields', ad.emergency_fields) AS admin_data,
    CASE
        WHEN mpr.id IS NOT NULL THEN json_build_object('targetMOIC', mpr.target_moic, 'paybackPeriod', mpr.payback_period, 'annualUtilization', mpr.annual_utilization, 'dispatchFee', mpr.dispatch_fee, 'mpgPerTruck', mpr.mpg_per_truck, 'staticEquipmentInfo', sei.static_equipment_info, 'phases', pa.phases, '_summary', json_build_object('revenue', mpr.revenue, 'cost', mpr.cost, 'grossProfit', mpr.gross_profit, 'hours', mpr.hours))
        ELSE NULL::json
    END AS mpt_rental,
    COALESCE(( SELECT json_agg(json_build_object('name', equipment_rental_entries.name, 'quantity', equipment_rental_entries.quantity, 'months', equipment_rental_entries.months, 'rentPrice', equipment_rental_entries.rent_price, 'reRentPrice', equipment_rental_entries.re_rent_price, 'reRentForCurrentJob', equipment_rental_entries.re_rent_for_current_job, 'totalCost', equipment_rental_entries.total_cost, 'usefulLifeYrs', equipment_rental_entries.useful_life_yrs, 'revenue', equipment_rental_entries.revenue, 'grossProfit', equipment_rental_entries.gross_profit, 'grossProfitMargin', equipment_rental_entries.gross_profit_margin, 'cost', equipment_rental_entries.cost)) AS json_agg
        FROM equipment_rental_entries
        WHERE equipment_rental_entries.bid_estimate_id = be.id), '[]'::json) AS equipment_rental,
    CASE
        WHEN f.id IS NOT NULL THEN json_build_object('standardPricing', f.standard_pricing, 'standardLumpSum', f.standard_lump_sum, 'numberTrucks', f.number_trucks, 'fuelEconomyMPG', f.fuel_economy_mpg, 'personnel', f.personnel, 'onSiteJobHours', f.on_site_job_hours, 'additionalEquipmentCost', f.additional_equipment_cost, 'fuelCostPerGallon', f.fuel_cost_per_gallon, 'truckDispatchFee', f.truck_dispatch_fee, 'workerComp', f.worker_comp, 'generalLiability', f.general_liability, 'markupRate', f.markup_rate, 'arrowBoards', json_build_object('quantity', f.arrow_boards_quantity, 'cost', f.arrow_boards_cost, 'includeInLumpSum', f.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', f.message_boards_quantity, 'cost', f.message_boards_cost, 'includeInLumpSum', f.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', f.tma_quantity, 'cost', f.tma_cost, 'includeInLumpSum', f.tma_include_in_lump_sum), 'revenue', f.revenue, 'cost', f.cost, 'grossProfit', f.gross_profit, 'hours', f.hours)
        ELSE NULL::json
    END AS flagging,
    CASE
        WHEN sw.id IS NOT NULL THEN json_build_object('standardPricing', sw.standard_pricing, 'standardLumpSum', sw.standard_lump_sum, 'numberTrucks', sw.number_trucks, 'fuelEconomyMPG', sw.fuel_economy_mpg, 'personnel', sw.personnel, 'onSiteJobHours', sw.on_site_job_hours, 'additionalEquipmentCost', sw.additional_equipment_cost, 'fuelCostPerGallon', sw.fuel_cost_per_gallon, 'truckDispatchFee', sw.truck_dispatch_fee, 'workerComp', sw.worker_comp, 'generalLiability', sw.general_liability, 'markupRate', sw.markup_rate, 'arrowBoards', json_build_object('quantity', sw.arrow_boards_quantity, 'cost', sw.arrow_boards_cost, 'includeInLumpSum', sw.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', sw.message_boards_quantity, 'cost', sw.message_boards_cost, 'includeInLumpSum', sw.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', sw.tma_quantity, 'cost', sw.tma_cost, 'includeInLumpSum', sw.tma_include_in_lump_sum), 'revenue', sw.revenue, 'cost', sw.cost, 'grossProfit', sw.gross_profit, 'hours', sw.hours)
        ELSE NULL::json
    END AS service_work,
    COALESCE(( SELECT json_agg(json_build_object('itemNumber', sale_items.item_number, 'name', sale_items.name, 'vendor', sale_items.vendor, 'quantity', sale_items.quantity, 'quotePrice', sale_items.quote_price, 'markupPercentage', sale_items.markup_percentage)) AS json_agg
        FROM sale_items
        WHERE sale_items.bid_estimate_id = be.id), '[]'::json) AS sale_items,
    -- Permanent Signs (NEW)
    CASE 
        WHEN pse.id IS NOT NULL THEN
            json_build_object(
                'maxDailyHours', (pse.permanent_signs_info->>'maxDailyHours')::numeric,
                'itemMarkup', (pse.permanent_signs_info->>'itemMarkup')::numeric,
                'equipmentData', pse.permanent_signs_info->'equipmentData',
                'productivityRates', pse.permanent_signs_info->'productivityRates',
                'signItems', COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'id', ps.id::text,
                            'itemNumber', ps.item_number,
                            'personnel', ps.personnel,
                            'numberTrucks', ps.number_trucks,
                            'numberTrips', ps.number_trips,
                            'installHoursRequired', ps.install_hours_required,
                            'quantity', ps.quantity,
                            'permSignBolts', ps.perm_sign_bolts,
                            'productivityRate', ps.productivity_rate,
                            'type', ps.type,
                            'signSqFootage', ps.sign_sq_footage,
                            'permSignPriceSqFt', ps.perm_sign_price_sq_ft,
                            'standardPricing', ps.standard_pricing,
                            'customMargin', ps.custom_margin,
                            'separateMobilization', ps.separate_mobilization,
                            'permSignCostSqFt', ps.perm_sign_cost_sq_ft,
                            'hiReflectiveStrips', ps.hi_reflective_strips,
                            'fygReflectiveStrips', ps.fyg_reflective_strips,
                            'jennyBrackets', ps.jenny_brackets,
                            'stiffenerSqInches', ps.stiffener_sq_inches,
                            'tmzBrackets', ps.tmz_brackets,
                            'antiTheftBolts', ps.anti_theft_bolts,
                            'chevronBrackets', ps.chevron_brackets,
                            'streetNameCrossBrackets', ps.street_name_cross_brackets,
                            'isRemove', ps.is_remove,
                            'flexibleDelineatorCost', ps.flexible_delineator_cost,
                            'additionalItems', ps.additional_items
                        ) ORDER BY ps.id
                    )
                    FROM permanent_signs ps
                    WHERE ps.permanent_signs_entry_id = pse.id
                ), '[]'::json)
            )
        ELSE NULL::json
    END AS permanent_signs,
    pm.project_manager,
    pm.pm_email,
    pm.pm_phone,
    pm.customer_contract_number,
    c.name AS contractor_name,
    s.name AS subcontractor_name,
    pa.phase_count AS total_phases,
    pa.total_days,
    pa.total_rated_hours + pa.total_non_rated_hours AS total_hours
FROM bid_estimates be
    LEFT JOIN admin_data_entries ad ON be.id = ad.bid_estimate_id
    LEFT JOIN mpt_rental_entries mpr ON be.id = mpr.bid_estimate_id
    LEFT JOIN phase_aggregations pa ON mpr.id = pa.mpt_rental_entry_id
    LEFT JOIN static_equipment_json sei ON mpr.id = sei.mpt_rental_entry_id
    LEFT JOIN flagging_entries f ON be.id = f.bid_estimate_id
    LEFT JOIN service_work_entries sw ON be.id = sw.bid_estimate_id
    LEFT JOIN project_metadata pm ON be.id = pm.bid_estimate_id
    LEFT JOIN contractors c ON pm.contractor_id = c.id
    LEFT JOIN subcontractors s ON pm.subcontractor_id = s.id
    LEFT JOIN permanent_signs_entries pse ON be.id = pse.bid_estimate_id;

-- Recreate jobs_complete view with permanent signs
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
        estimate_complete.permanent_signs,  -- NEW
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
SELECT j.id,
    j.billing_status,
    j.project_status,
    j.overdays,
    j.notes,
    j.bid_number,
    j.certified_payroll,
    j.created_at,
    j.archived,
    j.deleted,
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
    e.notes AS estimate_notes,
    e.deleted AS estimate_deleted,
    COALESCE(
        CASE
            WHEN ade_job.id IS NOT NULL THEN json_build_object('contractNumber', ade_job.contract_number, 'estimator', ade_job.estimator, 'division', ade_job.division::text, 'lettingDate', ade_job.bid_date, 'owner', ade_job.owner::text, 'county', ade_job.county, 'srRoute', ade_job.sr_route, 'location', ade_job.location, 'dbe', ade_job.dbe, 'startDate', ade_job.start_date, 'endDate', ade_job.end_date, 'winterStart', ade_job.winter_start, 'winterEnd', ade_job.winter_end, 'owTravelTimeMins', ade_job.ow_travel_time_mins, 'owMileage', ade_job.ow_mileage, 'fuelCostPerGallon', ade_job.fuel_cost_per_gallon, 'emergencyJob', ade_job.emergency_job, 'rated', ade_job.rated::text, 'emergencyFields', ade_job.emergency_fields)
            ELSE NULL::json
        END, e.admin_data) AS admin_data,
    e.mpt_rental,
    e.equipment_rental,
    e.flagging,
    e.service_work,
    e.sale_items,
    e.permanent_signs,  -- NEW
    COALESCE(pm_job.project_manager, e.project_manager) AS project_manager,
    COALESCE(pm_job.pm_email, e.pm_email) AS pm_email,
    COALESCE(pm_job.pm_phone, e.pm_phone) AS pm_phone,
    COALESCE(pm_job.customer_contract_number, e.customer_contract_number) AS customer_contract_number,
    e.contractor_name,
    e.subcontractor_name,
    e.total_phases,
    e.total_days,
    e.total_hours,
    json_build_object('jobNumber', jn.job_number, 'contractNumber', COALESCE(ade_job.contract_number, (e.admin_data ->> 'contractNumber'::text)::character varying), 'estimator', COALESCE(ade_job.estimator, (e.admin_data ->> 'estimator'::text)::character varying), 'owner', COALESCE(ade_job.owner::text, e.admin_data ->> 'owner'::text), 'county', COALESCE(ade_job.county, (e.admin_data -> 'county'::text)::jsonb), 'branch', jn.branch_code, 'startDate', COALESCE(ade_job.start_date::text, e.admin_data ->> 'startDate'::text), 'endDate', COALESCE(ade_job.end_date::text, e.admin_data ->> 'endDate'::text), 'projectDays', e.total_days, 'totalHours', e.total_hours, 'revenue', e.total_revenue, 'cost', e.total_cost, 'grossProfit', e.total_gross_profit, 'jobStatus', j.project_status, 'billingStatus', j.billing_status, 'certifiedPayroll', j.certified_payroll, 'overdays', j.overdays) AS job_summary
FROM jobs j
    LEFT JOIN job_numbers jn ON j.job_number_id = jn.id
    LEFT JOIN estimate_data e ON j.estimate_id = e.id
    LEFT JOIN admin_data_entries ade_job ON ade_job.job_id = j.id
    LEFT JOIN project_metadata pm_job ON pm_job.job_id = j.id
ORDER BY j.created_at DESC;