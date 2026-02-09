ALTER TABLE mpt_primary_signs ADD COLUMN display_structure VARCHAR(255);

ALTER TABLE mpt_primary_signs DROP COLUMN contract_number;

ALTER TABLE mpt_primary_signs DROP COLUMN phase_index;

ALTER TABLE mpt_primary_signs ADD COLUMN substrate VARCHAR(100);

ALTER TABLE mpt_secondary_signs ADD COLUMN substrate VARCHAR(100);

ALTER TABLE mpt_primary_signs ADD COLUMN b_lights_color  VARCHAR(100);

ALTER TABLE mpt_primary_signs ADD COLUMN stiffener boolean;

CREATE OR REPLACE VIEW estimate_complete AS
WITH phase_aggregations AS (
    SELECT mpt_phases.mpt_rental_entry_id,
       count(*) AS phase_count,
       sum(mpt_phases.days) AS total_days,
       sum(mpt_phases.additional_rated_hours) AS total_rated_hours,
       sum(mpt_phases.additional_non_rated_hours) AS total_non_rated_hours,
       json_agg(json_build_object('id', mpt_phases.id, 'name', mpt_phases.name, 'startDate', mpt_phases.start_date, 'endDate', mpt_phases.end_date, 'personnel', mpt_phases.personnel, 'days', mpt_phases.days, 'numberTrucks', mpt_phases.number_trucks, 'additionalRatedHours', mpt_phases.additional_rated_hours, 'additionalNonRatedHours', mpt_phases.additional_non_rated_hours, 'maintenanceTrips', mpt_phases.maintenance_trips, 'standardEquipment', json_build_object('fourFootTypeIII', json_build_object('quantity', mpt_phases.four_foot_type_iii_quantity), 'hStand', json_build_object('quantity', mpt_phases.h_stand_quantity), 'sixFootWings', json_build_object('quantity', mpt_phases.six_foot_wings_quantity), 'post', json_build_object('quantity', mpt_phases.post_quantity), 'sandbag', json_build_object('quantity', mpt_phases.sandbag_quantity), 'covers', json_build_object('quantity', mpt_phases.covers_quantity), 'metalStands', json_build_object('quantity', mpt_phases.metal_stands_quantity), 'HIVP', json_build_object('quantity', mpt_phases.hivp_quantity), 'TypeXIVP', json_build_object('quantity', mpt_phases.type_xivp_quantity), 'BLights', json_build_object('quantity', mpt_phases.b_lights_quantity), 'ACLights', json_build_object('quantity', mpt_phases.ac_lights_quantity), 'sharps', json_build_object('quantity', mpt_phases.sharps_quantity)), 'customLightAndDrumItems', mpt_phases.custom_light_and_drum_items, 'signs', COALESCE(phase_signs.all_signs, '[]'::json)) ORDER BY mpt_phases.phase_index) AS phases
      FROM (mpt_phases
        LEFT JOIN ( SELECT p.id AS phase_id,
               ( SELECT json_agg(combined.combined_signs) AS json_agg
                      FROM ( SELECT json_build_object('id', ps.sign_id, 'width', ps.width, 'height', ps.height, 'quantity', ps.quantity, 'sheeting', ps.sheeting, 'isCustom', ps.is_custom, 'designation', ps.designation, 'description', ps.description, 'associatedStructure', ps.associated_structure, 'displayStructure', ps.display_structure, 'bLights', ps.b_lights, 'bLightsColor', ps.b_lights_color, 'covers', ps.covers, 'substrate', ps.substrate, 'stiffener', ps.stiffener) AS combined_signs
                              FROM mpt_primary_signs ps
                             WHERE (ps.phase_id = p.id)
                           UNION ALL
                            SELECT json_build_object('id', ss.sign_id, 'width', ss.width, 'height', ss.height, 'sheeting', ss.sheeting, 'isCustom', ss.is_custom, 'designation', ss.designation, 'description', ss.description, 'primarySignId', ss.primary_sign_id, 'substrate', ss.substrate) AS combined_signs
                              FROM mpt_secondary_signs ss
                             WHERE (ss.phase_id = p.id)) combined) AS all_signs
              FROM mpt_phases p
             WHERE (p.mpt_rental_entry_id IS NOT NULL)
             GROUP BY p.id) phase_signs ON ((mpt_phases.id = phase_signs.phase_id)))
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
   json_build_object('contractNumber', ad.contract_number, 'estimator', ad.estimator, 'division', ad.division, 'lettingDate', ad.bid_date, 'owner', ad.owner, 'county', (ad.county)::json, 'srRoute', ad.sr_route, 'location', ad.location, 'dbe', ad.dbe, 'startDate', ad.start_date, 'endDate', ad.end_date, 'winterStart', ad.winter_start, 'winterEnd', ad.winter_end, 'owTravelTimeMins', ad.ow_travel_time_mins, 'owMileage', ad.ow_mileage, 'fuelCostPerGallon', ad.fuel_cost_per_gallon, 'emergencyJob', ad.emergency_job, 'rated', ad.rated, 'emergencyFields', ad.emergency_fields) AS admin_data,
       CASE
           WHEN (mpr.id IS NOT NULL) THEN json_build_object('targetMOIC', mpr.target_moic, 'paybackPeriod', mpr.payback_period, 'annualUtilization', mpr.annual_utilization, 'dispatchFee', mpr.dispatch_fee, 'mpgPerTruck', mpr.mpg_per_truck, 'staticEquipmentInfo', sei.static_equipment_info, 'phases', pa.phases, '_summary', json_build_object('revenue', mpr.revenue, 'cost', mpr.cost, 'grossProfit', mpr.gross_profit, 'hours', mpr.hours))
           ELSE NULL::json
       END AS mpt_rental,
   COALESCE(( SELECT json_agg(json_build_object('name', equipment_rental_entries.name, 'quantity', equipment_rental_entries.quantity, 'months', equipment_rental_entries.months, 'rentPrice', equipment_rental_entries.rent_price, 'reRentPrice', equipment_rental_entries.re_rent_price, 'reRentForCurrentJob', equipment_rental_entries.re_rent_for_current_job, 'totalCost', equipment_rental_entries.total_cost, 'usefulLifeYrs', equipment_rental_entries.useful_life_yrs, 'revenue', equipment_rental_entries.revenue, 'grossProfit', equipment_rental_entries.gross_profit, 'grossProfitMargin', equipment_rental_entries.gross_profit_margin, 'cost', equipment_rental_entries.cost)) AS json_agg
          FROM equipment_rental_entries
         WHERE (equipment_rental_entries.bid_estimate_id = be.id)), '[]'::json) AS equipment_rental,
       CASE
           WHEN (f.id IS NOT NULL) THEN json_build_object('standardPricing', f.standard_pricing, 'standardLumpSum', f.standard_lump_sum, 'numberTrucks', f.number_trucks, 'fuelEconomyMPG', f.fuel_economy_mpg, 'personnel', f.personnel, 'onSiteJobHours', f.on_site_job_hours, 'additionalEquipmentCost', f.additional_equipment_cost, 'fuelCostPerGallon', f.fuel_cost_per_gallon, 'truckDispatchFee', f.truck_dispatch_fee, 'workerComp', f.worker_comp, 'generalLiability', f.general_liability, 'markupRate', f.markup_rate, 'arrowBoards', json_build_object('quantity', f.arrow_boards_quantity, 'cost', f.arrow_boards_cost, 'includeInLumpSum', f.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', f.message_boards_quantity, 'cost', f.message_boards_cost, 'includeInLumpSum', f.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', f.tma_quantity, 'cost', f.tma_cost, 'includeInLumpSum', f.tma_include_in_lump_sum), 'revenue', f.revenue, 'cost', f.cost, 'grossProfit', f.gross_profit, 'hours', f.hours)
           ELSE NULL::json
       END AS flagging,
       CASE
           WHEN (sw.id IS NOT NULL) THEN json_build_object('standardPricing', sw.standard_pricing, 'standardLumpSum', sw.standard_lump_sum, 'numberTrucks', sw.number_trucks, 'fuelEconomyMPG', sw.fuel_economy_mpg, 'personnel', sw.personnel, 'onSiteJobHours', sw.on_site_job_hours, 'additionalEquipmentCost', sw.additional_equipment_cost, 'fuelCostPerGallon', sw.fuel_cost_per_gallon, 'truckDispatchFee', sw.truck_dispatch_fee, 'workerComp', sw.worker_comp, 'generalLiability', sw.general_liability, 'markupRate', sw.markup_rate, 'arrowBoards', json_build_object('quantity', sw.arrow_boards_quantity, 'cost', sw.arrow_boards_cost, 'includeInLumpSum', sw.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', sw.message_boards_quantity, 'cost', sw.message_boards_cost, 'includeInLumpSum', sw.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', sw.tma_quantity, 'cost', sw.tma_cost, 'includeInLumpSum', sw.tma_include_in_lump_sum), 'revenue', sw.revenue, 'cost', sw.cost, 'grossProfit', sw.gross_profit, 'hours', sw.hours)
           ELSE NULL::json
       END AS service_work,
   COALESCE(( SELECT json_agg(json_build_object('itemNumber', sale_items.item_number, 'name', sale_items.name, 'vendor', sale_items.vendor, 'quantity', sale_items.quantity, 'quotePrice', sale_items.quote_price, 'markupPercentage', sale_items.markup_percentage)) AS json_agg
          FROM sale_items
         WHERE (sale_items.bid_estimate_id = be.id)), '[]'::json) AS sale_items,
   pm.project_manager,
   pm.pm_email,
   pm.pm_phone,
   pm.customer_contract_number,
   c.name AS contractor_name,
   s.name AS subcontractor_name,
   pa.phase_count AS total_phases,
   pa.total_days,
   (pa.total_rated_hours + pa.total_non_rated_hours) AS total_hours
  FROM (((((((((bid_estimates be
    LEFT JOIN admin_data_entries ad ON ((be.id = ad.bid_estimate_id)))
    LEFT JOIN mpt_rental_entries mpr ON ((be.id = mpr.bid_estimate_id)))
    LEFT JOIN phase_aggregations pa ON ((mpr.id = pa.mpt_rental_entry_id)))
    LEFT JOIN static_equipment_json sei ON ((mpr.id = sei.mpt_rental_entry_id)))
    LEFT JOIN flagging_entries f ON ((be.id = f.bid_estimate_id)))
    LEFT JOIN service_work_entries sw ON ((be.id = sw.bid_estimate_id)))
    LEFT JOIN project_metadata pm ON ((be.id = pm.bid_estimate_id)))
    LEFT JOIN contractors c ON ((pm.contractor_id = c.id)))
    LEFT JOIN subcontractors s ON ((pm.subcontractor_id = s.id)));