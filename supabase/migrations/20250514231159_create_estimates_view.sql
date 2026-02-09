CREATE OR REPLACE VIEW estimate_complete AS
WITH phase_aggregations AS (
  -- Aggregate phase equipment and return as JSON
  SELECT
    mpt_rental_entry_id,
    COUNT(*) as phase_count,
    SUM(days) as total_days,
    SUM(additional_rated_hours) as total_rated_hours,
    SUM(additional_non_rated_hours) as total_non_rated_hours,
    json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'startDate', start_date,
        'endDate', end_date,
        'personnel', personnel,
        'days', days,
        'numberTrucks', number_trucks,
        'additionalRatedHours', additional_rated_hours,
        'additionalNonRatedHours', additional_non_rated_hours,
        'maintenanceTrips', maintenance_trips,
        'emergency', emergency,
        'standardEquipment', json_build_object(
          'fourFootTypeIII', json_build_object('quantity', four_foot_type_iii_quantity),
          'hStand', json_build_object('quantity', h_stand_quantity),
          'sixFootWings', json_build_object('quantity', six_foot_wings_quantity),
          'post', json_build_object('quantity', post_quantity),
          'sandbag', json_build_object('quantity', sandbag_quantity),
          'covers', json_build_object('quantity', covers_quantity),
          'metalStands', json_build_object('quantity', metal_stands_quantity),
          'HIVP', json_build_object('quantity', hivp_quantity),
          'TypeXIVP', json_build_object('quantity', type_xivp_quantity),
          'BLights', json_build_object('quantity', b_lights_quantity),
          'ACLights', json_build_object('quantity', ac_lights_quantity),
          'sharps', json_build_object('quantity', sharps_quantity)
        ),
        'customLightAndDrumItems', custom_light_and_drum_items
      ) ORDER BY phase_index
    ) as phases
  FROM mpt_phases
  GROUP BY mpt_rental_entry_id
),
phase_signs AS (
  -- Get signs for each phase
  SELECT
    p.id as phase_id,
    coalesce(json_agg(
      DISTINCT jsonb_build_object(
        'id', ps.sign_id,
        'width', ps.width,
        'height', ps.height,
        'quantity', ps.quantity,
        'sheeting', ps.sheeting,
        'isCustom', ps.is_custom,
        'designation', ps.designation,
        'description', ps.description,
        'associatedStructure', ps.associated_structure,
        'bLights', ps.b_lights,
        'covers', ps.covers
      )
    ) FILTER (WHERE ps.id IS NOT NULL), '[]'::json) as primary_signs,
    coalesce(json_agg(
      DISTINCT jsonb_build_object(
        'id', ss.sign_id,
        'width', ss.width,
        'height', ss.height,
        'sheeting', ss.sheeting,
        'isCustom', ss.is_custom,
        'designation', ss.designation,
        'description', ss.description,
        'primarySignId', ss.primary_sign_id
      )
    ) FILTER (WHERE ss.id IS NOT NULL), '[]'::json) as secondary_signs
  FROM mpt_phases p
  LEFT JOIN mpt_primary_signs ps ON p.id = ps.phase_id
  LEFT JOIN mpt_secondary_signs ss ON p.id = ss.phase_id
  GROUP BY p.id
),
static_equipment_json AS (
  -- Convert static equipment to JSON format
  SELECT
    mpt_rental_entry_id,
    json_object_agg(
      equipment_type,
      json_build_object(
        'price', price,
        'discountRate', discount_rate,
        'usefulLife', useful_life,
        'paybackPeriod', payback_period
      )
    ) as static_equipment_info
  FROM mpt_static_equipment_info
  GROUP BY mpt_rental_entry_id
)
SELECT
  -- Base estimate data
  be.id,
  be.status,
  be.total_revenue,
  be.total_cost,
  be.total_gross_profit,
  be.created_at,
  be.archived,
  -- Admin data as JSON
  json_build_object(
    'contractNumber', ad.contract_number,
    'estimator', ad.estimator,
    'division', ad.division,
    'lettingDate', ad.bid_date,
    'owner', ad.owner,
    'county', ad.county,
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
  ) as admin_data,
  -- MPT Rental as JSON
  CASE
    WHEN mpr.id IS NOT NULL THEN
      json_build_object(
        'targetMOIC', mpr.target_moic,
        'paybackPeriod', mpr.payback_period,
        'annualUtilization', mpr.annual_utilization,
        'dispatchFee', mpr.dispatch_fee,
        'mpgPerTruck', mpr.mpg_per_truck,
        'staticEquipmentInfo', sei.static_equipment_info,
        'phases', pa.phases,
        '_summary', json_build_object(
          'revenue', mpr.revenue,
          'cost', mpr.cost,
          'grossProfit', mpr.gross_profit,
          'hours', mpr.hours
        )
      )
    ELSE NULL
  END as mpt_rental,
  -- Equipment rental as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'name', name,
        'quantity', quantity,
        'months', months,
        'rentPrice', rent_price,
        'reRentPrice', re_rent_price,
        'reRentForCurrentJob', re_rent_for_current_job,
        'totalCost', total_cost,
        'usefulLifeYrs', useful_life_yrs,
        'revenue', revenue,
        'grossProfit', gross_profit,
        'grossProfitMargin', gross_profit_margin,
        'cost', cost
      )
    )
    FROM equipment_rental_entries
    WHERE bid_estimate_id = be.id),
    '[]'::json
  ) as equipment_rental,
  -- Flagging as JSON
  CASE
    WHEN f.id IS NOT NULL THEN
      json_build_object(
        'standardPricing', f.standard_pricing,
        'standardLumpSum', f.standard_lump_sum,
        'numberTrucks', f.number_trucks,
        'fuelEconomyMPG', f.fuel_economy_mpg,
        'personnel', f.personnel,
        'onSiteJobHours', f.on_site_job_hours,
        'additionalEquipmentCost', f.additional_equipment_cost,
        'fuelCostPerGallon', f.fuel_cost_per_gallon,
        'truckDispatchFee', f.truck_dispatch_fee,
        'workerComp', f.worker_comp,
        'generalLiability', f.general_liability,
        'markupRate', f.markup_rate,
        'arrowBoards', json_build_object(
          'quantity', f.arrow_boards_quantity,
          'cost', f.arrow_boards_cost,
          'includeInLumpSum', f.arrow_boards_include_in_lump_sum
        ),
        'messageBoards', json_build_object(
          'quantity', f.message_boards_quantity,
          'cost', f.message_boards_cost,
          'includeInLumpSum', f.message_boards_include_in_lump_sum
        ),
        'TMA', json_build_object(
          'quantity', f.tma_quantity,
          'cost', f.tma_cost,
          'includeInLumpSum', f.tma_include_in_lump_sum
        ),
        'revenue', f.revenue,
        'cost', f.cost,
        'grossProfit', f.gross_profit,
        'hours', f.hours
      )
    ELSE NULL
  END as flagging,
  -- Service work as JSON (same structure as flagging)
  CASE
    WHEN sw.id IS NOT NULL THEN
      json_build_object(
        'standardPricing', sw.standard_pricing,
        'standardLumpSum', sw.standard_lump_sum,
        'numberTrucks', sw.number_trucks,
        'fuelEconomyMPG', sw.fuel_economy_mpg,
        'personnel', sw.personnel,
        'onSiteJobHours', sw.on_site_job_hours,
        'additionalEquipmentCost', sw.additional_equipment_cost,
        'fuelCostPerGallon', sw.fuel_cost_per_gallon,
        'truckDispatchFee', sw.truck_dispatch_fee,
        'workerComp', sw.worker_comp,
        'generalLiability', sw.general_liability,
        'markupRate', sw.markup_rate,
        'arrowBoards', json_build_object(
          'quantity', sw.arrow_boards_quantity,
          'cost', sw.arrow_boards_cost,
          'includeInLumpSum', sw.arrow_boards_include_in_lump_sum
        ),
        'messageBoards', json_build_object(
          'quantity', sw.message_boards_quantity,
          'cost', sw.message_boards_cost,
          'includeInLumpSum', sw.message_boards_include_in_lump_sum
        ),
        'TMA', json_build_object(
          'quantity', sw.tma_quantity,
          'cost', sw.tma_cost,
          'includeInLumpSum', sw.tma_include_in_lump_sum
        ),
        'revenue', sw.revenue,
        'cost', sw.cost,
        'grossProfit', sw.gross_profit,
        'hours', sw.hours
      )
    ELSE NULL
  END as service_work,
  -- Sale items as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'itemNumber', item_number,
        'name', name,
        'vendor', vendor,
        'quantity', quantity,
        'quotePrice', quote_price,
        'markupPercentage', markup_percentage
      )
    )
    FROM sale_items
    WHERE bid_estimate_id = be.id),
    '[]'::json
  ) as sale_items,
  -- Project metadata
  pm.project_manager,
  pm.pm_email,
  pm.pm_phone,
  pm.customer_contract_number,
  c.name as contractor_name,
  s.name as subcontractor_name,
  -- Summary data
  pa.phase_count as total_phases,
  pa.total_days,
  pa.total_rated_hours + pa.total_non_rated_hours as total_hours
FROM bid_estimates be
LEFT JOIN admin_data_entries ad ON be.id = ad.bid_estimate_id
LEFT JOIN mpt_rental_entries mpr ON be.id = mpr.bid_estimate_id
LEFT JOIN phase_aggregations pa ON mpr.id = pa.mpt_rental_entry_id
LEFT JOIN static_equipment_json sei ON mpr.id = sei.mpt_rental_entry_id
LEFT JOIN flagging_entries f ON be.id = f.bid_estimate_id
LEFT JOIN service_work_entries sw ON be.id = sw.bid_estimate_id
LEFT JOIN project_metadata pm ON be.id = pm.bid_estimate_id
LEFT JOIN contractors c ON pm.contractor_id = c.id
LEFT JOIN subcontractors s ON pm.subcontractor_id = s.id;

-- Separate statement for the function
CREATE OR REPLACE FUNCTION get_phases_with_signs(p_mpt_rental_id integer)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'startDate', p.start_date,
      'endDate', p.end_date,
      'personnel', p.personnel,
      'days', p.days,
      'numberTrucks', p.number_trucks,
      'additionalRatedHours', p.additional_rated_hours,
      'additionalNonRatedHours', p.additional_non_rated_hours,
      'maintenanceTrips', p.maintenance_trips,
      'standardEquipment', json_build_object(
        'fourFootTypeIII', json_build_object('quantity', p.four_foot_type_iii_quantity),
        'hStand', json_build_object('quantity', p.h_stand_quantity),
        'sixFootWings', json_build_object('quantity', p.six_foot_wings_quantity),
        'post', json_build_object('quantity', p.post_quantity),
        'sandbag', json_build_object('quantity', p.sandbag_quantity),
        'covers', json_build_object('quantity', p.covers_quantity),
        'metalStands', json_build_object('quantity', p.metal_stands_quantity),
        'HIVP', json_build_object('quantity', p.hivp_quantity),
        'TypeXIVP', json_build_object('quantity', p.type_xivp_quantity),
        'BLights', json_build_object('quantity', p.b_lights_quantity),
        'ACLights', json_build_object('quantity', p.ac_lights_quantity),
        'sharps', json_build_object('quantity', p.sharps_quantity)
      ),
      'customLightAndDrumItems', p.custom_light_and_drum_items,
      'signs', coalesce(array_to_json(array_cat(
        COALESCE(
          (SELECT array_agg(
            json_build_object(
              'id', ps.sign_id,
              'width', ps.width,
              'height', ps.height,
              'quantity', ps.quantity,
              'sheeting', ps.sheeting,
              'isCustom', ps.is_custom,
              'designation', ps.designation,
              'description', ps.description,
              'associatedStructure', ps.associated_structure,
              'bLights', ps.b_lights,
              'covers', ps.covers
            )
          )
          FROM mpt_primary_signs ps
          WHERE ps.phase_id = p.id),
          ARRAY[]::json[]
        ),
        COALESCE(
          (SELECT array_agg(
            json_build_object(
              'id', ss.sign_id,
              'width', ss.width,
              'height', ss.height,
              'sheeting', ss.sheeting,
              'isCustom', ss.is_custom,
              'designation', ss.designation,
              'description', ss.description,
              'primarySignId', ss.primary_sign_id
            )
          )
          FROM mpt_secondary_signs ss
          WHERE ss.phase_id = p.id),
          ARRAY[]::json[]
        )
      )), '[]'::json)
    ) ORDER BY p.phase_index
  ) INTO result
  FROM mpt_phases p
  WHERE p.mpt_rental_entry_id = p_mpt_rental_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;